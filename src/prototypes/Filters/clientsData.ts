import {
  CLIENT_LABELS,
  CLIENTS as DB_CLIENTS,
  Client,
  INVOICES,
  LOCATIONS,
  TAX_RATES,
  TaxRate,
} from "../../data/db";
import { joinWithSeparator } from "../../utils/textSeparator";

import { LocationRecord, locationAddress } from "./listData";

// The Clients list's data door — a READER over the shared demo database, like
// the other eight (Daniel, 2026-09-11: "each row gets the data from the db").
// The clients live in src/data/db (fourteen rows, three deactivated); this
// module derives the display values and keeps the lookups.
//
// CLIENTS ARE THE CUSTOMER DIRECTORY — the second directory list after
// Vendors: no status, no phase machinery, nothing clock-derived. The two
// phases are the one `isActive` flag (production's own), and the page
// filters on it directly.
//
// THE MONEY TRIO:
//
//   CREDIT LIMIT — the client's own field (production `credit_limit`);
//   null = no limit configured, the filter's ABSENT row.
//
//   OUTSTANDING BALANCE — not a field anywhere: production computes it on
//   request (`/api/clients/{id}/balance`) as the sum of `amount_due` over the
//   client's invoices with status "sent" — the Outstanding + Overdue display
//   statuses — matched by who OWNS the location (billing intention ignored).
//   Derived here the same way, once at module load: stored status
//   "outstanding" (the derived Overdue is stored "outstanding" too), amount
//   due = total − amountPaid. NOTE this is NOT the db's `outstandingBalanceOf`
//   helper — that one includes draft + unsent (the New Job form's
//   credit-limit warning reads it); the LIST follows production's endpoint.
//
//   AVAILABLE INVOICE CREDIT — production's `credit_balance`, fed only by
//   credit notes (see the db type's note). STORED on the client, not derived.

/** The db row itself — the list renders it directly. */
export type ClientRow = Client;

/**
 * Every client in the database, sorted the view's own way — the production
 * "Clients" default, `name` ascending (on BOTH phases; the tabs' configs are
 * identical there).
 */
export const CLIENT_ROWS: ClientRow[] = [...DB_CLIENTS].sort((a, b) => a.name.localeCompare(b.name));

// ---- lookups ---------------------------------------------------------------

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((item) => [item.id, item]));

const CLIENT_BY_ID = byId(DB_CLIENTS);
const LABEL_BY_ID = byId(CLIENT_LABELS);
const TAX_RATE_BY_ID = byId(TAX_RATES);

export const labelsOf = (client: ClientRow) => client.labelIds.map((id) => LABEL_BY_ID.get(id)!);

/** The client's default tax rate, or null = no default configured. */
export const taxRateOf = (client: ClientRow): TaxRate | null =>
  client.defaultTaxRateId == null ? null : (TAX_RATE_BY_ID.get(client.defaultTaxRateId) ?? null);

// ---- locations -------------------------------------------------------------

const LOCATIONS_BY_CLIENT = new Map<string, LocationRecord[]>();
for (const location of LOCATIONS) {
  const list = LOCATIONS_BY_CLIENT.get(location.clientId) ?? [];
  list.push(location);
  LOCATIONS_BY_CLIENT.set(location.clientId, list);
}

/** The client's service locations — the count filter, the display column and
 *  the keyword search all read this one list. */
export const locationsOf = (client: ClientRow): LocationRecord[] => LOCATIONS_BY_CLIENT.get(client.id) ?? [];

/** How many service locations the client has — the Locations FILTER's number.
 *  Zero is real (a client can exist before its first location). */
export const locationsCountOf = (client: ClientRow): number => locationsOf(client).length;

/**
 * The Locations COLUMN's text — the production concept, on Daniel's copy
 * (2026-09-16: "The 'Locations' column should use production concept:
 * 'Location address' or 'N locations'"): one location prints its address
 * (production `first_location_address`; the tables' unit-less address, the
 * other lists' column rule), several print the count ("3 locations" —
 * production writes "3 Service Locations"; the short word is Daniel's), and
 * none prints nothing.
 */
export function locationsDisplayOf(client: ClientRow): string {
  const locations = LOCATIONS_BY_CLIENT.get(client.id) ?? [];
  if (locations.length === 0) return "";
  if (locations.length === 1) return locationAddress(locations[0]!);
  return `${locations.length} locations`;
}

// ---- the money trio --------------------------------------------------------

/** Dollars, or null = NO limit configured (the "No credit limit" row). */
export const creditLimitOf = (client: ClientRow): number | null => client.creditLimit ?? null;

/** Production `credit_balance` — see the module note. Zero renders EMPTY in
 *  the column (the legacy card prints "--" for it); the filter still sees 0. */
export const creditBalanceOf = (client: ClientRow): number => client.creditBalance;

const OUTSTANDING_TOTAL = new Map<string, number>();
{
  const clientOfLocation = new Map(LOCATIONS.map((location) => [location.id, location.clientId]));
  for (const invoice of INVOICES) {
    if (invoice.status !== "outstanding") continue;
    const clientId = clientOfLocation.get(invoice.locationId);
    if (clientId == null) continue;
    OUTSTANDING_TOTAL.set(clientId, (OUTSTANDING_TOTAL.get(clientId) ?? 0) + (invoice.total - invoice.amountPaid));
  }
}

/** The production endpoint's number — see the module note. Zero renders
 *  EMPTY in the column; the filter's "No balance" row is exactly zero. */
export const outstandingBalanceOf = (client: ClientRow): number => OUTSTANDING_TOTAL.get(client.id) ?? 0;

// (An OVER-LIMIT escalation — outstanding balance strictly greater than a
// configured credit limit, the rule production's deleted "Balance Due"
// column painted red and its job-create banner still words — is NOT built:
// no node draws it and Daniel has not asked. FLAGGED in the table registry;
// one comparison away if he wants it.)

// ---- billing routing ("Bills to") ------------------------------------------

/** The routing value the FILTER matches — production's default is
 *  SERVICE_LOCATION, so an unset field means "location". */
export const billingIntentionOf = (client: ClientRow) => client.defaultBillingIntention ?? "location";

/** The billing client, where the intention names one. */
export const billsToClientOf = (client: ClientRow): Client | null =>
  client.defaultBillingClientId == null ? null : (CLIENT_BY_ID.get(client.defaultBillingClientId) ?? null);

/**
 * The Bills to COLUMN's text — the filter's own words (Daniel's design;
 * production prints "This Client" / a BLANK cell / the client's name, and
 * the blank-for-a-real-value gap is the Bills-via lesson): "Same client",
 * "Location", or the billing client's name.
 */
export function billsToDisplayOf(client: ClientRow): string {
  const intention = billingIntentionOf(client);
  if (intention === "client") return "Same client";
  if (intention === "location") return "Location";
  return billsToClientOf(client)?.name ?? "";
}

// ---- the billing address ----------------------------------------------------

/**
 * The column's one-line string — the Vendors list's arrangement exactly
 * (production generates `billing_address_formatted` for clients too): state
 * and postal code join as ONE region part, the UNIT stays in, and the
 * optional RECIPIENT leads via the shared text separator. Empty for a client
 * with no billing address on file (Mission Taqueria — the New Job form's
 * "billing address is missing" issue).
 */
export function billingAddressOf(client: ClientRow): string {
  const region = [client.billingState, client.billingPostalCode].filter((part) => part != null).join(" ");
  const address = [client.billingStreet, client.billingUnit, client.billingCity, region === "" ? null : region]
    .filter((part) => part != null && part !== "")
    .join(", ");
  return joinWithSeparator(client.billingRecipient ?? null, address === "" ? null : address);
}

/** The same fields for the Billing address FILTER — matched field against
 *  field by the shared address kind (the Vendors twin). */
export const billingAddressParts = (client: ClientRow) => ({
  street: client.billingStreet ?? null,
  unit: client.billingUnit ?? null,
  city: client.billingCity ?? null,
  state: client.billingState ?? null,
  postalCode: client.billingPostalCode ?? null,
});

// ---- the three defaults' values in use --------------------------------------

/**
 * "30 days" / "1 day" — the estimate-expiration format the column and the
 * filter's options share (production stores bare days; the node's rows write
 * "N days").
 */
export function formatEstimateNet(days: number | null): string {
  if (days == null) return "";
  return days === 1 ? "1 day" : `${days} days`;
}

const ascending = (values: (number | undefined)[]) =>
  [...new Set(values.filter((value): value is number => value != null))].sort((a, b) => a - b);

/**
 * The distinct values IN USE, ascending — the two "Only the actual values
 * that exist on the list" filters' options (the Payment terms rule; the
 * Default estimate expiration section carries the same annotation). Every
 * client contributes — both phases, the Vendors arrangement.
 */
export const ESTIMATE_NETS_IN_USE: number[] = ascending(DB_CLIENTS.map((client) => client.defaultEstimateNet));
export const INVOICE_NETS_IN_USE: number[] = ascending(DB_CLIENTS.map((client) => client.defaultInvoiceNet));
