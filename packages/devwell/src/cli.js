#!/usr/bin/env node
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CliError, runCli, setExitCode } from "../../core/src/index.js";

const VERSION = "0.1.1";
const HELP = `devwell — Des projets sains, des développeurs sereins

USAGE
  devwell <commande> [options]

COMMANDES
  readme      Génère un changelog ou un README depuis Git
  env         Vérifie la cohérence des fichiers .env
  doctor      Évalue la santé d'un projet Node.js ou Python
  branches    Audite et nettoie les branches locales Git

OPTIONS
  -h, --help      Affiche cette aide
  -v, --version   Affiche la version

ALIAS HISTORIQUES
  readme-gen, env-doctor, project-doctor, branch-cleaner restent disponibles

EXEMPLES
  devwell env --help
  devwell doctor --json
  devwell branches --json`;

const COMMANDS = {
  readme: "readme-gen",
  "readme-gen": "readme-gen",
  env: "env-doctor",
  "env-doctor": "env-doctor",
  doctor: "project-doctor",
  "project-doctor": "project-doctor",
  branches: "branch-cleaner",
  "branch-cleaner": "branch-cleaner",
};

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function runCommand(command, args) {
  const script = resolve(PACKAGE_ROOT, command, "src", "cli.js");
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [script, ...args], {
      stdio: "inherit",
      windowsHide: true,
    });
    child.once("error", rejectRun);
    child.once("close", (code, signal) => {
      if (signal) {
        rejectRun(new CliError(`La commande ${command} s'est arrêtée sur le signal ${signal}`, 2));
        return;
      }
      resolveRun(code ?? 2);
    });
  });
}

async function main(argv) {
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    process.stdout.write(`${HELP}\n`);
    return 0;
  }
  if (argv[0] === "--version" || argv[0] === "-v") {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  const command = COMMANDS[argv[0]];
  if (!command) {
    throw new CliError(`Commande inconnue : ${argv[0]}\n\n${HELP}`, 1);
  }
  return runCommand(command, argv.slice(1));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  setExitCode(await runCli(main));
}
