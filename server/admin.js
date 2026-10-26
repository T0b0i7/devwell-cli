import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const SESSION_COOKIE = "devwell_admin_session";
const STATE_COOKIE = "devwell_admin_oauth_state";
const SESSION_TTL_SECONDS = 2 * 60 * 60;

export class AdminError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export function cookieValue(req, name) {
  const cookies = (req.headers.cookie ?? "").split(";");
  const entry = cookies.map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${name}=`));
  if (!entry) return null;
  try {
    return decodeURIComponent(entry.slice(name.length + 1));
  } catch {
    return null;
  }
}

function setCookie(res, name, value, maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const cookie = `${name}=${encodeURIComponent(value)}; Path=/api/admin; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
  const existing = res.getHeader?.("Set-Cookie");
  res.setHeader("Set-Cookie", existing ? [...(Array.isArray(existing) ? existing : [existing]), cookie] : cookie);
}

export function clearAuthCookies(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", [
    `${SESSION_COOKIE}=; Path=/api/admin; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
    `${STATE_COOKIE}=; Path=/api/admin; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
  ]);
}

function sessionKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new AdminError("ADMIN_SESSION_SECRET doit contenir au moins 32 caractères.", 503);
  }
  return createHash("sha256").update(secret).digest();
}

export function createSessionCookie(session) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", sessionKey(), iv);
  const payload = Buffer.from(JSON.stringify({
    ...session,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  }));
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const tag = cipher.getAuthTag();
  const value = [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
  return { name: SESSION_COOKIE, value, maxAge: SESSION_TTL_SECONDS };
}

export function readSession(req) {
  const value = cookieValue(req, SESSION_COOKIE);
  if (!value) return null;
  try {
    const [ivValue, tagValue, payloadValue] = value.split(".");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      sessionKey(),
      Buffer.from(ivValue, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    const payload = Buffer.concat([
      decipher.update(Buffer.from(payloadValue, "base64url")),
      decipher.final(),
    ]);
    const session = JSON.parse(payload.toString("utf8"));
    if (
      typeof session.token !== "string" ||
      typeof session.login !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) return null;
    return session;
  } catch (error) {
    if (error instanceof AdminError) throw error;
    return null;
  }
}

export function setSessionCookie(res, session) {
  const cookie = createSessionCookie(session);
  setCookie(res, cookie.name, cookie.value, cookie.maxAge);
}

export function setStateCookie(res, state) {
  setCookie(res, STATE_COOKIE, state, 600);
}

export function clearStateCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const cookie = `${STATE_COOKIE}=; Path=/api/admin; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
  const existing = res.getHeader?.("Set-Cookie");
  res.setHeader("Set-Cookie", existing ? [...(Array.isArray(existing) ? existing : [existing]), cookie] : cookie);
}

export function matchesState(req, state) {
  const stored = cookieValue(req, STATE_COOKIE);
  if (!stored || typeof state !== "string") return false;
  const storedBytes = Buffer.from(stored);
  const stateBytes = Buffer.from(state);
  return storedBytes.length === stateBytes.length && timingSafeEqual(storedBytes, stateBytes);
}

export function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new AdminError(`${name} n'est pas configurée dans Vercel.`, 503);
  return value;
}

export function siteOrigin() {
  const value = requiredEnv("ADMIN_SITE_URL");
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new AdminError("ADMIN_SITE_URL doit être une URL complète.", 503);
  }
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new AdminError("ADMIN_SITE_URL doit contenir uniquement l'origine du site, sans chemin.", 503);
  }
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new AdminError("ADMIN_SITE_URL doit utiliser HTTPS.", 503);
  }
  return url.origin;
}

export function requireSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin || origin !== siteOrigin()) {
    throw new AdminError("Origine de requête refusée.", 403);
  }
}

export function githubRepository() {
  const value = requiredEnv("GITHUB_REPOSITORY");
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)) {
    throw new AdminError("GITHUB_REPOSITORY doit être au format propriétaire/dépôt.", 503);
  }
  return value;
}

export function githubBranch() {
  const branch = process.env.GITHUB_BRANCH?.trim() || "main";
  if (!/^[A-Za-z0-9._/-]+$/.test(branch) || branch.startsWith("-") || branch.includes("..")) {
    throw new AdminError("GITHUB_BRANCH n'est pas une référence valide.", 503);
  }
  return branch;
}

export async function githubRequest(token, path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Devwell-Admin",
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const status = response.status === 404 ? 404 : response.status === 409 || response.status === 422 ? 409 : 502;
    throw new AdminError(body.message || "GitHub n'a pas accepté la requête.", status);
  }
  return body;
}

export function contentPath() {
  const [owner, repo] = githubRepository().split("/");
  const branch = encodeURIComponent(githubBranch());
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/public/content/site.json?ref=${branch}`;
}

export function parseSiteContent(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AdminError("Le contenu du site doit être un objet JSON.", 400);
  }
  const text = (field, maximum, name, optional = false) => {
    if (
      typeof field !== "string" ||
      field.trim().length > maximum ||
      (!optional && !field.trim())
    ) {
      const requirement = optional ? `un texte de 0 à ${maximum} caractères` : `un texte non vide de ${maximum} caractères au maximum`;
      throw new AdminError(`${name} doit être ${requirement}.`, 400);
    }
    return field.trim();
  };
  const navigationIds = new Set(["home", "tools", "guide", "playground", "install", "compare"]);
  if (!Array.isArray(value.navigation) || value.navigation.length !== navigationIds.size) {
    throw new AdminError("La navigation doit contenir ses six entrées configurables.", 400);
  }
  const ids = new Set();
  const navigation = value.navigation.map((item) => {
    if (!item || !navigationIds.has(item.id) || ids.has(item.id) || typeof item.visible !== "boolean") {
      throw new AdminError("Entrée de navigation invalide ou dupliquée.", 400);
    }
    ids.add(item.id);
    return { id: item.id, label: text(item.label, 32, "Libellé de navigation"), visible: item.visible };
  });
  if (!navigation.some((item) => item.visible)) {
    throw new AdminError("Au moins un élément de navigation doit rester visible.", 400);
  }
  if (!Array.isArray(value.announcements) || value.announcements.length > 20) {
    throw new AdminError("Le site peut contenir au plus vingt annonces.", 400);
  }
  const announcementIds = new Set();
  const announcements = value.announcements.map((item) => {
    if (!item || typeof item.id !== "string" || !/^[a-z0-9-]{1,64}$/.test(item.id) || announcementIds.has(item.id)) {
      throw new AdminError("Identifiant d'annonce invalide ou dupliqué.", 400);
    }
    announcementIds.add(item.id);
    if (typeof item.published !== "boolean") throw new AdminError("Statut d'annonce invalide.", 400);
    const href = text(item.href ?? "", 300, "Lien d'annonce", true);
    if (href && !href.startsWith("#/") && !/^https:\/\/[^\s]+$/i.test(href)) {
      throw new AdminError("Le lien d'une annonce doit être interne ou utiliser HTTPS.", 400);
    }
    const title = text(item.title, 100, "Titre d'annonce", !item.published);
    const message = text(item.message, 500, "Message d'annonce", !item.published);
    if (item.published && (!title || !message)) {
      throw new AdminError("Une annonce doit avoir un titre et un message avant publication.", 400);
    }
    return {
      id: item.id,
      title,
      message,
      href,
      linkLabel: text(item.linkLabel ?? "", 50, "Libellé de lien", true),
      published: item.published,
    };
  });
  return {
    siteTitle: text(value.siteTitle, 80, "Titre du site"),
    tagline: text(value.tagline, 180, "Signature du site"),
    heroTitle: text(value.heroTitle, 100, "Titre principal"),
    heroAccent: text(value.heroAccent, 80, "Accroche"),
    heroDescription: text(value.heroDescription, 500, "Description principale"),
    footerDescription: text(value.footerDescription, 400, "Description du pied de page"),
    navigation,
    announcements,
  };
}

export function parseRequestBody(req) {
  if (req.body && typeof req.body === "object") {
    if (Buffer.byteLength(JSON.stringify(req.body)) > 30_000) {
      throw new AdminError("Corps de requête trop volumineux.", 400);
    }
    return req.body;
  }
  const body = typeof req.body === "string" ? req.body : "";
  if (!body || body.length > 30_000) throw new AdminError("Corps de requête absent ou trop volumineux.", 400);
  try {
    return JSON.parse(body);
  } catch {
    throw new AdminError("Le corps de requête doit être du JSON valide.", 400);
  }
}
