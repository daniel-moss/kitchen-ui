import { useMemo, useState } from "react";

import { useOptionalAppStore } from "../../app/store/AppStore";
import { filesOf, jobById, workSummary } from "../../data/db";
import type { ModuleFile } from "../FilesModule/FilesModule.types";

// A job's WORK — its Work summary, Notes to dispatcher(s) and Files — read and
// written in ONE place (2026-11-14). They used to live inside the Summary tab
// and the Files module; the "Hold job" Detailed flow edits them too, so they
// moved to the app store (per job, like the Charges lines). In a story of its
// own (no store) each hook keeps local state.

/** The Work summary and Notes to dispatcher(s) of one job. */
export function useJobTexts(jobId: string) {
  const store = useOptionalAppStore();
  const seedSummary = useMemo(() => {
    const job = jobById(jobId);
    return job == null ? "" : workSummary(job);
  }, [jobId]);
  const [local, setLocal] = useState<{ summary?: string; notes?: string }>({});
  const saved = store?.jobTexts[jobId] ?? local;
  const set = (patch: { summary?: string; notes?: string }) =>
    store != null ? store.setJobTexts(jobId, patch) : setLocal((current) => ({ ...current, ...patch }));
  return {
    summary: saved.summary ?? seedSummary,
    notes: saved.notes ?? "",
    setSummary: (summary: string) => set({ summary }),
    setNotes: (notes: string) => set({ notes }),
  };
}

/** The job's files as the database seeds them. */
export function seedJobFiles(jobId: string): ModuleFile[] {
  const job = jobById(jobId);
  return (job == null ? [] : filesOf(job)).map((file) => ({
    id: String(file.id),
    name: file.name,
    type: file.kind,
    size: file.size,
    visibility: file.visibility,
    meta: file.meta,
  }));
}

/** The Files list of one job, and an updater. */
export function useJobFiles(jobId: string): [ModuleFile[], (update: (files: ModuleFile[]) => ModuleFile[]) => void] {
  const store = useOptionalAppStore();
  const seed = useMemo(() => seedJobFiles(jobId), [jobId]);
  const [local, setLocal] = useState<{ jobId: string; files: ModuleFile[] } | null>(null);
  if (store != null) return [store.jobFiles[jobId] ?? seed, (update) => store.updateJobFiles(jobId, seed, update)];
  const files = local?.jobId === jobId ? local.files : seed;
  return [files, (update) => setLocal((current) => ({ jobId, files: update(current?.jobId === jobId ? current.files : seed) }))];
}
