const PLAYHQ_BASE = "https://api.playhq.com";
const TENANT = process.env.PLAYHQ_TENANT || "cricket-australia";

export function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export async function fetchPlayHQ(url) {
  const headers = {
    "x-api-key": process.env.PLAYHQ_API_KEY,
    "tenant": TENANT,
    "Content-Type": "application/json"
  };

  const r = await fetch(url, { headers });
  const text = await r.text();
  let body = text;
  try { body = text ? JSON.parse(text) : ""; } catch { /* leave as text */ }

  return { ok: r.ok, status: r.status, body };
}

export function required(res, obj, keys) {
  for (const k of keys) {
    if (!obj[k]) {
      res.status(400).json({ error: `Missing required query param: ${k}` });
      return false;
    }
  }
  return true;
}

export { PLAYHQ_BASE };
