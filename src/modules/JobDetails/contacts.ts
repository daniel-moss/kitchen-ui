import { ContactRecord, clientById, clientContactsOf, locationById, locationContactsOf } from "../../data/db";
import { joinWithSeparator } from "../../utils/textSeparator";

// The job's contact pool — what the "Job reporter" / "Site supervisor" select
// lists offer (Figma 24485-40395 / 24485-40467, documented in the New Job form
// file 17184-50026 / 17187-66210).
//
// Both lists are the SAME list; only the title differs. It is grouped by where
// the contact comes from:
//   1. Service client   — contacts of the client the job belongs to
//   2. Service location — contacts of the job's service location
//   3. Billing client   — ONLY when the billing client differs from the
//                         service client (Figma behavior note)
// Every group's FIRST contact is its primary one (the crown on the avatar) —
// the database keeps each list primary-first.
//
// MIGRATED to the shared demo database on 2026-09-04: the groups are the
// database's contact rows for Wildwood Kitchen / Wildwood Downtown / North
// Point Hotel (the demo "different billing client"), and a JobContact's id is
// the DATABASE contact id (a string — it was the user id before). Contact
// photos come from the database too (`ContactRecord.avatar`, a demo nicety);
// techs and contacts no longer share faces. The channel GAPS the Send-summary
// form needs are the database's own: Marcus Boyd has no phone, Rosa Klein no
// e-mail. FLAGGED: the Figma demo names (McDonald's people) no longer match.

export interface JobContact {
  /** The DATABASE contact id (client or location contact). */
  id: string;
  name: string;
  /** Demo photo; a contact without one falls back to the avatar's default. */
  avatar?: string;
  /** A contact may have no e-mail (Rosa Klein — the Send-summary warning). */
  email?: string;
  /** A contact may have no phone (Marcus Boyd — the Send-summary warning). */
  phone?: string;
}

const toJobContact = (c: ContactRecord): JobContact => ({
  id: c.id,
  name: c.name ?? "",
  avatar: c.avatar,
  email: c.email,
  phone: c.phone,
});

export interface ContactGroup {
  /** The GroupLabel copy — a fixed label, not the client's name. */
  label: string;
  /** The plus button's tooltip / aria-label (the form it would open). */
  addLabel: string;
  contacts: JobContact[];
}

/**
 * The New Job form's documented sorting (annotation on node 17184-50566,
 * 2026-09-05): "The primary contact is on top within each group. The rest of
 * the contacts are sorted from A to Z." The database keeps insertion order,
 * so the rule is applied here, where the groups are built for the UI.
 */
const groupOrder = (contacts: ContactRecord[], primaryId?: string): JobContact[] => [
  ...contacts.filter((c) => c.id === primaryId),
  ...contacts
    .filter((c) => c.id !== primaryId)
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
].map(toJobContact);

/** Contacts of the client the job belongs to (Wildwood Kitchen). */
export const SERVICE_CLIENT_CONTACTS: JobContact[] = groupOrder(
  clientContactsOf("wildwood"),
  clientById("wildwood")?.primaryContactId,
);

/** Contacts of the job's service location (Wildwood Downtown). */
export const SERVICE_LOCATION_CONTACTS: JobContact[] = groupOrder(
  locationContactsOf("wildwood-downtown"),
  locationById("wildwood-downtown")?.primaryContactId,
);

/** Contacts of a billing client that is NOT the service client (North Point Hotel). */
export const BILLING_CLIENT_CONTACTS: JobContact[] = groupOrder(
  clientContactsOf("northpoint"),
  clientById("northpoint")?.primaryContactId,
);

/**
 * The demo job's starting contacts. The reporter is the database job's own
 * reporter — JOB-1201 denormalizes Ben Castillo's details, exactly how
 * production copies a picked contact onto the job. The supervisor is Rosa
 * Klein, whose missing e-mail keeps a channel warning reachable from a
 * selected contact.
 */
export const INITIAL_REPORTER = SERVICE_LOCATION_CONTACTS.find((c) => c.id === "lc-wildwood-downtown-1")!; // Ben Castillo
export const INITIAL_SUPERVISOR = SERVICE_LOCATION_CONTACTS.find((c) => c.id === "lc-wildwood-downtown-2")!; // Rosa Klein

/** The item caption: phone  ·  e-mail, joined by the shared TEXT_SEPARATOR.
 *  A contact missing one of them shows only the other. */
export const contactCaption = (c: JobContact) => joinWithSeparator(c.phone, c.email);

/** The channel a summary is delivered through — its own contact detail. */
export type ContactChannel = "text" | "email";

/** The channel's value on a contact, or undefined when the contact lacks it. */
export const channelValue = (c: JobContact, channel: ContactChannel) => (channel === "text" ? c.phone : c.email);

/** The Send-summary caption: only the channel's own detail, or what is missing
 *  (Figma "No Phone number" / "No Email address"). */
export const channelCaption = (c: JobContact, channel: ContactChannel) =>
  channelValue(c, channel) ?? (channel === "text" ? "No Phone number" : "No Email address");
