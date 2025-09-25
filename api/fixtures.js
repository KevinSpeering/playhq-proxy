// api/fixtures.js
// Vercel Serverless Function — PlayHQ proxy with CORS.
// Reads upstream body once (as text), then safely JSON.parse's it.
// Env: PLAYHQ_API_KEY

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

    // Read ONCE as text
    const raw = await playhqRes.text();

    // Try to parse JSON from raw
    let parsed = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch (_) {
      // not JSON; leave parsed as null
    }

    if (debug) {
      res.setHeader("Cache-Control", "no-store");
      res.status(playhqRes.status).json({
        debug: true,
        upstreamUrl,
        upstreamStatus: playhqRes.status,
        upstreamOk: playhqRes.ok,
        // If JSON parsed, show it; otherwise show raw text
        body: parsed ?? raw ?? null,
      });
      return;
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

    if (!playhqRes.ok) {
      res.status(playhqRes.status).json({
        error: "Upstream error",
        status: playhqRes.status,
        body: parsed ?? raw ?? null,
      });
      return;
    }

    // Successful path
    if (parsed !== null) {
      res.status(200).json(parsed);
    } else {
      // Upstream said OK but body wasn't JSON; still return something
      res.status(200).json({ ok: true, note: "Non-JSON upstream body", body: raw });
    }
  } catch (err) {
    res.status(500).json({ error: "Proxy error", message: err?.message || String(err) });
  }
}
