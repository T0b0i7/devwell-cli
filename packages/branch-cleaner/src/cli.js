#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CliError,
  parseOptions,
  runCli,
  runFile,
  setExitCode,
  writeJson,
} from "../../core/src/index.js";

const VERSION = "0.1.0";
const HELP = `branch-cleaner — Audite et nettoie les branches locales Git

USAGE
  branch-cleaner [options]

OPTIONS
  --merged                 Inclut les branches fusionnées (défaut)
  --stale <jours>          Inclut les branches inactives depuis N jours
  --orphans                Inclut les upstream supprimés (défaut)
  --base <ref>             Branche de comparaison (défaut : main ou master)
  --graph                  Affiche un graphe Git compact
  --graph-limit <n>        Nombre de commits (défaut : 20)
  --protect <patterns>     Branches protégées (séparées par des virgules)
  --dry-run                Simule les suppressions (défaut)
  --apply                  Supprime les branches candidates fusionnées
  --force-unmerged         Autorise la suppression forcée après double confirmation TTY
  --fetch                  Actualise les références distantes avant l'audit
  --format <pretty|json>   Format du rapport
  --json                   Alias de --format json
  -h, --help               Affiche cette aide
  -v, --version            Affiche la version

La branche courante et main/master/develop/dev/release/* ne sont jamais supprimées.
Les branches non fusionnées ne sont jamais supprimées sans --force-unmerged interactif.

EXEMPLES
  branch-cleaner --json
  branch-cleaner --apply`;

const DEFINITION = {
  merged: { type: "boolean", default: true },
  stale: { type: "string" },
  orphans: { type: "boolean", default: true },
  base: { type: "string" },
  graph: { type: "boolean", default: false },
  "graph-limit": { type: "string", default: "20" },
  protect: { type: "string", multiple: true },
  "dry-run": { type: "boolean", default: true },
  apply: { type: "boolean", default: false },
  "force-unmerged": { type: "boolean", default: false },
  fetch: { type: "boolean", default: false },
  format: { type: "string", default: "pretty" },
  json: { type: "boolean", default: false },
  help: { type: "boolean", short: "-h", default: false },
  version: { type: "boolean", short: "-v", default: false },
};

const DEFAULT_PROTECTED = ["main", "master", "develop", "dev", "release/*"];

function matchesPattern(pattern, branch) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`).test(branch);
}

function isProtected(branch, current, patterns) {
  return branch === current || patterns.some((pattern) => matchesPattern(pattern, branch));
}

export function auditBranches(branches, { current, patterns, includeMerged, staleDays }) {
  return branches
    .filter((branch) => {
      if (isProtected(branch.name, current, patterns)) return false;
      const stale = staleDays !== null && branch.ageDays >= staleDays;
      return (includeMerged && branch.merged) || branch.upstreamGone || stale;
    })
    .map((branch) => ({
      ...branch,
      reason: branch.merged ? "fusionnée" : branch.upstreamGone ? "upstream supprimé" : `inactive depuis ${branch.ageDays} j`,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function git(cwd, args) {
  return (await runFile("git", args, { cwd, timeout: 10_000 })).stdout.trim();
}

async function getBranches(cwd, current, base) {
  const [raw, mergedOutput] = await Promise.all([
    git(cwd, ["for-each-ref", "--format=%(refname:short)%00%(upstream:short)%00%(upstream:track)%00%(committerdate:unix)", "refs/heads"]),
    git(cwd, ["branch", "--merged", base, "--format=%(refname:short)"]),
  ]);
  const merged = new Set(mergedOutput.split(/\r?\n/).filter(Boolean));
  const now = Math.floor(Date.now() / 1000);
  return raw.split(/\r?\n/).filter(Boolean).map((line) => {
    const [name, upstream, track, committed] = line.split("\0");
    return {
      name,
      current: name === current,
      upstream: upstream || null,
      upstreamGone: Boolean(upstream) && track.includes("gone"),
      merged: merged.has(name),
      lastCommit: Number(committed) || 0,
      ageDays: Math.max(0, Math.floor((now - (Number(committed) || now)) / 86400)),
    };
  });
}

async function confirmForce(name) {
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    const first = await prompt.question(`Branche non fusionnée ${name}. Tapez DELETE ${name} pour continuer : `);
    if (first !== `DELETE ${name}`) return false;
    const second = await prompt.question(`Confirmation finale, tapez encore DELETE ${name} : `);
    return second === `DELETE ${name}`;
  } finally {
    prompt.close();
  }
}

function formatPretty(report) {
  const lines = [
    `branch-cleaner ${VERSION} — base : ${report.base}${report.dryRun ? " — DRY-RUN" : ""}`,
    "",
    "BRANCHE".padEnd(32) + "ÉTAT".padEnd(23) + "DERNIER COMMIT",
  ];
  for (const branch of report.branches) {
    const state = branch.current ? "courante" : branch.protected ? "protégée" : branch.reason ?? "active";
    const date = branch.lastCommit ? `${branch.ageDays} j` : "inconnue";
    lines.push(`${branch.name.padEnd(32)}${state.padEnd(23)}${date}`);
  }
  lines.push("", `${report.candidates.length} candidate(s) sûre(s)`);
  if (report.dryRun) lines.push("Simulation : rien n'a été supprimé. Relancez avec --apply pour confirmer.");
  if (report.deleted.length) lines.push(`Branches supprimées : ${report.deleted.join(", ")}`);
  if (report.failures.length) lines.push(...report.failures.map((failure) => `Échec ${failure.branch} : ${failure.message}`));
  if (report.graph) lines.push("", "HISTORIQUE", report.graph);
  return `${lines.join("\n")}\n`;
}

async function main(argv) {
  const { options, positionals } = parseOptions(argv, DEFINITION);
  if (positionals.length) throw new CliError(`Arguments inattendus : ${positionals.join(" ")}`, 1);
  if (options.help) {
    process.stdout.write(`${HELP}\n`);
    return 0;
  }
  if (options.version) {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }
  if (options.json) options.format = "json";
  if (!["pretty", "json"].includes(options.format)) throw new CliError("--format doit être pretty ou json", 1);
  const staleDays = options.stale === undefined ? null : Number(options.stale);
  const graphLimit = Number(options["graph-limit"]);
  if (staleDays !== null && (!Number.isInteger(staleDays) || staleDays < 1)) throw new CliError("--stale doit être un nombre de jours positif", 1);
  if (!Number.isInteger(graphLimit) || graphLimit < 1 || graphLimit > 200) throw new CliError("--graph-limit doit être compris entre 1 et 200", 1);
  if (options["force-unmerged"] && !options.apply) throw new CliError("--force-unmerged nécessite --apply", 1);
  if (options["force-unmerged"] && (!stdin.isTTY || !stdout.isTTY)) throw new CliError("--force-unmerged nécessite un terminal interactif pour les doubles confirmations", 1);

  const cwd = process.cwd();
  if (options.fetch) await git(cwd, ["fetch", "--prune", "--quiet"]);
  const current = await git(cwd, ["symbolic-ref", "--quiet", "--short", "HEAD"]).catch(() => null);
  if (!current && options.apply) throw new CliError("HEAD détachée : refus de modifier les branches dans cet état", 1);
  let base = options.base;
  if (!base) {
    for (const candidate of ["main", "master"]) {
      const exists = await git(cwd, ["rev-parse", "--verify", "--quiet", candidate]).then(() => true).catch(() => false);
      if (exists) {
        base = candidate;
        break;
      }
    }
  }
  base ??= current;
  if (!base) throw new CliError("Impossible de déterminer une branche de comparaison; utilisez --base", 1);
  await git(cwd, ["rev-parse", "--verify", `${base}^{commit}`]);
  const patterns = [...DEFAULT_PROTECTED, ...options.protect.flatMap((group) => group.split(",").filter(Boolean))];
  const branches = await getBranches(cwd, current, base);
  const candidates = auditBranches(branches, { current, patterns, includeMerged: options.merged, staleDays });
  const deleted = [];
  const failures = [];
  if (options.apply) {
    for (const branch of candidates) {
      const force = !branch.merged;
      if (force && !options["force-unmerged"]) continue;
      if (force && !(await confirmForce(branch.name))) {
        failures.push({ branch: branch.name, message: "confirmation refusée" });
        continue;
      }
      try {
        await git(cwd, ["branch", force ? "-D" : "-d", branch.name]);
        deleted.push(branch.name);
      } catch (error) {
        failures.push({ branch: branch.name, message: error.message });
      }
    }
  }
  const graph = options.graph
    ? await git(cwd, ["log", "--graph", "--oneline", "--decorate", `-${graphLimit}`, "--all"])
    : null;
  const report = {
    schemaVersion: 1,
    base,
    current,
    dryRun: !options.apply,
    branches: branches.map((branch) => ({
      ...branch,
      protected: isProtected(branch.name, current, patterns),
      reason: candidates.find((candidate) => candidate.name === branch.name)?.reason ?? null,
    })),
    candidates,
    deleted,
    failures,
    graph,
  };
  process.stdout.write(options.format === "json" ? writeJson(report) : formatPretty(report));
  return failures.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  setExitCode(await runCli(main));
}
