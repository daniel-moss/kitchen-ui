import { ManagedFile } from "../../AddFilesForm/files";

export interface FilesModuleProps {
  value: ManagedFile[];
  onChange: (files: ManagedFile[]) => void;
  /** Mobile presentation (drawer menus). */
  mobile: boolean;
}
