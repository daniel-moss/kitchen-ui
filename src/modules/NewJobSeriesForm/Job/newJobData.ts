import { CLIENTS, jobsOf, locationsOf, outstandingBalanceOf } from "../../../data/db";
import { Client, Job, JobStatus, Location } from "../../../data/db/types";
import { User, users } from "../../../data/users";
import { joinWithSeparator } from "../../../utils/textSeparator";

/** Lorne Riddle plays "you" in the demo (Daniel, 2026-09-07). */
export const CURRENT_USER = users[0];

/** The techs pool A→Z — the "Received by" (and later "Assignees") list order. */
export const usersSorted = () => [...users].sort((a, b) => a.name.localeCompare(b.name));

/** The address parts an on-the-fly created location carries. */
export interface AddressParts {
  street?: string;
  unit?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

/**
 * The address in US order with only the parts that exist:
 * "418 Mission St, Suite 200, San Francisco, CA 94105". State and postal
 * code join with a space so dropping either leaves the other clean.
 */
export const locationAddress = (parts: AddressParts): string => {
  const region = [parts.state, parts.postalCode].filter(Boolean).join(" ");
  return [parts.street, parts.unit, parts.city, region || null].filter(Boolean).join(", ");
};

/** The SelectField value: "Name  ·  address" — either half may be absent. */
export const locationLine = (name: string | undefined, address: string): string =>
  joinWithSeparator(name, address || undefined);

/** The list row sort key: the address, falling back to the name. */
export const locationTitle = (location: Location): string => locationAddress(location) || location.name || "";

/**
 * The client issues the Location (and later Billing) modules warn about —
 * client-level ONLY (Daniel, 2026-09-07): the credit limit is reached, or
 * the billing address is missing. In the demo db: Bayside Catering exceeds
 * its limit, Mission Taqueria has no billing address.
 */
export const clientIssues = (client: Client): string[] => {
  const issues: string[] = [];
  if (client.creditLimit != null && outstandingBalanceOf(client.id) >= client.creditLimit) {
    issues.push("Credit limit exceeded");
  }
  if (!client.billingStreet && !client.billingCity) {
    issues.push("Billing address is missing");
  }
  return issues;
};

// ---- priority — moved to the shared tier (modules/shared/priority) -------

export { NO_PRIORITY, PRIORITY, PRIORITY_OPTIONS, priorityOf } from "../../shared/priority";
export type { PriorityDef } from "../../shared/priority";

// ---- similar jobs (the "Similar Jobs" module rules) -------------------------

/** Not "open": drafts and the closed statuses (the dev notes). */
const NOT_OPEN: JobStatus[] = ["draft", "finalized", "cancelled"];

/**
 * Open jobs matching the location AND the service, sorted by start date —
 * scheduled first (earliest first), pending without a start time last.
 */
export const similarJobs = (locationId: string, serviceName: string): Job[] =>
  jobsOf(locationId)
    .filter((job) => job.serviceName === serviceName && !NOT_OPEN.includes(job.status))
    .sort((a, b) => {
      if (a.scheduledFor && b.scheduledFor) return a.scheduledFor.localeCompare(b.scheduledFor);
      return a.scheduledFor ? -1 : b.scheduledFor ? 1 : 0;
    });

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

/** "Jan 1, 2027" (US order, short month). */
export const shortDate = (iso: string): string => SHORT_DATE.format(new Date(iso));

/** "Lorne R." — the copy doc's attributed-user format. */
export const firstNameLastInitial = (user: User): string => `${user.firstName} ${user.lastName[0]}.`;

const JOB_VERB: Record<JobStatus, string> = {
  draft: "Drafted",
  unscheduled: "Unscheduled",
  upcoming: "Scheduled",
  pastDue: "Past due",
  active: "Active",
  quickPaused: "Paused",
  onHoldExternal: "On hold",
  onHoldInternal: "On hold",
  completed: "Completed",
  finalized: "Finalized",
  cancelled: "Cancelled",
};

/**
 * The job row caption — the workflow-object format from the copy doc:
 * "<Verb> on <date> by <First L.>", with "Someone" when nobody is attributed.
 */
export const jobCaption = (job: Job): string => {
  const assignee = job.assigneeIds.length > 0 ? users.find((user) => user.id === job.assigneeIds[0]) : undefined;
  const who = assignee ? firstNameLastInitial(assignee) : "Someone";
  const verb = JOB_VERB[job.status];
  return job.scheduledFor ? `${verb} on ${shortDate(job.scheduledFor)} by ${who}` : `${verb} by ${who}`;
};

/** Active clients first, each half A→Z (the "Location" SelectList sorting rule). */
export const clientsSorted = (): Client[] =>
  [...CLIENTS].sort((a, b) => (a.isActive === b.isActive ? a.name.localeCompare(b.name) : a.isActive ? -1 : 1));

/** A client's locations, A→Z by their display title. */
export const locationsSorted = (clientId: string): Location[] =>
  [...locationsOf(clientId)].sort((a, b) => locationTitle(a).localeCompare(locationTitle(b)));
