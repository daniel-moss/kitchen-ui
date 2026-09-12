import { semanticIcons } from "../../styles/semanticIcons";
import {
  CLIENTS as DB_CLIENTS,
  LOCATIONS as DB_LOCATIONS,
  SERVICES as DB_SERVICES,
  TODAY as DB_TODAY,
  Client,
  Location,
  Service,
} from "../../data/db";

// The prototype's SHARED data door — the demo clock, the workspace tables that
// belong to no single object, and the formatters every list prints with.
//
// Split out of `jobsData.ts` on 2026-09-11 (Daniel). Those pieces had lived
// there since the Jobs list was the only list, so the shared modules and the
// Estimates page all reached into a file named "jobs" for them: `filterDefs`
// imported `formatDuration`, `filterTemplates` imported `locationAddress`,
// `estimatesData` imported `dayOffset`. Nothing about any of them is
// jobs-specific — a location's address is a location's address — so they live
// here now and the arrows point at a neutral name.
//
// What STAYS in jobsData / estimatesData is each object's own door: its row
// shape, its rows, its lookups and its object-only tables (job labels, job
// sources, the tech pool).

// ---- what a list HOLDS, in words -------------------------------------------

/**
 * The object a list holds. Every string a shared component prints ABOUT the
 * object comes from here, so a new list type is one constant rather than a
 * copy of a component — the empty states, the Hidden Data Bar and a filter
 * option's count tag all take one.
 */
export interface ObjectNoun {
  /** "job" / "estimate". */
  one: string;
  /** "jobs" / "estimates". */
  many: string;
  /** The object's SidebarNav icon — the No Objects Exist state's own. */
  icon: string;
  /** The No Objects Exist action: "Create job" / "Create estimate". */
  createLabel: string;
}

export const JOB_NOUN: ObjectNoun = {
  one: "job",
  many: "jobs",
  icon: semanticIcons.job,
  createLabel: "Create job",
};

export const ESTIMATE_NOUN: ObjectNoun = {
  one: "estimate",
  many: "estimates",
  icon: semanticIcons.estimate,
  createLabel: "Create estimate",
};

/** "1 job" / "13 jobs" — the node's count copy, for any noun. */
export const countOf = (noun: ObjectNoun, count: number) => `${count} ${count === 1 ? noun.one : noun.many}`;

// ---- the clock --------------------------------------------------------------

/** The demo's fixed NOW — the database's clock (see db.ts). NEVER the real one. */
export const TODAY = DB_TODAY;

const DAY_MS = 24 * 60 * 60 * 1000;

// ---- the shared records ----------------------------------------------------
// Re-exported so a prototype module has ONE door to the workspace tables, the
// same way `jobsData` is the door to jobs and `estimatesData` to estimates.
//
// Location gotcha: `unit` ("Suite 200") is filterable through the Address
// filter but never DISPLAYED in a table — the Address column draws "street,
// city, state postal" without it, so `locationAddress` leaves it out. The
// Location FILTER's rows do show it (see `filterTemplates`).

export type ServiceRecord = Service;
export type ClientRecord = Client;
export type LocationRecord = Location;

export const SERVICES = DB_SERVICES;
export const CLIENTS = DB_CLIENTS;
export const LOCATIONS = DB_LOCATIONS;

/**
 * The address in US order, with ONLY the parts that exist:
 * "418 Mission St, San Francisco, CA 94105".
 *
 * State and postal code are ONE unit joined by a space ("CA 94105"), so dropping
 * either leaves the other reading correctly instead of stranding a comma. Empty
 * when the location has no address at all.
 */
export function locationAddress(location: LocationRecord): string {
  const region = [location.state, location.postalCode].filter((part) => part != null).join(" ");
  return [location.street, location.city, region === "" ? null : region].filter((part) => part != null).join(", ");
}

// ---- display formatting ----------------------------------------------------
// Everything a list prints is derived here, so two lists cannot spell the same
// value two ways.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Aug 12" — month FIRST, the US order (Daniel, 2026-09-04; was "12 Aug").
 *  Matches the production formatDate ("MMM D") and every other formatter in
 *  the DS (they use Intl en-US, which is month-first already). */
export function formatDay(iso: string | null): string {
  if (iso == null) return "";
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "9:00 AM" — the time half of `formatDateTime`, US 12-hour. */
export function formatTime(iso: string | null): string {
  if (iso == null) return "";
  const d = new Date(iso);
  const hours = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
  const mm = String(d.getMinutes()).padStart(2, "0");
  const period = d.getHours() < 12 ? "AM" : "PM";
  return `${hours}:${mm} ${period}`;
}

/**
 * "Aug 12, 9:00 AM" — US 12-hour time, date and time joined by a COMMA
 * (Daniel, 2026-09-04, after the separator research: a date with its time is
 * one compound value, which style guides join with a comma or "at", never a
 * symbol). Was "12 Aug • 9:00 AM", and 24-hour "12 Aug • 09:00" before that.
 * FLAGGED: the production DateTimeCell still prints the bullet — the two now
 * differ on purpose, pending the product-wide separator decision.
 */
export function formatDateTime(iso: string | null): string {
  if (iso == null) return "";
  return `${formatDay(iso)}, ${formatTime(iso)}`;
}

/** "2h 30m" / "45m" / "3h" */
export function formatDuration(minutes: number | null): string {
  if (minutes == null) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Whole days from TODAY to the given date (negative = in the past). */
export function dayOffset(iso: string): number {
  const d = new Date(iso);
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()).getTime();
  return Math.round((a - b) / DAY_MS);
}
