import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

import { Job, JOBS as SEED_JOBS } from "../jobsData";

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

interface AppStoreValue {
  /** Every job, with edits applied — the list reads this. */
  jobs: Job[];
  jobById: Map<string, Job>;
  /** Applies a change to one job. Also stamps `lastModifiedAt`, like the app would. */
  updateJob: (id: string, patch: JobPatch) => void;
}

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

  const value = useMemo(() => ({ jobs, jobById, updateJob }), [jobs, jobById, updateJob]);

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
