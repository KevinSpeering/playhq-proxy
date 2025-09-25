// lib/ids.js
// Central place to keep Org/Season + Grade/Team ID mappings.
// Accepts short ids (8 hex) or full UUIDs.

// ---- Org / Season ----
export const ORG = {
  short: "28c4c8fb",
  uuid:  "28c4c8fb-80e1-4942-967b-b18235ec8a0b",
  name:  "Adelaide Lions CC",
};

export const SEASON = {
  short: "9dc3827d",
  uuid:  "9dc3827d-cefe-4712-8ab8-a0e037788259",
  name:  "Summer 2025/26",
};

// ---- Grades ----
export const GRADES = {
  // key by a friendly code you like to use in the UI
  A2:  { short: "eaf0a9df", uuid: "eaf0a9df-9925-49a7-bea3-5ca20e955a05", name: "A2 Sportcentre Grade" },
  B1:  { short: "1e3d1d9a", uuid: "1e3d1d9a-a717-4f90-87f9-25660ff11f57", name: "B1 Grade" },
  LO1: { short: "c400fda6", uuid: "c400fda6-73e3-47a9-ac85-2b87a9b6c0b8", name: "ISC Teamwear LO Division 1" },
  LO4: { short: "0c2237bd", uuid: "0c2237bd-f624-49fe-b786-fd1453487d5c", name: "ISC Teamwear LO Division 4" },
};

// ---- Teams ----
export const TEAMS = {
  A2:  { short: "eaf0a9df", uuid: "eaf0a9df-9925-49a7-bea3-5ca20e955a05", name: "Adelaide Lions A2" },
  B1:  { short: "1e3d1d9a", uuid: "1e3d1d9a-a717-4f90-87f9-25660ff11f57", name: "Adelaide Lions B1" },
  LO1: { short: "c400fda6", uuid: "c400fda6-73e3-47a9-ac85-2b87a9b6c0b8", name: "Adelaide Lions LO1" },
  LO4: { short: "0c2237bd", uuid: "0c2237bd-f624-49fe-b786-fd1453487d5c", name: "Adelaide Lions LO4" },
};

// ---- Helpers ----
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHORT_RE = /^[0-9a-f]{8}$/i;

export function normaliseToUuid(input, mapByShort = {}, mapByCode = {}) {
  if (!input) return null;

  // If already UUID, pass through
  if (UUID_RE.test(input)) return input;

  // If exactly 8-hex: treat as short id
  if (SHORT_RE.test(input)) {
    // Look in the provided short map (e.g., grades or teams)
    // mapByShort must be an object where values have { short, uuid }
    for (const key of Object.keys(mapByShort)) {
      const entry = mapByShort[key];
      if (entry.short?.toLowerCase() === input.toLowerCase()) {
        return entry.uuid;
      }
    }
  }

  // If friendly code (e.g., "A2" / "B1" / "LO1" / "LO4")
  if (mapByCode && mapByCode[input]) {
    return mapByCode[input].uuid;
  }

  return null; // not found
}
