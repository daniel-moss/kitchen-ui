// Point every job at the equipment its SERVICE is about.
//
// Added 2026-09-28 (Daniel: "Many jobs don't have an equipment ... However,
// the service sounds like the work is related to a piece of equipment ... In
// most of the cases equipment is involved"). A job's `equipmentIds` used to be
// empty on 67 of the 78 rows.
//
// Re-runnable and idempotent: it reads the CURRENT equipment out of db.ts and
// rewrites each job's `equipmentIds`. Run it after
// scripts/regenerate-db-rows.mjs, which emits the mass job rows with an empty
// array.
//
//   node scripts/assign-job-equipment.mjs [--dry-run]

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// --db=<path> targets another copy (the Filters prototype keeps its own,
// frozen, and is NOT maintained by this script).
const dbArg = process.argv.find((a) => a.startsWith("--db="));
const DB = dbArg ? dbArg.slice(5) : fileURLToPath(new URL("../src/data/db/db.ts", import.meta.url));
const dryRun = process.argv.includes("--dry-run");

/**
 * Service → the equipment CATEGORY it works on. A category match is enough:
 * the real type lists are narrower than the services are (a walk-in-cooler
 * call on a location whose only refrigeration is a walk-in freezer is still
 * that box), and a site holds one piece per category in this demo.
 */
const SERVICE_CATEGORY = {
  "walk-in-cooler": "Refrigeration",
  "freezer-seal": "Refrigeration",
  "prep-fridge": "Refrigeration",
  "ice-machine": "Ice Machines",
  dishwasher: "Dishwashing Equipment",
  "combi-oven": "Ovens and Ranges",
  "range-burner": "Ovens and Ranges",
  "fryer-service": "Fryers",
  "hood-cleaning": "HVAC",
  "grease-trap": "Plumbing",
  "steam-table": "Holding and Warming Equipment",
  espresso: "Beverage Equipment",
};

/**
 * Jobs that stay WITHOUT equipment on purpose — the db keeps deliberate gaps
 * so the empty states stay reachable, and Daniel's own rule allows it ("A job
 * might have no equipment but it's usually when a job is about general check
 * and review").
 */
const NO_EQUIPMENT = new Set(["JOB-1213"]);

/**
 * Jobs whose equipment is CURATED, not derived — a story depends on the exact
 * list. JOB-1201 is the one the Job Details prototype opens on, and its demo
 * shows TWO equipment modules (a job really can cover more than one box).
 */
const CURATED = {
  "JOB-1201": ["eq-wd-walkin", "eq-wd-reachin"],
};

/** The service's own preferred TYPE, when a site holds more than one match. */
const SERVICE_TYPE = {
  "walk-in-cooler": "Walk-In Cooler",
  "freezer-seal": "Reach-In Freezer",
  "prep-fridge": "Prep Table",
  "combi-oven": "Combi Oven",
  "range-burner": "Gas Range",
};

const source = readFileSync(DB, "utf8");

// ---- the equipment table ---------------------------------------------------
const eqStart = source.indexOf("const EQUIPMENT_AT_ANCHOR");
const eqEnd = source.indexOf("];", eqStart);
const equipment = [...source.slice(eqStart, eqEnd).matchAll(/\{ id: "(eq-[^"]+)", locationId: "([^"]+)", displayName: "[^"]+", category: "([^"]+)"(?:, type: "([^"]+)")?/g)].map(
  (m) => ({ id: m[1], location: m[2], category: m[3], type: m[4] }),
);

// ---- rewrite every job -----------------------------------------------------
const jobsStart = source.indexOf("const JOBS_AT_ANCHOR");
const jobsEnd = source.indexOf("const ESTIMATES_AT_ANCHOR");
let block = source.slice(jobsStart, jobsEnd);

let assigned = 0;
let cleared = 0;
const unmatched = [];

// Each job row, whether the multi-line curated shape or the one-line mass one.
block = block.replace(/id: "(JOB-\d+)"([\s\S]{0,1600}?)equipmentIds: \[[^\]]*\]/g, (whole, id, between) => {
  const location = /locationId: "([^"]+)"/.exec(between)?.[1];
  const service = /serviceId: "([^"]+)"/.exec(between)?.[1];
  const head = `id: "${id}"${between}equipmentIds: `;

  if (NO_EQUIPMENT.has(id)) {
    cleared += 1;
    return `${head}[]`;
  }

  if (CURATED[id]) {
    assigned += 1;
    return `${head}[${CURATED[id].map((eid) => `"${eid}"`).join(", ")}]`;
  }

  // The exact TYPE wins: a site can hold a walk-in AND a reach-in, both
  // Refrigeration, and a freezer-seal call is about the reach-in. The category
  // is only the fallback, for the services that name no type of their own.
  const category = SERVICE_CATEGORY[service];
  const preferred = SERVICE_TYPE[service];
  const candidates = equipment.filter((row) => row.location === location && row.category === category);
  const pick = candidates.find((row) => row.type === preferred) ?? candidates[0];

  if (!pick) {
    unmatched.push(`${id} — ${service} @ ${location}`);
    return `${head}[]`;
  }
  assigned += 1;
  return `${head}["${pick.id}"]`;
});

const next = source.slice(0, jobsStart) + block + source.slice(jobsEnd);

console.log(`equipment rows: ${equipment.length}`);
console.log(`jobs assigned:  ${assigned}`);
console.log(`left empty:     ${cleared} on purpose${unmatched.length ? `, ${unmatched.length} unmatched` : ""}`);
if (unmatched.length) console.log("unmatched:\n  " + unmatched.join("\n  "));

if (dryRun) {
  console.log("\n--dry-run: db.ts not written");
} else if (next !== source) {
  writeFileSync(DB, next);
  console.log("\ndb.ts updated");
} else {
  console.log("\ndb.ts already up to date");
}
