// api/fixtures.js
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

  const { teamId, seasonId, debug } = req.query;
  if (!teamId) {
    res.status(400).json({ error: "Missing teamId query param." });
    return;
  }
  const season = seasonId || "9dc3827d"; // Summer 2025/26

  try {
    const upstreamUrl = `https://api.playhq.com/v1/discover/seasons/${season}/teams/${teamId}/fixtures`;

    const playhqRes = await fetch(upstreamUrl, {
      headers: {
        "x-api-key": process.env.PLAYHQ_API_KEY,
        "Content-Type": "application/json",
      },
    });

    // Try JSON first, then fall back to text so we never hide upstream errors
    let body;
    let asText = null;
    try {
      body = await playhqRes.json();
    } catch {
      asText = await playhqRes.text();
    }

    if (debug) {
      res.setHeader("Cache-Control", "no-store");
      res.status(playhqRes.status).json({
        debug: true,
        upstreamUrl,
        upstreamStatus: playhqRes.status,
        upstreamOk: playhqRes.ok,
        // Return whichever we managed to parse
        body: body ?? null,
        text: asText ?? null,
      });
      return;
    }

    // Normal path
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

    if (!playhqRes.ok) {
      res
        .status(playhqRes.status)
        .json({ error: "Upstream error", status: playhqRes.status, body: body ?? asText });
      return;
    }

    res.status(200).json(body ?? { ok: true, note: "Empty response body" });
  } catch (err) {
    res.status(500).json({ error: "Proxy error", message: err?.message || String(err) });
  }
}
