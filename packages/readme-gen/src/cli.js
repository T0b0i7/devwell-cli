#!/usr/bin/env node
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CliError,
  parseOptions,
  pathExists,
  readJson,
  runCli,
  runFile,
  setExitCode,
  writeAtomic,
} from "../../core/src/index.js";

const VERSION = "0.1.1";
const HELP = `readme-gen — Génère un changelog depuis Git

USAGE
  readme-gen [options]

OPTIONS
  --since <tag|date>   Limite la plage (défaut : dernier tag)
  --format <md|json>   Format de sortie (défaut : md)
  --json               Alias de --format json
  --output <file|->    Destination (défaut : CHANGELOG.md, - pour stdout)
  --types <a,b,c>      Types conventionnels inclus
  --readme             Crée un README minimal si absent
  --check              Vérifie les commits sans écrire (1 si non conventionnels)
  --dry-run            Affiche le changelog sans écrire
  --force              Remplace un fichier existant avec sauvegarde .bak
  --lang <fr|en>       Langue de la sortie (défaut : fr)
  -h, --help           Affiche cette aide
  -v, --version        Affiche la version

EXEMPLES
  readme-gen --dry-run
  readme-gen --json --output -`;

const DEFINITION = {
  since: { type: "string" },
  format: { type: "string", default: "md" },
  json: { type: "boolean", default: false },
  output: { type: "string", default: "CHANGELOG.md" },
  types: { type: "string", default: "feat,fix,perf,refactor,docs" },
  readme: { type: "boolean", default: false },
  check: { type: "boolean", default: false },
  "dry-run": { type: "boolean", default: false },
  force: { type: "boolean", default: false },
  lang: { type: "string", default: "fr" },
  help: { type: "boolean", short: "-h", default: false },
  version: { type: "boolean", short: "-v", default: false },
};

const TYPE_TITLES = {
  feat: "Added",
  fix: "Fixed",
  perf: "Performance",
  refactor: "Changed",
  docs: "Documentation",
  chore: "Maintenance",
  test: "Tests",
  build: "Build",
  ci: "CI",
  revert: "Reverted",
};

export function parseCommit(subject) {
  const match = /^(?<type>[a-z][a-z0-9-]*)(?:\((?<scope>[^()\r\n]+)\))?(?<breaking>!)?:\s+(?<description>.+)$/i.exec(subject.trim());
  if (!match) return null;
  return {
    type: match.groups.type.toLowerCase(),
    scope: match.groups.scope,
    breaking: Boolean(match.groups.breaking),
    description: match.groups.description,
  };
}

function renderMarkdown(commits, { types, lang }) {
  const date = new Date().toISOString().slice(0, 10);
  const versions = new Map();
  const releases = commits.reduce((groups, commit) => {
    const key = commit.version;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(commit);
    return groups;
  }, versions);
  const lines = [
    "# Changelog",
    "",
    lang === "fr"
      ? "Les changements notables de ce projet sont documentés ici."
      : "Notable changes to this project are documented here.",
    "",
  ];

  for (const [version, entries] of releases) {
    lines.push(`## ${version === "Unreleased" ? version : `[${version}]`} - ${version === "Unreleased" ? date : entries[0].date}`, "");
    const typesPresent = [...new Set(entries.map((entry) => entry.parsed?.type ?? "other"))];
    for (const type of [...types, ...typesPresent.filter((item) => !types.includes(item) && item === "other")]) {
      const matching = entries.filter((entry) => (entry.parsed?.type ?? "other") === type);
      if (!matching.length) continue;
      lines.push(`### ${TYPE_TITLES[type] ?? (lang === "fr" ? "Autres changements" : "Other")}`, "");
      for (const entry of matching) {
        const text = entry.parsed
          ? `${entry.parsed.description}${entry.parsed.scope ? ` (${entry.parsed.scope})` : ""}${entry.parsed.breaking ? " **BREAKING CHANGE**" : ""}`
          : entry.subject;
        lines.push(`- ${text} (${entry.hash.slice(0, 7)})`);
      }
      lines.push("");
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}

async function collectCommits(cwd, since, types) {
  let range;
  if (since) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(since)) {
      const timestamp = Date.parse(`${since}T00:00:00Z`);
      if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== since) {
        throw new CliError(`Date ISO invalide : ${since}`, 1);
      }
    } else {
      await runFile("git", ["rev-parse", "--verify", `${since}^{commit}`], { cwd });
      range = `${since}..HEAD`;
    }
  } else {
    const { stdout } = await runFile("git", ["describe", "--tags", "--abbrev=0"], { cwd }).catch((error) => {
      if (error.message.includes("No names found") || error.message.includes("ne correspond")) return { stdout: "" };
      throw error;
    });
    if (stdout.trim()) range = `${stdout.trim()}..HEAD`;
  }

  const args = ["log", "--no-merges", "--format=%H%x00%cs%x00%s%x1e"];
  if (since && /^\d{4}-\d{2}-\d{2}$/.test(since)) args.push(`--since=${since}T00:00:00Z`);
  if (range) args.push(range);
  else args.push("HEAD");
  const { stdout } = await runFile("git", args, { cwd });
  const includedTypes = new Set(types);
  return stdout
    .split("\x1e")
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, date, subject] = record.split("\x00");
      const parsed = parseCommit(subject ?? "");
      return { hash, date, subject: subject ?? "", parsed, version: "Unreleased" };
    })
    .filter((entry) => !entry.parsed || includedTypes.has(entry.parsed.type));
}

function renderJson(entries, since) {
  const commits = entries.map(({ hash, date, subject, parsed }) => ({
    hash,
    date,
    subject,
    type: parsed?.type ?? "other",
    scope: parsed?.scope ?? null,
    description: parsed?.description ?? subject,
    breaking: parsed?.breaking ?? false,
  }));
  return `${JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    range: { since: since ?? null, until: "HEAD" },
    versions: [{ version: "Unreleased", date: new Date().toISOString().slice(0, 10), commits }],
    stats: {
      commits: commits.length,
      parsed: commits.filter((commit) => commit.type !== "other").length,
      unparsed: commits.filter((commit) => commit.type === "other").length,
    },
  }, null, 2)}\n`;
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
  if (!["md", "json"].includes(options.format)) throw new CliError("--format doit être md ou json", 1);
  if (!["fr", "en"].includes(options.lang)) throw new CliError("--lang doit être fr ou en", 1);

  const cwd = process.cwd();
  const entries = await collectCommits(cwd, options.since, options.types.split(",").filter(Boolean));
  const output = options.format === "json"
    ? renderJson(entries, options.since)
    : renderMarkdown(entries, { types: options.types.split(",").filter(Boolean), lang: options.lang });

  if (options.check) {
    const invalidCount = entries.filter((entry) => !entry.parsed).length;
    const result = invalidCount
      ? `${invalidCount} commit(s) non conventionnel(s) sur ${entries.length} vérifié(s). Action recommandée : utilisez le format type(scope): description et relancez --check.`
      : `Historique valide : ${entries.length} commit(s) vérifié(s).`;
    process.stdout.write(`${result}\n`);
    return invalidCount ? 1 : 0;
  }

  const readmePath = resolve(cwd, "README.md");
  if (options.readme && !(await pathExists(readmePath))) {
    const manifest = await readJson(resolve(cwd, "package.json"));
    const name = manifest?.name ?? basename(cwd);
    const description = manifest?.description ?? `${name} : documentation du projet.`;
    const skeleton = `# ${name}\n\n${description}\n\n## Installation\n\n\`\`\`sh\nnpm install\n\`\`\`\n\n## Utilisation\n\nDécrivez ici les principales commandes.\n`;
    if (options["dry-run"]) process.stdout.write(skeleton);
    else await writeAtomic(readmePath, skeleton);
  }

  if (options["dry-run"] || options.output === "-") {
    process.stdout.write(output);
    return 0;
  }
  const destination = resolve(cwd, options.output);
  const result = await writeAtomic(destination, output, { force: options.force, backup: options.force });
  process.stdout.write(`CHANGELOG généré : ${destination} — ${entries.length} commit(s) inclus${result.backup ? ` (sauvegarde : ${result.backup})` : ""}\n`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  setExitCode(await runCli(main));
}
