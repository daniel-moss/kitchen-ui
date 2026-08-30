import { IconPack } from "../../components/Icon/Icon.types";
import { User, users } from "../../data/users";
import { Billing, BILLING_INTENTION_LABELS, billingClientName } from "./BillingForm";
import { JobProperties, MODULE_DATE } from "./JobPropertiesForm";
import { durationLabel, Scheduling, scheduledForLabel } from "./SchedulingForm";
import { PRIORITIES, ServiceValues } from "./ServiceForm";
import { Equipment, EQUIPMENT_POOL, equipmentSentenceName } from "./equipment";

// Activity events for the Activity tab. PROTOTYPE-LOCAL on purpose (Daniel,
// 2026-08-02): we are exploring how update logs should read, so none of this
// touches the DS ActivityLog components.

/**
 * The glyph a value carries in the product (Type and Priority have one; a plain
 * text value does not). `color` is the icon's own tint — it is dropped on the
 * OLD side, which always renders muted.
 */
export interface ValueIcon {
  icon: string;
  pack: IconPack;
  color?: string;
}

/** A person inside a log value — rendered as an xxs avatar plus their name. */
export interface LogPerson {
  name: string;
  avatar: string;
}

/** One changed field inside an update event. */
export interface FieldChange {
  /** The field's name as the form labels it, e.g. "Reason for call". */
  label: string;
  /** The value before the change. "" = the field was empty. */
  oldValue: string;
  /** The value after the change. "" = the field was cleared. */
  newValue: string;
  /** A TextArea-backed field — its values get the stacked "old ↓ new" layout. */
  longText?: boolean;
  /** Only for values that come with a glyph — left out otherwise. */
  oldIcon?: ValueIcon;
  newIcon?: ValueIcon;
  /**
   * People-valued fields (Assignees): each name renders with its own avatar.
   * When set, these REPLACE `oldValue`/`newValue` on screen — the strings stay
   * as the plain-text form the diff compares.
   */
  oldPeople?: LogPerson[];
  newPeople?: LogPerson[];
}

const TYPE_ICON = (value: string): ValueIcon =>
  value === "recall" ? { icon: "clock-rotate-left", pack: "regular" } : { icon: "sparkle", pack: "regular" };

const PRIORITY_ICON = (value: string): ValueIcon | undefined => {
  const priority = PRIORITIES.find((p) => p.value === value);
  return priority ? { icon: priority.icon, pack: priority.pack, color: priority.color } : undefined;
};

export interface ActivityEvent {
  id: number;
  kind:
    | "created"
    | "updated"
    | "equipment"
    | "contact"
    | "labels"
    // Time-tracking events (Figma 24453-26325): the tech's check-in / check-out
    // and status switches, plus the three time-session edits.
    | "checkin"
    | "checkout"
    | "status"
    | "sessionAdded"
    | "sessionUpdated"
    | "sessionDeleted"
    // The job's own lifecycle: started / paused / resumed / cancelled
    // (Figma 24512-62842).
    | "jobStatus"
    // The Scheduling (Figma 24522-89331) and Assignees (24522-89736) modules.
    // Both are MODULE logs: a plain regular gray-12 glyph, not the job-status
    // colors.
    | "scheduling"
    | "assignees"
    // What the job was turned into once it was completed — the invoice /
    // estimate / recall it spawned and the two "marked as" actions
    // (Figma 24592-40478). Module logs too.
    | "createdFrom"
    // The "Forms" module (Figma 24592-40934): add / remove / rename /
    // visibility / complete / save, all on the `clipboard-list` glyph.
    | "forms";
  date: Date;
  user: User;
  /** Update events only — the changed fields, in form order. */
  changes?: FieldChange[];
  /** Equipment AND label events — what was put on / taken off the job. */
  added?: string[];
  removed?: string[];
  /** Contact events only — the role slot, e.g. "Job reporter". */
  role?: string;
  /** Contact events only — who held the slot before / after. `null` = nobody,
   *  which is what tells added / updated / removed apart. */
  contactBefore?: string | null;
  contactAfter?: string | null;
  /** Contact events only — their photos, shown as an xxs avatar by the name. */
  contactBeforeAvatar?: string;
  contactAfterAvatar?: string;
  /** Check-in and status events — the tech status the log names. */
  status?: string;
  /**
   * Session events — the session's range, `"Mon, Jan 1 at 11:30 AM → Mon, Jan 1
   * at 2:30 PM"`. It is written after the session's `status` (which brings its
   * own icon): the added and updated logs show it as it is now, the deleted log
   * strikes it through.
   */
  sessionRange?: string;
  /** Job-status events — the timeline glyph and the sentence, in parts. */
  jobStatus?: JobStatusLog;
}

/**
 * One job-lifecycle sentence (Figma 24512-62842). The parts alternate between
 * the muted narration and the emphasised values:
 *   "{user}" + text + **value** + tailText + **tailValue**
 * e.g. " scheduled the job for " / "Monday, January 1 at 12:00 AM for 2 hr " /
 * "with assigned " / "Ana Roy, Seb Ronin".
 */
export interface JobStatusLog {
  /** The status glyph: circle-play / circle-pause / circle-stop / … */
  icon: string;
  /**
   * The glyph's own color token — every JOB STATUS has one (Figma
   * 24512-62842) and renders solid. `""` = a module log: regular weight,
   * plain gray-12 (Scheduling / Assignees).
   */
  color: string;
  text: string;
  /** An emphasised field name that closes with a colon, e.g. "Duration". */
  label?: string;
  /** The value that is GONE — struck through (an old duration, a cleared slot). */
  strikeValue?: string;
  value?: string;
  /**
   * Render `value` as a LINK to the object it names — underlined (Figma
   * 24592-40478 writes INV-10001 / EST-10001 / JOB-10001 that way). Those
   * objects do not exist in the prototype, so it does not navigate.
   */
  valueLink?: boolean;
  tailText?: string;
  tailValue?: string;
  /** Render `tailValue` struck through (the unassigned half of an Assignees log). */
  tailStrike?: boolean;
  /**
   * PEOPLE as the value instead of `value` / `tailValue` — each name renders
   * with its xxs avatar, like every other person in a log (Assignees, Daniel
   * 2026-08-05).
   */
  people?: LogPerson[];
  tailPeople?: LogPerson[];
  /**
   * The free-text reason the user typed. It turns the log into an accordion
   * whose single sub-log is `reasonTitle` over this text (Figma 24515-63361 /
   * 63391 / 63421 / 63451).
   */
  reason?: string;
  /** "Start reason" / "Pause reason" / "Resume reason" / "Cancel reason". */
  reasonTitle?: string;
}

/**
 * What changed between two equipment selections. The Equipment form applies a
 * whole session of edits at once, so ONE change can add and remove several
 * pieces together — the log reads "added A, B and removed C, D" (Figma
 * 24450-60498).
 */
export function diffEquipment(
  before: number[],
  after: number[],
  // The LIVE pool — the New-equipment form appends to it, so the caller passes
  // its own copy instead of this module reading the initial one.
  pool: Equipment[] = EQUIPMENT_POOL
): { added: string[]; removed: string[] } {
  const name = (id: number) => {
    const equipment = pool.find((e) => e.id === id);
    return equipment != null ? equipmentSentenceName(equipment) : undefined;
  };
  const names = (ids: number[]) => ids.map(name).filter((n): n is string => n != null);

  return {
    added: names(after.filter((id) => !before.includes(id))),
    removed: names(before.filter((id) => !after.includes(id))),
  };
}

// The Service module's fields in the order the FORM shows them. The sub-logs
// follow this order, not the order the user happened to edit them in.
const SERVICE_FIELDS: {
  key: keyof ServiceValues;
  label: string;
  longText?: boolean;
  format?: (value: string) => string;
  /** Only Type and Priority carry a glyph — the rest are plain text. */
  icon?: (value: string) => ValueIcon | undefined;
}[] = [
  { key: "reason", label: "Reason for call", longText: true },
  { key: "type", label: "Type", format: (v) => (v === "recall" ? "Recall" : "New"), icon: TYPE_ICON },
  { key: "recallTo", label: "Recall to" },
  { key: "service", label: "Service" },
  { key: "priority", label: "Priority", icon: PRIORITY_ICON },
  { key: "tech", label: "Tech instructions", longText: true },
];

// The Job-properties fields in the order the FORM shows them. Daniel,
// 2026-08-03: this module logs exactly like Service, so the same update-log
// rules apply (one field → a plain row, several → the module accordion).
// None of them carries a glyph — Source and Received by show AVATARS in the
// module, and `ValueIcon` is icon-only, so the log writes their names plainly.
const JOB_PROPERTY_FIELDS: { key: keyof JobProperties; label: string; format?: (value: JobProperties[keyof JobProperties]) => string }[] = [
  { key: "jobId", label: "Job ID" },
  { key: "branch", label: "Branch" },
  { key: "source", label: "Source" },
  { key: "sourceId", label: "Source ID" },
  // The module's date format ("January 1, 2026"), not the field's weekday one.
  { key: "dateReceived", label: "Date received", format: (v) => (v instanceof Date ? MODULE_DATE.format(v) : "") },
  { key: "receivedBy", label: "Received by", format: (v) => users.find((u) => u.id === v)?.name ?? "" },
];

/** The Job-properties fields that changed, in form order. Empty when nothing changed. */
export function diffJobProperties(before: JobProperties, after: JobProperties): FieldChange[] {
  const changes: FieldChange[] = [];

  for (const field of JOB_PROPERTY_FIELDS) {
    const format = field.format ?? ((value: JobProperties[keyof JobProperties]) => String(value ?? ""));
    const from = before[field.key] == null ? "" : format(before[field.key]);
    const to = after[field.key] == null ? "" : format(after[field.key]);
    if (from === to) continue;
    changes.push({ label: field.label, oldValue: from, newValue: to });
  }

  return changes;
}

/**
 * The Scheduling fields that changed, in FORM order (Daniel, 2026-08-04 —
 * same pattern as Service / Job properties). The form groups its inputs, so
 * the log follows the LABELS the user sees, not the raw state: the date and
 * the time share one "Date & time" field, the hours and minutes share one
 * "Duration". A field with nothing in it reads as "No value".
 */
export function diffScheduling(before: Scheduling, after: Scheduling): FieldChange[] {
  const changes: FieldChange[] = [];

  // Only a set DATE makes the pair a real value — the time alone says nothing
  // (unscheduling clears the date and leaves the time behind).
  const dateTime = (s: Scheduling) => (s.date != null ? scheduledForLabel(s) : "");
  if (dateTime(before) !== dateTime(after)) {
    changes.push({ label: "Date & time", oldValue: dateTime(before), newValue: dateTime(after) });
  }

  // durationLabel renders an empty duration as "0 min"; the log wants the
  // "No value" placeholder instead.
  const duration = (s: Scheduling) => {
    const total = (parseInt(s.hours, 10) || 0) * 60 + (parseInt(s.minutes, 10) || 0);
    return total === 0 ? "" : durationLabel(s.hours, s.minutes);
  };
  if (duration(before) !== duration(after)) {
    changes.push({ label: "Duration", oldValue: duration(before), newValue: duration(after) });
  }

  return changes;
}

/**
 * The Billing-intention fields that changed. Same pattern as Service and Job
 * properties (Daniel, 2026-08-03), so the ActivityUpdateLog rules apply: one
 * field reads as a plain row, both give the module accordion. "Billing client"
 * only exists while the intention is "Bill to different client".
 */
export function diffBilling(before: Billing, after: Billing): FieldChange[] {
  const changes: FieldChange[] = [];

  if (before.intention !== after.intention) {
    changes.push({
      label: "Billing intention",
      oldValue: BILLING_INTENTION_LABELS[before.intention],
      newValue: BILLING_INTENTION_LABELS[after.intention],
    });
  }

  const fromClient = before.intention === "differentClient" ? billingClientName(before.clientId) : "";
  const toClient = after.intention === "differentClient" ? billingClientName(after.clientId) : "";
  if (fromClient !== toClient) {
    changes.push({ label: "Billing client", oldValue: fromClient, newValue: toClient });
  }

  return changes;
}

/** The Service fields that changed, in form order. Empty when nothing changed. */
export function diffServiceValues(before: ServiceValues, after: ServiceValues): FieldChange[] {
  const changes: FieldChange[] = [];

  for (const field of SERVICE_FIELDS) {
    const from = before[field.key] ?? "";
    const to = after[field.key] ?? "";
    if (from === to) continue;

    const format = field.format ?? ((value: string) => value);
    changes.push({
      label: field.label,
      oldValue: from === "" ? "" : format(from),
      newValue: to === "" ? "" : format(to),
      longText: field.longText,
      // An empty side has no value, so it has no glyph either.
      oldIcon: from === "" ? undefined : field.icon?.(from),
      newIcon: to === "" ? undefined : field.icon?.(to),
    });
  }

  return changes;
}
