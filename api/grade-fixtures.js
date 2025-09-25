// api/grade-fixtures.js
import { GRADES, normaliseToUuid } from "../lib/ids.js";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  const { gradeId, debug, cursor } = req.query;

  const gradeUuid =
    normaliseToUuid(gradeId, GRADES, GRADES) // checks UUID, short, or code
    || normaliseToUuid(gradeId, GRADES, null);

  if (!gradeUuid) {
    return res.status(400).json({
      error: "Invalid gradeId",
      message: "Provide a grade UUID, short id (8 hex), or code (A2/B1/LO1/LO4).",
    });
  }

  try {
    const url = new URL(`https://api.playhq.com/v1/grades/${gradeUuid}/games`);
    if (cursor) url.searchParams.set("cursor", cursor);

    const upstream = await fetch(url.toString(), {
      headers: {
        "x-api-key": process.env.PLAYHQ_API_KEY,
        "x-phq-tenant": "ca",
        accept: "application/json",
      },
    });

    const text = await upstream.text();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: "Upstream error",
        status: upstream.status,
        ...(debug ? { url: url.toString(), body: text } : {}),
      });
    }

    try {
      const json = text ? JSON.parse(text) : {};
      return res.status(200).json(json);
    } catch {
      return res.status(200).send(text);
    }
  } catch (err) {
    return res.status(500).json({ error: "Proxy error", message: String(err) });
  }
}
