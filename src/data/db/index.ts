// The demo database — one simulated service company for every prototype.
// Schema in types.ts (mirrors production models), data in db.ts, browsable in
// Storybook under Data → Database. Import from here:
//
//   import { CLIENTS, locationsOf, warrantiesOf } from "../../data/db";

import { CLIENT_CONTACTS, CLIENTS, EQUIPMENT, ESTIMATES, INVOICES, JOBS, LOCATION_CONTACTS, LOCATIONS, WARRANTIES } from "./db";
import { Client, Equipment, Estimate, Invoice, Job, Location } from "./types";

export * from "./types";
export {
  TODAY,
  CLIENTS,
  CLIENT_CONTACTS,
  LOCATIONS,
  LOCATION_CONTACTS,
  EQUIPMENT,
  WARRANTIES,
  JOBS,
  ESTIMATES,
  ESTIMATE_LABELS,
  INVOICES,
  SERVICES,
  JOB_LABELS,
  JOB_SOURCES,
  BRANCHES,
  JOB_FORMS,
  COMPANY,
} from "./db";

const index = <T extends { id: string }>(rows: T[]) => new Map(rows.map((row) => [row.id, row]));

/**
 * Unpaid (Pending/Sent) invoice dollars across the client's locations —
 * compared against `creditLimit` for the "credit limit reached" client issue.
 */
export const outstandingBalanceOf = (clientId: string): number =>
  LOCATIONS.filter((location) => location.clientId === clientId)
    .flatMap((location) => INVOICES.filter((invoice) => invoice.locationId === location.id))
    .filter((invoice) => invoice.status === "Pending" || invoice.status === "Sent")
    .reduce((sum, invoice) => sum + invoice.total, 0);

const CLIENT_BY_ID = index(CLIENTS);
const LOCATION_BY_ID = index(LOCATIONS);
const EQUIPMENT_BY_ID = index(EQUIPMENT);
const JOB_BY_ID = index(JOBS);

export const clientById = (id: string): Client | undefined => CLIENT_BY_ID.get(id);
export const locationById = (id: string): Location | undefined => LOCATION_BY_ID.get(id);
export const equipmentById = (id: string): Equipment | undefined => EQUIPMENT_BY_ID.get(id);
export const jobById = (id: string): Job | undefined => JOB_BY_ID.get(id);

// ---- down the hierarchy ----------------------------------------------------

export const locationsOf = (clientId: string) => LOCATIONS.filter((row) => row.clientId === clientId);
export const clientContactsOf = (clientId: string) => CLIENT_CONTACTS.filter((row) => row.clientId === clientId);
export const locationContactsOf = (locationId: string) => LOCATION_CONTACTS.filter((row) => row.locationId === locationId);
export const equipmentOf = (locationId: string) => EQUIPMENT.filter((row) => row.locationId === locationId);
export const warrantiesOf = (equipmentId: string) => WARRANTIES.filter((row) => row.equipmentId === equipmentId);
export const jobsOf = (locationId: string) => JOBS.filter((row) => row.locationId === locationId);
export const estimatesOf = (locationId: string) => ESTIMATES.filter((row) => row.locationId === locationId);
export const invoicesOf = (locationId: string) => INVOICES.filter((row) => row.locationId === locationId);

// ---- up the hierarchy ------------------------------------------------------

/** The client a location belongs to. Every location has one. */
export const clientOfLocation = (location: Location): Client => CLIENT_BY_ID.get(location.clientId)!;

/** A job's location, and through it its client. */
export const locationOfJob = (job: Job): Location => LOCATION_BY_ID.get(job.locationId)!;
export const clientOfJob = (job: Job): Client => clientOfLocation(locationOfJob(job));
export const locationOfEstimate = (estimate: Estimate): Location => LOCATION_BY_ID.get(estimate.locationId)!;
export const locationOfInvoice = (invoice: Invoice): Location => LOCATION_BY_ID.get(invoice.locationId)!;
