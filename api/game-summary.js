// api/game-summary.js
export default async function handler(req, res) {
  // CORS for Wix
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const { gameId } = req.query;
  if (!gameId) return res.status(400).json({ error: "Missing gameId" });

  try {
    const upstream = await fetch(
      `https://api.playhq.com/v1/games/${gameId}/summary`,
      {
        headers: {
          "x-api-key": process.env.PLAYHQ_API_KEY,
          "x-phq-tenant": "ca",
          "Accept": "application/json"
        }
      }
    );

    const text = await upstream.text();
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");

    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: "Upstream error", status: upstream.status, body: text });
    }

    try {
      const json = JSON.parse(text || "{}");
      return res.status(200).json(json);
    } catch {
      return res.status(200).send(text);
    }
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Proxy error", message: e?.message || String(e) });
  }
}
