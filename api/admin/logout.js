import {
  clearAuthCookies,
  requireSameOrigin,
  sendJson,
} from "../../server/admin.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Méthode non autorisée." });
  }
  try {
    requireSameOrigin(req);
    clearAuthCookies(res);
    return sendJson(res, 200, { message: "Session terminée." });
  } catch (error) {
    return sendJson(res, error.status ?? 500, { error: error.message || "Impossible de fermer la session." });
  }
}
