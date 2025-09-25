// Vercel Serverless Function — PlayHQ proxy for TEAM fixtures (External API)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const { teamId } = req.query;
  if (!teamId) {
    res.status(400).json({ error: "Missing teamId query param." });
    return;
  }

  try {
    const upstreamUrl = `https://api.playhq.com/v1/teams/${teamId}/games`;
    const upstream = await fetch(upstreamUrl, {
      headers: {
        "x-api-key": process.env.PLAYHQ_API_KEY,
        Accept: "application/json"
      }
    });

    const text = await upstream.text();
    let body = {};
    try { body = text ? JSON.parse(text) : {}; } catch { body = text; }

    // Cache for 5m
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: "Upstream error",
        status: upstream.status,
        body
      });
    }

    return res.status(200).json(body);
  } catch (err) {
    return res.status(500).json({ error: "Proxy error", message: String(err) });
  }
}
