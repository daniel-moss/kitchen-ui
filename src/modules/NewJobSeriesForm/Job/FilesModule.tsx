import Dropzone from "../../../components/Dropzone/Dropzone";
import FormModule from "../../../components/FormModule/FormModule";
import { COMPANY } from "../../../data/db";
import { acceptDroppedFiles, ManagedFile, useUploadSimulation } from "../../AddFilesForm/files";
import FileList from "../../AddFilesForm/FileList";

import { FilesModuleProps } from "./FilesModule.types";
import styles from "./FilesModule.module.scss";

// The "Files" module of the "New Job" form (Figma 17216-64841): the same
// Dropzone + grouped file list the Add-Files form owns (Daniel, 2026-09-08 —
// the functionality is INHERITED from that module), just inline: no Dialog,
// no Upload button — the files are form state committed with the job.

export default function FilesModule({ value, onChange, mobile }: FilesModuleProps) {
  useUploadSimulation(value, (updater) => onChange(updater(value)));

  const remaining = COMPANY.maxFileUploads - value.length;
  const atLimit = remaining <= 0;

  return (
    <FormModule title="Files" titleCondition="optional">
      <div className={styles.stack}>
        <Dropzone
          title={atLimit ? undefined : `Add up to ${remaining} ${remaining === 1 ? "file" : "files"}`}
          caption={`Drag and drop or click to upload. Up to ${COMPANY.maxFileUploadSizeMb} MB per file.`}
          warningTitle={`You've reached the ${COMPANY.maxFileUploads}-file limit`}
          isWarning={atLimit}
          onFilesSelected={(dropped) => onChange([...value, ...acceptDroppedFiles(dropped, value.length)])}
        />
        <FileList files={value} onChange={onChange} mobile={mobile} />
      </div>
    </FormModule>
  );
}
