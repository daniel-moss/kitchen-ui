// Shared job demo values, so the Job Details page and the Start / Cancel job
// forms show the SAME data (Daniel: the forms mirror the page's values).
// Type / Service / Reason for call are not surfaced on the page itself yet —
// they live here as the job's real demo values.

export const JOB_ID = "JOB-10001";

// The tech we are signed in as in this prototype — Lorne Riddle (user 1).
export const VIEWER_ID = 1;

/**
 * A person's name for a STAFF select list: the viewer is marked "(You)", so it
 * is obvious who we are (Daniel, 2026-08-05). Only for lists of OUR people —
 * the client-contact lists happen to reuse the same demo person as a McDonald's
 * contact, which is a different role and must NOT be marked.
 */
export const staffSelectLabel = (user: { id: number; name: string }) => (user.id === VIEWER_ID ? `${user.name} (You)` : user.name);
export const JOB_SOURCE_ID = "123456789";
// The job this one recalls to — shown as the Service module's "Recall to" link
// AND the "Recall to" row in the Details panel's Related module (same object).
export const JOB_RECALL_TO = "JOB-10002";
export const JOB_TYPE = "Repair";
export const JOB_SERVICE = "Refrigeration repair";

// The service-location street address (the forms show the full address; the
// Location module on the page shows the location name + a shorter caption).
export const JOB_LOCATION_ADDRESS = "123 Main Street, San Francisco, CA 94105";

// ---- service locations ------------------------------------------------------

// The location pool behind the Location module's select list — every location
// belongs to a client, and the list groups them by client (Figma 24372-22116).
// An inactive client renders as a dimmed group: "Inactive" caption, no add
// button, items disabled.
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

export const LOCATIONS: JobLocation[] = [
  { id: 1, client: "McDonald's", clientActive: true, name: "HQ", address: "123 Main Street, Suite 45, San Francisco, CA 94105" },
  { id: 2, client: "McDonald's", clientActive: true, name: "Downtown", address: "800 Market Street, San Francisco, CA 94102" },
  { id: 3, client: "Taco Bell", clientActive: true, name: "Mission District", address: "2411 Mission Street, San Francisco, CA 94110" },
  { id: 4, client: "Taco Bell", clientActive: true, name: "Airport", address: "780 S Airport Blvd, South San Francisco, CA 94080" },
  { id: 5, client: "KFC", clientActive: false, name: "Old Oakland", address: "901 Broadway, Oakland, CA 94607" },
  { id: 6, client: "KFC", clientActive: false, name: "Berkeley", address: "2180 Shattuck Avenue, Berkeley, CA 94704" },
];

/** The job's initial location — McDonald's HQ (the Figma demo values). */
export const DEFAULT_LOCATION = LOCATIONS[0];

/** The Location / Billing modules' caption for a location: "HQ · 123 Main…". */
export const locationCaption = (l: JobLocation) => `${l.name} · ${l.address}`;

// The company's clients for the "Service clients" select list (Figma
// 15550-43833) — opened from the Locations list's "Add location" so the user
// picks whom the new location belongs to. Every client from the locations
// pool exists here (plus extra demo clients); all are commercial businesses.
export interface ServiceClient {
  id: number;
  name: string;
  active: boolean;
}

export const SERVICE_CLIENTS: ServiceClient[] = [
  { id: 1, name: "McDonald's", active: true },
  { id: 2, name: "Taco Bell", active: true },
  { id: 3, name: "Starbucks", active: true },
  { id: 4, name: "Chipotle", active: true },
  { id: 5, name: "KFC", active: false },
  { id: 6, name: "Blockbuster", active: false },
];

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
// clamp + "Show more".
export const JOB_REASON_FOR_CALL =
  "Walk-in cooler is not holding temperature. Kitchen staff reported it climbing above 45°F overnight, and product is at risk of spoiling. The compressor is running constantly and the door gasket looks worn. Please inspect the compressor, check the refrigerant charge, and replace the door seal if needed. The manager also mentioned a rattling noise from the condenser fan that started a few days ago, so please take a look at that while on site and let us know if any parts need to be ordered.";

export const JOB_TECH_INSTRUCTIONS =
  "Check in with the kitchen manager at the back entrance before starting — the front is closed during prep. Bring the low-temp refrigeration kit and a spare door gasket for a 48-inch walk-in. Photograph the compressor nameplate and any error codes before making changes. If parts are needed, call the office for approval before ordering; do not leave the unit running if it trips the breaker again.";
