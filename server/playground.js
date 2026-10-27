import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const projectRoot = process.env.VERCEL
  ? process.cwd()
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_BODY_BYTES = 1024;
const MAX_OUTPUT_BYTES = 128 * 1024;
const COMMAND_TIMEOUT_MS = 7000;
const SETUP_TIMEOUT_MS = 2000;

const commands = {
  "readme-gen": {
    binary: "readme-gen",
    display: "devwell readme --dry-run --since v0.1.0 --lang fr",
    args: ["--dry-run", "--since", "v0.1.0", "--lang", "fr"],
  },
  "env-doctor": {
    binary: "env-doctor",
    display: "devwell env --files .env.example,.env --ci --json",
    args: ["--files", ".env.example,.env", "--ci", "--json"],
  },
  "project-doctor": {
    binary: "project-doctor",
    display: "devwell doctor --offline --json",
    args: ["--offline", "--json"],
  },
  "branch-cleaner": {
    binary: "branch-cleaner",
    display: "devwell branches --dry-run --json",
    args: ["--dry-run", "--json"],
  },
};

function response(status, body) {
  return { status, body };
}

function expectedOrigin(req) {
  const host = req.headers.host;
  if (!host) return null;
  const forwardedProtocol = req.headers["x-forwarded-proto"];
  const protocol = typeof forwardedProtocol === "string"
    ? forwardedProtocol.split(",")[0].trim()
    : host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https";
  return `${protocol}://${host}`;
}

async function requestBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === "string") {
      if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) return null;
      return JSON.parse(req.body);
    }
    if (Buffer.byteLength(JSON.stringify(req.body)) > MAX_BODY_BYTES) return null;
    return req.body;
  }

  const chunks = [];
  let bytes = 0;
  let oversized = false;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) oversized = true;
    else if (!oversized) chunks.push(chunk);
  }
  if (oversized) return null;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function runFile(command, args, cwd, env, timeout = COMMAND_TIMEOUT_MS) {
  return execFileAsync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    timeout,
    maxBuffer: MAX_OUTPUT_BYTES,
    windowsHide: true,
  });
}

function safeEnvironment(home) {
  const allowed = ["PATH", "SystemRoot", "WINDIR", "TEMP", "TMP", "LANG", "LC_ALL"];
  const env = Object.fromEntries(
    allowed.flatMap((name) => process.env[name] === undefined ? [] : [[name, process.env[name]]]),
  );
  return {
    ...env,
    HOME: home,
    USERPROFILE: home,
    NO_COLOR: "1",
    CI: "1",
    GIT_TERMINAL_PROMPT: "0",
    GIT_CONFIG_NOSYSTEM: "1",
  };
}

async function createFixture(cwd, env, needsGit) {
  await mkdir(cwd, { recursive: true });
  await mkdir(join(cwd, "src"), { recursive: true });
  await Promise.all([
    writeFile(join(cwd, "package.json"), JSON.stringify({
      name: "devwell-playground-sample",
      version: "1.0.0",
      engines: { node: `>=${process.versions.node.split(".")[0]}` },
      scripts: { dev: "vite", build: "vite build", test: "node --test", lint: "eslint ." },
    }, null, 2)),
    writeFile(join(cwd, "package-lock.json"), JSON.stringify({
      name: "devwell-playground-sample",
      version: "1.0.0",
      lockfileVersion: 3,
      requires: true,
      packages: { "": { name: "devwell-playground-sample", version: "1.0.0" } },
    }, null, 2)),
    writeFile(join(cwd, ".nvmrc"), `${process.versions.node.split(".")[0]}\n`),
    writeFile(join(cwd, ".gitignore"), "node_modules/\ndist/\n.env\n"),
    writeFile(join(cwd, "README.md"), "# Devwell Playground Sample\n\nA disposable sample project.\n"),
    writeFile(join(cwd, "LICENSE"), "MIT License\n"),
    writeFile(join(cwd, ".env.example"), "APP_URL=\nLOG_LEVEL=info\n"),
    writeFile(join(cwd, ".env"), "APP_URL=http://localhost:3000\n"),
    writeFile(join(cwd, "src", "app.js"), "export const appName = 'playground';\n"),
  ]);
  if (!needsGit) return;
  await runFile("git", ["init", "-q", "--template=", "-b", "main"], cwd, env, SETUP_TIMEOUT_MS);
  await runFile("git", ["add", "."], cwd, env, SETUP_TIMEOUT_MS);
  await runFile("git", [
    "-c", "user.email=playground@example.invalid",
    "-c", "user.name=Devwell Playground",
    "commit", "-qm", "chore: create sample project",
  ], cwd, env, SETUP_TIMEOUT_MS);
  await runFile("git", ["tag", "v0.1.0"], cwd, env, SETUP_TIMEOUT_MS);
  await writeFile(join(cwd, "src", "app.js"), "export const appName = 'playground';\nexport const previewReady = true;\n");
  await runFile("git", [
    "-c", "user.email=playground@example.invalid",
    "-c", "user.name=Devwell Playground",
    "commit", "-qam", "feat(app): add preview support",
  ], cwd, env, SETUP_TIMEOUT_MS);
  await runFile("git", ["branch", "feat/preview"], cwd, env, SETUP_TIMEOUT_MS);
}

export async function handlePlaygroundRequest(req) {
  if (req.method !== "POST") {
    return response(405, { error: "Méthode non autorisée." });
  }

  const contentType = req.headers["content-type"] ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return response(415, { error: "Le contenu doit être envoyé en JSON." });
  }

  if (req.headers.origin !== expectedOrigin(req)) {
    return response(403, { error: "Origine de requête refusée." });
  }

  try {
    if (Number(req.headers["content-length"]) > MAX_BODY_BYTES) {
      return response(413, { error: "La requête dépasse la taille maximale autorisée." });
    }
    const body = await requestBody(req);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return response(400, { error: "Corps de requête invalide." });
    }
    const command = typeof body.tool === "string" && Object.hasOwn(commands, body.tool)
      ? commands[body.tool]
      : null;
    if (!command || Object.keys(body).some((key) => key !== "tool")) {
      return response(400, { error: "Outil de démonstration non autorisé." });
    }

    const cwd = await mkdtemp(join(tmpdir(), "devwell-playground-"));
    const env = safeEnvironment(cwd);
    let startedAt = performance.now();
    try {
      await createFixture(cwd, env, command.binary === "readme-gen" || command.binary === "branch-cleaner");
      startedAt = performance.now();
      const script = resolve(projectRoot, "packages", command.binary, "src", "cli.js");
      const { stdout = "", stderr = "" } = await runFile(process.execPath, [script, ...command.args], cwd, env);
      return response(200, {
        command: command.display,
        exitCode: 0,
        durationMs: Math.round(performance.now() - startedAt),
        stdout: stdout.slice(0, MAX_OUTPUT_BYTES),
        stderr: stderr.slice(0, MAX_OUTPUT_BYTES),
      });
    } catch (error) {
      if (typeof error.stdout === "string" || typeof error.stderr === "string") {
        return response(200, {
          command: command.display,
          exitCode: typeof error.code === "number" ? error.code : 1,
          durationMs: Math.round(performance.now() - startedAt),
          stdout: (error.stdout ?? "").slice(0, MAX_OUTPUT_BYTES),
          stderr: (error.stderr ?? error.message ?? "La commande a échoué.").slice(0, MAX_OUTPUT_BYTES),
        });
      }
      console.error("Devwell Playground: execution de la fixture impossible.", error);
      return response(500, { error: "Impossible d'exécuter la démonstration pour le moment." });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return response(400, { error: "Corps JSON invalide." });
    }
    console.error("Devwell Playground: requête impossible à traiter.", error);
    return response(500, { error: "Impossible de traiter la démonstration pour le moment." });
  }
}
