import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { auditBranches } from "../packages/branch-cleaner/src/cli.js";
import { parseEnv } from "../packages/env-doctor/src/cli.js";
import { parseCommit } from "../packages/readme-gen/src/cli.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const commands = {
  devwell: resolve(root, "packages/devwell/src/cli.js"),
  "readme-gen": resolve(root, "packages/readme-gen/src/cli.js"),
  "env-doctor": resolve(root, "packages/env-doctor/src/cli.js"),
  "project-doctor": resolve(root, "packages/project-doctor/src/cli.js"),
  "branch-cleaner": resolve(root, "packages/branch-cleaner/src/cli.js"),
  "context-pack": resolve(root, "packages/context-pack/src/cli.js"),
};

async function fixture(prefix) {
  return mkdtemp(join(tmpdir(), prefix));
}

function command(name, args, cwd, { allowFailure = false, env } = {}) {
  const childEnv = { ...process.env };
  if (env) {
    for (const [key, value] of Object.entries(env)) {
      const existingKey = Object.keys(childEnv).find((name) => name.toLowerCase() === key.toLowerCase());
      if (existingKey) delete childEnv[existingKey];
      childEnv[key] = value;
    }
  }
  const result = spawnSync(process.execPath, [commands[name], ...args], {
    cwd,
    encoding: "utf8",
    timeout: 15_000,
    windowsHide: true,
    env: childEnv,
  });
  if (result.error) throw result.error;
  if (!allowFailure && result.status !== 0) {
    throw new Error(`${name} exited ${result.status}\n${result.stderr}\n${result.stdout}`);
  }
  return result;
}

function git(cwd, ...args) {
  execFileSync("git", args, { cwd, stdio: "ignore" });
}

test("devwell dispatches subcommands and preserves legacy command aliases", async (t) => {
  const cwd = await fixture("devwell-command-");
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(join(cwd, ".env.example"), "APP_KEY=\n");
  await writeFile(join(cwd, ".env"), "APP_KEY=local\n");

  const help = command("devwell", ["--help"], cwd);
  assert.match(help.stdout, /devwell env --help/);
  assert.match(help.stdout, /context\s+Prépare un AGENTS\.md/);
  const report = command("devwell", ["env", "--files", ".env.example,.env", "--ci", "--json"], cwd);
  assert.deepEqual(JSON.parse(report.stdout).summary, { errors: 0, warnings: 0 });
  const pretty = command("env-doctor", [], cwd);
  assert.match(pretty.stdout, /RÉSUMÉ/);
  assert.match(pretty.stdout, /configuration est cohérente/);

  const legacy = command("env-doctor", ["--json"], cwd);
  assert.deepEqual(JSON.parse(legacy.stdout).summary, { errors: 0, warnings: 0 });
  const version = command("devwell", ["--version"], cwd);
  assert.equal(version.stdout.trim(), "0.1.1");
});

test("context-pack detects project context, previews, writes explicitly, and refuses overwrites", async (t) => {
  const cwd = await fixture("devwell-context-pack-");
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await mkdir(join(cwd, "src"));
  await mkdir(join(cwd, "tests"));
  await writeFile(join(cwd, "package-lock.json"), "{}");
  await writeFile(join(cwd, "package.json"), JSON.stringify({
    name: "sample-app",
    dependencies: { next: "1.0.0", react: "1.0.0" },
    scripts: { build: "echo do-not-copy-this-script-body", test: "node --test" },
  }));

  const preview = command("context-pack", [], cwd);
  assert.match(preview.stdout, /# Contexte du projet : sample-app/);
  assert.match(preview.stdout, /Node\.js, Next\.js, React/);
  assert.match(preview.stdout, /npm run build/);
  assert.match(preview.stdout, /Structure de premier niveau/);
  assert.ok(!preview.stdout.includes("do-not-copy-this-script-body"));
  assert.equal(await readFile(join(cwd, "AGENTS.md"), "utf8").catch(() => null), null);

  command("devwell", ["context", "--write"], cwd);
  const generated = await readFile(join(cwd, "AGENTS.md"), "utf8");
  assert.match(generated, /N'effectuez pas d'action destructive/);

  const overwrite = command("devwell", ["context", "--write"], cwd, { allowFailure: true });
  assert.equal(overwrite.status, 1);
  assert.match(overwrite.stderr, /existe déjà/);
  assert.equal(await readFile(join(cwd, "AGENTS.md"), "utf8"), generated);
});

test("context-pack reports when no supported manifest is present", async (t) => {
  const cwd = await fixture("devwell-context-empty-");
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const result = command("context-pack", [], cwd, { allowFailure: true });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Aucun manifeste reconnu/);
});

async function gitFixture() {
  const cwd = await fixture("atelier-git-");
  git(cwd, "init", "-q", "-b", "main");
  git(cwd, "config", "user.email", "tests@example.invalid");
  git(cwd, "config", "user.name", "CLI Tests");
  await writeFile(join(cwd, "file.txt"), "base\n");
  git(cwd, "add", ".");
  git(cwd, "commit", "-qm", "feat: initial version");
  return cwd;
}

test("readme-gen parses conventional commits and rejects malformed subjects", () => {
  assert.deepEqual(parseCommit("feat(cli)!: add json output"), {
    type: "feat",
    scope: "cli",
    breaking: true,
    description: "add json output",
  });
  assert.equal(parseCommit("work in progress"), null);
});

test("readme-gen generates JSON and writes safely without overwriting by default", async (t) => {
  const cwd = await gitFixture();
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(join(cwd, "file.txt"), "next\n");
  git(cwd, "commit", "-qam", "fix(core): keep old files safe");

  const check = command("readme-gen", ["--check"], cwd);
  assert.match(check.stdout, /Historique valide : 2 commit\(s\) vérifié\(s\)/);
  const dryRun = command("devwell", ["readme", "--dry-run", "--json", "--output", "-"], cwd);
  const report = JSON.parse(dryRun.stdout);
  assert.equal(report.versions[0].commits[0].type, "fix");
  assert.equal(await readFile(join(cwd, "CHANGELOG.md"), "utf8").catch(() => null), null);

  command("readme-gen", [], cwd);
  assert.match(await readFile(join(cwd, "CHANGELOG.md"), "utf8"), /keep old files safe/);
  const overwrite = command("readme-gen", [], cwd, { allowFailure: true });
  assert.equal(overwrite.status, 1);
  command("readme-gen", ["--force"], cwd);
  assert.match(await readFile(join(cwd, "CHANGELOG.md.bak"), "utf8"), /keep old files safe/);
});

test("env-doctor reports missing keys and secret patterns without revealing values", async (t) => {
  const cwd = await fixture("atelier-env-");
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const secret = "AKIAIOSFODNN7EXAMPLE";
  await writeFile(join(cwd, ".env.example"), "API_URL=\nAWS_ACCESS_KEY_ID=\nMISSING_KEY=\n");
  await writeFile(join(cwd, ".env"), `API_URL=https://example.invalid\nAWS_ACCESS_KEY_ID=${secret}\n`);
  const result = command("env-doctor", ["--files", ".env.example,.env", "--json"], cwd, { allowFailure: true });
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.ok(report.issues.some((issue) => issue.code === "ENV_KEY_MISSING" && issue.key === "MISSING_KEY"));
  assert.ok(report.issues.some((issue) => issue.code === "ENV_SECRET_EXPOSED"));
  assert.ok(!result.stdout.includes(secret));
  assert.deepEqual(parseEnv("export A='one'\r\nA=two\n").duplicates, ["A"]);
});

test("env-doctor reports malformed lines without echoing their contents", async (t) => {
  const cwd = await fixture("devwell-env-malformed-");
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(join(cwd, ".env.example"), "APP_KEY=\nmalformed reference content\n");
  await writeFile(join(cwd, ".env"), "APP_KEY=local\nmalformed target content\n");

  const result = command("env-doctor", ["--json"], cwd, { allowFailure: true });
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.equal(report.issues.filter((issue) => issue.code === "ENV_LINE_MALFORMED").length, 2);
  assert.ok(!result.stdout.includes("malformed reference content"));
  assert.ok(!result.stdout.includes("malformed target content"));
  assert.deepEqual(parseEnv("GOOD=value\nnot a valid assignment\n").malformed, [{ line: 2 }]);
});

test("env-doctor accepts environment file paths containing spaces", async (t) => {
  const cwd = await fixture("devwell-env-spaces-");
  const folder = join(cwd, "config files");
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await mkdir(folder);
  const reference = join(folder, ".env.example");
  const target = join(folder, ".env");
  await writeFile(reference, "APP_KEY=\n");
  await writeFile(target, "APP_KEY=local\n");

  const result = command("env-doctor", [reference, target, "--json"], cwd);
  const files = JSON.parse(result.stdout).files.map((file) => file.replaceAll("\\", "/"));
  assert.deepEqual(
    files.map((file) => file.slice(file.indexOf("config files/"))),
    ["config files/.env.example", "config files/.env"],
  );
});

test("env-doctor explains how to proceed when no environment files are found", async (t) => {
  const cwd = await fixture("devwell-empty-env-");
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const result = command("env-doctor", [], cwd);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /L'analyse n'a pas été effectuée/);
  assert.match(result.stdout, /--files/);
});

test("project-doctor scores a healthy Node project and creates an escaped HTML report", async (t) => {
  const cwd = await fixture("atelier-project-");
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(join(cwd, "package.json"), JSON.stringify({
    name: "<safe-project>",
    engines: { node: ">=18" },
    scripts: { dev: "vite", build: "vite build", test: "node --test", lint: "eslint ." },
  }));
  await writeFile(join(cwd, "package-lock.json"), "{}");
  await writeFile(join(cwd, "README.md"), "# Project\n");
  await writeFile(join(cwd, "LICENSE"), "MIT\n");
  await writeFile(join(cwd, ".gitignore"), "node_modules\n");
  const result = command("project-doctor", [
    "--offline", "--ci", "--json", "--min-score", "100", "--report", "reports/health.html",
  ], cwd);
  assert.equal(JSON.parse(result.stdout).score, 100);
  const documentedExample = command("devwell", ["doctor", "--offline", "--min-score", "0"], cwd);
  assert.match(documentedExample.stdout, /Santé du projet/);
  const pretty = command("project-doctor", ["--min-score", "0"], cwd);
  assert.match(pretty.stdout, /RÉSUMÉ/);
  assert.match(pretty.stdout, /configuration est cohérente/);
  const html = await readFile(join(cwd, "reports/health.html"), "utf8");
  assert.ok(html.includes("&lt;safe-project&gt;"));
  assert.ok(!html.includes("<safe-project>"));
});

test("project-doctor only applies its explicit allowlisted fix with a backup", async (t) => {
  const cwd = await fixture("atelier-fix-");
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(join(cwd, ".nvmrc"), "20.12.0\n");
  await writeFile(join(cwd, "package.json"), JSON.stringify({ name: "fixable", scripts: {} }));
  await writeFile(join(cwd, "package-lock.json"), "{}");
  const preview = command("project-doctor", ["--format", "json", "--fix", "--min-score", "0"], cwd);
  assert.deepEqual(JSON.parse(preview.stdout).fixes.applied, []);
  assert.equal(JSON.parse(await readFile(join(cwd, "package.json"), "utf8")).engines, undefined);
  command("project-doctor", ["--format", "json", "--fix", "--apply", "--min-score", "0"], cwd);
  const updated = JSON.parse(await readFile(join(cwd, "package.json"), "utf8"));
  assert.equal(updated.engines.node, ">=20");
  assert.ok(await readFile(join(cwd, "package.json.bak"), "utf8"));
});

test("project-doctor returns a setup error when no supported manifest exists", async (t) => {
  const cwd = await fixture("devwell-unsupported-project-");
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const result = command("project-doctor", [], cwd, { allowFailure: true });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Aucun package\.json ni pyproject\.toml/);
});

test("branch-cleaner dry-run preserves merged refs; --apply deletes only merged candidates", async (t) => {
  const cwd = await gitFixture();
  t.after(() => rm(cwd, { recursive: true, force: true }));

  git(cwd, "checkout", "-qb", "feature/merged");
  await writeFile(join(cwd, "merged.txt"), "merged\n");
  git(cwd, "add", ".");
  git(cwd, "commit", "-qm", "feat: merged feature");
  git(cwd, "checkout", "-q", "main");
  git(cwd, "merge", "--no-ff", "-qm", "merge feature", "feature/merged");
  git(cwd, "checkout", "-qb", "feature/wip");
  await writeFile(join(cwd, "wip.txt"), "work in progress\n");
  git(cwd, "add", ".");
  git(cwd, "commit", "-qm", "feat: work in progress");
  git(cwd, "checkout", "-q", "main");
  await writeFile(join(cwd, "current.txt"), "current\n");
  git(cwd, "add", ".");
  git(cwd, "commit", "-qm", "feat: current work");

  const documentedExample = command("devwell", ["branches", "--stale", "30", "--graph"], cwd);
  assert.match(documentedExample.stdout, /HISTORIQUE/);
  const pretty = command("branch-cleaner", [], cwd);
  assert.match(pretty.stdout, /RÉSUMÉ/);
  assert.match(pretty.stdout, /1 candidate\(s\)/);
  assert.match(pretty.stdout, /--apply/);
  const dryRun = command("branch-cleaner", ["--dry-run", "--json"], cwd);
  const report = JSON.parse(dryRun.stdout);
  assert.ok(report.candidates.some((branch) => branch.name === "feature/merged"));
  assert.ok(!report.candidates.some((branch) => branch.name === "main"));
  assert.ok(await readFile(join(cwd, "merged.txt"), "utf8"));
  command("branch-cleaner", ["--apply", "--format", "json"], cwd);
  const names = execFileSync("git", ["branch", "--format=%(refname:short)"], { cwd, encoding: "utf8" });
  assert.ok(!names.includes("feature/merged"));
  assert.ok(names.includes("feature/wip"));
  assert.ok(names.includes("main"));
});

test("branch-cleaner audit always protects current and default branches", () => {
  const candidates = auditBranches([
    { name: "main", ageDays: 100, merged: true, upstreamGone: false },
    { name: "feature/active", ageDays: 2, merged: false, upstreamGone: false },
    { name: "feature/merged", ageDays: 2, merged: true, upstreamGone: false },
  ], {
    current: "feature/active",
    patterns: ["main", "master", "develop", "dev", "release/*"],
    includeMerged: true,
    staleDays: null,
  });
  assert.deepEqual(candidates.map((branch) => branch.name), ["feature/merged"]);
});

test("branch-cleaner explains why an empty repository cannot be audited", async (t) => {
  const cwd = await fixture("devwell-empty-git-");
  t.after(() => rm(cwd, { recursive: true, force: true }));
  git(cwd, "init", "-q", "-b", "main");

  const result = command("branch-cleaner", [], cwd, { allowFailure: true });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /au moins un commit/);
});

test("branch-cleaner reports Git as a required dependency", async (t) => {
  const cwd = await fixture("devwell-no-git-");
  const emptyPath = join(cwd, "empty path");
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await mkdir(emptyPath);

  const result = command("branch-cleaner", [], cwd, {
    allowFailure: true,
    env: { PATH: emptyPath },
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /git/i);

  const readmeResult = command("readme-gen", [], cwd, {
    allowFailure: true,
    env: { PATH: emptyPath },
  });
  assert.equal(readmeResult.status, 2);
  assert.match(readmeResult.stderr, /git/i);
});
