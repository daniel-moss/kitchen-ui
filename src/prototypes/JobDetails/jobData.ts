// Shared job demo values, so the Job Details page and the Start / Cancel job
// forms show the SAME data (Daniel: the forms mirror the page's values).
// Type / Service / Reason for call are not surfaced on the page itself yet —
// they live here as the job's real demo values.
//
// MIGRATED to the shared demo database on 2026-09-04 (src/data/db — browse it
// under Data → Database): the world is Wildwood Kitchen's now, not
// McDonald's. The page opens on the database's JOB-1201 (walk-in cooler
// repair at Wildwood Downtown), clients and locations are the database's
// rows, and this module DERIVES its exports from them — the export names and
// shapes stayed, so the rest of the prototype did not care. What has no
// database home yet (job type, source ref, reason for call) stays a local
// demo value. FLAGGED: the Figma demo content still says McDonald's.

import { CLIENTS as DB_CLIENTS, Location as DbLocation, jobById, locationById, locationsOf } from "../../data/db";
import { joinWithSeparator } from "../../utils/textSeparator";

/** The database job this page opens on — walk-in cooler repair, active. */
export const JOB_ID = "JOB-1201";

const DB_JOB = jobById(JOB_ID)!;

// The tech we are signed in as in this prototype — Lorne Riddle (user 1), the
// database job's assignee.
export const VIEWER_ID = 1;

/**
 * A person's name for a STAFF select list: the viewer is marked "(You)", so it
 * is obvious who we are (Daniel, 2026-08-05). Only for lists of OUR people —
 * client contacts are their own records (the database's), never marked.
 */
export const staffSelectLabel = (user: { id: number; name: string }) => (user.id === VIEWER_ID ? `${user.name} (You)` : user.name);
export const JOB_SOURCE_ID = "123456789";
// The job this one recalls to — shown as the Service module's "Recall to" link
// AND the "Recall to" row in the Details panel's Related module (same object).
// JOB-1209 is the database's FINALIZED job at the same location, which is what
// a recall target has to be.
export const JOB_RECALL_TO = "JOB-1209";
export const JOB_TYPE = "Repair";
export const JOB_SERVICE = DB_JOB.serviceName; // "Walk-in cooler repair"

/** Full US address of a database location, with only the parts that exist. */
const fullAddress = (l: DbLocation): string => {
  const region = [l.state, l.postalCode].filter((part) => part != null).join(" ");
  return [l.street, l.unit, l.city, region === "" ? null : region].filter((part) => part != null && part !== "").join(", ");
};

// The service-location street address (the forms show the full address; the
// Location module on the page shows the location name + a shorter caption).
export const JOB_LOCATION_ADDRESS = fullAddress(locationById(DB_JOB.locationId)!);

// ---- service locations ------------------------------------------------------

// The location pool behind the Location module's select list — every location
// belongs to a client, and the list groups them by client (Figma 24372-22116).
// An inactive client renders as a dimmed group: "Inactive" caption, no add
// button, items disabled.
//
// Numeric ids are POOL ids (the shell's state appends created locations); the
// records themselves come from the database, client by client in its order —
// which puts the job's own location first and the deactivated client
// (Presidio Canteen) last. A nameless location keeps an empty `name` and an
// address-less one an empty `address` (the database's deliberate gaps).
export interface JobLocation {
  id: number;
  /** The owning client — the group label AND the Location module's title. */
  client: string;
  clientActive: boolean;
  /** The location's own name — the list item's caption. */
  name: string;
  /** The street address — the list item's title. */
  address: string;
}

export const LOCATIONS: JobLocation[] = DB_CLIENTS.flatMap((client) =>
  locationsOf(client.id).map((location) => ({
    id: 0, // assigned below, pool order
    client: client.name,
    clientActive: client.isActive,
    name: location.name ?? "",
    address: fullAddress(location),
  })),
).map((location, index) => ({ ...location, id: index + 1 }));

/** The job's initial location — the database job's own (Wildwood Downtown). */
export const DEFAULT_LOCATION = LOCATIONS[0];

/** The Location / Billing modules' caption for a location: "Downtown  ·  418
 *  Mission St…" — the parts that exist, joined by the shared TEXT_SEPARATOR. */
export const locationCaption = (l: JobLocation) => joinWithSeparator(l.name || null, l.address || null);

// The company's clients for the "Service clients" select list (Figma
// 15550-43833) — opened from the Locations list's "Add location" so the user
// picks whom the new location belongs to. The database's clients, in its
// order; `caption` is the "Type  ·  Industry" line the list draws per client.
export interface ServiceClient {
  id: number;
  name: string;
  active: boolean;
  caption: string;
}

export const SERVICE_CLIENTS: ServiceClient[] = DB_CLIENTS.map((client, index) => ({
  id: index + 1,
  name: client.name,
  active: client.isActive,
  caption: joinWithSeparator(client.clientType, client.industryType),
}));

/**
 * Group a location pool by client (pool order) for the Locations select list.
 * A function, not a const — the shell owns the locations as STATE now (the
 * New-location form appends to it).
 */
export const groupLocations = (locations: JobLocation[]) =>
  locations.reduce<{ client: string; active: boolean; locations: JobLocation[] }[]>((groups, l) => {
    const group = groups.find((g) => g.client === l.client);
    if (group != null) group.locations.push(l);
    else groups.push({ client: l.client, active: l.clientActive, locations: [l] });
    return groups;
  }, []);

// The "Reason for call" free text — long enough to exercise the Cancel form's
// clamp + "Show more". It matches the database job's story (JOB-1201's own
// note is its short version).
export const JOB_REASON_FOR_CALL =
  "Walk-in cooler is not holding temperature. Kitchen staff reported it climbing above 45°F overnight, and product is at risk of spoiling. The compressor is running constantly and the door gasket looks worn. Please inspect the compressor, check the refrigerant charge, and replace the door seal if needed. The manager also mentioned a rattling noise from the condenser fan that started a few days ago, so please take a look at that while on site and let us know if any parts need to be ordered.";

export const JOB_TECH_INSTRUCTIONS =
  "Check in with the kitchen manager at the back entrance before starting — the front is closed during prep. Bring the low-temp refrigeration kit and a spare door gasket for a 48-inch walk-in. Photograph the compressor nameplate and any error codes before making changes. If parts are needed, call the office for approval before ordering; do not leave the unit running if it trips the breaker again.";
