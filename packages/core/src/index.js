import { execFile as execFileCallback } from "node:child_process";
import { copyFile, mkdir, open, readFile, rename, rm, stat } from "node:fs/promises";
import { dirname, basename, resolve } from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

export class CliError extends Error {
  constructor(message, exitCode = 2) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
  }
}

export function parseOptions(argv, definition) {
  const options = Object.fromEntries(
    Object.entries(definition).map(([name, spec]) => [
      name,
      spec.multiple ? [] : spec.default,
    ]),
  );
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      positionals.push(...argv.slice(index + 1));
      break;
    }
    if (!arg.startsWith("--")) {
      if (arg.startsWith("-") && arg !== "-") {
        const short = Object.entries(definition).find(([, spec]) => spec.short === arg);
        if (!short) throw new CliError(`Option inconnue : ${arg}`, 1);
        const [name, spec] = short;
        if (spec.type === "boolean") {
          options[name] = true;
        } else {
          const value = argv[++index];
          if (value === undefined) throw new CliError(`Valeur manquante pour ${arg}`, 1);
          options[name] = value;
        }
        continue;
      }
      positionals.push(arg);
      continue;
    }

    const separator = arg.indexOf("=");
    const name = arg.slice(2, separator < 0 ? undefined : separator);
    const negated = name.startsWith("no-");
    const key = negated ? name.slice(3) : name;
    const spec = definition[key];
    if (!spec) throw new CliError(`Option inconnue : --${name}`, 1);
    if (spec.type === "boolean") {
      if (separator >= 0) throw new CliError(`--${name} ne prend pas de valeur`, 1);
      options[key] = !negated;
      continue;
    }
    if (negated) throw new CliError(`--no-${key} n'est pas une option valide`, 1);
    const value = separator >= 0 ? arg.slice(separator + 1) : argv[++index];
    if (value === undefined || value === "") throw new CliError(`Valeur manquante pour --${key}`, 1);
    if (spec.multiple) options[key].push(value);
    else options[key] = value;
  }

  return { options, positionals };
}

export async function runFile(command, args, { cwd = process.cwd(), timeout = 10_000, env } = {}) {
  try {
    const { stdout, stderr } = await execFile(command, args, {
      cwd,
      timeout,
      maxBuffer: 8 * 1024 * 1024,
      encoding: "utf8",
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0", ...env },
    });
    return { stdout, stderr };
  } catch (error) {
    const message = error.stderr?.trim() || error.message || `${command} a échoué`;
    throw new CliError(message, error.code === "ENOENT" ? 2 : 1);
  }
}

export async function readText(path) {
  return readFile(path, "utf8");
}

export async function readJson(path) {
  try {
    return JSON.parse(await readText(path));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw new CliError(`${basename(path)} est invalide : ${error.message}`, 1);
  }
}

export async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export async function writeAtomic(path, content, { force = false, backup = false } = {}) {
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  const existing = await pathExists(target);
  if (existing && !force) throw new CliError(`${basename(target)} existe déjà; utilisez --force pour le remplacer`, 1);

  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
  const backupPath = `${target}.bak`;
  let backupCreated = false;
  try {
    const handle = await open(temporary, "wx");
    try {
      await handle.writeFile(content, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
    if (existing && backup) {
      await copyFile(target, backupPath, 1);
      backupCreated = true;
    }
    if (existing) await rm(target);
    await rename(temporary, target);
    return { backup: backupCreated ? backupPath : null };
  } catch (error) {
    await rm(temporary, { force: true });
    if (backupCreated && !(await pathExists(target))) {
      await copyFile(backupPath, target).catch(() => {});
    }
    if (error.code === "EEXIST" || error.code === "ERR_FS_CP_EEXIST") {
      throw new CliError(`${basename(backupPath)} existe déjà; déplacez-le avant de remplacer ce fichier`, 1);
    }
    throw error;
  }
}

export function writeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

export async function runCli(main, argv = process.argv.slice(2)) {
  try {
    return await main(argv);
  } catch (error) {
    const exitCode = error instanceof CliError ? error.exitCode : 2;
    process.stderr.write(`Erreur : ${error.message || String(error)}\n`);
    return exitCode;
  }
}

export function setExitCode(code) {
  process.exitCode = code;
}
