#!/usr/bin/env node
import { readdir } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CliError,
  parseOptions,
  pathExists,
  readJson,
  readText,
  runCli,
  setExitCode,
  writeAtomic,
} from "../../core/src/index.js";

const VERSION = "0.1.1";
const HELP = `context-pack — Prépare un contexte de projet pour les assistants de code

USAGE
  context-pack [options]

OPTIONS
  --output <fichier>  Destination (défaut : AGENTS.md)
  --write             Crée le fichier après avoir affiché son aperçu
  -h, --help          Affiche cette aide
  -v, --version       Affiche la version

Sans --write, le contenu est seulement affiché dans le terminal.
Un fichier existant n'est jamais remplacé.

EXEMPLES
  context-pack
  context-pack --output AGENTS.md --write`;

const DEFINITION = {
  output: { type: "string", default: "AGENTS.md" },
  write: { type: "boolean", default: false },
  help: { type: "boolean", short: "-h", default: false },
  version: { type: "boolean", short: "-v", default: false },
};

const MANIFESTS = [
  "composer.json",
  "pyproject.toml",
  "requirements.txt",
  "go.mod",
  "Cargo.toml",
  "pubspec.yaml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
];
const LOCKFILES = {
  "package-lock.json": "npm",
  "npm-shrinkwrap.json": "npm",
  "pnpm-lock.yaml": "pnpm",
  "yarn.lock": "Yarn",
  "bun.lock": "Bun",
  "bun.lockb": "Bun",
  "composer.lock": "Composer",
  "poetry.lock": "Poetry",
  "uv.lock": "uv",
  "Pipfile.lock": "Pipenv",
  "Cargo.lock": "Cargo",
  "go.sum": "Go modules",
  "pubspec.lock": "Pub",
};
const IGNORED_DIRECTORIES = new Set([".git", ".vercel", "node_modules", "dist", "build", "coverage", ".next", ".venv"]);

function inline(value) {
  return String(value).replace(/[\r\n`]/g, " ").trim();
}

function dependencyNames(manifest) {
  return [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.require ?? {}),
    ...Object.keys(manifest["require-dev"] ?? {}),
  ];
}

function detectFrameworks(manifests, packageJson, dependencyText) {
  const dependencies = new Set(dependencyNames(packageJson ?? {}));
  const frameworks = [];
  const add = (name) => {
    if (!frameworks.includes(name)) frameworks.push(name);
  };

  if (manifests.has("package.json")) add("Node.js");
  if (dependencies.has("next")) add("Next.js");
  if (dependencies.has("react")) add("React");
  if (dependencies.has("vite")) add("Vite");
  if (dependencies.has("vue")) add("Vue");
  if (dependencies.has("nuxt")) add("Nuxt");
  if (dependencies.has("@angular/core")) add("Angular");
  if (dependencies.has("svelte")) add("Svelte");
  if (dependencies.has("express")) add("Express");
  if (dependencies.has("fastify")) add("Fastify");
  if (manifests.has("composer.json")) add(/laravel\/framework/i.test(dependencyText) ? "Laravel / PHP" : "PHP");
  if (manifests.has("pyproject.toml") || manifests.has("requirements.txt")) {
    add("Python");
    if (/\bfastapi\b/i.test(dependencyText)) add("FastAPI");
    if (/\bdjango\b/i.test(dependencyText)) add("Django");
    if (/\bflask\b/i.test(dependencyText)) add("Flask");
  }
  if (manifests.has("go.mod")) add("Go");
  if (manifests.has("Cargo.toml")) add("Rust");
  if (manifests.has("pubspec.yaml")) add("Dart / Flutter");
  if (manifests.has("pom.xml") || manifests.has("build.gradle") || manifests.has("build.gradle.kts")) add("JVM");

  return frameworks;
}

export async function collectProjectContext(cwd = process.cwd()) {
  const root = resolve(cwd);
  const manifestNames = [];
  for (const name of ["package.json", ...MANIFESTS]) {
    if (await pathExists(resolve(root, name))) manifestNames.push(name);
  }

  const packageJson = manifestNames.includes("package.json")
    ? await readJson(resolve(root, "package.json"))
    : null;
  if (manifestNames.includes("package.json") && (!packageJson || Array.isArray(packageJson) || typeof packageJson !== "object")) {
    throw new CliError("package.json doit contenir un objet JSON.", 1);
  }

  let dependencyText = "";
  for (const name of ["composer.json", "pyproject.toml", "requirements.txt", "Cargo.toml", "pubspec.yaml"]) {
    if (manifestNames.includes(name)) dependencyText += `\n${await readText(resolve(root, name))}`;
  }

  const lockfiles = [];
  for (const [name, manager] of Object.entries(LOCKFILES)) {
    if (await pathExists(resolve(root, name))) lockfiles.push({ name, manager });
  }
  const entries = await readdir(root, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory() && !IGNORED_DIRECTORIES.has(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
    .slice(0, 12);
  const scriptManifest = packageJson?.scripts && typeof packageJson.scripts === "object" && !Array.isArray(packageJson.scripts)
    ? packageJson.scripts
    : {};
  const allScripts = Object.keys(scriptManifest)
    .filter((name) => /^[A-Za-z0-9:_-]+$/.test(name))
    .sort((left, right) => left.localeCompare(right));
  const scripts = allScripts.slice(0, 20);
  const frameworks = detectFrameworks(new Set(manifestNames), packageJson, dependencyText);

  if (!manifestNames.length) {
    throw new CliError("Aucun manifeste reconnu. Lancez context-pack à la racine d'un projet pris en charge.", 2);
  }

  return {
    name: inline(packageJson?.name || basename(root)),
    manifests: manifestNames,
    frameworks,
    lockfiles,
    scripts,
    omittedScripts: Math.max(0, allScripts.length - scripts.length),
    directories,
  };
}

export function renderContextPack(context) {
  const lines = [
    `# Contexte du projet : ${context.name}`,
    "",
    "> Fichier préparé localement par Devwell à partir des manifestes détectés. Vérifiez et adaptez ces informations avant de vous y fier.",
    "",
    "## Stack détectée",
    "",
    `- Technologies : ${context.frameworks.map(inline).join(", ") || "à confirmer"}`,
    `- Manifestes : ${context.manifests.map((name) => `\`${inline(name)}\``).join(", ")}`,
    `- Gestionnaire(s) verrouillé(s) : ${context.lockfiles.length ? context.lockfiles.map(({ manager }) => inline(manager)).join(", ") : "aucun fichier lock détecté"}`,
    "",
    "## Commandes disponibles",
    "",
  ];

  if (context.scripts.length) {
    lines.push(
      "Scripts npm détectés dans `package.json` (les valeurs des scripts ne sont pas copiées dans ce fichier) :",
      "",
      ...context.scripts.map((name) => `- \`npm run ${inline(name)}\``),
    );
    if (context.omittedScripts) lines.push(`- ${context.omittedScripts} autre(s) script(s) omis`);
  } else {
    lines.push("Aucun script npm détecté. Vérifiez les commandes du projet avant de lancer un build ou des tests.");
  }

  lines.push("", "## Structure de premier niveau", "");
  if (context.directories.length) {
    lines.push(...context.directories.map((name) => `- \`${inline(name)}\``));
  } else {
    lines.push("Aucun dossier de premier niveau détecté.");
  }

  lines.push(
    "",
    "## Consignes de travail",
    "",
    "- Consultez les fichiers et conventions concernés avant de modifier le code.",
    "- N'inventez pas de commandes : vérifiez les scripts et la documentation du dépôt.",
    "- Exécutez les contrôles pertinents après vos changements et signalez ceux qui n'ont pas pu être lancés.",
    "- Gardez les modifications ciblées et ne révélez jamais de secrets ou de valeurs de fichiers d'environnement.",
    "- N'effectuez pas d'action destructive sans validation explicite.",
    "",
  );
  return `${lines.join("\n").trimEnd()}\n`;
}

async function main(argv) {
  const { options, positionals } = parseOptions(argv, DEFINITION);
  if (positionals.length) throw new CliError("Cette commande n'accepte pas d'argument positionnel.", 1);
  if (options.help) {
    process.stdout.write(`${HELP}\n`);
    return 0;
  }
  if (options.version) {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  const content = renderContextPack(await collectProjectContext());
  process.stdout.write(content);
  if (!options.write) {
    process.stdout.write(`\nAucun fichier créé. Relancez avec --write pour créer ${options.output}.\n`);
    return 0;
  }

  const target = resolve(process.cwd(), options.output);
  await writeAtomic(target, content);
  process.stdout.write(`\nFichier créé : ${target}\n`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  setExitCode(await runCli(main));
}
