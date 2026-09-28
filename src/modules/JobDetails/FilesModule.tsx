import { useEffect, useMemo, useState } from "react";

import { toast } from "../../components/Toast/Toaster";
import { filesOf, jobById } from "../../data/db";
import SharedFilesModule from "../FilesModule/FilesModule";
import { FileVisibility, ModuleFile } from "../FilesModule/FilesModule.types";

import { useCurrentJobId } from "./currentJob";

// The job's "Files" module. The module ITSELF is shared — every object that
// holds files shows the same one (src/modules/FilesModule) — so what lives
// here is only this page's data and its handlers.
//
// The files come from the JOB (db/jobFiles.ts): a job nobody has worked has
// none, and a job that has been worked has what its own tech filed, on the day
// they were there. They used to be the same six on all 78 jobs.
//
// The upload cap is the module's default — the company setting — so this file
// no longer keeps a 25 of its own.

export default function FilesModule({ mobile = false }: { mobile?: boolean }) {
  const jobId = useCurrentJobId();

  const seeded = useMemo<ModuleFile[]>(() => {
    const job = jobById(jobId);
    return (job == null ? [] : filesOf(job)).map((file) => ({
      id: String(file.id),
      name: file.name,
      type: file.kind,
      size: file.size,
      visibility: file.visibility,
      meta: file.meta,
    }));
  }, [jobId]);

  const [files, setFiles] = useState(seeded);
  // The page serves all 78 jobs, so the list has to follow the job on screen.
  useEffect(() => setFiles(seeded), [seeded]);

  // The drag indexes are within ONE group, so map them back onto the flat array.
  const reorder = (visibility: FileVisibility, from: number, to: number) =>
    setFiles((prev) => {
      const group = prev.filter((file) => file.visibility === visibility);
      const moved = [...group];
      const [item] = moved.splice(from, 1);
      moved.splice(to, 0, item);
      let next = 0;
      return prev.map((file) => (file.visibility === visibility ? moved[next++] : file));
    });

  const toggleVisibility = (file: ModuleFile) => {
    const now: FileVisibility = file.visibility === "private" ? "public" : "private";
    setFiles((prev) => prev.map((row) => (row.id === file.id ? { ...row, visibility: now } : row)));
    toast({ type: "neutral", icon: now === "public" ? "globe" : "lock", title: `"${file.name}" is now ${now}` });
  };

  const deleteFile = (file: ModuleFile) => {
    setFiles((prev) => prev.filter((row) => row.id !== file.id));
    toast({ type: "neutral", icon: "trash-can", title: `"${file.name}" deleted` });
  };

  return (
    <SharedFilesModule
      files={files}
      showViewToggle
      mobile={mobile}
      onReorder={reorder}
      onToggleVisibility={toggleVisibility}
      onDelete={deleteFile}
      onPreview={() => {}}
      onFilesAdded={(added) => setFiles((prev) => [...prev, ...added])}
    />
  );
}
