import { setCors, required, fetchPlayHQ, PLAYHQ_BASE } from "./_helpers.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const { teamId, seasonId } = req.query;
  if (!required(res, { teamId, seasonId }, ["teamId", "seasonId"])) return;

  const url = `${PLAYHQ_BASE}/v1/teams/${teamId}/games?seasonId=${seasonId}`;
  const out = await fetchPlayHQ(url);

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=300");
  if (!out.ok) return res.status(out.status).json({ error: "Upstream error", ...out });
  res.status(200).json(out.body);
}
