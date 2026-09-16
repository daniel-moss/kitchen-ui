import { Fragment, ReactNode } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { users } from "../users";
import { joinWithSeparator } from "../../utils/textSeparator";
import {
  BILL_LABELS,
  BILLS,
  BRANCHES,
  CLIENT_CONTACTS,
  CLIENT_LABELS,
  CLIENTS,
  TAX_RATES,
  COMPANY,
  CREDIT_NOTE_LABELS,
  CREDIT_NOTES,
  EQUIPMENT,
  ESTIMATE_LABELS,
  ESTIMATES,
  INVOICE_LABELS,
  INVOICES,
  JOB_FORMS,
  JOB_LABELS,
  JOB_SERIES,
  JOB_SUB_STATUSES,
  JOB_SOURCES,
  JOBS,
  LABOR_ITEMS,
  LABOR_LABELS,
  LABOR_SUBTYPES,
  PRODUCT_ITEMS,
  PRODUCT_LABELS,
  PRODUCT_SUBTYPES,
  OTHER_ITEMS,
  OTHER_LABELS,
  OTHER_SUBTYPES,
  DISCOUNT_ITEMS,
  DISCOUNT_LABELS,
  DISCOUNT_SUBTYPES,
  TAX_RATE_ITEMS,
  TAX_RATE_LABELS,
  LOCATION_CONTACTS,
  LOCATIONS,
  PO_LABELS,
  PURCHASE_ORDERS,
  SERVICES,
  VENDORS,
  WARRANTIES,
  billsOf,
  clientContactsOf,
  creditNotesOf,
  equipmentOf,
  estimatesOf,
  invoicesOf,
  jobSeriesOf,
  jobsOf,
  locationContactsOf,
  locationsOf,
  purchaseOrdersOf,
  shippingOf,
  warrantiesOf,
} from "./index";
import { ContactRecord, Job, Location } from "./types";

import styles from "./DatabaseBrowser.module.scss";

// Data → Database — the demo database, readable (Daniel, 2026-09-04: "if it
// exists in code only, it'll be hard to understand what we currently have").
// EVERYTHING on this page is rendered FROM the live records in db.ts — the
// schema lists are the records' own keys — so the page can never drift from
// the data. Change db.ts, and this page follows.

const USER_NAME = new Map(users.map((user) => [user.id, user.name]));

/** "—" for a field the record does not carry. */
const orDash = (value: ReactNode) => (value == null || value === "" ? <span className={styles.missing}>—</span> : value);

const money = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });

/** "418 Mission St, Suite 200, San Francisco, CA 94105" — the parts that exist. */
function addressOf(location: Location): string {
  const region = [location.state, location.postalCode].filter((part) => part != null).join(" ");
  return [location.street, location.unit, location.city, region === "" ? null : region]
    .filter((part) => part != null && part !== "")
    .join(", ");
}

/** Every property name across a table's records, with how many records carry it. */
function schemaOf(rows: object[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (value == null) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([key, count]) => (count === rows.length ? key : `${key} (${count} of ${rows.length})`))
    .join(", ");
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {head.map((label) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, rowIndex) => (
            <tr key={rowIndex}>
              {cells.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const contactRows = (contacts: ContactRecord[], primaryId?: string) =>
  contacts.map((contact) => [
    <Fragment key="name">
      {orDash(contact.name)}
      {contact.id === primaryId ? <span className={styles.muted}> (primary)</span> : null}
    </Fragment>,
    orDash(contact.position),
    orDash(joinWithSeparator(contact.phone && `${contact.phone}${contact.phoneExtension ? ` ext. ${contact.phoneExtension}` : ""}`, contact.email)),
  ]);

const jobContactText = (contact: Job["reporter"]) =>
  contact == null
    ? null
    : `${joinWithSeparator(contact.name, contact.phone, contact.email)}${contact.isEphemeral ? " (ephemeral)" : ""}`;

function LocationBlock({ location }: { location: Location }) {
  const contacts = locationContactsOf(location.id);
  const equipment = equipmentOf(location.id);
  const jobs = jobsOf(location.id);
  const series = jobSeriesOf(location.id);
  const estimates = estimatesOf(location.id);
  const invoices = invoicesOf(location.id);
  const address = addressOf(location);

  return (
    <div className={styles.locationBlock}>
      <p className={styles.locationName}>
        {location.name ?? <span className={styles.missing}>No name</span>}{" "}
        <span className={styles.muted}>{address === "" ? "— no address" : `— ${address}`}</span>{" "}
        <span className={styles.clientId}>{location.id}</span>
      </p>
      {location.notes != null && <p className={styles.muted}>{location.notes}</p>}

      {contacts.length > 0 && (
        <>
          <p className={styles.blockLabel}>Location contacts</p>
          <Table head={["Name", "Position", "Details"]} rows={contactRows(contacts, location.primaryContactId)} />
        </>
      )}

      {equipment.length > 0 && (
        <>
          <p className={styles.blockLabel}>Equipment</p>
          <Table
            head={["Name", "Category", "Manufacturer", "Model / Serial", "Ownership", "Installed", "Warranties"]}
            rows={equipment.map((piece) => [
              piece.displayName,
              piece.category,
              orDash(piece.manufacturer),
              orDash(joinWithSeparator(piece.modelNumber, piece.serialNumber)),
              piece.ownership,
              orDash(piece.installationDate),
              warrantiesOf(piece.id).length === 0 ? (
                <span className={styles.missing}>none</span>
              ) : (
                warrantiesOf(piece.id).map((warranty) => (
                  <div key={warranty.id}>
                    {warranty.name} <span className={styles.muted}>{warranty.startDate} → {warranty.endDate ?? "no expiry"}</span>
                  </div>
                ))
              ),
            ])}
          />
        </>
      )}

      {jobs.length > 0 && (
        <>
          <p className={styles.blockLabel}>Jobs</p>
          <Table
            head={["ID", "Service", "Status", "Scheduled for", "Assignees", "Equipment", "Own contacts"]}
            rows={jobs.map((job) => [
              job.id,
              job.serviceName,
              job.status,
              orDash(job.scheduledFor),
              orDash(job.assigneeIds.map((id) => USER_NAME.get(id) ?? id).join(", ")),
              orDash(job.equipmentIds.join(", ")),
              orDash(
                [job.reporter && `Reporter: ${jobContactText(job.reporter)}`, job.pointOfContact && `POC: ${jobContactText(job.pointOfContact)}`]
                  .filter(Boolean)
                  .map((line) => <div key={line as string}>{line}</div>),
              ),
            ])}
          />
        </>
      )}

      {estimates.length > 0 && (
        <>
          <p className={styles.blockLabel}>Estimates</p>
          <Table
            head={["ID", "Service", "Status", "Total", "Issued", "Job"]}
            rows={estimates.map((estimate) => [
              estimate.id,
              estimate.serviceName,
              estimate.status,
              money(estimate.total),
              estimate.issuedAt,
              orDash(estimate.jobId),
            ])}
          />
        </>
      )}

      {invoices.length > 0 && (
        <>
          <p className={styles.blockLabel}>Invoices</p>
          <Table
            head={["ID", "Service", "Status", "Total", "Issued", "Due", "Job"]}
            rows={invoices.map((invoice) => [
              invoice.id,
              invoice.serviceName,
              invoice.status,
              money(invoice.total),
              invoice.issuedAt,
              invoice.dueAt,
              orDash(invoice.jobId),
            ])}
          />
        </>
      )}

      {series.length > 0 && (
        <>
          <p className={styles.blockLabel}>Job series</p>
          <Table
            head={["ID", "Service", "Type", "Frequency", "Start", "End", "Open jobs"]}
            rows={series.map((row) => [
              row.id,
              row.serviceName,
              row.type,
              row.recurrenceFrequency,
              row.recurrenceStart,
              orDash(row.recurrenceEnd),
              row.openJobsCount,
            ])}
          />
        </>
      )}
    </div>
  );
}

function DatabasePage() {
  const tables: { name: string; rows: object[] }[] = [
    { name: "Clients", rows: CLIENTS },
    { name: "Client contacts", rows: CLIENT_CONTACTS },
    { name: "Locations", rows: LOCATIONS },
    { name: "Location contacts", rows: LOCATION_CONTACTS },
    { name: "Equipment", rows: EQUIPMENT },
    { name: "Warranties", rows: WARRANTIES },
    { name: "Jobs", rows: JOBS },
    { name: "Job series", rows: JOB_SERIES },
    { name: "Estimates", rows: ESTIMATES },
    { name: "Invoices", rows: INVOICES },
    { name: "Credit notes", rows: CREDIT_NOTES },
    { name: "Vendors", rows: VENDORS },
    { name: "Purchase orders", rows: PURCHASE_ORDERS },
    { name: "Bills", rows: BILLS },
    { name: "Services", rows: SERVICES },
    { name: "Labor items", rows: LABOR_ITEMS },
    { name: "Labor subtypes", rows: LABOR_SUBTYPES },
    { name: "Labor labels", rows: LABOR_LABELS },
    { name: "Products", rows: PRODUCT_ITEMS },
    { name: "Product subtypes", rows: PRODUCT_SUBTYPES },
    { name: "Product labels", rows: PRODUCT_LABELS },
    { name: "Other charges", rows: OTHER_ITEMS },
    { name: "Other subtypes", rows: OTHER_SUBTYPES },
    { name: "Other labels", rows: OTHER_LABELS },
    { name: "Discounts", rows: DISCOUNT_ITEMS },
    { name: "Discount subtypes", rows: DISCOUNT_SUBTYPES },
    { name: "Discount labels", rows: DISCOUNT_LABELS },
    { name: "Tax rate items", rows: TAX_RATE_ITEMS },
    { name: "Tax rate labels", rows: TAX_RATE_LABELS },
    { name: "Job labels", rows: JOB_LABELS },
    { name: "Job sub-statuses", rows: JOB_SUB_STATUSES },
    { name: "Estimate labels", rows: ESTIMATE_LABELS },
    { name: "Invoice labels", rows: INVOICE_LABELS },
    { name: "Credit note labels", rows: CREDIT_NOTE_LABELS },
    { name: "PO labels", rows: PO_LABELS },
    { name: "Bill labels", rows: BILL_LABELS },
    { name: "Job sources", rows: JOB_SOURCES },
    { name: "Branches", rows: BRANCHES },
    { name: "Job forms", rows: JOB_FORMS },
    { name: "Company settings", rows: [COMPANY] },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Demo database</h1>
      <p className={styles.intro}>
        One simulated service company shared by every prototype, shaped like the real app: clients own locations and
        credit notes; locations own equipment (with warranties), jobs, estimates and invoices; clients and locations
        each have their own contacts, and a job can carry contacts of its own. Vendors are the supplier side — the
        purchase orders the company sends them and the bills they send back (accounts payable) both hang off them,
        outside the client hierarchy. This page renders
        directly from the data (src/data/db), so it always shows exactly what exists. Techs are the shared users pool.
      </p>

      <h2 className={styles.sectionTitle}>Tables and properties</h2>
      <Table
        head={["Table", "Records", "Properties (how many records carry each)"]}
        rows={tables.map((table) => [
          table.name,
          table.rows.length,
          <span key="props" className={styles.schemaProps}>{schemaOf(table.rows)}</span>,
        ])}
      />

      <h2 className={styles.sectionTitle}>The pricebook (labor)</h2>
      {/* The labor catalog — production PriceBookItem, type service. The 12
          SERVICES rows are the same records seen from the job side (same
          ids); the review rows are what the system mints from free-text line
          items. Added 2026-09-16 for the Labor list. */}
      <section className={styles.clientCard}>
        <Table
          head={["ID", "Name", "Phase", "Status", "Subtype", "Cost", "Rate", "Unit", "Est. duration", "Labels"]}
          rows={LABOR_ITEMS.map((item) => [
            item.id,
            item.name,
            item.isActive ? "active" : "inactive",
            item.isActive ? item.status : "—",
            orDash(LABOR_SUBTYPES.find((subtype) => subtype.id === item.subtypeId)?.name ?? null),
            money(item.cost),
            money(item.rate),
            item.unitType === "hourly" ? "hourly" : "flat rate",
            orDash(item.estDurationMinutes == null ? null : `${item.estDurationMinutes} min`),
            orDash(
              item.labelIds
                .map((id) => LABOR_LABELS.find((label) => label.id === id)?.name)
                .filter(Boolean)
                .join(", ") || null,
            ),
          ])}
        />
      </section>

      <h2 className={styles.sectionTitle}>The pricebook (products)</h2>
      {/* The parts catalog — production PriceBookItem, the part type. Tracked
          rows carry a stock status and levels; the review rows are what the
          system mints from free-text line items and from parts typed onto a
          purchase order (those arrive with a cost). Added 2026-09-16 for the
          Products list. */}
      <section className={styles.clientCard}>
        <Table
          head={["ID", "Name", "Phase", "Status", "Subtype", "Cost", "Price", "MFG", "MFG part #", "Inventory", "Stock", "Levels", "Labels"]}
          rows={PRODUCT_ITEMS.map((item) => [
            item.id,
            item.name,
            item.isActive ? "active" : "inactive",
            item.isActive ? item.status : "—",
            orDash(PRODUCT_SUBTYPES.find((subtype) => subtype.id === item.subtypeId)?.name ?? null),
            money(item.cost),
            money(item.price),
            orDash(item.manufacturer === "" ? null : item.manufacturer),
            orDash(item.partNumber === "" ? null : item.partNumber),
            item.trackInventory ? "tracked" : "not tracked",
            orDash(item.stock),
            orDash(item.trackInventory ? `${item.quantity}/${item.quantityDesired}` : null),
            orDash(
              item.labelIds
                .map((id) => PRODUCT_LABELS.find((label) => label.id === id)?.name)
                .filter(Boolean)
                .join(", ") || null,
            ),
          ])}
        />
      </section>

      <h2 className={styles.sectionTitle}>The pricebook (other charges, discounts, tax rates)</h2>
      {/* The remaining three pricebook types, added 2026-09-16 with their
          lists. Other and Discounts are ONE production shape — a discount
          simply carries no cost, is never taxable and holds a negative
          price. A tax rate is the leanest of the five: no cost, no
          taxability, no subtype, and its amount is a percent. */}
      <section className={styles.clientCard}>
        <h3 className={styles.clientName}>Other charges</h3>
        <Table
          head={["ID", "Name", "Phase", "Status", "Subtype", "Cost", "Price", "Taxable", "Labels"]}
          rows={OTHER_ITEMS.map((item) => [
            item.id,
            item.name,
            item.isActive ? "active" : "inactive",
            item.isActive ? item.status : "—",
            orDash(OTHER_SUBTYPES.find((subtype) => subtype.id === item.subtypeId)?.name ?? null),
            money(item.cost),
            money(item.price),
            item.taxable ? "yes" : "no",
            orDash(
              item.labelIds
                .map((id) => OTHER_LABELS.find((label) => label.id === id)?.name)
                .filter(Boolean)
                .join(", ") || null,
            ),
          ])}
        />
      </section>
      <section className={styles.clientCard}>
        <h3 className={styles.clientName}>Discounts</h3>
        <Table
          head={["ID", "Name", "Phase", "Status", "Subtype", "Price", "Labels"]}
          rows={DISCOUNT_ITEMS.map((item) => [
            item.id,
            item.name,
            item.isActive ? "active" : "inactive",
            item.isActive ? item.status : "—",
            orDash(DISCOUNT_SUBTYPES.find((subtype) => subtype.id === item.subtypeId)?.name ?? null),
            money(item.price),
            orDash(
              item.labelIds
                .map((id) => DISCOUNT_LABELS.find((label) => label.id === id)?.name)
                .filter(Boolean)
                .join(", ") || null,
            ),
          ])}
        />
      </section>
      <section className={styles.clientCard}>
        <h3 className={styles.clientName}>Tax rates</h3>
        <Table
          head={["ID", "Name", "Phase", "Status", "Rate", "Labels"]}
          rows={TAX_RATE_ITEMS.map((item) => [
            item.id,
            item.name,
            item.isActive ? "active" : "inactive",
            item.isActive ? item.status : "—",
            `${item.rate}%`,
            orDash(
              item.labelIds
                .map((id) => TAX_RATE_LABELS.find((label) => label.id === id)?.name)
                .filter(Boolean)
                .join(", ") || null,
            ),
          ])}
        />
      </section>

      <h2 className={styles.sectionTitle}>The vendor side (accounts payable)</h2>
      {/* Bills hang off VENDORS — the suppliers billing the company — not off
          the client hierarchy below. Added 2026-09-15 for the Bills list. */}
      {VENDORS.map((vendor) => (
        <section key={vendor.id} className={styles.clientCard}>
          <h3 className={styles.clientName}>
            <span className={vendor.isActive ? undefined : styles.inactive}>{vendor.name}</span>
            {!vendor.isActive && <span className={styles.muted}>(deactivated)</span>}
            <span className={styles.clientId}>{vendor.id}</span>
          </h3>
          {vendor.paymentTerms != null && (
            <p className={styles.muted}>
              Payment terms: {vendor.paymentTerms === 0 ? "Same Day" : `Net ${vendor.paymentTerms}`}
            </p>
          )}
          {purchaseOrdersOf(vendor.id).length > 0 && (
            <>
              <p className={styles.blockLabel}>Purchase orders</p>
              <Table
                head={["ID", "Status", "Items", "Amount", "Shipping", "Issued", "Associated"]}
                rows={purchaseOrdersOf(vendor.id).map((po) => [
                  po.id,
                  po.status,
                  po.itemCount,
                  money(po.amount),
                  orDash(shippingOf(po)),
                  po.issuedAt,
                  orDash(
                    [...po.associatedJobIds, ...po.associatedEstimateIds, ...po.associatedInvoiceIds].join(", ") ||
                      null,
                  ),
                ])}
              />
            </>
          )}
          {billsOf(vendor.id).length > 0 && (
            <>
              <p className={styles.blockLabel}>Bills</p>
              <Table
                head={["ID", "Vendor invoice ID", "Status", "Total", "Received", "Issued", "Due"]}
                rows={billsOf(vendor.id).map((bill) => [
                  bill.id,
                  bill.vendorInvoiceId,
                  bill.status,
                  money(bill.total),
                  bill.receivedAt,
                  bill.issuedAt,
                  bill.dueAt,
                ])}
              />
            </>
          )}
        </section>
      ))}

      <h2 className={styles.sectionTitle}>The world, client by client</h2>
      {CLIENTS.map((client) => (
        <section key={client.id} className={styles.clientCard}>
          <h3 className={styles.clientName}>
            <span className={client.isActive ? undefined : styles.inactive}>{client.name}</span>
            {!client.isActive && <span className={styles.muted}>(deactivated)</span>}
            <span className={styles.clientId}>{client.id}</span>
          </h3>
          <p className={styles.muted}>
            {joinWithSeparator(
              client.clientType,
              client.industryType,
              client.labelIds.length > 0
                ? `Labels: ${client.labelIds.map((id) => CLIENT_LABELS.find((label) => label.id === id)?.name ?? id).join(", ")}`
                : null,
              client.creditLimit != null ? `Credit limit ${money(client.creditLimit)}` : null,
              client.creditBalance > 0 ? `Credit balance ${money(client.creditBalance)}` : null,
              client.defaultTaxRateId != null
                ? `Tax: ${TAX_RATES.find((rate) => rate.id === client.defaultTaxRateId)?.name ?? client.defaultTaxRateId}`
                : null,
            )}
          </p>
          {client.notes != null && <p className={styles.muted}>{client.notes}</p>}

          {clientContactsOf(client.id).length > 0 && (
            <>
              <p className={styles.blockLabel}>Client contacts</p>
              <Table head={["Name", "Position", "Details"]} rows={contactRows(clientContactsOf(client.id), client.primaryContactId)} />
            </>
          )}

          {/* Credit notes hang off the CLIENT directly (production
              `external_client`), not off a location — the one such table. */}
          {creditNotesOf(client.id).length > 0 && (
            <>
              <p className={styles.blockLabel}>Credit notes</p>
              <Table
                head={["ID", "Invoice", "Status", "Type", "Total", "Issued"]}
                rows={creditNotesOf(client.id).map((creditNote) => [
                  creditNote.id,
                  orDash(creditNote.invoiceId),
                  creditNote.status,
                  orDash(creditNote.type),
                  money(creditNote.total),
                  creditNote.issuedAt,
                ])}
              />
            </>
          )}

          {locationsOf(client.id).map((location) => (
            <LocationBlock key={location.id} location={location} />
          ))}
        </section>
      ))}
    </div>
  );
}

const meta: Meta = {
  title: "Data/Database",
  parameters: { layout: "fullscreen" },
};

export default meta;

/** The whole demo database, rendered live from src/data/db. */
export const Database: StoryObj = {
  render: () => <DatabasePage />,
};
