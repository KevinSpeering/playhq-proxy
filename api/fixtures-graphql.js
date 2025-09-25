// api/fixtures-graphql.js
// GraphQL proxy for PlayHQ fixtures (CORS-safe for Wix).
// Env required: PLAYHQ_API_KEY, PLAYHQ_GRAPHQL_URL

const QUERY = `
  query TeamFixtures($teamId: ID!, $seasonId: ID!) {
    discoverTeam(id: $teamId) { id name }
    discoverTeamFixture(teamId: $teamId, seasonId: $seasonId) {
      id
      name
      fixture {
        byes { id }
        games {
          id
          date
          dates
          status { value name }
          home { id name }
          away { id name }
          allocation {
            time
            dateTimeList { date time }
            court {
              id
              name
              venue {
                id
                name
                suburb
                state
                postcode
                country
                address
              }
            }
          }
          result {
            homeTeam { score }
            awayTeam { score }
            summary
          }
          gameType { value name }
        }
      }
    }
  }
`;

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
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
  // Default to Summer 2025/26 (from your paste)
  const season = seasonId || "9dc3827d";

  const url = process.env.PLAYHQ_GRAPHQL_URL;
  if (!url) {
    res.status(500).json({ error: "Missing PLAYHQ_GRAPHQL_URL env var" });
    return;
  }

  try {
    const upstreamRes = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": process.env.PLAYHQ_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { teamId, seasonId: season },
      }),
    });

    const raw = await upstreamRes.text();
    let parsed = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch {}

    if (debug) {
      res.setHeader("Cache-Control", "no-store");
      res.status(upstreamRes.status).json({
        debug: true,
        upstreamStatus: upstreamRes.status,
        upstreamOk: upstreamRes.ok,
        url,
        body: parsed ?? raw ?? null,
      });
      return;
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

    if (!upstreamRes.ok) {
      res.status(upstreamRes.status).json({
        error: "Upstream error",
        status: upstreamRes.status,
        body: parsed ?? raw ?? null,
      });
      return;
    }

    res.status(200).json(parsed ?? { ok: true, note: "Non-JSON upstream body", body: raw });
  } catch (err) {
    res.status(500).json({ error: "Proxy error", message: err?.message || String(err) });
  }
}
