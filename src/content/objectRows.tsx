import { ReactNode } from "react";

import { countMissing, formatDate, joinValues, RANGE_ARROW, userName, value } from "./objectText";

// The object-row content rules, from the Figma "Object data" documentation page
// (27171-15212). One formatter per object: it returns the row's title, its
// caption, and whether the object's OWN issue rule has fired — the row then
// swaps its avatar for AvatarWarning.
//
// There is no shared issue rule. Each object decides for itself (Daniel,
// 2026-09-25), which is exactly why the rule has to live in code next to the
// copy instead of being re-derived per screen:
//   Client     — never an issue.
//   Contact    — an issue only when BOTH phone and email are missing.
//   Equipment  — an issue when ANY ONE of manufacturer, serial, model is missing.
//   File       — never an issue.
//   Location   — never an issue; a missing name is normal.
//   Tax rate   — never an issue.
//   Warranty   — never an issue; the end date is optional.
//   Workflow   — never an issue.

/** What a row draws: the two text lines, and whether the avatar must warn. */
export interface ObjectRow {
  title: ReactNode;
  caption: ReactNode;
  /** True when this object's own issue rule has fired → use AvatarWarning. */
  hasIssue: boolean;
}

/** A person who acted, for the "by …" half of a caption. */
export interface ActingUser {
  firstName?: string | null;
  lastName?: string | null;
}

// ---- Client ---------------------------------------------------------------

export interface ClientInput {
  name?: string | null;
  type?: string | null;
  industry?: string | null;
}

/** Title: client name. Caption: type · industry. Never an issue. */
export function clientRow(client: ClientInput): ObjectRow {
  return {
    title: joinValues([value(client.name, "Name")]),
    caption: joinValues([value(client.type, "Type"), value(client.industry, "Industry")]),
    hasIssue: false,
  };
}

// ---- Contact --------------------------------------------------------------

export interface ContactInput {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * Title: contact name. Caption: phone number · email address.
 * An issue only when BOTH ways of reaching the contact are missing — one of
 * the two is enough to do the job.
 */
export function contactRow(contact: ContactInput): ObjectRow {
  const reach = [value(contact.phone, "Phone number"), value(contact.email, "Email address")];
  return {
    title: joinValues([value(contact.name, "Name")]),
    caption: joinValues(reach),
    hasIssue: countMissing(reach) === reach.length,
  };
}

// ---- Equipment ------------------------------------------------------------

export interface EquipmentInput {
  name?: string | null;
  manufacturer?: string | null;
  serial?: string | null;
  model?: string | null;
}

/**
 * Title: name · manufacturer. Caption: "Serial: X" · "Model: Y".
 * An issue when ANY ONE of manufacturer, serial or model is missing — a
 * technician cannot order a part without all three.
 */
export function equipmentRow(equipment: EquipmentInput): ObjectRow {
  const manufacturer = value(equipment.manufacturer, "Manufacturer");
  const serial = value(equipment.serial && `Serial: ${equipment.serial}`, "Serial number");
  const model = value(equipment.model && `Model: ${equipment.model}`, "Model number");
  return {
    title: joinValues([value(equipment.name, "Name"), manufacturer]),
    caption: joinValues([serial, model]),
    hasIssue: countMissing([manufacturer, serial, model]) > 0,
  };
}

// ---- File -----------------------------------------------------------------

export interface FileInput {
  name?: string | null;
  /** Extension without the dot — "pdf". */
  extension?: string | null;
  addedOn: Date;
  addedBy?: ActingUser | null;
}

/**
 * Title: "File name.ext" — the extension joins with a DOT, not the separator,
 * because a name and its extension are one value. Caption: a sentence.
 */
export function fileRow(file: FileInput): ObjectRow {
  const name = file.name && file.extension ? `${file.name}.${file.extension}` : file.name;
  return {
    title: joinValues([value(name, "Name")]),
    caption: `Added on ${formatDate(file.addedOn)} by ${userName(file.addedBy?.firstName, file.addedBy?.lastName)}`,
    hasIssue: false,
  };
}

// ---- Location -------------------------------------------------------------

export interface LocationInput {
  name?: string | null;
  street?: string | null;
  suite?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}

/**
 * The address, as the title: street, suite, city, then "ST 94110". Commas join
 * the parts — state and postal code are the one pair that takes a space,
 * because together they are a single postal expression.
 */
export function formatAddress(location: LocationInput): string {
  const region = [location.state, location.postalCode].filter(Boolean).join(" ");
  return [location.street, location.suite, location.city, region].filter(Boolean).join(", ");
}

/**
 * Title: the address. Caption: location name. A missing name is NOT an issue —
 * a location is identified by where it is, not by what it is called.
 */
export function locationRow(location: LocationInput): ObjectRow {
  return {
    title: joinValues([value(formatAddress(location), "Address")]),
    caption: joinValues([value(location.name, "Location name")]),
    hasIssue: false,
  };
}

// ---- Tax rate -------------------------------------------------------------

export interface TaxRateInput {
  name?: string | null;
  percentage?: number | null;
}

/** Title: tax rate name. Caption: the percentage. */
export function taxRateRow(taxRate: TaxRateInput): ObjectRow {
  const percentage = taxRate.percentage == null ? null : `${taxRate.percentage}%`;
  return {
    title: joinValues([value(taxRate.name, "Name")]),
    caption: joinValues([value(percentage, "Percentage")]),
    hasIssue: false,
  };
}

// ---- Warranty -------------------------------------------------------------

export interface WarrantyInput {
  name?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

/**
 * Title: warranty name. Caption: start → end, joined by a real arrow rather
 * than the separator, because a range is directional. The end date is
 * optional, so its placeholder is not an issue.
 */
export function warrantyRow(warranty: WarrantyInput): ObjectRow {
  return {
    title: joinValues([value(warranty.name, "Name")]),
    caption: joinValues(
      [
        value(warranty.startDate && formatDate(warranty.startDate), "Start date"),
        value(warranty.endDate && formatDate(warranty.endDate), "End date"),
      ],
      RANGE_ARROW,
    ),
    hasIssue: false,
  };
}

// ---- Workflow objects -----------------------------------------------------

export interface WorkflowObjectInput {
  /** The object's own id. It is company-configurable — never assume a prefix. */
  id: string;
  /** The status as the product names it — "Jobbed", "Sent", "Received". */
  status?: string | null;
  statusChangedOn?: Date | null;
  statusChangedBy?: ActingUser | null;
}

/**
 * Bills, credit notes, estimates, invoices, jobs and purchase orders all read
 * the same way. Title: the object's id. Caption: a sentence saying which
 * status was applied, when, and by whom.
 */
export function workflowObjectRow(object: WorkflowObjectInput): ObjectRow {
  const by = userName(object.statusChangedBy?.firstName, object.statusChangedBy?.lastName);
  const caption =
    object.status && object.statusChangedOn
      ? `${object.status} on ${formatDate(object.statusChangedOn)} by ${by}`
      : null;
  return {
    title: joinValues([value(object.id, "ID")]),
    caption: joinValues([value(caption, "Status")]),
    hasIssue: false,
  };
}
