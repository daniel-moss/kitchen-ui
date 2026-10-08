import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

import { LABOR_LABELS, TAX_RATE_LABELS } from "../../data/db";
import { users } from "../../data/users";
import { Job, JOBS as SEED_JOBS } from "../jobsData";
import { LABOR_ROWS as SEED_LABOR_RATES, LaborRow } from "../laborData";
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

/**
 * The fields the "Labor rate" side panel can change: the General pair, the
 * whole Pricing module, the accounting account, the three text/label modules,
 * and the two status flags its actions flip.
 */
export type LaborRatePatch = Partial<
  Pick<
    LaborRow,
    | "name"
    | "subtypeId"
    | "unitType"
    | "cost"
    | "rate"
    | "taxable"
    | "priceStrategy"
    | "priceAdjustmentAmount"
    | "priceAdjustmentPercent"
    | "quickbooksAccountId"
    | "labelIds"
    | "summary"
    | "notes"
    | "status"
    | "isActive"
    | "lastModifiedAt"
  >
>;

/** What the "New labor rate" form collects, before the store gives it an id. */
export interface NewLaborRateInput {
  name: string;
  subtypeId?: string;
  unitType: "hourly" | "flat";
  cost: number;
  priceStrategy: "manual" | "fixed" | "percent";
  rate: number;
  fixedMarkup?: number;
  percentMarkup?: number;
  isTaxable: boolean;
  quickbooksAccountId?: string;
  /** Label NAMES, as the picker hands them back. */
  labels: string[];
  description: string;
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

  /** Every labor rate — the seed plus anything created in this session, edits applied. */
  laborRates: LaborRow[];
  laborRateById: Map<string, LaborRow>;
  updateLaborRate: (id: string, patch: LaborRatePatch) => void;
  createLaborRate: (input: NewLaborRateInput) => string;
  deleteLaborRate: (id: string) => void;
}

/**
 * ONE editable table: the frozen seed, plus this session's patches, additions
 * and removals. Both pricebook lists work exactly this way, so the mechanics
 * live here once (2026-10-08, with the labor rates) — including the rule that
 * matters for performance: while nothing has been touched it hands back the
 * SEED ARRAY ITSELF, so the memoised table sees the very same row objects.
 *
 * `sort` keeps a created row where it belongs instead of at the end; both
 * pricebook lists sort by name.
 */
function useEditableTable<T extends { id: string }>(seed: T[], sort: (a: T, b: T) => number) {
  const [patches, setPatches] = useState<Record<string, Partial<T>>>({});
  const [added, setAdded] = useState<T[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);

  const rows = useMemo(() => {
    if (Object.keys(patches).length === 0 && removed.length === 0 && added.length === 0) return seed;
    return [...seed, ...added]
      .filter((row) => !removed.includes(row.id))
      .map((row) => (patches[row.id] == null ? row : { ...row, ...patches[row.id] }))
      .sort(sort);
  }, [seed, sort, patches, added, removed]);

  const byId = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);

  // Every edit stamps `lastModifiedAt`, like the app would. The cast is the
  // one place this helper has to trust its callers: both row types carry it.
  const update = useCallback((id: string, patch: Partial<T>) => {
    setPatches((current) => ({
      ...current,
      [id]: { ...current[id], ...patch, lastModifiedAt: new Date().toISOString() } as Partial<T>,
    }));
  }, []);

  const create = useCallback((row: T) => {
    setAdded((current) => [...current, row]);
    return row.id;
  }, []);

  const remove = useCallback((id: string) => {
    setRemoved((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  return { rows, byId, update, create, remove };
}

/** The lists' neutral order, and where a newly created row lands. */
const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);

/** Human-readable and unique within a session — this is a demo, not a backend. */
const newId = (prefix: string) => `${prefix}-new-${Date.now().toString(36)}`;

const LABEL_ID_OF = new Map(TAX_RATE_LABELS.map((label) => [label.name, label.id]));
const LABOR_LABEL_ID_OF = new Map(LABOR_LABELS.map((label) => [label.name, label.id]));

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

/**
 * A new labor rate, as production would store it: CONFIRMED (someone here
 * typed it), active, created by the signed-in user, and NOT yet synced — it
 * reaches QuickBooks on the next run, which is what the create form warns
 * about. `estDurationMinutes` is null: the form does not collect it any more,
 * because that field is moving to the new Service object (ROO-3222).
 */
const seedNewLaborRate = (input: NewLaborRateInput, id: string): LaborRow => ({
  id,
  name: input.name,
  status: "active",
  isActive: true,
  subtypeId: input.subtypeId ?? null,
  summary: input.description,
  notes: input.notes,
  cost: input.cost,
  rate: input.rate,
  unitType: input.unitType === "hourly" ? "hourly" : "flatRate",
  taxable: input.isTaxable,
  estDurationMinutes: null,
  priceStrategy: input.priceStrategy,
  priceAdjustmentAmount: input.fixedMarkup,
  priceAdjustmentPercent: input.percentMarkup,
  labelIds: input.labels.map((name) => LABOR_LABEL_ID_OF.get(name)).filter((value): value is string => value != null),
  createdAt: new Date().toISOString(),
  createdById: users[0].id,
  lastModifiedAt: new Date().toISOString(),
  quickbooksAccountId: input.quickbooksAccountId,
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

  // ---- the two pricebook lists --------------------------------------------
  //
  // Same shape as the jobs above, with two differences: a demo can CREATE a
  // rate (the "New …" forms) and DELETE one (a rate in Review), so each table
  // keeps an added list and a removed set next to the patches. Both run on
  // `useEditableTable`.

  const taxRateTable = useEditableTable(SEED_TAX_RATES, byName);
  const { rows: taxRates, byId: taxRateById, update: updateTaxRate } = taxRateTable;

  const createTaxRate = useCallback(
    (input: NewTaxRateInput) => taxRateTable.create(seedNewTaxRate(input, newId("tax"))),
    [taxRateTable],
  );
  const deleteTaxRate = taxRateTable.remove;

  const laborRateTable = useEditableTable(SEED_LABOR_RATES, byName);
  const { rows: laborRates, byId: laborRateById, update: updateLaborRate } = laborRateTable;

  const createLaborRate = useCallback(
    (input: NewLaborRateInput) => laborRateTable.create(seedNewLaborRate(input, newId("labor"))),
    [laborRateTable],
  );
  const deleteLaborRate = laborRateTable.remove;

  const value = useMemo(
    () => ({
      jobs,
      jobById,
      updateJob,
      taxRates,
      taxRateById,
      updateTaxRate,
      createTaxRate,
      deleteTaxRate,
      laborRates,
      laborRateById,
      updateLaborRate,
      createLaborRate,
      deleteLaborRate,
    }),
    [
      jobs,
      jobById,
      updateJob,
      taxRates,
      taxRateById,
      updateTaxRate,
      createTaxRate,
      deleteTaxRate,
      laborRates,
      laborRateById,
      updateLaborRate,
      createLaborRate,
      deleteLaborRate,
    ],
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

/** Every labor rate, edits applied — the list reads this. */
export const useLaborRates = (): LaborRow[] => useAppStore().laborRates;

/** One labor rate by id — undefined once it is deleted, or for an id that never existed. */
export const useLaborRate = (id: string | null): LaborRow | undefined => {
  const { laborRateById } = useAppStore();
  return id == null ? undefined : laborRateById.get(id);
};
