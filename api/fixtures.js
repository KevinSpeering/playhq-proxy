// api/fixtures.js
// Vercel Serverless Function — PlayHQ proxy with CORS.
// Uses an environment variable PLAYHQ_API_KEY (set in Vercel).

export default async function handler(req, res) {
  // --- CORS (allow browser calls from Wix) ---
  res.setHeader("Access-Control-Allow-Origin", "*"); // can restrict later
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end(); // preflight
    return;
  }

  const { teamId, seasonId } = req.query;

  if (!teamId) {
    res.status(400).json({ error: "Missing teamId query param." });
    return;
  }

  // Fallback seasonId if not passed
  const season = seasonId || "9dc3827d"; // Summer 2025/26

  try {
    const playhqRes = await fetch(
      `https://api.playhq.com/v1/discover/seasons/${season}/teams/${teamId}/fixtures`,
      {
        headers: {
          "x-api-key": process.env.PLAYHQ_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    let body = null;
    try {
      body = await playhqRes.json();
    } catch {
      body = await playhqRes.text(); // fallback if response isn’t JSON
    }

    // Cache at the edge for 5 min to ease API load; refresh in background
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

    if (!playhqRes.ok) {
      res
        .status(playhqRes.status)
        .json({ error: "Upstream error", status: playhqRes.status, body });
      return;
    }

    res.status(200).json(body);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Proxy error", message: err?.message || String(err) });
  }
}
