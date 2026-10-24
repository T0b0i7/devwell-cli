#!/usr/bin/env node
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CliError,
  parseOptions,
  pathExists,
  readText,
  runCli,
  setExitCode,
} from "../../core/src/index.js";

const VERSION = "0.1.1";
const HELP = `env-doctor — Vérifie la cohérence des fichiers .env

USAGE
  env-doctor [fichiers...] [options]

OPTIONS
  --files <paths>       Fichiers à comparer (référence en premier)
  --format <pretty|json|github>
  --json                Alias de --format json
  --strict              Traite aussi les avertissements comme des erreurs
  --no-secrets          Désactive la détection des motifs de secrets
  --allow <glob>        Motif de clé publique autorisé (répétable)
  --ignore <key>        Ignore une clé (répétable)
  --ci                  Mode CI, JSON sur stdout
  --no-color            Désactive les couleurs
  -h, --help            Affiche cette aide
  -v, --version         Affiche la version

Les valeurs des variables ne sont jamais affichées.

EXEMPLE
  env-doctor --files .env.example,.env --json`;

const DEFINITION = {
  files: { type: "string" },
  format: { type: "string", default: "pretty" },
  json: { type: "boolean", default: false },
  strict: { type: "boolean", default: false },
  secrets: { type: "boolean", default: true },
  allow: { type: "string", multiple: true },
  ignore: { type: "string", multiple: true },
  ci: { type: "boolean", default: false },
  color: { type: "boolean", default: true },
  help: { type: "boolean", short: "-h", default: false },
  version: { type: "boolean", short: "-v", default: false },
};

const SECRET_RULES = [
  { id: "aws-access-key", pattern: /\bAKIA[0-9A-Z]{16}\b/, severity: "error" },
  { id: "github-token", pattern: /\bgh[pous]_[A-Za-z0-9_]{20,}\b/, severity: "error" },
  { id: "stripe-secret", pattern: /\b[rs]k_live_[A-Za-z0-9]{16,}\b/, severity: "error" },
  { id: "slack-token", pattern: /\bxox[abp]-[A-Za-z0-9-]{10,}\b/, severity: "warning" },
  { id: "google-api", pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/, severity: "error" },
  { id: "private-key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, severity: "error" },
  { id: "jwt", pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, severity: "warning" },
];

export function parseEnv(source) {
  const entries = [];
  const malformed = [];
  const duplicateKeys = new Set();
  const seen = new Set();

  source.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.replace(/^\uFEFF/, "").trim();
    if (!line || line.startsWith("#")) return;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/.exec(line);
    if (!match) {
      malformed.push({ line: index + 1 });
      return;
    }
    const [, key, rawValue] = match;
    const value = rawValue.replace(/\s+#.*$/, "").replace(/^(['"])(.*)\1$/, "$2");
    if (seen.has(key)) duplicateKeys.add(key);
    seen.add(key);
    entries.push({ key, value, line: index + 1 });
  });

  return { entries, duplicates: [...duplicateKeys], malformed };
}

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`);
}

function scanSecrets(file, entries, allowPatterns) {
  return entries.flatMap(({ key, value, line }) => {
    if (!value || allowPatterns.some((pattern) => pattern.test(key))) return [];
    const valueRule = SECRET_RULES.find((rule) => rule.pattern.test(value));
    const genericRule =
      /^[A-Z0-9_]*(SECRET|TOKEN|PASSWORD|PRIVATE)[A-Z0-9_]*$/.test(key) && value.length >= 16
        ? { id: "generic-secret", severity: "warning" }
        : null;
    const rule = valueRule ?? genericRule;
    if (!rule) return [];
    return [{
      code: "ENV_SECRET_EXPOSED",
      severity: rule.severity,
      file,
      key,
      line,
      message: `Motif ${rule.id} détecté`,
    }];
  });
}

function compareEnv(reference, target, file, referenceFile, options) {
  const referenceKeys = new Set(reference.entries.map((entry) => entry.key));
  const targetKeys = new Set(target.entries.map((entry) => entry.key));
  const ignored = new Set(options.ignore);
  const issues = [];

  for (const entry of target.malformed) {
    issues.push({
      code: "ENV_LINE_MALFORMED",
      severity: "error",
      file,
      key: "LIGNE",
      line: entry.line,
      message: "Syntaxe invalide; la ligne a été ignorée",
    });
  }
  for (const key of target.duplicates) {
    if (!ignored.has(key)) issues.push({ code: "ENV_DUPLICATE_KEY", severity: "error", file, key, message: "Clé définie plusieurs fois" });
  }
  for (const key of referenceKeys) {
    if (!targetKeys.has(key) && !ignored.has(key)) {
      issues.push({ code: "ENV_KEY_MISSING", severity: "error", file, key, message: `Présente dans ${referenceFile}, absente de ${file}` });
    }
  }
  for (const entry of target.entries) {
    if (ignored.has(entry.key)) continue;
    if (!referenceKeys.has(entry.key)) {
      issues.push({ code: "ENV_KEY_ORPHAN", severity: "warning", file, key: entry.key, line: entry.line, message: `Absente de ${referenceFile}` });
    }
    if (!entry.value.trim()) {
      issues.push({ code: "ENV_VALUE_EMPTY", severity: "error", file, key: entry.key, line: entry.line, message: "Valeur vide" });
    }
  }
  if (options.secrets) issues.push(...scanSecrets(file, target.entries, options.allowPatterns)
    .filter((issue) => !ignored.has(issue.key)));
  return issues;
}

async function resolveFiles(options, positionals) {
  if (options.files) return options.files.split(",").map((file) => resolve(file));
  if (positionals.length) return positionals.map((file) => resolve(file));
  const files = [".env.example", ".env", ".env.local", ".env.development", ".env.production"]
    .map((file) => resolve(file));
  const present = [];
  for (const file of files) if (await pathExists(file)) present.push(file);
  return present;
}

function renderPretty(report) {
  const lines = [`env-doctor ${VERSION} — ${report.files.length} fichier(s) analysé(s)`, ""];
  for (const issue of report.issues) {
    lines.push(`${issue.severity === "error" ? "ERREUR" : "AVERTISSEMENT"} ${issue.file}${issue.line ? `:${issue.line}` : ""} ${issue.key} — ${issue.message}`);
  }
  if (!report.issues.length) {
    lines.push("Aucune incohérence détectée.");
  }
  const nextStep = report.summary.errors > 0
    ? "Action recommandée : corrigez les erreurs ci-dessus avant de valider une configuration de travail ou de CI."
    : report.summary.warnings > 0
      ? "Action recommandée : vérifiez les avertissements et confirmez qu'ils sont intentionnels."
      : "Action recommandée : rien à corriger pour le moment ; la configuration est cohérente.";
  lines.push("", "RÉSUMÉ");
  lines.push(`${report.summary.errors} erreur(s), ${report.summary.warnings} avertissement(s)`);
  lines.push(nextStep);
  return `${lines.join("\n")}\n`;
}

async function main(argv) {
  const { options, positionals } = parseOptions(argv, DEFINITION);
  if (options.help) {
    process.stdout.write(`${HELP}\n`);
    return 0;
  }
  if (options.version) {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }
  if (options.json) options.format = "json";
  if (!["pretty", "json", "github"].includes(options.format)) throw new CliError("--format doit être pretty, json ou github", 1);
  const files = await resolveFiles(options, positionals);
  if (!files.length) {
    const report = { schemaVersion: 1, files: [], issues: [], summary: { errors: 0, warnings: 0 } };
    const message = "Aucun fichier .env* détecté. L'analyse n'a pas été effectuée. Action recommandée : ajoutez .env.example ou indiquez les fichiers avec --files.";
    process.stdout.write(options.format === "json" || options.ci ? `${JSON.stringify(report, null, 2)}\n` : `${message}\n`);
    return 0;
  }

  const sourcePath = files[0];
  const reference = parseEnv(await readText(sourcePath));
  if (!reference.entries.length) throw new CliError(`${sourcePath} ne contient aucune variable valide`, 1);
  const issues = reference.malformed.map((entry) => ({
    code: "ENV_LINE_MALFORMED",
    severity: "error",
    file: sourcePath,
    key: "LIGNE",
    line: entry.line,
    message: "Syntaxe invalide; la ligne a été ignorée",
  }));
  for (const file of files.slice(1)) {
    const target = parseEnv(await readText(file));
    issues.push(...compareEnv(reference, target, file, sourcePath, {
      ...options,
      allowPatterns: [
        /^VITE_/,
        /^NEXT_PUBLIC_/,
        /^PUBLIC_/,
        ...options.allow.map(globToRegExp),
      ],
    }));
  }
  const report = {
    schemaVersion: 1,
    files: files.map((file) => file.replace(`${process.cwd()}\\`, "").replace(`${process.cwd()}/`, "")),
    issues,
    summary: {
      errors: issues.filter((issue) => issue.severity === "error").length,
      warnings: issues.filter((issue) => issue.severity === "warning").length,
    },
  };
  if (options.format === "json" || options.ci) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else if (options.format === "github") {
    for (const issue of issues) {
      const command = issue.severity === "error" ? "error" : "warning";
      process.stdout.write(`::${command} file=${issue.file},line=${issue.line ?? 1}::${issue.key}: ${issue.message}\n`);
    }
  } else process.stdout.write(renderPretty(report));
  return report.summary.errors || (options.strict && report.summary.warnings) ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  setExitCode(await runCli(main));
}
