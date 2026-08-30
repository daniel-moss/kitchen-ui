import { AvatarSize } from "./Avatar.types";

/** AvatarLive sizes — md, lg and xl only. */
export type AvatarLiveSize = Extract<AvatarSize, "md" | "lg" | "xl">;

/** Live-collaboration ring colors (the only colors the ring may use). */
export type AvatarLiveColor =
  | "crimson"
  | "pink"
  | "plum"
  | "violet"
  | "indigo"
  | "blue"
  | "cyan"
  | "teal"
  | "orange"
  | "amber";

/** Content. `counter` is the group's overflow slot and carries no ring. */
export type AvatarLiveContent = "image" | "letters" | "counter";

export interface AvatarLiveProps {
  /** Size (md, lg, xl). Default "md". */
  size?: AvatarLiveSize;
  /** What fills the avatar. Default "image". */
  content?: AvatarLiveContent;
  /** Ring color. Ignored by `counter`, which has no ring. Default "crimson". */
  color?: AvatarLiveColor;
  /** Letters (content "letters"). Default "AB". */
  characters?: string;
  /** Image URL (content "image"). */
  imageSrc?: string;
  /** Count (content "counter"). Default 2. */
  count?: number;
  className?: string;
}
