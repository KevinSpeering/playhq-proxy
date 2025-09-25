// Proxy: Game Summary (used to compute W/L and show final scores nicely)
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  const { gameId } = req.query;
  if (!gameId) return res.status(400).json({ error: "Missing gameId query param." });

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(gameId)) {
    return res.status(400).json({ error: "Invalid gameId (must be UUID from External API)" });
  }

  try {
    const url = `https://api.playhq.com/v1/games/${gameId}/summary`;

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": process.env.PLAYHQ_API_KEY,
        "x-phq-tenant": "ca",
        "accept": "application/json"
      }
    });

    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");

    const text = await upstream.text();
    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: "Upstream error", status: upstream.status, body: text });
    }

    res.status(200).send(text);
  } catch (err) {
    res.status(500).json({ error: "Proxy error", message: err?.message || String(err) });
  }
}
