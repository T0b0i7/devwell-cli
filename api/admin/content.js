import {
  AdminError,
  contentPath,
  githubBranch,
  githubRepository,
  githubRequest,
  parseRequestBody,
  parseSiteContent,
  readSession,
  requireSameOrigin,
  sendJson,
} from "../../server/admin.js";

async function readContent(token) {
  const file = await githubRequest(token, contentPath());
  if (typeof file.content !== "string" || typeof file.sha !== "string") {
    throw new AdminError("Le fichier de contenu du site est invalide.", 502);
  }
  try {
    return {
      sha: file.sha,
      content: JSON.parse(Buffer.from(file.content.replace(/\s/g, ""), "base64").toString("utf8")),
    };
  } catch {
    throw new AdminError("Le fichier de contenu du site contient du JSON invalide.", 502);
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "PUT") {
    res.setHeader("Allow", "GET, PUT");
    return sendJson(res, 405, { error: "Méthode non autorisée." });
  }

  try {
    if (req.method === "PUT") requireSameOrigin(req);
    const session = readSession(req);
    if (!session) return sendJson(res, 401, { error: "Session absente ou expirée. Reconnectez-vous." });

    if (req.method === "GET") {
      const { content, sha } = await readContent(session.token);
      return sendJson(res, 200, { content, sha, user: session.login });
    }

    const body = parseRequestBody(req);
    const content = parseSiteContent(body.content);
    if (typeof body.sha !== "string" || !body.sha) {
      throw new AdminError("Version de contenu manquante. Rechargez l'administration avant d'enregistrer.", 400);
    }
    const current = await readContent(session.token);
    if (current.sha !== body.sha) {
      throw new AdminError("Le contenu a été modifié ailleurs. Rechargez l'administration avant d'enregistrer.", 409);
    }
    const repository = githubRepository();
    const [owner, repo] = repository.split("/");
    const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/public/content/site.json`;
    const result = await githubRequest(session.token, path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "content: update Devwell site settings",
        content: Buffer.from(`${JSON.stringify(content, null, 2)}\n`).toString("base64"),
        sha: body.sha,
        branch: githubBranch(),
      }),
    });
    return sendJson(res, 200, {
      commit: result.commit?.sha ?? null,
      sha: result.content?.sha ?? null,
      message: "Modifications enregistrées sur GitHub. Le site sera mis à jour après le déploiement Vercel.",
    });
  } catch (error) {
    return sendJson(res, error.status ?? 500, { error: error.message || "Impossible de charger le contenu." });
  }
}
