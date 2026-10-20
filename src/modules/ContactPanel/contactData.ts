import {
  clientById,
  clientContactById,
  clientOfLocation,
  locationById,
  locationContactById,
  type Location,
} from "../../data/db";
import { User } from "../../data/users";

import { ContactOwner, PanelContact, ReminderChannels, ReminderKind } from "./ContactPanel.types";

// Pure helpers for the "Contact" side panel: formats, validation, the reminder
// tag, and the db lookup the stories (and any future host) open the panel with.

/**
 * "(987) 654-3210 ext. 123" — the phone row's format ("[phone_number]
 * [extension]; extension is only shown if it exists", node annotation). The
 * same string is what Copy puts on the clipboard.
 */
export const formatPhone = (phone: string, extension?: string): string =>
  extension == null || extension === "" ? phone : `${phone} ext. ${extension}`;

/**
 * A US phone number: 10 digits, or 11 with a leading 1. Production stores a
 * `PhoneNumberField` (region US), so anything else is "Invalid Phone number".
 * Returns the canonical "(415) 555-0198" form, or null when it is not valid.
 */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** A plain shape check — something@something.tld, no spaces. */
export const isValidEmail = (input: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());

const has = (value: string | undefined) => value != null && value !== "";

/**
 * A reminder's channels AS THEY TAKE EFFECT. A channel whose contact method is
 * missing reads OFF whatever the stored flag says: SMS needs a phone, Email an
 * email (production's `clean()`; Figma "No Channel", 24087-4242).
 */
export function reminderChannels(contact: PanelContact, kind: ReminderKind): ReminderChannels {
  const email = kind === "estimate" ? contact.estimateRemindersEmail : contact.invoiceRemindersEmail;
  const sms = kind === "estimate" ? contact.estimateRemindersSms : contact.invoiceRemindersSms;
  return { email: email === true && has(contact.email), sms: sms === true && has(contact.phone) };
}

/** The row's tag — "Off" | "Email" | "SMS" | "Email, SMS" (New Contact form doc 21874-7175). */
export function reminderTag({ email, sms }: ReminderChannels): string {
  if (email && sms) return "Email, SMS";
  if (email) return "Email";
  if (sms) return "SMS";
  return "Off";
}

/** The record fields one reminder kind writes. */
export const reminderFields = (kind: ReminderKind, { email, sms }: ReminderChannels): Partial<PanelContact> =>
  kind === "estimate" ? { estimateRemindersEmail: email, estimateRemindersSms: sms } : { invoiceRemindersEmail: email, invoiceRemindersSms: sms };

/**
 * The location caption: its name; without one, "[street address], [city],
 * [state] [postal_code]" (the Location Contact caption's annotation, 23908-4027).
 */
export const locationCaption = (location: Location): string =>
  location.name ?? `${location.street}, ${location.city}, ${location.state} ${location.postalCode}`;

/** "Thiago C." — the "[Name S.] is editing" tooltip's name. */
export const shortName = (user: User): string => `${user.firstName} ${user.lastName.charAt(0)}.`;

/** Initials for a contact without a photo ("Kate Sherman" → "KS"). */
export const contactInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

/** The client a contact hangs under, if any — its `isActive` gates editing. */
export const clientOf = (owner: ContactOwner) => (owner.kind === "job" ? undefined : owner.client);

/**
 * Everything the panel needs for one SAVED contact, read from the db: the
 * record, its owner, and whether it is that owner's primary contact.
 */
export function contactPanelData(id: string): { contact: PanelContact; owner: ContactOwner; isPrimary: boolean } {
  const clientContact = clientContactById(id);
  if (clientContact != null) {
    const client = clientById(clientContact.clientId)!;
    return { contact: clientContact, owner: { kind: "client", client }, isPrimary: client.primaryContactId === id };
  }
  const locationContact = locationContactById(id);
  if (locationContact == null) throw new Error(`No contact "${id}" in the db`);
  const location = locationById(locationContact.locationId)!;
  return {
    contact: locationContact,
    owner: { kind: "location", location, client: clientOfLocation(location) },
    isPrimary: location.primaryContactId === id,
  };
}
