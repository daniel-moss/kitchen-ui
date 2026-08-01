import { MouseEvent } from "react";

import { IconPack } from "../Icon/Icon.types";

/**
 * The file kinds a CardFile can represent. Each maps to a file-type icon +
 * color for the no-preview tile (see FILE_TYPE_META). `generic` is the
 * fallback for anything unrecognised.
 */
export type FileType =
  | "generic"
  | "image"
  | "gif"
  | "audio"
  | "video"
  | "pdf"
  | "word"
  | "spreadsheet"
  | "presentation"
  | "markdown"
  | "vector"
  | "archive";

/** Icon + color per file type — read from Figma "No Preview Tale Template". */
export interface FileTypeMeta {
  /** Icon glyph name. */
  icon: string;
  /** Icon pack (markdown uses the FA Brands font). */
  pack: IconPack;
  /**
   * Radix color scale name. Drives the tile background (`<color>-a2`) and its
   * icon + text (`<color>-a11`) via the matching SCSS class.
   */
  color: string;
}

export const FILE_TYPE_META: Record<FileType, FileTypeMeta> = {
  generic: { icon: "file", pack: "regular", color: "blue" },
  word: { icon: "file-word", pack: "regular", color: "blue" },
  image: { icon: "image", pack: "regular", color: "jade" },
  spreadsheet: { icon: "table", pack: "regular", color: "jade" },
  gif: { icon: "gif", pack: "regular", color: "cyan" },
  audio: { icon: "headphones", pack: "regular", color: "amber" },
  video: { icon: "video", pack: "regular", color: "violet" },
  pdf: { icon: "file-pdf", pack: "regular", color: "tomato" },
  presentation: { icon: "presentation", pack: "regular", color: "orange" },
  markdown: { icon: "markdown", pack: "brand", color: "crimson" },
  vector: { icon: "bezier-curve", pack: "regular", color: "teal" },
  archive: { icon: "archive", pack: "regular", color: "gray" },
};

export interface CardFileProps {
  /** File name — shown in the footer and (when there is no preview) in the tile. */
  name: string;
  /** File kind. Drives the no-preview icon + color. Default "generic". */
  fileType?: FileType;
  /**
   * Thumbnail URL. When set, the tile shows the image (cropped to the square).
   * When unset, the tile shows the colored file-type placeholder.
   */
  previewSrc?: string;

  /** Whole-card click (open / preview the file). The card is interactive. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /**
   * Handler for the footer action button. It stops propagation, so it never
   * triggers `onClick`. When unset, the action button is hidden.
   */
  onMenuClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Keep the action button in its pressed state (e.g. while its menu is open). */
  menuOpen?: boolean;
  /** Action button icon. Default `"ellipsis"` (opens a context menu). */
  actionIcon?: string;
  /** Action button accessible label. Default `"File actions"`. */
  actionLabel?: string;
  /** Render the action button in the danger (red) style — e.g. a delete action. */
  actionDanger?: boolean;

  /** Non-interactive and dimmed (Card's disabled). */
  disabled?: boolean;
  /** Non-interactive; the tile and footer show skeletons and the action button is hidden while the file loads. */
  loading?: boolean;
  /** Lifted "dragging" look (Card's dragging) — used by ItemGroup's cards reorder. */
  dragging?: boolean;

  className?: string;
}
