import { ReactNode } from "react";

import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";

/** Label–value pair orientation. */
export type ValueDisplayOrientation = "horizontal" | "vertical";

interface ValueDisplayBase {
  /** The label. Also builds the empty placeholder ("No " + Label). */
  label: string;
  /** Override for the empty placeholder (default "No " + capitalized label). */
  emptyText?: string;
  /** Loading: the label stays, the value renders skeletons. Default false. */
  isLoading?: boolean;
  className?: string;
}

// ---- horizontal (label in a fixed 120px column) -------------------------

interface HorizontalBase extends ValueDisplayBase {
  /** Default "horizontal". */
  orientation?: "horizontal";
  /** One IconButton to the right of the value (horizontal only). */
  slotRight?: ReactNode;
}

/** Horizontal text value. Plain text wraps; with `slotLeft` it truncates to one line (tooltip shows the full text). */
export interface ValueDisplayHorizontalTextProps extends HorizontalBase {
  kind?: "text";
  /** The value. Empty/undefined renders the "No [Label]" placeholder. */
  value?: string;
  /** Value text color (a CSS color, normally a token var like `var(--jade-11)`). */
  valueColor?: string;
  /** Icon (14px) or avatar (xs) before the text, 8px gap. */
  slotLeft?: ReactNode;
  /** Warning: `--text-warning` text + amber warning icon pinned right. */
  isWarning?: boolean;

  badge?: never;
  link?: never;
  lineLimit?: never;
  items?: never;
  avatarLimit?: never;
}

/** Horizontal badge value — any badge element. Truncates with a tooltip when space is short. */
export interface ValueDisplayHorizontalBadgeProps extends HorizontalBase {
  kind: "badge";
  /** The badge (Badge, BadgeColor, a status badge…). null/undefined = empty state. */
  badge?: ReactNode;

  value?: never;
  valueColor?: never;
  slotLeft?: never;
  isWarning?: never;
  link?: never;
  lineLimit?: never;
  items?: never;
  avatarLimit?: never;
}

/** Horizontal LinkButton value. Truncates with a tooltip when space is short. */
export interface ValueDisplayHorizontalLinkProps extends HorizontalBase {
  kind: "linkButton";
  /** The LinkButton. null/undefined = empty state. */
  link?: ReactNode;

  value?: never;
  valueColor?: never;
  slotLeft?: never;
  isWarning?: never;
  badge?: never;
  lineLimit?: never;
  items?: never;
  avatarLimit?: never;
}

// ---- vertical (label above the value) ------------------------------------

interface VerticalBase extends ValueDisplayBase {
  orientation: "vertical";
  slotRight?: never;
}

/** Vertical text value — wraps freely; an optional line limit clamps it and adds "Show more" / "Show less". */
export interface ValueDisplayVerticalTextProps extends VerticalBase {
  kind?: "text";
  /** The value. Empty/undefined renders the "No [Label]" placeholder. */
  value?: string;
  /** Value text color (a CSS color, normally a token var). */
  valueColor?: string;
  /** Max lines before clamping. Clamped text gets "Show more". Omit for no limit. */
  lineLimit?: number;

  slotLeft?: never;
  isWarning?: never;
  badge?: never;
  link?: never;
  items?: never;
  avatarLimit?: never;
}

/** Vertical avatar-group value — an xs avatar stack; an optional avatar limit truncates it to a "+N" row and adds "Show more" / "Show less". */
export interface ValueDisplayVerticalAvatarsProps extends VerticalBase {
  kind: "avatarGroup";
  /** The users. Empty/undefined renders the placeholder-avatar empty state. */
  items?: AvatarGroupItem[];
  /** Max rows before truncating to a "+N" line (counts the counter row). Omit to show all. */
  avatarLimit?: number;

  value?: never;
  valueColor?: never;
  slotLeft?: never;
  isWarning?: never;
  badge?: never;
  link?: never;
  lineLimit?: never;
}

export type ValueDisplayProps =
  | ValueDisplayHorizontalTextProps
  | ValueDisplayHorizontalBadgeProps
  | ValueDisplayHorizontalLinkProps
  | ValueDisplayVerticalTextProps
  | ValueDisplayVerticalAvatarsProps;
