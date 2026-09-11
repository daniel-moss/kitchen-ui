import { Fragment, ReactNode } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { users } from "../users";
import { joinWithSeparator } from "../../utils/textSeparator";
import {
  BRANCHES,
  CLIENT_CONTACTS,
  CLIENTS,
  COMPANY,
  EQUIPMENT,
  ESTIMATE_LABELS,
  ESTIMATES,
  INVOICES,
  JOB_FORMS,
  JOB_LABELS,
  JOB_SOURCES,
  JOBS,
  LOCATION_CONTACTS,
  LOCATIONS,
  SERVICES,
  WARRANTIES,
  clientContactsOf,
  equipmentOf,
  estimatesOf,
  invoicesOf,
  jobsOf,
  locationContactsOf,
  locationsOf,
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
            head={["ID", "Status", "Total", "Issued", "Terms", "Job"]}
            rows={invoices.map((invoice) => [
              invoice.id,
              invoice.status,
              money(invoice.total),
              invoice.issuedAt,
              invoice.netDays == null ? "Due on receipt" : `Net ${invoice.netDays}`,
              orDash(invoice.jobId),
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
    { name: "Estimates", rows: ESTIMATES },
    { name: "Invoices", rows: INVOICES },
    { name: "Services", rows: SERVICES },
    { name: "Job labels", rows: JOB_LABELS },
    { name: "Estimate labels", rows: ESTIMATE_LABELS },
    { name: "Job sources", rows: JOB_SOURCES },
    { name: "Branches", rows: BRANCHES },
    { name: "Job forms", rows: JOB_FORMS },
    { name: "Company settings", rows: [COMPANY] },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Demo database</h1>
      <p className={styles.intro}>
        One simulated service company shared by every prototype, shaped like the real app: clients own locations;
        locations own equipment (with warranties), jobs, estimates and invoices; clients and locations each have their
        own contacts, and a job can carry contacts of its own. This page renders directly from the data
        (src/data/db), so it always shows exactly what exists. Techs are the shared users pool.
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
              client.labels.length > 0 ? `Labels: ${client.labels.join(", ")}` : null,
              client.creditLimit != null ? `Credit limit ${money(client.creditLimit)}` : null,
            )}
          </p>
          {client.notes != null && <p className={styles.muted}>{client.notes}</p>}

          {clientContactsOf(client.id).length > 0 && (
            <>
              <p className={styles.blockLabel}>Client contacts</p>
              <Table head={["Name", "Position", "Details"]} rows={contactRows(clientContactsOf(client.id), client.primaryContactId)} />
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
