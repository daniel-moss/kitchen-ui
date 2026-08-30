import { FileType } from "../../components/Card/CardFile.types";

// One picked file, shared by every MediaField-carrying form (Hot Side - Repair,
// Ice Machine - Repair). Extracted from HotSideRepairForm when the second such
// form arrived, so the two cannot drift apart.

export interface MediaItem {
  name: string;
  type: FileType;
  /** Object URL of the picked file — the preview's Download uses it. */
  src?: string;
  /**
   * A VIDEO's poster frame. The card tile is an `<img>`, so a video cannot be
   * its own thumbnail — without a poster it falls back to the file-type
   * placeholder (with the play icon on top either way).
   */
  poster?: string;
  /** Size in bytes — the preview's file menu shows it next to Download. */
  size?: number;
}

/** Only these kinds show their image in the card tile; the rest get the placeholder. */
export const isPreviewable = (type: FileType) => type === "image" || type === "gif" || type === "video";

/**
 * What the card tile shows: the file itself for a picture, the poster frame for
 * a video. Shared so the form and the preview cannot disagree.
 */
export const tileSrc = (file: { type: FileType; src?: string; poster?: string }) =>
  file.type === "video" ? file.poster : isPreviewable(file.type) ? file.src : undefined;

/** The CardFile kind a picked file maps to. */
export const fileTypeOf = (file: File): FileType => {
  if (file.type === "image/gif") return "gif";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type === "application/pdf") return "pdf";
  return "generic";
};
