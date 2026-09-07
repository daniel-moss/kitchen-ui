import { BadgeJobStatusStatus } from "../../components/Badge/BadgeJobStatus";

// The demo database's SCHEMA (started 2026-09-04, Daniel: "we need to start
// the database now until it's not too late"). One simulated service company,
// shaped like the REAL app: every entity and field below mirrors a production
// model (read from roopairs_api, read-only), trimmed to what a prototype can
// show — sync/billing plumbing (QuickBooks, Stripe, tax defaults) is left out.
//
// The hierarchy (Daniel's spec):
//   Client ── parameters of its own, and its own contacts
//     └── Locations ── each with its own contacts
//           ├── Equipment ── each with its Warranties
//           ├── Jobs ── may carry their OWN contacts (not saved anywhere)
//           ├── Estimates
//           └── Invoices
//
// Rules:
//   - Ids are human-readable strings ("wildwood", "JOB-1201") so demo code
//     and this page stay legible.
//   - Dates are absolute ISO strings — never derived from the clock, so
//     every prototype and screenshot stays stable (the Filters rule).
//   - Field OPTIONALITY mirrors production: what is blank=true there is
//     optional here, so empty states can be designed with real gaps.
//   - Techs/office staff are NOT here — they are the shared `users` pool
//     (src/data/users.ts); jobs reference them by user id.
//
// Browse the whole dataset in Storybook: Data → Database.

/** Production `ClientTypes` (core/models.py). */
export type ClientType = "Business" | "Individual";

/** Production `ExternalClient.IndustryTypes`. Optional on a client there too. */
export type IndustryType = "Residential" | "Commercial" | "Industrial" | "Government";

/** Production `EquipmentOwnershipTypes` (equipment/choices.py). */
export type EquipmentOwnership = "Unknown" | "Owned" | "Leased" | "Rented";

/**
 * Production `EquipmentCategories` (core/models.py) — the commercial-kitchen
 * set, verbatim labels.
 */
export type EquipmentCategory =
  | "Cooking Equipment"
  | "Fryers"
  | "Ice Machines"
  | "Ovens and Ranges"
  | "Concession and Condiment Equipment"
  | "Dishwashing Equipment"
  | "Holding and Warming Equipment"
  | "Refrigeration"
  | "Beverage Equipment"
  | "Food Preparation Equipment"
  | "Laundry"
  | "Other";

/** Production `Estimate.Statuses` (estimates/models.py). */
export type EstimateStatus = "Pending" | "Sent" | "Approved" | "Won" | "Lost" | "Cancelled";

/** Production `Invoice.Statuses` (invoices/models.py). */
export type InvoiceStatus = "Pending" | "Sent" | "Paid" | "Voided" | "Forgiven";

/**
 * A job's status uses the DESIGN SYSTEM'S status set (BadgeJobStatus), not
 * production's 8-value enum — the DS set is what every prototype renders, and
 * it splits production's Pending into draft/unscheduled, Scheduled into
 * upcoming/pastDue, etc.
 */
export type JobStatus = BadgeJobStatusStatus;

/**
 * A saved contact — production `BaseContact` (core/models.py): every field
 * optional there ("at least one of name, phone, email"), same here.
 * `ClientContact` belongs to a client, `LocationContact` to a location;
 * production keeps them as two separate tables and so do we.
 */
export interface ContactRecord {
  id: string;
  /** Person's name. */
  name?: string;
  /**
   * Demo PHOTO for prototypes' contact lists — production contacts carry no
   * photo; this is a prototyping nicety. Paths come from the avatars pool's
   * TAIL (user-10 and up), so a tech (users 1-9) never shares a face with a
   * contact. A photo may repeat across clients that never share one list.
   */
  avatar?: string;
  /** Job title — production calls it `position` ("Kitchen Manager"). */
  position?: string;
  phone?: string;
  phoneExtension?: string;
  email?: string;
}

export interface ClientContact extends ContactRecord {
  clientId: string;
}

export interface LocationContact extends ContactRecord {
  locationId: string;
}

/** Production `ExternalClient` — the client's own parameters. */
export interface Client {
  id: string;
  name: string;
  clientType: ClientType;
  /** Optional in production too. */
  industryType?: IndustryType;
  /** Free-form tags (production `ExternalClientLabel`). */
  labels: string[];
  /** Dollars. Unset = no limit configured. */
  creditLimit?: number;
  /**
   * Billing address parts (production `billing_address_*`). ALL unset =
   * billing address missing — one of the two client issues the "New Job"
   * form warns about (the other: the credit limit is reached).
   */
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  /**
   * Pre-picks the job's billing intention when the picked location has no
   * default of its own. NEW concept — production has no client-level default;
   * unset = the platform default "Bill to this location".
   */
  defaultBillingIntention?: BillingIntention;
  notes?: string;
  /** One of this client's own contacts. */
  primaryContactId?: string;
  /** Deactivated clients stay in the data (production `is_active`). */
  isActive: boolean;
}

/**
 * Production `ServiceLocation`. `name` is optional — a client with one site
 * often leaves it blank, and the address stands for it. The address is NOT
 * optional: street, city, state and postal code are required to create a
 * location (Daniel, 2026-09-07), so every row carries them. Only `unit` is
 * a true optional.
 */
export interface Location {
  id: string;
  clientId: string;
  name?: string;
  street: string;
  /** "Apartment, Suite, etc." in production. */
  unit?: string;
  city: string;
  state: string;
  postalCode: string;
  /**
   * Production `default_billing_intention` — pre-picks the job's billing
   * intention; wins over the client's default.
   */
  defaultBillingIntention?: BillingIntention;
  /**
   * Production `default_billing_client` — pre-picks the billing client when
   * the default intention is "differentClient".
   */
  defaultBillingClientId?: string;
  notes?: string;
  /** One of this location's own contacts. */
  primaryContactId?: string;
}

/** Production `EquipmentWarranty` — an equipment can hold several. */
export interface Warranty {
  id: string;
  equipmentId: string;
  /** "Manufacturer parts", "Extended labor"… (production `name`, 60 chars). */
  name: string;
  startDate: string;
  /** Unset = does not expire. */
  endDate?: string;
  details?: string;
}

/** Production `Equipment` — always under a location. */
export interface Equipment {
  id: string;
  locationId: string;
  displayName: string;
  category: EquipmentCategory;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  /** WHERE at the site it stands ("Back kitchen") — production `location`. */
  physicalLocation?: string;
  installationDate?: string;
  ownership: EquipmentOwnership;
  notes?: string;
}

/**
 * A contact belonging to THE JOB itself — production stores it as plain
 * fields on the job (reporter_*, point_of_contact_*), NOT as a row in any
 * contact table. `isEphemeral` is production's flag for "one-off person,
 * do not save to the location's contacts".
 */
export interface JobContact {
  name?: string;
  phone?: string;
  phoneExtension?: string;
  email?: string;
  isEphemeral: boolean;
}

export interface Job {
  id: string;
  locationId: string;
  /** What the pricebook service is called ("Walk-in cooler repair"). */
  serviceName: string;
  status: JobStatus;
  /** 1 Urgent · 2 High · 3 Medium · 4 Low. Unset = no priority. */
  priority?: 1 | 2 | 3 | 4;
  /** ISO date-time. Unset = not scheduled yet. */
  scheduledFor?: string;
  durationMinutes?: number;
  /** Techs from the shared users pool (src/data/users.ts). */
  assigneeIds: number[];
  /** The equipment this job services, from the same location. */
  equipmentIds: string[];
  /** Who reported the issue — the job's own contact. */
  reporter?: JobContact;
  /** Who to meet on site — the job's own contact. */
  pointOfContact?: JobContact;
  notes?: string;
}

export interface Estimate {
  id: string;
  locationId: string;
  /** Set when the estimate was turned into (or written for) a job. */
  jobId?: string;
  serviceName: string;
  status: EstimateStatus;
  /** Dollars. */
  total: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  locationId: string;
  /** Set when the invoice bills a job. */
  jobId?: string;
  status: InvoiceStatus;
  /** Dollars. */
  total: number;
  issuedAt: string;
  /** Payment terms in days ("Net 30"). Unset = due on receipt. */
  netDays?: number;
}

// ---- reference tables (moved from the Filters prototype, 2026-09-04) -------

/** A pricebook service — what a job can be for. The "Service" filter's options. */
export interface Service {
  id: string;
  name: string;
  /**
   * Pre-fills the job's priority in the "New Job" form. REQUIRED — a service
   * cannot be created without picking one of the options (Daniel,
   * 2026-09-07): 1 Urgent · 2 High · 3 Medium · 4 Low · null = the explicit
   * "No priority" option (production's null job priority). NEW concept —
   * production `PriceBookItem` has no priority field (its only job default
   * is `default_job_duration`).
   */
  defaultPriority: 1 | 2 | 3 | 4 | null;
  /**
   * Pre-fills the job's duration (production `default_job_duration`, held as
   * minutes here). Unset = no default.
   */
  defaultDurationMinutes?: number;
}

/** A job label — free-form tags on jobs (production `JobLabel`). */
export interface JobLabel {
  id: string;
  name: string;
}

/** Where a job request came from — the "Source" filter's options. */
export interface JobSource {
  id: string;
  name: string;
  /** Prefix for the demo Source ID ("CALL-1042"), or null when the source provides none. */
  prefix: string | null;
  /**
   * The "New Job" form shows and requires the "Source ID" field when this
   * source is picked. Production has no flag — every origin type but Direct
   * shows the input; the design's "New Source" form makes it an explicit
   * checkbox, so the demo stores it per source.
   */
  requiresId: boolean;
}

/** Production `BillingIntention` — who pays for a job. */
export type BillingIntention = "location" | "client" | "differentClient";

/**
 * A service-company branch — the "Branch" field of the "New Job" form. NEW
 * concept: production has NO Branch model (the nearest analog is
 * `InventoryLocation`, a named `PhysicalAddressEntity`); the shape follows
 * the design (name title + one-line address caption) with Location's
 * address parts.
 */
export interface Branch {
  id: string;
  name: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

/**
 * A form the tech fills out when completing the job — the "Forms" module's
 * library. NEW concept: production has no form-template model. A form
 * becomes REQUIRED (not removable from the job) when a matching service or
 * equipment category is on the job.
 */
export interface JobForm {
  id: string;
  name: string;
  /** Services that make this form required. */
  requiredForServiceIds?: string[];
  /** Equipment categories that make this form required. */
  requiredForEquipmentCategories?: EquipmentCategory[];
}

/**
 * The demo company's settings that gate the "New Job" form (production
 * `ServiceCompany` fields of the same names).
 */
export interface CompanySettings {
  /** Max files per upload. Production default 25, absolute max 100. */
  maxFileUploads: number;
  /** Max file size in MB. Production default 100. */
  maxFileUploadSizeMb: number;
  /**
   * Custom job ids (production `job_custom_id_generation_mode`): "off" hides
   * the "Job ID" field, "manual" shows it and requires a value, "automatic"
   * generates one. The demo runs "manual" so the field is visible.
   */
  jobCustomIdGenerationMode: "off" | "manual" | "automatic";
}
