import assert from "node:assert/strict";
import test from "node:test";
import { handlePlaygroundRequest } from "../server/playground.js";

function request({ method = "POST", body = { tool: "project-doctor" }, origin = "https://devwell.example", headers = {} } = {}) {
  return {
    method,
    body,
    headers: {
      origin,
      host: "devwell.example",
      "content-type": "application/json",
      ...headers,
    },
  };
}

test("playground API rejects methods, cross-origin requests, and arbitrary arguments", async () => {
  assert.equal((await handlePlaygroundRequest(request({ method: "GET" }))).status, 405);
  assert.equal((await handlePlaygroundRequest(request({ origin: "https://attacker.example" }))).status, 403);
  assert.equal((await handlePlaygroundRequest(request({ body: { tool: "project-doctor", args: ["--apply"] } }))).status, 400);
  assert.equal((await handlePlaygroundRequest(request({ body: { tool: "unknown" } }))).status, 400);
  assert.equal((await handlePlaygroundRequest(request({ headers: { "content-type": "text/plain" } }))).status, 415);
  assert.equal((await handlePlaygroundRequest(request({ headers: { "content-length": "1025" } }))).status, 413);
  assert.equal((await handlePlaygroundRequest(request({ body: "{" }))).status, 400);
});

for (const tool of ["readme-gen", "env-doctor", "project-doctor", "branch-cleaner"]) {
  test(`playground runs the real ${tool} command against a disposable fixture`, async () => {
    const result = await handlePlaygroundRequest(request({ body: { tool } }));
    assert.equal(result.status, 200);
    assert.match(result.body.command, /^devwell /);
    assert.equal(result.body.exitCode, tool === "env-doctor" ? 1 : 0, result.body.stderr);
    assert.ok(result.body.durationMs >= 0);
    assert.ok(result.body.stdout.length > 0);
    assert.equal(result.body.stderr, "");
    if (tool === "env-doctor") {
      assert.equal(JSON.parse(result.body.stdout).summary.errors, 1);
      assert.match(result.body.stdout, /ENV_KEY_MISSING/);
    } else if (tool === "readme-gen") {
      assert.match(result.body.stdout, /add preview support/);
    } else if (tool === "project-doctor") {
      assert.match(result.body.stdout, /devwell-playground-sample/);
    } else if (tool === "branch-cleaner") {
      assert.match(result.body.stdout, /feat\/preview/);
    }
  });
}
