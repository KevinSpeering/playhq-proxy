// api/grade-fixtures.js
// Proxy to PlayHQ External API: Grade -> Games (fixtures/results)

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

  const { gradeId, cursor } = req.query;
  if (!gradeId) {
    res.status(400).json({ error: "Missing gradeId query param." });
    return;
  }

  try {
    const url = new URL("https://api.playhq.com/v1/grades/" + gradeId + "/games");
    if (cursor) url.searchParams.set("cursor", cursor);

    const upstream = await fetch(url.toString(), {
      headers: {
        "x-api-key": process.env.PLAYHQ_API_KEY,        // REQUIRED
        "x-phq-tenant": "ca",                           // Cricket Australia tenant
        "accept": "application/json"
      },
      // no body, it's a GET
      method: "GET"
    });

    // cache at edge for 5m for stability
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

    const text = await upstream.text(); // safely read once
    if (!upstream.ok) {
      res
        .status(upstream.status)
        .json({ error: "Upstream error", status: upstream.status, body: text });
      return;
    }

    // pass JSON through
    res.status(200).send(text);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Proxy error", message: err?.message || String(err) });
  }
}
