import { useEffect, useRef } from "react";

import { toast } from "../../components/Toast/Toaster";
import { COMPANY } from "../../data/db";

// The shared file model + helpers of the Add-Files functionality — used by
// the AddFilesForm module and inherited by the New Job form's Files module.

export type ManagedFileType = "image" | "video" | "pdf" | "generic";

export interface ManagedFile {
  key: string;
  /** Full name with extension ("Image.png"). */
  name: string;
  sizeBytes: number;
  type: ManagedFileType;
  /** New files are public by default (the dev notes). */
  visibility: "public" | "private";
  /** Unset = no description — the row shows the placeholder. */
  description?: string;
  /** 0–99 while (demo-)uploading; unset = uploaded (the ⋯ menu appears). */
  progress?: number;
}

export const fileTypeOf = (file: File): ManagedFileType => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "pdf";
  return "generic";
};

/** "113 KB" / "4.6 MB" / "2 MB" — the node's size captions. */
export const formatSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const mb = bytes / 1024 / 1024;
  const rounded = Math.round(mb * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} MB`;
};

/**
 * Validate a drop against the company limits and return the accepted files
 * as ManagedFiles (uploading state). One Toast per drop — the Dropzone doc's
 * rejection set.
 */
export const acceptDroppedFiles = (files: File[], currentCount: number): ManagedFile[] => {
  const remaining = COMPANY.maxFileUploads - currentCount;
  const maxBytes = COMPANY.maxFileUploadSizeMb * 1024 * 1024;
  const fitting = files.filter((file) => file.size <= maxBytes);
  const oversized = files.length - fitting.length;
  const accepted = fitting.slice(0, Math.max(0, remaining));

  if (oversized > 0 && accepted.length < files.length - oversized) {
    toast({ type: "error", variant: "detailed", title: "Some files couldn't be added", caption: `${accepted.length} of ${files.length} files added` });
  } else if (oversized === 1) {
    const file = files.find((row) => row.size > maxBytes);
    toast({
      type: "error",
      variant: "detailed",
      title: "File size exceeded",
      caption: `"${file?.name}" (${Math.round((file?.size ?? 0) / 1024 / 1024)} MB) exceeds the maximum allowed size of ${COMPANY.maxFileUploadSizeMb} MB`,
    });
  } else if (oversized > 1) {
    toast({ type: "error", variant: "detailed", title: "File size exceeded", caption: `${oversized} files exceed the maximum allowed size of ${COMPANY.maxFileUploadSizeMb} MB` });
  } else if (accepted.length < fitting.length) {
    toast({
      type: "warning",
      variant: "detailed",
      title: "File limit reached",
      caption: `${accepted.length} of ${files.length} files added. Maximum ${COMPANY.maxFileUploads} files allowed.`,
    });
  }

  return accepted.map((file) => ({
    key: `${file.name}-${Date.now()}-${Math.random()}`,
    name: file.name,
    sizeBytes: file.size,
    type: fileTypeOf(file),
    visibility: "public",
    progress: 0,
  }));
};

/**
 * The demo upload: every in-progress file advances until its ProgressRing
 * hands over to the ⋯ menu (the node: the ring sits in the right slot while
 * uploading, then the context menu replaces it).
 */
export const useUploadSimulation = (
  files: ManagedFile[],
  setFiles: (updater: (current: ManagedFile[]) => ManagedFile[]) => void,
) => {
  const uploading = files.some((file) => file.progress != null);
  // The interval must always call the LATEST setter: a value/onChange caller
  // (the New Job Files module) hands a NEW closure every render, and the
  // first one holds stale state — files froze mid-upload there.
  const setRef = useRef(setFiles);
  setRef.current = setFiles;
  useEffect(() => {
    if (!uploading) return undefined;
    const timer = setInterval(() => {
      setRef.current((current) =>
        current.map((file) => {
          if (file.progress == null) return file;
          const next = file.progress + 25;
          return next >= 100 ? { ...file, progress: undefined } : { ...file, progress: next };
        }),
      );
    }, 300);
    return () => clearInterval(timer);
  }, [uploading]);
};
