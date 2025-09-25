// api/fixtures-graphql.js
// GraphQL proxy for PlayHQ. Requires:
// - PLAYHQ_GRAPHQL_URL (full URL you copied from DevTools)
// - PLAYHQ_API_KEY (same key; used as x-api-key by default)

const QUERY = `
  query TeamFixtures($teamId: ID!, $seasonId: ID!) {
    discoverTeam(id: $teamId) { id name }
    discoverTeamFixture(teamId: $teamId, seasonId: $seasonId) {
      id
      name
      fixture {
        games {
          id
          date
          dates
          status { value name }
          home { id name }
          away { id name }
          allocation {
            time
            court {
              venue { name suburb state postcode country }
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
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
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

    let json = null;
    let text = null;
    try {
      json = await upstreamRes.json();
    } catch {
      text = await upstreamRes.text();
    }

    if (debug) {
      res.setHeader("Cache-Control", "no-store");
      res.status(upstreamRes.status).json({
        debug: true,
        upstreamStatus: upstreamRes.status,
        upstreamOk: upstreamRes.ok,
        url,
        json,
        text,
      });
      return;
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

    if (!upstreamRes.ok) {
      res.status(upstreamRes.status).json({
        error: "Upstream error",
        status: upstreamRes.status,
        body: json ?? text,
      });
      return;
    }

    res.status(200).json(json);
  } catch (err) {
    res.status(500).json({ error: "Proxy error", message: err?.message || String(err) });
  }
}
