import { handlePlaygroundRequest } from "../../server/playground.js";

export default async function handler(req, res) {
  const result = await handlePlaygroundRequest(req);
  res.statusCode = result.status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.end(JSON.stringify(result.body));
}
