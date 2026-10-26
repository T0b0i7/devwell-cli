import {
  clearAuthCookies,
  clearStateCookie,
  githubRepository,
  requiredEnv,
  matchesState,
  sendJson,
  setSessionCookie,
  siteOrigin,
} from "../../server/admin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Méthode non autorisée." });
  }

  const query = new URL(req.url, "https://devwell.invalid").searchParams;
  const code = query.get("code");
  const state = query.get("state");
  if (!code || !matchesState(req, state)) {
    return sendJson(res, 400, { error: "La vérification de connexion a échoué. Recommencez depuis l'administration." });
  }

  try {
    const callbackUrl = `${siteOrigin()}/api/admin/callback`;
    const exchange = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: requiredEnv("GITHUB_OAUTH_CLIENT_ID"),
        client_secret: requiredEnv("GITHUB_OAUTH_CLIENT_SECRET"),
        code,
        redirect_uri: callbackUrl,
      }),
    });
    const credentials = await exchange.json();
    if (!exchange.ok || credentials.error || !credentials.access_token) {
      throw new Error("GitHub n'a pas pu terminer l'authentification.");
    }

    const identityResponse = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${credentials.access_token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Devwell-Admin",
      },
    });
    if (!identityResponse.ok) throw new Error("Impossible de vérifier le compte GitHub.");
    const identity = await identityResponse.json();
    const allowlist = requiredEnv("GITHUB_ADMIN_USERS")
      .split(",")
      .map((login) => login.trim().toLowerCase())
      .filter(Boolean);
    if (!identity.login || !allowlist.includes(identity.login.toLowerCase())) {
      clearAuthCookies(res);
      return sendJson(res, 403, { error: "Ce compte GitHub n'est pas autorisé à administrer le site." });
    }

    const repository = githubRepository();
    const permissionResponse = await fetch(`https://api.github.com/repos/${repository}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${credentials.access_token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Devwell-Admin",
      },
    });
    if (!permissionResponse.ok) throw new Error("Impossible de vérifier les droits du compte sur le dépôt.");
    const repositoryInfo = await permissionResponse.json();
    if (repositoryInfo.permissions?.push !== true) {
      clearAuthCookies(res);
      return sendJson(res, 403, { error: "Ce compte GitHub n'a pas les droits de modification nécessaires sur le dépôt." });
    }

    setSessionCookie(res, { token: credentials.access_token, login: identity.login });
    clearStateCookie(res);
    res.statusCode = 303;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Location", `${siteOrigin()}/#/admin`);
    return res.end();
  } catch (error) {
    clearAuthCookies(res);
    return sendJson(res, error.status ?? 502, { error: error.message || "Échec de la connexion GitHub." });
  }
}
