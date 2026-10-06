import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

import { TAX_RATE_LABELS } from "../../data/db";
import { users } from "../../data/users";
import { Job, JOBS as SEED_JOBS } from "../jobsData";
import { TAX_RATE_ROWS as SEED_TAX_RATES, TaxRateRow } from "../taxRatesData";

// THE APP'S WRITABLE LAYER — what a demo changes, and what every screen reads.
//
// It is ADDITIVE to `src/data/db`, never a replacement: the database stays the
// frozen set of `export const` arrays it has always been (the Filters
// prototype imports it in 31 places and is under live user testing — see
// MODULES.md). This store seeds itself FROM those arrays and keeps the edits
// on top as patches.
//
// IN MEMORY, not localStorage — deliberately (Daniel, 2026-09-26). Every demo
// starts from the same clean database, so nobody inherits the previous
// session's mess. A reload is the reset button.
//
// Patches, not copies: only the fields a demo can actually change are stored,
// so seeding stays cheap and the untouched 78 jobs keep their identity (which
// matters — the list table is memoised on its rows).

/** The fields a demo can change on a job. Grows as modules are wired up. */
export type JobPatch = Partial<
  Pick<Job, "scheduledFor" | "durationMinutes" | "assigneeIds" | "status" | "priority" | "lastModifiedAt">
>;

/**
 * The fields the "Tax rate" side panel can change: the two General-details
 * fields, the accounting agency, the three text/label modules, and the two
 * status flags its actions flip (Confirm → `status`, Deactivate / Reactivate →
 * `isActive`).
 */
export type TaxRatePatch = Partial<
  Pick<
    TaxRateRow,
    "name" | "rate" | "quickbooksVendorId" | "labelIds" | "summary" | "notes" | "status" | "isActive" | "lastModifiedAt"
  >
>;

/** What the "New tax rate" form collects, before the store gives it an id. */
export interface NewTaxRateInput {
  name: string;
  rate: number;
  quickbooksVendorId?: string;
  /** Label NAMES, as the picker hands them back. */
  labels: string[];
  summary: string;
  notes: string;
}

interface AppStoreValue {
  /** Every job, with edits applied — the list reads this. */
  jobs: Job[];
  jobById: Map<string, Job>;
  /** Applies a change to one job. Also stamps `lastModifiedAt`, like the app would. */
  updateJob: (id: string, patch: JobPatch) => void;

  /** Every tax rate — the seed plus anything created in this session, edits applied. */
  taxRates: TaxRateRow[];
  taxRateById: Map<string, TaxRateRow>;
  updateTaxRate: (id: string, patch: TaxRatePatch) => void;
  /** Adds a rate and returns its id, so the caller can open it. */
  createTaxRate: (input: NewTaxRateInput) => string;
  /** Removes a rate. Only a rate in Review can be deleted — the panel enforces that. */
  deleteTaxRate: (id: string) => void;
}

const LABEL_ID_OF = new Map(TAX_RATE_LABELS.map((label) => [label.name, label.id]));

/**
 * A new rate, as production would store it: CONFIRMED (someone here typed it,
 * so it is not in Review), active, created by the signed-in user, and NOT yet
 * synced — it reaches QuickBooks on the next run, which is exactly why the
 * create form warns about it.
 *
 * A label the picker INVENTED has no id in the demo database, so it is dropped
 * here rather than faked. Flagged: a real app would create the label too.
 */
const seedNewTaxRate = (input: NewTaxRateInput, id: string): TaxRateRow => ({
  id,
  name: input.name,
  status: "active",
  isActive: true,
  rate: input.rate,
  summary: input.summary,
  notes: input.notes,
  labelIds: input.labels.map((name) => LABEL_ID_OF.get(name)).filter((value): value is string => value != null),
  createdAt: new Date().toISOString(),
  createdById: users[0].id,
  lastModifiedAt: new Date().toISOString(),
  quickbooksVendorId: input.quickbooksVendorId,
  needsSyncing: true,
});

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [patches, setPatches] = useState<Record<string, JobPatch>>({});

  const jobs = useMemo(() => {
    // Nothing edited yet: hand back the seed array itself, so the memoised
    // table sees the very same row objects it saw before.
    if (Object.keys(patches).length === 0) return SEED_JOBS;
    return SEED_JOBS.map((job) => (patches[job.id] == null ? job : { ...job, ...patches[job.id] }));
  }, [patches]);

  const jobById = useMemo(() => new Map(jobs.map((job) => [job.id, job])), [jobs]);

  const updateJob = useCallback((id: string, patch: JobPatch) => {
    setPatches((current) => ({
      ...current,
      [id]: { ...current[id], ...patch, lastModifiedAt: new Date().toISOString() },
    }));
  }, []);

  // ---- tax rates ----------------------------------------------------------
  //
  // Same shape as the jobs above, with two differences: a demo can CREATE a
  // rate (the "New tax rate" form) and DELETE one (a rate in Review), so the
  // store keeps an added list and a removed set next to the patches.

  const [taxRatePatches, setTaxRatePatches] = useState<Record<string, TaxRatePatch>>({});
  const [addedTaxRates, setAddedTaxRates] = useState<TaxRateRow[]>([]);
  const [removedTaxRates, setRemovedTaxRates] = useState<string[]>([]);

  const taxRates = useMemo(() => {
    const untouched =
      Object.keys(taxRatePatches).length === 0 && removedTaxRates.length === 0 && addedTaxRates.length === 0;
    // Nothing touched yet: hand back the seed array itself, so the memoised
    // table sees the very same row objects it saw before.
    if (untouched) return SEED_TAX_RATES;

    const rows = [...SEED_TAX_RATES, ...addedTaxRates]
      .filter((row) => !removedTaxRates.includes(row.id))
      .map((row) => (taxRatePatches[row.id] == null ? row : { ...row, ...taxRatePatches[row.id] }));
    // The list's neutral order is name A–Z, so a created rate lands where it
    // belongs instead of at the end.
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }, [taxRatePatches, addedTaxRates, removedTaxRates]);

  const taxRateById = useMemo(() => new Map(taxRates.map((row) => [row.id, row])), [taxRates]);

  const updateTaxRate = useCallback((id: string, patch: TaxRatePatch) => {
    setTaxRatePatches((current) => ({
      ...current,
      [id]: { ...current[id], ...patch, lastModifiedAt: new Date().toISOString() },
    }));
  }, []);

  const createTaxRate = useCallback((input: NewTaxRateInput) => {
    // Human-readable, like every id in the database, and unique within a
    // session — this is a demo, not a backend.
    const id = `tax-new-${Date.now().toString(36)}`;
    setAddedTaxRates((current) => [...current, seedNewTaxRate(input, id)]);
    return id;
  }, []);

  const deleteTaxRate = useCallback((id: string) => {
    setRemovedTaxRates((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const value = useMemo(
    () => ({ jobs, jobById, updateJob, taxRates, taxRateById, updateTaxRate, createTaxRate, deleteTaxRate }),
    [jobs, jobById, updateJob, taxRates, taxRateById, updateTaxRate, createTaxRate, deleteTaxRate],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const value = useContext(AppStoreContext);
  if (value == null) throw new Error("useAppStore must be used inside <AppStoreProvider>");
  return value;
}

/** Every job, edits applied. */
export const useJobs = (): Job[] => useAppStore().jobs;

/** One job by id, edits applied — undefined when the id is not in the database. */
export const useJob = (id: string): Job | undefined => useAppStore().jobById.get(id);

/** Every tax rate, edits applied — the list reads this. */
export const useTaxRates = (): TaxRateRow[] => useAppStore().taxRates;

/** One tax rate by id — undefined once it is deleted, or for an id that never existed. */
export const useTaxRate = (id: string | null): TaxRateRow | undefined => {
  const { taxRateById } = useAppStore();
  return id == null ? undefined : taxRateById.get(id);
};
