import { toast } from "../../components/Toast/Toaster";
import SharedFilesModule from "../FilesModule/FilesModule";
import { FileVisibility, ModuleFile } from "../FilesModule/FilesModule.types";

import { useCurrentJobId } from "./currentJob";
import { useJobFiles } from "./jobWork";

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

/**
 * One change to the job's files, for the Activity tab (Figma 24453-26236). The
 * module reports it and Job Details writes the sentence, like the Forms module.
 */
export type FilesLog =
  | { kind: "added"; names: string[] }
  | { kind: "removed"; names: string[] }
  | { kind: "visibility"; name: string; visibility: FileVisibility };

export default function FilesModule({
  mobile = false,
  isPublicView = false,
  readOnly = false,
  onLog,
}: {
  mobile?: boolean;
  isPublicView?: boolean;
  readOnly?: boolean;
  /** Reports each change for the activity log. */
  onLog?: (log: FilesLog) => void;
}) {
  const jobId = useCurrentJobId();

  // Kept per job in the app store since 2026-11-14 (`jobWork.ts`), so the
  // "Hold job" Detailed flow can add files to the same list.
  const [files, setFiles] = useJobFiles(jobId);

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
    onLog?.({ kind: "visibility", name: file.name, visibility: now });
  };

  // NO confirm and NO toast here: the shared module asks first and reports
  // afterwards, so this only has to remove the row (2026-10-06).
  const deleteFile = (file: ModuleFile) => {
    setFiles((prev) => prev.filter((row) => row.id !== file.id));
    onLog?.({ kind: "removed", names: [file.name] });
  };

  // The job's PUBLIC view shows the module only when it holds public files
  // ("Only shown if it contains files"); the shared module drops the private
  // ones itself.
  if (isPublicView && !files.some((file) => file.visibility === "public")) return null;

  return (
    <SharedFilesModule
      files={files}
      isPublicView={isPublicView}
      readOnly={readOnly}
      onDownload={(file) => toast({ type: "neutral", icon: "download", title: `Downloading "${file.name}"` })}
      showViewToggle
      mobile={mobile}
      onReorder={reorder}
      onToggleVisibility={toggleVisibility}
      onDelete={deleteFile}
      onPreview={() => {}}
      onFilesAdded={(added) => {
        setFiles((prev) => [...prev, ...added]);
        if (added.length > 0) onLog?.({ kind: "added", names: added.map((file) => file.name) });
      }}
    />
  );
}
