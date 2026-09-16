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
/**
 * An estimate's ONE status — the DS `BadgeEstimateStatus` keys, minus
 * `expired`, which is derived (a sent estimate whose `dueAt` has passed).
 *
 * It replaced production's two-level model on 2026-09-11 (Daniel: "this
 * concept of state is redundant and we won't use it anymore"). Production
 * stores a STATE (`Estimate.Statuses`: Pending / Sent / Approved / Won / Lost
 * / Cancelled) plus `is_draft` and a conversion path, and derives the badge
 * from all three — so the same estimate could be Approved-and-jobbed or
 * Won-and-unconverted, and a list could group it two different ways. The demo
 * stores the answer instead. Nothing is lost: every production combination
 * maps onto exactly one of these.
 *
 * The open / closed PHASE is no longer a property of the row either — it is
 * whichever statuses a list's views group together (see the Estimates page).
 */
export type EstimateStatus =
  | "draft"
  | "unsent"
  | "awaitingApproval"
  | "unconverted"
  | "jobbed"
  | "invoiced"
  | "lost"
  | "cancelled";

/**
 * ONE status level, the DS badge's own keys (BadgeInvoiceStatus) — the
 * estimates decision (2026-09-11, Daniel: "this concept of state is
 * redundant") applied to invoices when their list arrived (2026-09-14).
 * Production stores five statuses (invoices/models.py `Statuses`: Pending /
 * Sent / Paid / Voided / Forgiven) and derives the seven display labels from
 * them (`get_status_display`: Pending splits into Draft/Unsent by `is_draft`,
 * Sent into Outstanding/Overdue by `is_overdue`). The demo stores the display
 * status directly — minus OVERDUE, which stays derived because it depends on
 * the clock (an outstanding invoice whose `dueAt` has passed), exactly like
 * the estimates' Expired.
 */
export type InvoiceStatus = "draft" | "unsent" | "outstanding" | "paid" | "voided" | "forgiven";

/**
 * A job's status uses the DESIGN SYSTEM'S status set (BadgeJobStatus), not
 * production's 8-value enum — the DS set is what every prototype renders, and
 * it splits production's Pending into draft/unscheduled, Scheduled into
 * upcoming/pastDue, etc.
 */
export type JobStatus = BadgeJobStatusStatus;

/**
 * Production `JobSeriesType` (jobs/choices.py): UPFRONT creates every job of
 * the series at once (an end date is REQUIRED for it), ROLLING creates the
 * next job as the series progresses (its end date is optional — a rolling
 * series can run forever).
 */
export type JobSeriesType = "upfront" | "rolling";

/** Production `RecurrenceFrequency` (core/choices.py, rrule-backed). */
export type SeriesRecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

/**
 * Production `JobSeriesMonthlyRecurrence`: recur on the same DATE each month
 * ("day 15") or on the same DAY each month ("the 3rd Friday") — both read off
 * `recurrenceStart`.
 */
export type SeriesMonthlyRecurrence = "sameDate" | "sameDay";

/**
 * Production `JobSeries` (jobs/models.py), trimmed to what the list shows. A
 * series is a recurrence rule that stamps out jobs; it belongs to a LOCATION
 * (and through it to the client) and has no id column, no labels and no
 * status of its own — its open / closed PHASE is DERIVED from
 * `recurrenceEnd` (production `JobSeriesFilter.filter_is_closed`: closed =
 * the end has passed; no end, or an end in the future = open).
 */
export interface JobSeries {
  id: string;
  locationId: string;
  /** The pricebook service behind the series — the Job's own pattern. */
  serviceId?: string;
  /** The series' OWN service name (production `service_name`, denormalized). */
  serviceName: string;
  type: JobSeriesType;
  /** ISO date-time. The rule's anchor — weekday/date reads come from it. */
  recurrenceStart: string;
  /** ISO date-time. Unset = open-ended (rolling only — see `JobSeriesType`). */
  recurrenceEnd?: string;
  /** "Every N …" — production `recurrence_interval`, at least 1. */
  recurrenceInterval: number;
  recurrenceFrequency: SeriesRecurrenceFrequency;
  /** WEEKLY only: Monday-based weekday indexes (0=Mon … 6=Sun), production's own. */
  weeklyRecurrence?: number[];
  /** MONTHLY only. */
  monthlyRecurrence?: SeriesMonthlyRecurrence;
  /**
   * Production's `open_jobs_count` annotation — the series' jobs currently
   * in flight (scheduled / active / paused / on hold / completed; NOT
   * pending, finalized or cancelled). Stored directly: the demo does not
   * link jobs to their series, so there is nothing to count from.
   */
  openJobsCount: number;
  /** ISO. */
  createdAt: string;
  /** ISO. Any edit. */
  lastModifiedAt: string;
}

/**
 * The statuses a SUB-STATUS can hang under. In production a sub-status is
 * offered only where the job is paused or on hold (`JobPauseForm` asks for one
 * behind `PAUSED_SUBSTATUSES_EXIST` / `ON_HOLD_SUBSTATUSES_EXIST`), so those are
 * the three DS statuses that can carry one.
 */
export type SubStatusParent = Extract<JobStatus, "quickPaused" | "onHoldExternal" | "onHoldInternal">;

/**
 * A job SUB-STATUS — production `JobSubStatus` (the search-or-CREATE select in
 * `JobSubStatusSearchOrCreateSelect.jsx`): a company-configurable named reason
 * belonging to ONE parent status, not a fixed enum. "Waiting for parts",
 * "Customer unavailable".
 *
 * Production shows it INSTEAD of the generic status wherever a job has one
 * (`getJobStatusOrSubStatusLabel`: "return job.substatus_label ? … :
 * job.status_label"), which is also the Figma Status section's annotation:
 * "Sub-statuses — If exist, they are shown instead of the generic status".
 *
 * Added 2026-09-14 (Daniel: "let's add sub-statuses to db"). It is what gives
 * a sub-status SWAP — Active ↔ Quick-paused, on hold external ↔ internal —
 * something to point at: those count as real status transitions, so a job that
 * carries one has a `statusChangedAt` that stands for that swap.
 */
export interface JobSubStatusRecord {
  id: string;
  /** What the badge and the lists would print instead of the status label. */
  name: string;
  /** The status this reason belongs to — production's `associated_status`. */
  status: SubStatusParent;
}

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

/** A client label — production `ExternalClientLabel`, its own table like
 *  every other object's. The legacy card marks them "(Only Visible to You)". */
export interface ClientLabel {
  id: string;
  name: string;
}

/**
 * A workspace tax rate — production keeps these as PriceBook items limited to
 * the tax type (`pricebook_item_tax_limiter`); a client's default tax rate is
 * an FK onto one. Trimmed to what the lists show: the name (and the percent,
 * for the Database browser).
 */
export interface TaxRate {
  id: string;
  name: string;
  /** Percent, e.g. 8.63. Zero is a real rate ("Tax exempt"). */
  rate: number;
}

/** Production `ExternalClient` — the client's own parameters. Extended
 *  2026-09-16 for the Clients list (the fields production's table leaves
 *  unlisted: industry, the money trio, the three defaults, the dates). */
export interface Client {
  id: string;
  name: string;
  clientType: ClientType;
  /** Optional in production too — the filter's "No industry" row. */
  industryType?: IndustryType;
  /** CLIENT_LABELS ids (production `ExternalClientLabel`). Was free-form
   *  strings until 2026-09-16 — every other list's labels are id-based. */
  labelIds: string[];
  /** Dollars. Unset = no limit configured (production allows it: NULL). */
  creditLimit?: number;
  /**
   * "Available invoice credit" — production `credit_balance`, the money the
   * client can put toward invoices. Only CREDIT NOTES feed it there (issue +,
   * allocate −, void −, deallocate +; a Postgres trigger over the
   * ClientBalanceTransaction ledger — payments never touch it). STORED here,
   * not derived: the demo does not model allocations, so summing the credit
   * notes would inflate it. Curated to roughly agree with the client's issued
   * credit notes — FLAGGED.
   */
  creditBalance: number;
  /**
   * Billing address parts (production `billing_address_*`). ALL unset =
   * billing address missing — one of the two client issues the "New Job"
   * form warns about (the other: the credit limit is reached).
   */
  billingRecipient?: string;
  billingStreet?: string;
  /** "Apartment, Suite, etc." — the Billing address filter's second field. */
  billingUnit?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  /**
   * "Bills to" — production `default_billing_intention` (its default is
   * SERVICE_LOCATION, so unset = "Location"): who receives this client's
   * invoices. "client" = the client itself ("Same client"), "location" = each
   * service location, "differentClient" = the client named below.
   */
  defaultBillingIntention?: BillingIntention;
  /** Production `default_billing_client` — required there iff the intention
   *  is "differentClient". */
  defaultBillingClientId?: string;
  /** Estimate expiration in DAYS (production `default_estimate_net`).
   *  Unset = the company default — the filter's "No default" row. */
  defaultEstimateNet?: number;
  /** Payment terms in net days (production `default_invoice_net`): 0 =
   *  "Same Day", n = "Net n". Unset = the company default ("No default"). */
  defaultInvoiceNet?: number;
  /** TAX_RATES id (production `default_pricebook_tax`). Unset = no default. */
  defaultTaxRateId?: string;
  notes?: string;
  /** One of this client's own contacts. */
  primaryContactId?: string;
  /** Deactivated clients stay in the data (production `is_active`). */
  isActive: boolean;
  /** ISO. When the record was added (production `created_at`). */
  createdAt: string;
  /** ISO. Any edit (production `last_modified_at`). */
  lastModifiedAt: string;
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
  /** The pricebook service behind the job (a SERVICES id). */
  serviceId: string;
  /**
   * The job's OWN service name — production denormalizes it onto the job, and
   * it may drift from the pricebook name ("Fryer preventive maintenance" on a
   * job whose service is "Fryer service and calibration"). Lists show THIS.
   */
  serviceName: string;
  status: JobStatus;
  /**
   * JOB_SUB_STATUSES id — the named reason behind a paused or on-hold job.
   * Only a `SubStatusParent` status may carry one, and even then it is
   * optional: production's sub-statuses are a company feature, so a workspace
   * that never made any has none. See `JobSubStatusRecord`.
   */
  subStatusId?: string;
  /** 1 Urgent · 2 High · 3 Medium · 4 Low. Unset = no priority. */
  priority?: 1 | 2 | 3 | 4;
  /** ISO date-time. Unset = not scheduled yet. */
  scheduledFor?: string;
  /**
   * The ESTIMATED duration, in minutes — what the lists call "Est. duration".
   *
   * Every job has one EXCEPT a draft (Daniel, 2026-09-14: "the duration must
   * exist to create a job. Only draft jobs might not have duration"), so it is
   * optional in the type and empty only on `status: "draft"`. Keep it that way
   * when adding rows: a dateless duration cell is a draft's, and the Est.
   * duration filter answers nothing for a row without one.
   */
  durationMinutes?: number;
  /** Techs from the shared users pool (src/data/users.ts). */
  assigneeIds: number[];
  /** The equipment this job services, from the same location. */
  equipmentIds: string[];
  /** JOB_LABELS ids — free-form tags (production `JobLabel`). */
  labelIds: string[];
  /** The Service module's "Type": a fresh request, or a recall of old work. */
  type: "new" | "recall";
  /** Where the request came from — a JOB_SOURCES id (production origin type). */
  sourceId: string;
  /** The source's own reference ("SC-8590"); unset when the source has none. */
  sourceRef?: string;
  /** ISO. When the request came in. */
  receivedAt: string;
  /**
   * ISO. When the status last REALLY changed — null until it ever does
   * (Daniel, 2026-09-12). The status a job is born with is not a change, and
   * neither is leaving Draft (a draft is "not created yet" to the user), so:
   * a draft is always null; an unscheduled job carries a date only when it
   * came back from a schedule; a scheduled job only when someone scheduled it
   * later, out of Unscheduled. From Active on there is always a date — those
   * statuses can only be reached by a transition. Upcoming → Past due is the
   * clock, not an action, and never writes one; a SUB-status swap
   * (Active ↔ Quick-paused, On hold external ↔ internal) does.
   */
  statusChangedAt: string | null;
  /** ISO. Any edit to the job. */
  lastModifiedAt: string;
  /** Who reported the issue — the job's own contact. */
  reporter?: JobContact;
  /** Who to meet on site — the job's own contact. */
  pointOfContact?: JobContact;
  notes?: string;
}

// (`EstimateConversionPath` is GONE with the state model, 2026-09-11: what an
// estimate turned into IS its status now — `unconverted` / `jobbed` /
// `invoiced` are three of the eight `EstimateStatus` values.)

/**
 * Production derives this from the down-payment amounts
 * (`get_down_payment_status_display`); the demo stores the outcome directly.
 */
export type EstimateDownPayment = "notRequired" | "unpaid" | "partiallyPaid" | "paid";

/** An estimate label — production `EstimateLabel`, SEPARATE from job labels. */
export interface EstimateLabel {
  id: string;
  name: string;
}

// ONE status level since 2026-09-11 — see `EstimateStatus`. The row carries
// the status the badge shows; the single exception is EXPIRED, which stays
// derived, because it depends on the clock rather than on anything stored
// (an "awaitingApproval" estimate whose `dueAt` has passed).
export interface Estimate {
  id: string;
  locationId: string;
  /** Set when the estimate was turned into (or written for) a job. */
  jobId?: string;
  /**
   * The pricebook service behind the estimate (a SERVICES id) — the Job's own
   * pattern, added 2026-09-11 so the Estimates list's Service filter can match
   * by id rather than by a name that may have drifted. Unset when the estimate
   * is not for a pricebook service at all (EST-2205's build-out consultation).
   */
  serviceId?: string;
  /** The estimate's OWN service name, which may differ from the pricebook's. */
  serviceName: string;
  /** The status the badge shows. EXPIRED is derived from `dueAt`, not stored. */
  status: EstimateStatus;
  /** ESTIMATE_LABELS ids (production `EstimateLabel`). */
  labelIds: string[];
  /** Dollars. */
  total: number;
  /** ISO. Production `date_issued` (replaced `createdAt`, 2026-09-11). */
  issuedAt: string;
  /** ISO. When the estimate expires — production `date_due`, the "Expires" column. */
  dueAt: string;
  downPayment: EstimateDownPayment;
  /**
   * ISO. Production `last_status_transition_time` — null until the status
   * really changes, the same rule the jobs carry: a draft and an unsent
   * estimate are both sitting in their FIRST status, so neither has one.
   * Everything from "sent" on does (sending is a real transition), and an
   * estimate cannot go back to Unsent.
   */
  statusChangedAt: string | null;
  /** ISO. Any edit. */
  lastModifiedAt: string;
  /** ISO — the client opened it (production `last_viewed`). Unset = never. */
  lastViewedAt?: string;
}

/** An invoice label — production `InvoiceLabel`, SEPARATE from job and estimate labels. */
export interface InvoiceLabel {
  id: string;
  name: string;
}

/**
 * ONE status level, the DS badge's own keys (BadgeCreditNoteStatus) — the
 * estimates/invoices decision applied to credit notes when their list arrived
 * (2026-09-14). Production stores three (invoices/choices.py
 * `CreditNoteStatus`: Pending / Issued / Voided) and splits Pending into
 * Draft/Unsent by `is_draft` (`get_status_display`); the demo stores the
 * display status directly. Nothing here is clock-derived — a credit note has
 * no due date, so there is no Overdue/Expired twin.
 */
export type CreditNoteStatus = "draft" | "unsent" | "issued" | "voided";

/**
 * Production `CreditNoteType` (invoices/choices.py): Pre-Payment /
 * Post-Payment / Mixed. Production COMPUTES it when the credit note is ISSUED
 * (CreditNoteViewSet.issue): fully allocated to its invoice = pre_payment,
 * nothing allocated = post_payment, part = mixed; no invoice = post_payment.
 * So a draft or unsent credit note has NO type yet — keep that rule when
 * adding rows.
 */
export type CreditNoteType = "prePayment" | "postPayment" | "mixed";

/** A credit note label — production `CreditNoteLabel`, its own table again. */
export interface CreditNoteLabel {
  id: string;
  name: string;
}

/**
 * Production `CreditNote` (invoices/models.py), trimmed to what the list
 * shows. Unlike an invoice it belongs to a CLIENT directly
 * (`external_client`), not to a location — and its invoice link is optional.
 */
export interface CreditNote {
  id: string;
  /** The client the credit belongs to — production `external_client`. */
  clientId: string;
  /** Set when the credit note is written against an invoice. */
  invoiceId?: string;
  /** The status the badge shows. */
  status: CreditNoteStatus;
  /** Unset until the credit note is ISSUED — see `CreditNoteType`. */
  type?: CreditNoteType;
  /** CREDIT_NOTE_LABELS ids (production `CreditNoteLabel`). */
  labelIds: string[];
  /** Why the credit was given — production `reason` (blank allowed there too). */
  reason?: string;
  /** Dollars — production's trigger-maintained `total`. */
  total: number;
  /** ISO. Production `date_issued`. */
  issuedAt: string;
  /** ISO. Any edit. */
  lastModifiedAt: string;
}

/**
 * A VENDOR — the supplier side (production `Vendor`, pricebook/models.py):
 * who the service company BUYS from, and who bills it. A different world
 * from the clients. First trimmed to the name and (for the POs list) the
 * payment terms; EXTENDED 2026-09-15 for the Vendors list itself with
 * production's own list fields — account id, billing address, labels,
 * website, the bills-via link and the last-modified stamp. Still trimmed:
 * production also carries contacts, notes, deactivation messages and
 * accounting sync, none of which are list columns here.
 *
 * The three NUMBER columns (Current POs, Commitments, Payables) are NOT
 * fields: production annotates them onto the queryset from the PO and Bill
 * tables, and the demo derives them the same way (see the Filters
 * prototype's vendorsData).
 */
export interface Vendor {
  id: string;
  name: string;
  /** Deactivated vendors stay in the data (production `is_active`). */
  isActive: boolean;
  /**
   * NET DAYS — production `payment_terms`, a nullable free integer on the
   * VENDOR (no choices, no validators): 0 = "Same Day", n = "Net n", null =
   * no terms. It is NOT copied onto a purchase order — production's PO list
   * reads `instance.vendor.payment_terms` live, so changing a vendor's terms
   * retroactively changes what every one of its POs shows. The POs list's
   * "Payment terms" column and filter read it the same way.
   */
  paymentTerms: number | null;
  /** The company's account number WITH the vendor (production `account_id`,
   *  max 30 chars, blank-able there). */
  accountId?: string;
  /**
   * The vendor's billing address parts (production `billing_address_*`, each
   * blank-able). The list's column shows them as one string — production's
   * generated `billing_address_formatted` — and the Billing address filter
   * matches them field against field. All unset = no address on file.
   */
  /**
   * The addressee line (production `billing_address_recipient`) — a person
   * or a department the mail is addressed to. When set, the column prints it
   * IN FRONT of the address, joined with the shared text separator (Daniel,
   * 2026-09-15). Not one of the filter's five fields.
   */
  billingRecipient?: string;
  billingStreet?: string;
  /** "Suite, unit, etc." — the filter's own second field. */
  billingUnit?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  /** VENDOR_LABELS ids (production `VendorLabel`, its own table again). */
  labelIds: string[];
  /**
   * "Bills via" — production `default_billing_vendor`, a nullable SELF-link:
   * the vendor the bills arrive FROM when buying from this one ("Default
   * vendor to bill through for purchases from this vendor"; it pre-fills the
   * PO's billing vendor). Unset = bills come from the vendor itself — the
   * legacy UI's "Same as vendor", and the filter's leading "Same vendor"
   * row. A vendor cannot be its own (production validates that).
   */
  billsViaId?: string;
  /** Production `website`, blank-able (a scheme-less URL is allowed there). */
  website?: string;
  /** ISO. When the record was added (production `created_at`). Added
   *  2026-09-15 for the Created at filter (Daniel: "we do need 'Created at'
   *  on 'Vendors' and 'Clients'"). */
  createdAt: string;
  /** ISO. Any edit (production `last_modified_at`). */
  lastModifiedAt: string;
}

/** A vendor label — production `VendorLabel`, its own table again. */
export interface VendorLabel {
  id: string;
  name: string;
}

/** A bill label — production `BillLabel`, its own table again. */
export interface BillLabel {
  id: string;
  name: string;
}

/**
 * ONE status level for bills — the estimates/invoices decision applied when
 * their list arrived (2026-09-15). Production stores four (bills/choices.py
 * `BillStatus`: Pending / Received / Paid / Voided) and derives six display
 * labels from them — Pending splits into Draft/Unsent by `is_draft`,
 * Received into Outstanding/Overdue by the annotated `is_overdue`. The demo
 * drops UNSENT on Daniel's call (2026-09-15: production is wrong — a bill
 * cannot be sent, so it cannot be unsent) and stores the display status
 * directly — minus OVERDUE, which stays derived from `dueAt` like the
 * invoices', because it depends on the clock.
 */
export type BillStatus = "draft" | "outstanding" | "paid" | "voided";

/**
 * Production `Bill` (bills/models.py) — ACCOUNTS PAYABLE: a bill a VENDOR
 * sends the service company, so it hangs off a vendor, not a client or a
 * location. Trimmed to what the list shows: production also carries an
 * optional `purchasing_vendor`, a purchase-order link, billing/shipping
 * addresses and `last_viewed`, none of which are list properties (Daniel,
 * 2026-09-15: filters only for the existing columns, and a bill that cannot
 * be sent cannot be "seen" either).
 */
export interface Bill {
  id: string;
  /** The vendor billing us — production `vendor` ("Billing Vendor"). */
  vendorId: string;
  /**
   * The VENDOR'S OWN invoice number for this bill — production
   * `vendor_invoice_id` ("Billing Vendor Invoice ID"), required there.
   */
  vendorInvoiceId: string;
  /** The status the badge shows. OVERDUE is derived from `dueAt`, not stored. */
  status: BillStatus;
  /** BILL_LABELS ids (production `BillLabel`). */
  labelIds: string[];
  /**
   * Dollars — the list's "Total" column. Production stores it as `subtotal`,
   * its ONLY amount field: a bill carries no tax and no partial payments
   * (`mark_as_paid` settles it in full), so there is no Amount due twin.
   */
  total: number;
  /**
   * ISO date. Production `date_received` — the date the USER ENTERS for when
   * the bill arrived. NOT production's `last_received_at` transition
   * timestamp: the production table's "Received" / "Paid" / "Voided" columns
   * are all status-transition data (Daniel, 2026-09-15: "all those relate to
   * the Status changed concept"), and the actual received date is not listed
   * there at all. The design's "Received" column and filter read THIS field.
   */
  receivedAt: string;
  /** ISO date. Production `date_issued` — on or before `dueAt` (a DB constraint there). */
  issuedAt: string;
  /** ISO date. Production `date_due`. */
  dueAt: string;
  /**
   * ISO. The jobs' rule: null until the status really changes. A draft is
   * "not created yet" and leaving Draft is not a change — and with Unsent
   * gone a bill is BORN outstanding — so draft AND outstanding rows are
   * always null; Paid and Voided always carry one (mark-as-paid and void are
   * real transitions). Outstanding → Overdue is the clock and writes
   * nothing. Consequence, flagged to Daniel 2026-09-15: on bills the Status
   * changed column has values only in the closed phase.
   */
  statusChangedAt: string | null;
  /** ISO. Any edit. */
  lastModifiedAt: string;
}

/** A purchase-order label — production `PurchaseOrderLabel`, its own table again. */
export interface POLabel {
  id: string;
  name: string;
}

/**
 * One PRESET shipping carrier or method — production's fixed
 * `ShippingCarriers` / `ShippingMethods` choice lists (core/models.py).
 * "Other" is NOT a row: it is the mechanism behind the user's custom
 * values, which live on the purchase order itself
 * (`shippingCarrierOtherName` / `shippingMethodOtherName`).
 */
export interface ShippingOption {
  id: string;
  name: string;
}

/**
 * ONE status level for purchase orders — the standing badge-status decision
 * applied when the POs list arrived (2026-09-15). Production stores eight
 * (purchase_orders/models.py `Statuses`: pending / sent / acknowledged /
 * in_transit / delivered / stocked / paid / cancelled) and RELABELS four for
 * display (`get_status_display`): pending splits into Draft/Unsent by
 * `is_draft`, delivered shows as "Unstocked" and stocked as "Unpaid" — the
 * badge names the work still to do, not the step done. The demo stores the
 * nine display statuses directly (BadgePOStatus's set); NOTHING is
 * clock-derived — a PO has no due date, so there is no Overdue twin.
 * Production's coarser State ("Open" = sent + acknowledged) never entered
 * the schema — the standing estimates decision.
 */
export type POStatus =
  | "draft"
  | "unsent"
  | "sent"
  | "acknowledged"
  | "inTransit"
  | "unstocked"
  | "unpaid"
  | "paid"
  | "cancelled";

/**
 * Production `PurchaseOrder` (purchase_orders/models.py) — what the company
 * ORDERS from a vendor: parts and materials, bought either for jobs or to
 * restock inventory. Hangs off a VENDOR (production `vendor`, verbose name
 * "Purchasing Vendor"), like a bill. Trimmed to what the list shows:
 * production also carries a billing vendor, an inventory location (the
 * ship-to), a source-estimate FK, line items (the PO's rows — `itemCount`
 * and `amount` are their rollups here), comments and attachments.
 */
export interface PurchaseOrder {
  id: string;
  /** The supplier the order goes to — production `vendor` ("Purchasing Vendor"). */
  vendorId: string;
  /** The status the badge shows — see `POStatus`. Nothing is derived. */
  status: POStatus;
  /** PO_LABELS ids (production `PurchaseOrderLabel`). */
  labelIds: string[];
  /**
   * How many line items the order carries — production's `item_count`
   * annotation (`Count("line_items")`). STORED here (the demo has no line-item
   * table); 0 is a real value — a just-created draft has no items yet.
   */
  itemCount: number;
  /**
   * Dollars — the list's "Amount" column. Production stores it as `subtotal`,
   * a DB-trigger rollup of the line items (quantity × expected cost); a PO's
   * only money field — no tax, no total twin.
   */
  amount: number;
  /**
   * The shipping CARRIER — a SHIPPING_CARRIERS id, or "other" with the
   * user's own name in `shippingCarrierOtherName` (production's
   * `shipping_carrier` + `shipping_carrier_other_name` pair). Null = not
   * set — the Shipping carrier filter's "No carrier" row. SPLIT from the
   * single combined `shipping` string on 2026-09-15 (Daniel: carrier and
   * method are separate filters; the "Other + custom name" mechanism is why
   * a plain string could not carry it). Production stores the pair TWICE
   * (`preferred_*` = requested, bare = what the vendor actually used) and
   * shows one combined string per view; the demo keeps ONE pair under the
   * one column name "Shipping" (Daniel's earlier ruling, unchanged).
   */
  shippingCarrierId: string | null;
  /** The custom carrier name when `shippingCarrierId` is "other". */
  shippingCarrierOtherName?: string;
  /**
   * The shipping METHOD — a SHIPPING_METHODS id, or "other" with
   * `shippingMethodOtherName` (production's `shipping_method` +
   * `shipping_method_other_name`). Null = not set — the Shipping method
   * filter's "No method" row. Carrier and method are independent: either
   * can be set without the other.
   */
  shippingMethodId: string | null;
  /** The custom method name when `shippingMethodId` is "other". */
  shippingMethodOtherName?: string;
  /** Production `tracking_number` — free text, set when the vendor ships. */
  trackingNumber: string | null;
  /**
   * ISO date — production `estimated_arrival_time`. The list's "Est. arrival"
   * column turns red while the PO is IN TRANSIT and this date is in the past
   * (production's `isDangerous` rule).
   */
  estimatedArrivalAt: string | null;
  /** ISO date. Production `date_issued`, required — the lists' default sort. */
  issuedAt: string;
  /**
   * Deduplicated ids of the estimates / jobs / invoices the order's LINE
   * ITEMS are linked to — production's `associated_estimates` /
   * `associated_jobs` / `associated_invoices` serializer fields. The link
   * lives on line items there (M2M per line), so one PO can point at many of
   * each; the demo stores the union the columns show. Empty = not linked —
   * the Associated filters' "None" option.
   */
  associatedEstimateIds: string[];
  associatedJobIds: string[];
  associatedInvoiceIds: string[];
  /**
   * ISO. The jobs' rule: null until the status really changes. A PO is born
   * pending (Draft or Unsent — production's `is_draft` flag), and leaving
   * Draft is not a change, so both are always null; everything from Sent on
   * carries one — send, acknowledge, mark-shipped, deliver, stock, pay and
   * cancel are all real transitions (production's `last_*_at` timestamps,
   * which its table shows as seven per-status date columns — collapsed into
   * the ONE generic Status changed here, Daniel's bills ruling applied).
   */
  statusChangedAt: string | null;
  /** ISO. Any edit. */
  lastModifiedAt: string;
  /** ISO — the vendor opened it (production `last_viewed`). Unset = never. */
  lastViewedAt?: string;
}

export interface Invoice {
  id: string;
  locationId: string;
  /** Set when the invoice bills a job. */
  jobId?: string;
  /**
   * The pricebook service behind the invoice (a SERVICES id) — the Estimate's
   * own pattern. Unset when the invoice is not for a pricebook service.
   */
  serviceId?: string;
  /** The invoice's OWN service name — production `service_name` (required there). */
  serviceName: string;
  /** The status the badge shows. OVERDUE is derived from `dueAt`, not stored. */
  status: InvoiceStatus;
  /** INVOICE_LABELS ids (production `InvoiceLabel`). */
  labelIds: string[];
  /** Dollars — production's trigger-maintained `total`. */
  total: number;
  /**
   * Dollars already paid — production's `amount_paid`, the sum of the
   * invoice's payments (partial payments and estimate deposits copied over
   * included). The list's "Amount due" is `total - amountPaid`; production
   * stores `amount_due` too and also subtracts credit-note allocations, which
   * the demo does not model.
   */
  amountPaid: number;
  /** ISO. Production `date_issued`. */
  issuedAt: string;
  /**
   * ISO. Production `date_due` — where the payment terms end ("Net 30" =
   * issued + 30 days). Equal to `issuedAt` when due on receipt. (This
   * REPLACED `netDays`, 2026-09-14 — the list's Due date column and the
   * derived Overdue both read the date itself, production's own shape.)
   */
  dueAt: string;
  /**
   * ISO. Production `last_status_transition_time` — null until the status
   * really changes, the estimates' rule: a draft and an unsent invoice are
   * both sitting in their FIRST status (production's `pending`, where
   * `is_draft` is a flag, not a status), so neither has one. Everything from
   * "outstanding" on does — sending is a real transition. Outstanding →
   * Overdue is the clock, not an action, and writes nothing.
   */
  statusChangedAt: string | null;
  /** ISO. Any edit. */
  lastModifiedAt: string;
  /** ISO — the client opened it (production `last_viewed`). Unset = never. */
  lastViewedAt?: string;
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

/**
 * A pricebook item's status while it is ACTIVE — production's boolean
 * `confirmed`, worded per Daniel's 2026-09-16 decision ("the status will be
 * called 'Active'", the view tab stays "Confirmed"): "review" = an item the
 * SYSTEM created (production mints one, confirmed=False, whenever a free-text
 * description lands on a job/estimate/invoice/bill line item, or a part is
 * typed onto a purchase order) waiting to be vetted; "active" = confirmed.
 * The status applies to ACTIVE items only — a pricebook list's Inactive phase
 * is one bucket with no status shown, and the demo carries no "review +
 * inactive" rows (the UI cannot create one: a Review item offers only Confirm
 * or Delete).
 *
 * RENAMED from `LaborStatus` on 2026-09-16, when the Products list became the
 * second pricebook type to read it — production has ONE `PriceBookItem` model
 * and one `confirmed` flag across all five types.
 */
export type PricebookStatus = "review" | "active";

/**
 * A LABOR pricebook item — production `PriceBookItem` with
 * `pricebook_item_type = 1` (the "LABR" item-code type), the Labor list's
 * rows (added 2026-09-16). The 12 `Service` rows are the same records seen
 * from the job side — `LABOR_ITEMS` derives its first rows from `SERVICES`
 * by id, so a job's service and its labor item can never disagree — and this
 * table adds the pricebook fields the Service shape never carried.
 */
export interface LaborItem {
  id: string;
  /** Production `description` — the item's name, unique per company. */
  name: string;
  /** See `PricebookStatus`. Meaningful while `isActive`; an inactive item
   *  keeps its last value but no list or filter reads it. */
  status: PricebookStatus;
  /** The Active / Inactive phase (production `is_active`). */
  isActive: boolean;
  /** Production `subtype` (FK, nullable) — the revenue-category classification. */
  subtypeId: string | null;
  /** Production `summary_template` — the default line-item summary. "" = none. */
  summary: string;
  /** Production `cost` — the internal cost. Auto-created items default to 0. */
  cost: number;
  /** Production `default_price` — the billed rate. */
  rate: number;
  /** Production `default_unit_type` — REQUIRED for services there, so never
   *  null here (the design's Unit type filter has no absence row). */
  unitType: "hourly" | "flatRate";
  /** Production `default_is_taxable`. */
  taxable: boolean;
  /** Production `default_job_duration`, minutes. Null = none — the table's
   *  empty cell and the filter's "No est. duration" row. */
  estDurationMinutes: number | null;
  /** → LABOR_LABELS (production `PriceBookItemLabel`, company-written). */
  labelIds: string[];
  lastModifiedAt: string;
}

/**
 * A pricebook subtype — production `PriceBookItemSubtype`, company-written.
 * Production scopes each row to ONE `pricebook_item_type`, so the tables are
 * per type (`LABOR_SUBTYPES`, `PRODUCT_SUBTYPES`) while the shape is one.
 * RENAMED from `LaborSubtype` on 2026-09-16 with the Products list.
 */
export interface PricebookSubtype {
  id: string;
  name: string;
}

/**
 * A pricebook label (production `PriceBookItemLabel`) — a pricebook list's
 * tags. Per type like the subtypes (production's label picker filters by
 * `pricebook_item_type`): `LABOR_LABELS`, `PRODUCT_LABELS`. RENAMED from
 * `LaborLabel` on 2026-09-16.
 */
export interface PricebookLabel {
  id: string;
  name: string;
}

/**
 * How full a tracked product's stock is — production's `InventoryStatus`
 * (apps/inventory/choices.py), annotated per inventory location and rolled up
 * onto the item as `lowest_inventory_status`: the WORST status across the
 * locations that hold it, which is what the list's Stock column shows.
 *
 * Production derives each one from the location's quantity against its
 * desired level: `depleted` = nothing on hand, `low` / `limited` = the two
 * bands below the target, `full` = at or above it (and anything with no
 * desired level set counts full). Stored here, since the demo models no
 * per-location inventory rows.
 *
 * NULL on an untracked product — the Stock cell is then the "No value" dash
 * (Daniel, 2026-09-16, over production's "Untracked" word) and the Stock
 * filter's own "Not tracked" row is what asks for those.
 */
export type StockStatus = "full" | "limited" | "low" | "depleted";

/**
 * A PRODUCT — production `PriceBookItem` with `pricebook_item_type = 2` (the
 * "PART" item-code type, production's "Parts & Materials"; the design renames
 * the list "Products"). The Products list's rows, added 2026-09-16.
 *
 * It shares every pricebook field with `LaborItem` and swaps the three
 * service-only ones (rate-per-unit, unit type, default job duration) for the
 * part-only five: the manufacturer pair that identifies a physical part, and
 * the inventory trio.
 */
export interface ProductItem {
  id: string;
  /** Production `description` — the item's name, unique per company. */
  name: string;
  /** See `PricebookStatus`. Meaningful while `isActive`. */
  status: PricebookStatus;
  /** The Active / Inactive phase (production `is_active`). */
  isActive: boolean;
  /** Production `subtype` (FK, nullable) — the revenue-category classification. */
  subtypeId: string | null;
  /**
   * Production `summary_template` — the default line-item summary. "" = none.
   * NOT a column on this list (production's parts view drops it where its
   * services view keeps it), but the keyword search reads it, production's
   * `filter_keywords` does too, and the field is on the model.
   */
  summary: string;
  /** Production `cost` — what the company pays. Auto-created items default to 0. */
  cost: number;
  /** Production `default_price` — what the client is charged. The list's "Price". */
  price: number;
  /** Production `default_is_taxable`. */
  taxable: boolean;
  /** Production `manufacturer` — the brand. "" = none (a blank CharField there). */
  manufacturer: string;
  /** Production `part_number` — the MANUFACTURER's part number, not ours. "" = none. */
  partNumber: string;
  /**
   * Production `track_inventory` — whether the company counts this part in
   * stock. The Inventory filter's two values (Tracked · Not tracked), and
   * production's own form calls the pair "Part Type" (Inventory /
   * Non-Inventory). An untracked product has no stock and no levels.
   */
  trackInventory: boolean;
  /** See `StockStatus`. NULL exactly when `trackInventory` is false. */
  stock: StockStatus | null;
  /** Production `total_quantity` — units on hand across the locations. NULL when untracked. */
  quantity: number | null;
  /** Production `total_quantity_desired` — the target. NULL when untracked. */
  quantityDesired: number | null;
  /** → PRODUCT_LABELS (production `PriceBookItemLabel`, company-written). */
  labelIds: string[];
  lastModifiedAt: string;
}

/**
 * An "OTHER CHARGE" or a DISCOUNT — production `PriceBookItem` with
 * `pricebook_item_type = 3` or `4` (the "MISC" and "DISC" item-code types;
 * the design renames Miscellaneous to **Other**). ONE shape, because
 * production's own form offers the two the same fields, and the design's two
 * Filters menus are identical row for row.
 *
 * What the two DO differ in is the data, and the rules are production's:
 *   - a DISCOUNT's `price` is zero or NEGATIVE (the sign rule in
 *     pricebook/serializers.py — a discount takes money off the invoice), and
 *     the column heads it "Discount" there;
 *   - a DISCOUNT carries no `cost` and is never `taxable` — production's form
 *     offers neither, and its import rejects a taxable discount outright. The
 *     FIELDS still exist on the shared model, so they are here, held at their
 *     defaults (0 / false) exactly as production stores them.
 *
 * Added 2026-09-16 with the Other and Discounts lists.
 */
export interface ChargeItem {
  id: string;
  /** Production `description` — the item's name, unique per company. */
  name: string;
  /** See `PricebookStatus`. Meaningful while `isActive`. */
  status: PricebookStatus;
  /** The Active / Inactive phase (production `is_active`). */
  isActive: boolean;
  /** Production `subtype` (FK, nullable). Offered for both types. */
  subtypeId: string | null;
  /** Production `summary_template` — the default line-item summary. "" = none. */
  summary: string;
  /**
   * Production `cost`. Offered for OTHER charges only — every discount holds
   * its 0 default, because production's form does not offer the field.
   */
  cost: number;
  /**
   * Production `default_price`. Positive on an other charge; zero or NEGATIVE
   * on a discount (production's sign rule).
   */
  price: number;
  /**
   * Production `default_is_taxable`. Offered for OTHER charges only — always
   * false on a discount ("Discount items cannot be taxable").
   */
  taxable: boolean;
  /** → OTHER_LABELS / DISCOUNT_LABELS (production `PriceBookItemLabel`). */
  labelIds: string[];
  lastModifiedAt: string;
}

/**
 * A TAX RATE — production `PriceBookItem` with `pricebook_item_type = 5`
 * (type "Tax"), the Tax rates list's rows (added 2026-09-16).
 *
 * The leanest of the five pricebook types, and production is strict about it:
 * NO cost, NO taxability ("Tax items cannot be taxable") and NO subtype (the
 * form and the table both guard it out) — its one amount is `default_price`
 * held as a PERCENT, which production caps at 100 and renders "8.63%".
 *
 * The workspace's four rates are the SAME records the Clients list already
 * reads for its "Default tax rate" filter — `TAX_RATE_ITEMS` derives them
 * from `TAX_RATES` by id, the way LABOR_ITEMS derives the SERVICES rows, so a
 * rate can never disagree between the two places.
 */
export interface TaxRateItem {
  id: string;
  /** Production `description` — the rate's name ("SF sales tax"). */
  name: string;
  /** See `PricebookStatus`. Meaningful while `isActive`. */
  status: PricebookStatus;
  /** The Active / Inactive phase (production `is_active`). */
  isActive: boolean;
  /**
   * Production `default_price`, held as a PERCENT (8.63 = 8.63%). Production
   * validates it at 100 or below in three places; zero is a real rate ("Tax
   * exempt"), not an absence.
   */
  rate: number;
  /** Production `summary_template`. "" = none. */
  summary: string;
  /** → TAX_RATE_LABELS (production `PriceBookItemLabel`). */
  labelIds: string[];
  lastModifiedAt: string;
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
