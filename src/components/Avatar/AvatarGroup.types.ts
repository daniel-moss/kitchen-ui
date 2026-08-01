import { AvatarRingColor } from "./Avatar.types";

export type AvatarGroupSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarGroupVariation = "inline" | "stack";

/** A user avatar in a group. Content is image or letters only (no addOns). */
export interface AvatarGroupUserItem {
  kind?: "user";
  content?: "image" | "letters";
  imageSrc?: string;
  letter?: string;
  /** Name shown in the stack variation. */
  name?: string;
}

/** A live avatar in a group. Only valid at md/lg/xl. Ring color auto-assigned. */
export interface AvatarGroupLiveItem {
  kind: "live";
  content?: "image" | "letters";
  imageSrc?: string;
  letter?: string;
  ringColor?: AvatarRingColor;
  name?: string;
}

export type AvatarGroupItem = AvatarGroupUserItem | AvatarGroupLiveItem;

export interface AvatarGroupProps {
  /** Layout. Default "inline". */
  variation?: AvatarGroupVariation;
  /** Shared size for every avatar (xs–xl; live needs md/lg/xl). Default "md". */
  size?: AvatarGroupSize;
  /** The avatars. */
  items: AvatarGroupItem[];
  /**
   * Max visible slots including the `+N` counter. When items exceed it, the last
   * slot becomes a counter avatar for the overflow. Omit for no truncation.
   */
  max?: number;
  /** Loading: avatars pulse and (stack) names become skeletons. Default false. */
  isLoading?: boolean;
  className?: string;
}
