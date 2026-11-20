import { chargesOf, INVOICES, Invoice, Job, JOBS } from "../../data/db";
import { Charge } from "../../data/db/jobCharges";
import { HistoryRow, invoiceHistoryRow, jobHistoryRow } from "../EquipmentPanel/equipmentData";

// The pricebook "History" tab's rows — SHARED by every pricebook item (Figma
// "↳ Shared Tabs" → History 3091-28563; the Equipment panel's History module
// as it is, with jobs and invoices only). Where the item was billed:
//
//   1. Only jobs and invoices.
//   2. Only completed jobs without an invoice. When an invoice is created out
//      of that job, only the invoice is shown.
//   3. Every non-draft invoice.
//   4. Line items are LINKED to the pricebook item, so renaming it keeps the
//      history. (Production matches by the line item's NAME — flagged.)
//
// A job "uses" the item when one of its charge lines points at it (`uses`);
// an invoice inherits its job's charges — the demo keeps no line items of its
// own, so an invoice without a job never lists. Newest first.

/**
 * Where the rows come from. Default: the demo database as seeded. The demo
 * app passes its LIVE data instead (2026-11-20) — job statuses changed in this
 * session and the charge lines edited on Job Details.
 */
export interface HistorySources {
  jobs: Job[];
  /** Every charge line of a job, all types together. */
  linesOf: (job: Job) => Charge[];
  invoices: Invoice[];
}

export const SEED_HISTORY_SOURCES: HistorySources = {
  jobs: JOBS,
  linesOf: (job) => chargesOf(job).flatMap((group) => group.items),
  invoices: INVOICES,
};

export function pricebookHistoryRows(uses: (line: Charge) => boolean, sources: HistorySources = SEED_HISTORY_SOURCES): HistoryRow[] {
  const { jobs, linesOf, invoices } = sources;
  const usingJobs = new Set(jobs.filter((job) => linesOf(job).some(uses)).map((job) => job.id));
  // A job is REPLACED by its invoice once that invoice can show (no longer a
  // draft); a job whose invoice is still a draft stays listed (Daniel,
  // 2026-10-21 — production drops it as soon as any invoice exists).
  const invoiced = new Set(
    invoices.filter((invoice) => invoice.jobId != null && invoice.status !== "draft").map((invoice) => invoice.jobId!),
  );

  const rows: HistoryRow[] = [];
  for (const job of jobs) {
    if (!usingJobs.has(job.id) || invoiced.has(job.id)) continue;
    if (job.status !== "completed" && job.status !== "finalized") continue;
    const row = jobHistoryRow(job);
    if (row != null) rows.push(row);
  }
  for (const invoice of invoices) {
    if (invoice.status === "draft" || invoice.jobId == null || !usingJobs.has(invoice.jobId)) continue;
    rows.push(invoiceHistoryRow(invoice));
  }
  return rows.sort((a, b) => b.changedAt - a.changedAt);
}
