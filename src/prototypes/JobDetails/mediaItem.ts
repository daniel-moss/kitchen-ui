import { FileType } from "../../components/Card/CardFile.types";

// One picked file, shared by every MediaField-carrying form (Hot Side - Repair,
// Ice Machine - Repair). Extracted from HotSideRepairForm when the second such
// form arrived, so the two cannot drift apart.

export interface MediaItem {
  name: string;
  type: FileType;
  /** Object URL of the picked file — the preview's Download uses it. */
  src?: string;
  /** Size in bytes — the preview's file menu shows it next to Download. */
  size?: number;
}

/** Only these kinds show their image in the card tile; the rest get the placeholder. */
export const isPreviewable = (type: FileType) => type === "image" || type === "gif" || type === "video";

/** The CardFile kind a picked file maps to. */
export const fileTypeOf = (file: File): FileType => {
  if (file.type === "image/gif") return "gif";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type === "application/pdf") return "pdf";
  return "generic";
};
