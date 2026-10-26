import { randomBytes } from "node:crypto";
import { requiredEnv, sendJson, setStateCookie, siteOrigin } from "../../server/admin.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Méthode non autorisée." });
  }
  try {
    const state = randomBytes(32).toString("base64url");
    const redirectUri = `${siteOrigin()}/api/admin/callback`;
    const params = new URLSearchParams({
      client_id: requiredEnv("GITHUB_OAUTH_CLIENT_ID"),
      redirect_uri: redirectUri,
      scope: "public_repo",
      state,
    });
    setStateCookie(res, state);
    res.statusCode = 302;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Location", `https://github.com/login/oauth/authorize?${params}`);
    return res.end();
  } catch (error) {
    return sendJson(res, error.status ?? 500, { error: error.message || "Connexion indisponible." });
  }
}
