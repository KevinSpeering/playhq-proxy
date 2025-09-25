// api/fixtures.js
// Vercel Serverless Function — PlayHQ proxy with CORS.
// Uses an environment variable PLAYHQ_API_KEY (set in Vercel).

export default async function handler(req, res) {
  // --- CORS (allow browser calls from Wix) ---
  const origin = req.headers.origin || "*";
  // If you want to restrict later, replace "*" with your domains:
  // e.g., ['https://adelaidelions.com.au', 'https://*.wixsite.com', 'https://*.filesusr.com']
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end(); // preflight
    return;
  }

  const { teamId } = req.query;
  if (!teamId) {
    res.status(400).json({ error: "Missing teamId query param." });
    return;
  }

  try {
    const playhqRes = await fetch(
      `https://api.playhq.com/v1/discover/teams/${teamId}/fixtures`,
      {
        headers: {
          "x-api-key": process.env.PLAYHQ_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    const data = await playhqRes.json();

    // Cache at the edge for 5 min to ease API load; refresh in background
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

    if (!playhqRes.ok) {
      res.status(playhqRes.status).json({ error: "Upstream error", data });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Proxy error", message: err?.message || String(err) });
  }
}
