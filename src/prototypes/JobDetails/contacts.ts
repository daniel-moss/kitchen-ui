import { User, usersById } from "../../data/users";

// The job's contact pool — what the "Job reporter" / "Site supervisor" select
// lists offer (Figma 24485-40395 / 24485-40467, documented in the New Job form
// file 17184-50026 / 17187-66210).
//
// Both lists are the SAME list; only the title differs. It is grouped by where
// the contact comes from:
//   1. Service client   — contacts of the client the job belongs to
//   2. Service location — contacts of the job's service location
//   3. Billing client   — ONLY when the billing client differs from the
//                         service client (Figma behaviour note)
// Every group's FIRST contact is its primary one (the crown on the avatar).
//
// The names are the Figma demo names. Their phone/e-mail are invented per
// person (Figma repeats one placeholder for all of them) so that searching by
// phone or e-mail actually works in the prototype — Daniel, 2026-08-03.

export interface JobContact {
  /** Same id as the demo user — the avatar and name come from there. */
  id: number;
  name: string;
  avatar: string;
  email: string;
  phone: string;
}

const contact = (userId: number, email: string, phone: string): JobContact => {
  const user = usersById.get(userId) as User;
  return { id: userId, name: user.name, avatar: user.avatar, email, phone };
};

// One entry per person: the same contact can sit in two groups (Seb Phillips
// and Ismaeel Landry do in Figma), and picking either row selects the person.
export const CONTACTS = {
  lorne: contact(1, "lorne.riddle@mcdonalds.com", "(415) 555-0118"),
  amy: contact(3, "amy.lowery@mcdonalds.com", "(415) 555-0142"),
  kate: contact(4, "kate.charles@mcdonalds.com", "(415) 555-0167"),
  angel: contact(6, "angel.leblanc@mcdonalds.com", "(415) 555-0193"),
  dirk: contact(5, "dirk.horton@mcdonalds.com", "(415) 555-0224"),
  ismaeel: contact(8, "ismaeel.landry@mcdonalds.com", "(415) 555-0251"),
  seb: contact(7, "seb.phillips@mcdonalds.com", "(415) 555-0286"),
  scott: contact(19, "scott.lyons@chipotle.com", "(415) 555-0310"),
};

export interface ContactGroup {
  /** The GroupLabel copy — a fixed label, not the client's name. */
  label: string;
  /** The plus button's tooltip / aria-label (the form it would open). */
  addLabel: string;
  contacts: JobContact[];
}

/** Contacts of the client the job belongs to. */
export const SERVICE_CLIENT_CONTACTS: JobContact[] = [
  CONTACTS.lorne,
  CONTACTS.amy,
  CONTACTS.kate,
  // Not in the Figma list: the demo job's current reporter, so the list can
  // show him as the selected option. Flagged to Daniel.
  CONTACTS.angel,
];

/** Contacts of the job's service location. */
export const SERVICE_LOCATION_CONTACTS: JobContact[] = [CONTACTS.dirk, CONTACTS.ismaeel, CONTACTS.seb];

/** Contacts of a billing client that is NOT the service client. */
export const BILLING_CLIENT_CONTACTS: JobContact[] = [CONTACTS.scott, CONTACTS.seb, CONTACTS.ismaeel];

/** The demo job's starting contacts (Figma menus 21136-58214 / 21758-23072). */
export const INITIAL_REPORTER = CONTACTS.angel;
export const INITIAL_SUPERVISOR = CONTACTS.kate;

/** The item caption: phone ・ e-mail (Figma separator is U+30FB). */
export const contactCaption = (c: JobContact) => `${c.phone} ・ ${c.email}`;
