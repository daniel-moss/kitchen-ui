import { AvatarFileType } from "../../components/Avatar/AvatarFile.types";

/** Which group a file sits in — "Public" is visible to the client. */
export type FileVisibility = "public" | "private";

/** How the files are laid out. The side panels only ever show the list. */
export type FileView = "list" | "cards";

/** One file the module lists. The caller owns the array and every mutation. */
export interface ModuleFile {
  id: string;
  name: string;
  /** Drives AvatarFile's icon and colors, and CardFile's preview. */
  type: AvatarFileType;
  /** Already formatted for display ("2 MB") — shown as the Download tag. */
  size: string;
  visibility: FileVisibility;
  /** The row's caption, e.g. "Added on Aug 12, 2026 by Lorne R.". */
  meta: string;
}

export interface FilesModuleProps {
  /** Every file, both groups. The module splits them by `visibility`. */
  files: ModuleFile[];

  /**
   * Reorder inside one group — the drag handler. `from` / `to` are indexes
   * within THAT group's files, in the order they were handed over.
   */
  onReorder?: (visibility: FileVisibility, from: number, to: number) => void;
  /** Flip one file between Public and Private. */
  onToggleVisibility?: (file: ModuleFile) => void;
  /** Delete one file. */
  onDelete?: (file: ModuleFile) => void;
  /** Preview one file — the row click and the menu's "Preview". */
  onPreview?: (file: ModuleFile) => void;
  /**
   * The header's plus button opens the shared **"Add files" form** — the
   * module owns that flow, so every object that holds files gets the same one
   * (Daniel, 2026-09-28). This is called with the uploaded files, already in
   * this module's shape, for the caller to append. Omit it and the plus button
   * renders disabled: there would be nowhere for the files to go.
   */
  onFilesAdded?: (files: ModuleFile[]) => void;
  /**
   * Who is adding them — a `src/data/users.ts` id, used for the new rows'
   * "Added on … by …" caption. Default 1 (Lorne Riddle, the demo viewer).
   */
  currentUserId?: number;

  /**
   * The upload cap: the info banner shows from 80%, the warning banner plus a
   * disabled add button at 100%. Defaults to the company setting
   * (`COMPANY.maxFileUploads`) — the same one the "Add files" form enforces,
   * so the two can never disagree. Pass `Infinity` for no cap.
   */
  maxFiles?: number;

  /**
   * The list / cards TabGroup in the header. OFF by default — a 400px side
   * panel has no room for cards (Equipment side panel Figma 21979-7536), while
   * a full details page turns it on.
   */
  showViewToggle?: boolean;
  /** Initial view when the toggle is shown. Default "list". */
  defaultView?: FileView;

  /** Mobile presentation for the per-file menus (drawer instead of a card). */
  mobile?: boolean;
  /** Body padding: the module owns it. Set false inside a padded container. */
  className?: string;
}
