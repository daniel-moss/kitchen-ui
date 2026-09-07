import { useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import Dropzone from "../../components/Dropzone/Dropzone";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { toast } from "../../components/Toast/Toaster";
import { COMPANY } from "../../data/db";
import useIsDesktop from "../../hooks/useIsDesktop";

import { acceptDroppedFiles, ManagedFile, useUploadSimulation } from "./files";
import FileList from "./FileList";
import { AddFilesFormProps } from "./AddFilesForm.types";
import styles from "./AddFilesForm.module.scss";

// The "Add Files" form (Figma TKpqh7MBnmYeOeqGAE9eYc, 18594-94278) — a
// reusable Modules-tier form: the Dropzone (always visible; the warning
// state at the company limit) over the shared grouped file list, with the
// Upload commit. The New Job form's Files module inherits the same Dropzone
// + FileList pair without the Dialog.

export default function AddFilesForm({ open, onClose, onUploaded, breakpoint = "auto" }: AddFilesFormProps) {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const isDesktop = useIsDesktop(breakpoint);
  const mobile = !isDesktop;
  useUploadSimulation(files, setFiles);

  useEffect(() => {
    if (!open) setFiles([]);
  }, [open]);

  const remaining = COMPANY.maxFileUploads - files.length;
  const atLimit = remaining <= 0;

  const upload = () => {
    onUploaded?.(files);
    toast({ type: "success", title: "Files uploaded" });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add files"
      breakpoint={breakpoint}
      confirmOnDismiss={files.length > 0}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          {/* Disabled until there is at least one file added (the dev notes). */}
          <Button size="lg" variant="solid" isDisabled={files.length === 0} onClick={upload}>
            Upload
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.stack}>
        <Dropzone
          title={atLimit ? undefined : `Add up to ${remaining} ${remaining === 1 ? "file" : "files"}`}
          caption={`Drag and drop or click to upload. Up to ${COMPANY.maxFileUploadSizeMb} MB per file.`}
          warningTitle={`You've reached the ${COMPANY.maxFileUploads}-file limit`}
          isWarning={atLimit}
          onFilesSelected={(dropped) => setFiles((current) => [...current, ...acceptDroppedFiles(dropped, current.length)])}
        />
        <FileList files={files} onChange={setFiles} mobile={mobile} />
      </div>
    </Dialog>
  );
}
