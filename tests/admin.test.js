import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import handler from "../api/admin/content.js";
import {
  createSessionCookie,
  parseSiteContent,
  readSession,
} from "../server/admin.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const originalSecret = process.env.ADMIN_SESSION_SECRET;
process.env.ADMIN_SESSION_SECRET = "test-only-admin-session-secret-long-enough";

function response() {
  const headers = new Map();
  return {
    headers,
    statusCode: 200,
    body: "",
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
    },
    getHeader(name) {
      return headers.get(name.toLowerCase());
    },
    end(value = "") {
      this.body = value;
    },
    json() {
      return JSON.parse(this.body);
    },
  };
}

function authenticatedRequest(method, body) {
  const session = createSessionCookie({ token: "test-access-token", login: "admin-user" });
  return {
    method,
    url: "/api/admin/content",
    headers: {
      cookie: `${session.name}=${encodeURIComponent(session.value)}`,
      ...(method === "PUT" ? { origin: "https://devwell.example" } : {}),
    },
    body,
  };
}

test("admin sessions are encrypted and reject tampering", () => {
  const session = createSessionCookie({ token: "private-token", login: "owner" });
  const req = { headers: { cookie: `${session.name}=${encodeURIComponent(session.value)}` } };
  assert.deepEqual(
    { token: readSession(req)?.token, login: readSession(req)?.login },
    { token: "private-token", login: "owner" },
  );
  const tampered = `${session.value.slice(0, -1)}x`;
  assert.equal(readSession({ headers: { cookie: `${session.name}=${tampered}` } }), null);
  assert.ok(!session.value.includes("private-token"));
});

test("admin content validation rejects unsafe links and empty published notices", async () => {
  const content = JSON.parse(await readFile(resolve(root, "public/content/site.json"), "utf8"));
  assert.deepEqual(parseSiteContent(content), content);
  assert.throws(
    () => parseSiteContent({ ...content, announcements: [{
      id: "bad-link",
      title: "Unsafe",
      message: "Do not execute this link",
      href: "javascript:alert(1)",
      linkLabel: "Open",
      published: true,
    }] }),
    (error) => error instanceof Error && error.message.includes("doit être interne ou utiliser HTTPS"),
  );
  assert.throws(
    () => parseSiteContent({ ...content, announcements: [{
      id: "empty",
      title: "",
      message: "",
      href: "",
      linkLabel: "",
      published: true,
    }] }),
    /Titre d'annonce doit être un texte non vide/,
  );
});

test("admin content API requires an authenticated session and same-origin writes", async () => {
  const previousSiteUrl = process.env.ADMIN_SITE_URL;
  process.env.ADMIN_SITE_URL = "https://devwell.example";
  try {
    const unauthorized = response();
    await handler({ method: "GET", headers: {} }, unauthorized);
    assert.equal(unauthorized.statusCode, 401);

    const crossOrigin = response();
    const request = authenticatedRequest("PUT", { content: {} });
    request.headers.origin = "https://attacker.example";
    await handler(request, crossOrigin);
    assert.equal(crossOrigin.statusCode, 403);

    const missingRevision = response();
    const validContent = JSON.parse(await readFile(resolve(root, "public/content/site.json"), "utf8"));
    await handler(authenticatedRequest("PUT", { content: validContent }), missingRevision);
    assert.equal(missingRevision.statusCode, 400);
    assert.match(missingRevision.json().error, /Version de contenu manquante/);
  } finally {
    if (previousSiteUrl === undefined) delete process.env.ADMIN_SITE_URL;
    else process.env.ADMIN_SITE_URL = previousSiteUrl;
  }
});

test("admin content API loads and saves validated content through GitHub", async (t) => {
  const previous = {
    fetch: globalThis.fetch,
    siteUrl: process.env.ADMIN_SITE_URL,
    repository: process.env.GITHUB_REPOSITORY,
    branch: process.env.GITHUB_BRANCH,
  };
  const source = JSON.parse(await readFile(resolve(root, "public/content/site.json"), "utf8"));
  let savedPayload;
  process.env.ADMIN_SITE_URL = "https://devwell.example";
  process.env.GITHUB_REPOSITORY = "owner/site";
  process.env.GITHUB_BRANCH = "main";
  globalThis.fetch = async (_url, options = {}) => {
    if (options.method === "PUT") {
      savedPayload = JSON.parse(options.body);
      return new Response(JSON.stringify({
        commit: { sha: "commit-sha" },
        content: { sha: "updated-file-sha" },
      }), { status: 200 });
    }
    return new Response(JSON.stringify({
      sha: "file-sha",
      content: Buffer.from(`${JSON.stringify(source)}\n`).toString("base64"),
    }), { status: 200 });
  };
  t.after(() => {
    globalThis.fetch = previous.fetch;
    if (previous.siteUrl === undefined) delete process.env.ADMIN_SITE_URL;
    else process.env.ADMIN_SITE_URL = previous.siteUrl;
    if (previous.repository === undefined) delete process.env.GITHUB_REPOSITORY;
    else process.env.GITHUB_REPOSITORY = previous.repository;
    if (previous.branch === undefined) delete process.env.GITHUB_BRANCH;
    else process.env.GITHUB_BRANCH = previous.branch;
  });

  const loaded = response();
  await handler(authenticatedRequest("GET"), loaded);
  assert.equal(loaded.statusCode, 200);
  assert.equal(loaded.json().user, "admin-user");
  assert.deepEqual(loaded.json().content, source);
  assert.equal(loaded.json().sha, "file-sha");

  const updated = { ...source, tagline: "Un site administré avec soin." };
  const saved = response();
  await handler(authenticatedRequest("PUT", { content: updated, sha: "file-sha" }), saved);
  assert.equal(saved.statusCode, 200);
  assert.equal(saved.json().commit, "commit-sha");
  assert.equal(saved.json().sha, "updated-file-sha");
  assert.equal(JSON.parse(Buffer.from(savedPayload.content, "base64").toString("utf8")).tagline, updated.tagline);
  assert.equal(savedPayload.sha, "file-sha");
});

test("admin content API rejects a stale editor instead of overwriting newer changes", async (t) => {
  const previous = {
    fetch: globalThis.fetch,
    siteUrl: process.env.ADMIN_SITE_URL,
    repository: process.env.GITHUB_REPOSITORY,
    branch: process.env.GITHUB_BRANCH,
  };
  process.env.ADMIN_SITE_URL = "https://devwell.example";
  process.env.GITHUB_REPOSITORY = "owner/site";
  process.env.GITHUB_BRANCH = "main";
  globalThis.fetch = async () => new Response(JSON.stringify({
    sha: "newer-file-sha",
    content: Buffer.from("{}").toString("base64"),
  }), { status: 200 });
  t.after(() => {
    globalThis.fetch = previous.fetch;
    if (previous.siteUrl === undefined) delete process.env.ADMIN_SITE_URL;
    else process.env.ADMIN_SITE_URL = previous.siteUrl;
    if (previous.repository === undefined) delete process.env.GITHUB_REPOSITORY;
    else process.env.GITHUB_REPOSITORY = previous.repository;
    if (previous.branch === undefined) delete process.env.GITHUB_BRANCH;
    else process.env.GITHUB_BRANCH = previous.branch;
  });

  const result = response();
  await handler(authenticatedRequest("PUT", {
    sha: "stale-file-sha",
    content: JSON.parse(await readFile(resolve(root, "public/content/site.json"), "utf8")),
  }), result);
  assert.equal(result.statusCode, 409);
  assert.match(result.json().error, /modifié ailleurs/);
});

test.after(() => {
  if (originalSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = originalSecret;
});
