// api/game-summary.js
// Proxy to PlayHQ External API: Game Summary (v1 works for cricket)

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const { gameId } = req.query;
  if (!gameId) {
    res.status(400).json({ error: "Missing gameId query param." });
    return;
  }

  try {
    // v1 summary is the broadest compatible for cricket
    const url = `https://api.playhq.com/v1/games/${gameId}/summary`;

    const upstream = await fetch(url, {
      headers: {
        "x-api-key": process.env.PLAYHQ_API_KEY,
        "x-phq-tenant": "ca",
        "accept": "application/json"
      },
      method: "GET"
    });

    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");

    const text = await upstream.text();
    if (!upstream.ok) {
      res
        .status(upstream.status)
        .json({ error: "Upstream error", status: upstream.status, body: text });
      return;
    }

    res.status(200).send(text);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Proxy error", message: err?.message || String(err) });
  }
}
