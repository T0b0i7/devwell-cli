#!/usr/bin/env node
import { dirname, resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import {
  CliError,
  escapeHtml,
  parseOptions,
  pathExists,
  readJson,
  readText,
  runCli,
  setExitCode,
  writeAtomic,
  writeJson,
} from "../../core/src/index.js";

const VERSION = "0.1.1";
const HELP = `project-doctor — Évalue la santé d'un projet Node.js ou Python

USAGE
  project-doctor [options]

OPTIONS
  --format <table|md|json>  Format du rapport (défaut : table)
  --json                    Alias de --format json
  --min-score <n>           Seuil de réussite (0-100, défaut : 80)
  --checks <ids>            Sous-ensemble : runtime,configs,lockfile,scripts,hygiene
  --offline                 N'effectue aucune requête réseau (défaut)
  --ci                      Mode CI, sans correction ni interaction
  --strict                  Fait échouer sur les erreurs de configuration
  --fix                     Affiche les corrections sûres proposées
  --apply                   Applique les corrections proposées par --fix
  --report <file.html>      Écrit aussi un rapport HTML autonome
  -h, --help                Affiche cette aide
  -v, --version             Affiche la version

Les corrections ne sont jamais appliquées sans --fix --apply.

EXEMPLE
  project-doctor --json`;

const DEFINITION = {
  format: { type: "string", default: "table" },
  json: { type: "boolean", default: false },
  "min-score": { type: "string", default: "80" },
  checks: { type: "string" },
  offline: { type: "boolean", default: true },
  ci: { type: "boolean", default: false },
  strict: { type: "boolean", default: false },
  fix: { type: "boolean", default: false },
  apply: { type: "boolean", default: false },
  report: { type: "string" },
  help: { type: "boolean", short: "-h", default: false },
  version: { type: "boolean", short: "-v", default: false },
};

const WEIGHTS = { runtime: 20, configs: 25, lockfile: 15, scripts: 20, hygiene: 20 };

function stripJsonComments(source) {
  let output = "";
  let inString = false;
  let inLine = false;
  let inBlock = false;
  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];
    if (inLine) {
      if (current === "\n") {
        inLine = false;
        output += current;
      }
      continue;
    }
    if (inBlock) {
      if (current === "*" && next === "/") {
        inBlock = false;
        index += 1;
      }
      continue;
    }
    if (inString) {
      output += current;
      if (current === "\\") output += source[++index] ?? "";
      else if (current === '"') inString = false;
      continue;
    }
    if (current === '"') {
      inString = true;
      output += current;
    } else if (current === "/" && next === "/") {
      inLine = true;
      index += 1;
    } else if (current === "/" && next === "*") {
      inBlock = true;
      index += 1;
    } else {
      output += current;
    }
  }
  return output.replace(/,(\s*[}\]])/g, "$1");
}

function result(id, label, earned, weight, severity, message, action) {
  return { id, label, earned, weight, severity, message, ...(action ? { action } : {}) };
}

async function has(cwd, name) {
  return pathExists(resolve(cwd, name));
}

async function auditNode(cwd, manifest, selected) {
  const checks = [];
  const major = Number(process.versions.node.split(".")[0]);
  const nvmExists = await has(cwd, ".nvmrc");
  let expected = null;
  if (nvmExists) expected = (await readText(resolve(cwd, ".nvmrc"))).trim().replace(/^v/, "");
  const engine = manifest.engines?.node;
  const engineMajor = typeof engine === "string" ? /\d+/.exec(engine)?.[0] : null;
  const runtimeOk = (expected && Number(expected.split(".")[0]) === major) ||
    (!expected && engineMajor && major >= Number(engineMajor));
  if (selected.has("runtime")) {
    checks.push(result(
      "runtime",
      "Runtime Node",
      runtimeOk ? WEIGHTS.runtime : (expected || engine ? 0 : 12),
      WEIGHTS.runtime,
      runtimeOk ? "ok" : expected || engine ? "error" : "warning",
      runtimeOk ? `Node ${process.versions.node} satisfait la version déclarée` : expected
        ? `Node ${process.versions.node} ne correspond pas à .nvmrc (${expected})`
        : engine ? `Node ${process.versions.node} ne satisfait pas engines.node (${engine})` : "Aucune version Node n'est déclarée",
      runtimeOk ? undefined : "Déclarer la version supportée dans .nvmrc et engines.node",
    ));
  }

  let configEarned = WEIGHTS.configs;
  const configProblems = [];
  for (const file of ["package.json", "tsconfig.json"]) {
    if (!(await has(cwd, file))) continue;
    try {
      const text = await readText(resolve(cwd, file));
      if (file === "package.json") JSON.parse(text);
      else JSON.parse(stripJsonComments(text));
    } catch (error) {
      configEarned -= file === "package.json" ? 15 : 10;
      configProblems.push(`${file} invalide : ${error.message}`);
    }
  }
  if (selected.has("configs")) {
    checks.push(result("configs", "Configurations", Math.max(0, configEarned), WEIGHTS.configs,
      configProblems.length ? "error" : "ok",
      configProblems.length ? configProblems.join("; ") : "package.json et configurations JSON valides",
      configProblems.length ? "Corriger les fichiers de configuration signalés" : undefined));
  }

  const lockNames = ["package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml", "yarn.lock"];
  const lockFiles = [];
  for (const name of lockNames) if (await has(cwd, name)) lockFiles.push(name);
  if (selected.has("lockfile")) {
    checks.push(result("lockfile", "Verrouillage des dépendances", lockFiles.length ? WEIGHTS.lockfile : 0,
      WEIGHTS.lockfile, lockFiles.length ? "ok" : "warning",
      lockFiles.length ? `Fichier(s) présent(s) : ${lockFiles.join(", ")}` : "Aucun fichier lock détecté",
      lockFiles.length ? undefined : "Générer et versionner le lockfile du gestionnaire utilisé"));
  }

  const scripts = manifest.scripts ?? {};
  const usefulScripts = ["dev", "build", "test", "lint"].filter((name) => Boolean(scripts[name]));
  if (selected.has("scripts")) {
    const earned = Math.round((usefulScripts.length / 4) * WEIGHTS.scripts);
    checks.push(result("scripts", "Scripts de développement", earned, WEIGHTS.scripts,
      usefulScripts.length >= 3 ? "ok" : "warning",
      usefulScripts.length ? `Présents : ${usefulScripts.join(", ")}` : "Aucun script dev/build/test/lint déclaré",
      `Ajouter les scripts manquants : ${["dev", "build", "test", "lint"].filter((name) => !scripts[name]).join(", ") || "aucun"}`));
  }

  if (selected.has("hygiene")) {
    const present = [];
    const missing = [];
    for (const file of ["README.md", "LICENSE", ".gitignore"]) {
      if (await has(cwd, file)) present.push(file);
      else missing.push(file);
    }
    const earned = Math.round((present.length / 3) * WEIGHTS.hygiene);
    checks.push(result("hygiene", "Hygiène du dépôt", earned, WEIGHTS.hygiene,
      missing.length ? "warning" : "ok",
      missing.length ? `Fichiers absents : ${missing.join(", ")}` : "README, licence et .gitignore présents",
      missing.length ? `Ajouter : ${missing.join(", ")}` : undefined));
  }
  return checks;
}

async function auditPython(cwd, selected) {
  const checks = [];
  const pyprojectPath = resolve(cwd, "pyproject.toml");
  const content = await readText(pyprojectPath);
  const requires = /^\s*requires-python\s*=\s*["']([^"']+)["']/m.exec(content)?.[1];
  const pythonVersion = await (async () => {
    try {
      const { stdout } = await import("../../core/src/index.js").then(({ runFile }) => runFile("python", ["--version"], { cwd, timeout: 2000 }));
      return stdout.trim() || "Python disponible";
    } catch {
      return null;
    }
  })();
  if (selected.has("runtime")) checks.push(result("runtime", "Runtime Python",
    pythonVersion ? WEIGHTS.runtime : 0, WEIGHTS.runtime, pythonVersion ? "ok" : "warning",
    pythonVersion ? `${pythonVersion}${requires ? `; requis ${requires}` : ""}` : "Commande python introuvable",
    pythonVersion ? undefined : "Installer Python et le rendre disponible dans PATH"));
  if (selected.has("configs")) {
    checks.push(result("configs", "Configuration Python", content.includes("[project]") ? WEIGHTS.configs : Math.round(WEIGHTS.configs * 0.6),
      WEIGHTS.configs, content.includes("[project]") ? "ok" : "warning",
      content.includes("[project]") ? "pyproject.toml contient la section [project]" : "pyproject.toml ne contient pas de section [project]",
      "Déclarer les métadonnées du projet dans [project]"));
  }
  const lockFiles = [];
  for (const file of ["uv.lock", "poetry.lock", "Pipfile.lock"]) if (await has(cwd, file)) lockFiles.push(file);
  if (selected.has("lockfile")) checks.push(result("lockfile", "Verrouillage des dépendances",
    lockFiles.length ? WEIGHTS.lockfile : 0, WEIGHTS.lockfile, lockFiles.length ? "ok" : "warning",
    lockFiles.length ? `Présent : ${lockFiles.join(", ")}` : "Aucun lockfile Python détecté",
    "Générer un lockfile avec le gestionnaire de dépendances de l'équipe"));
  if (selected.has("scripts")) {
    const hasTest = /pytest|unittest/.test(content);
    checks.push(result("scripts", "Tests", hasTest ? WEIGHTS.scripts : 0, WEIGHTS.scripts,
      hasTest ? "ok" : "warning", hasTest ? "Configuration de tests détectée" : "Aucun outil de test Python détecté",
      "Ajouter pytest ou documenter la commande de test"));
  }
  if (selected.has("hygiene")) {
    const present = [];
    const missing = [];
    for (const file of ["README.md", "LICENSE", ".gitignore"]) {
      if (await has(cwd, file)) present.push(file);
      else missing.push(file);
    }
    const earned = Math.round((present.length / 3) * WEIGHTS.hygiene);
    checks.push(result("hygiene", "Hygiène du dépôt", earned, WEIGHTS.hygiene,
      missing.length ? "warning" : "ok", missing.length ? `Fichiers absents : ${missing.join(", ")}` : "README, licence et .gitignore présents"));
  }
  return checks;
}

function markdownReport(report) {
  return [
    `# Santé du projet : ${report.project}`,
    "",
    `**Score : ${report.score}/100** — ${report.status}`,
    "",
    "| Check | Résultat | Détail |",
    "|---|---:|---|",
    ...report.checks.map((check) => `| ${check.label} | ${check.earned}/${check.weight} | ${check.message.replace(/\|/g, "\\|")} |`),
    "",
    "Généré par project-doctor.",
    "",
  ].join("\n");
}

function htmlReport(report) {
  const rows = report.checks.map((check) =>
    `<tr><th>${escapeHtml(check.label)}</th><td>${check.earned}/${check.weight}</td><td>${escapeHtml(check.message)}</td></tr>`,
  ).join("");
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Rapport project-doctor</title><style>body{font:16px system-ui;max-width:960px;margin:3rem auto;padding:0 1rem;color:#17180f;background:#f5f2ea}table{width:100%;border-collapse:collapse;background:#fbf9f3}th,td{text-align:left;padding:.8rem;border-bottom:1px solid #ddd8c9}h1{font-size:2rem}strong{font-size:1.4rem}</style><h1>Santé du projet : ${escapeHtml(report.project)}</h1><p><strong>${report.score}/100</strong> — ${escapeHtml(report.status)}</p><table><thead><tr><th>Check</th><th>Score</th><th>Détail</th></tr></thead><tbody>${rows}</tbody></table></html>\n`;
}

async function applySafeFix(cwd, checks, ci) {
  if (ci) throw new CliError("--fix --apply est interdit en mode CI", 1);
  const manifestPath = resolve(cwd, "package.json");
  const manifest = await readJson(manifestPath);
  const nvmPath = resolve(cwd, ".nvmrc");
  if (!manifest || manifest.engines?.node || !(await pathExists(nvmPath))) return [];
  const version = (await readText(nvmPath)).trim().replace(/^v/, "");
  const major = Number(version.split(".")[0]);
  if (!Number.isInteger(major) || major < 1) return [];
  manifest.engines = { ...manifest.engines, node: `>=${major}` };
  await writeAtomic(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { force: true, backup: true });
  return [`Ajout de engines.node >=${major} dans package.json`];
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
  if (!["table", "md", "json"].includes(options.format)) throw new CliError("--format doit être table, md ou json", 1);
  const minScore = Number(options["min-score"]);
  if (!Number.isInteger(minScore) || minScore < 0 || minScore > 100) throw new CliError("--min-score doit être compris entre 0 et 100", 1);
  if (options.apply && !options.fix) throw new CliError("--apply nécessite --fix", 1);
  const cwd = process.cwd();
  const nodeManifest = await readJson(resolve(cwd, "package.json"));
  const isPython = await pathExists(resolve(cwd, "pyproject.toml"));
  if (!nodeManifest && !isPython) throw new CliError("Aucun package.json ni pyproject.toml détecté", 2);
  const allowedChecks = new Set(Object.keys(WEIGHTS));
  const selected = new Set(options.checks ? options.checks.split(",") : allowedChecks);
  for (const id of selected) if (!allowedChecks.has(id)) throw new CliError(`Check inconnu : ${id}`, 1);
  const checks = nodeManifest ? await auditNode(cwd, nodeManifest, selected) : await auditPython(cwd, selected);
  const maximum = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce((sum, check) => sum + check.earned, 0);
  const score = maximum ? Math.round((earned / maximum) * 100) : 0;
  const status = score >= 90 ? "excellent" : score >= 70 ? "bon" : score >= 50 ? "fragile" : "critique";
  const proposedFixes = [];
  if (options.fix && nodeManifest && !nodeManifest.engines?.node && await pathExists(resolve(cwd, ".nvmrc"))) {
    proposedFixes.push("Ajouter engines.node à package.json depuis .nvmrc");
  }
  const applied = options.apply ? await applySafeFix(cwd, checks, options.ci) : [];
  const report = {
    schemaVersion: 1,
    project: nodeManifest?.name ?? cwd.split(/[\\/]/).filter(Boolean).at(-1),
    ecosystem: nodeManifest ? "node" : "python",
    score,
    status,
    checks,
    fixes: { proposed: proposedFixes, applied },
    offline: true,
  };
  if (options.format === "json") process.stdout.write(writeJson(report));
  else if (options.format === "md") process.stdout.write(markdownReport(report));
  else {
    const reviewCount = checks.filter((check) => check.severity !== "ok").length;
    const lines = [
      `project-doctor ${VERSION} — ${report.project}`,
      `Santé du projet : ${score}/100 — ${status}`,
    ];
    for (const check of checks) {
      lines.push(`${check.severity === "ok" ? "OK" : check.severity.toUpperCase()} ${check.label.padEnd(26)} ${String(check.earned).padStart(2)}/${check.weight}  ${check.message}`);
      if (check.action) lines.push(`  Action : ${check.action}`);
    }
    for (const fix of proposedFixes) lines.push(`Correction proposée : ${fix} (aucun changement; relancer avec --fix --apply)`);
    for (const fix of applied) lines.push(`Correction appliquée : ${fix}`);
    lines.push("", "RÉSUMÉ");
    lines.push(`${checks.length} contrôle(s) effectué(s), ${reviewCount} à examiner — score : ${score}/100.`);
    if (applied.length) {
      lines.push("Action recommandée : vérifiez les corrections appliquées, puis relancez doctor.");
    } else if (proposedFixes.length) {
      lines.push("Action recommandée : relancez avec --fix --apply pour appliquer les corrections proposées.");
    } else if (reviewCount) {
      lines.push("Action recommandée : traitez les actions indiquées ci-dessus, puis relancez doctor.");
    } else {
      lines.push("Action recommandée : rien à corriger pour le moment ; la configuration est cohérente.");
    }
    process.stdout.write(`${lines.join("\n")}\n`);
  }
  if (options.report) {
    const reportPath = resolve(cwd, options.report);
    await mkdir(dirname(reportPath), { recursive: true });
    await writeAtomic(reportPath, htmlReport(report), { force: false });
  }
  const hasConfigError = checks.some((check) => check.severity === "error");
  return hasConfigError && options.strict || score < minScore ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  setExitCode(await runCli(main));
}
