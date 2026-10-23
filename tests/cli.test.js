import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
};

async function fixture(prefix) {
  return mkdtemp(join(tmpdir(), prefix));
}

function command(name, args, cwd, { allowFailure = false } = {}) {
  const result = spawnSync(process.execPath, [commands[name], ...args], {
    cwd,
    encoding: "utf8",
    timeout: 15_000,
    windowsHide: true,
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
  const report = command("devwell", ["env", "--json"], cwd);
  assert.deepEqual(JSON.parse(report.stdout).summary, { errors: 0, warnings: 0 });

  const legacy = command("env-doctor", ["--json"], cwd);
  assert.deepEqual(JSON.parse(legacy.stdout).summary, { errors: 0, warnings: 0 });
  const version = command("devwell", ["--version"], cwd);
  assert.equal(version.stdout.trim(), "0.1.0");
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

  const dryRun = command("readme-gen", ["--json", "--dry-run"], cwd);
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
    "--ci", "--json", "--min-score", "100", "--report", "reports/health.html",
  ], cwd);
  assert.equal(JSON.parse(result.stdout).score, 100);
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

  const dryRun = command("branch-cleaner", ["--json"], cwd);
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
