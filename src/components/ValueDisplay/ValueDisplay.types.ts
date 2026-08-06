import { ReactNode } from "react";

import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";

/** Label–value pair orientation. */
export type ValueDisplayOrientation = "horizontal" | "vertical";

/**
 * The value kinds. `text` / `badge` / `linkButton` belong to the horizontal
 * orientation; `shortText` / `longText` / `avatarStack` / `files` /
 * `objectCard` belong to the vertical one. The types below enforce the split.
 */
export type ValueDisplayKind =
  | "text"
  | "badge"
  | "linkButton"
  | "shortText"
  | "longText"
  | "avatarStack"
  | "files"
  | "objectCard";

/**
 * How much a value may be truncated:
 * - a number — that many lines / avatars,
 * - `true` — the kind's default (4 lines, 3 avatars),
 * - `false` — no truncation.
 */
export type ValueDisplayLimit = number | boolean;

/** Every value-specific prop name — a kind excludes the ones it does not own. */
type ValueKey =
  | "value"
  | "valueColor"
  | "slotLeft"
  | "isWarning"
  | "badge"
  | "link"
  | "lineLimit"
  | "items"
  | "avatarLimit"
  | "files"
  | "loadingCount"
  | "card";

/** Marks every value prop the kind does NOT own as unusable. */
type Only<K extends ValueKey> = { [P in Exclude<ValueKey, K>]?: never };

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
  /** One IconButton (lg — 36px) to the right of the value. Horizontal only. */
  slotRight?: ReactNode;
}

/** Horizontal text value. Plain text wraps; with `slotLeft` it truncates to one line (tooltip shows the full text). */
export type ValueDisplayHorizontalTextProps = HorizontalBase &
  Only<"value" | "valueColor" | "slotLeft" | "isWarning"> & {
    kind?: "text";
    /** The value. Empty/undefined renders the "No [Label]" placeholder. */
    value?: string;
    /** Value text color (a CSS color, normally a token var like `var(--jade-11)`). */
    valueColor?: string;
    /** Icon (14px) or avatar (xs — 20px, fixed) before the text, 8px gap. */
    slotLeft?: ReactNode;
    /** Warning: `--text-warning` text + amber warning icon pinned right. */
    isWarning?: boolean;
  };

/** Horizontal badge value — any badge element (size md). Truncates with a tooltip when space is short. */
export type ValueDisplayHorizontalBadgeProps = HorizontalBase &
  Only<"badge"> & {
    kind: "badge";
    /** The badge (Badge, BadgeColor, a status badge…). null/undefined = empty state. */
    badge?: ReactNode;
  };

/** Horizontal LinkButton value. Truncates with a tooltip when space is short. */
export type ValueDisplayHorizontalLinkProps = HorizontalBase &
  Only<"link"> & {
    kind: "linkButton";
    /** The LinkButton. null/undefined = empty state. */
    link?: ReactNode;
  };

// ---- vertical (label above the value) ------------------------------------

interface VerticalBase extends ValueDisplayBase {
  orientation: "vertical";
  slotRight?: never;
}

/** Vertical short-text value — `body-400-compact`, wraps freely. Supports a left slot. */
export type ValueDisplayVerticalShortTextProps = VerticalBase &
  Only<"value" | "valueColor" | "slotLeft"> & {
    kind: "shortText";
    /** The value. Empty/undefined renders the "No [Label]" placeholder. */
    value?: string;
    /** Value text color (a CSS color, normally a token var). */
    valueColor?: string;
    /** Icon (14px) or avatar (xs — 20px, fixed) before the text, 8px gap, top-aligned. */
    slotLeft?: ReactNode;
  };

/** Vertical long-text value — `body-400-spacious`, wraps freely; an optional line limit clamps it and adds "Show more" / "Show less". */
export type ValueDisplayVerticalLongTextProps = VerticalBase &
  Only<"value" | "valueColor" | "lineLimit"> & {
    kind?: "longText";
    /** The value. Empty/undefined renders the "No [Label]" placeholder. */
    value?: string;
    /** Value text color (a CSS color, normally a token var). */
    valueColor?: string;
    /**
     * Clamp the text and add "Show more" / "Show less". Off by default (the
     * text wraps freely). `true` uses the standard 4 lines; a number sets your
     * own limit.
     */
    lineLimit?: ValueDisplayLimit;
  };

/** Vertical avatar-stack value — an xs avatar stack that truncates to a "+N" row and adds "Show more" / "Show less". */
export type ValueDisplayVerticalAvatarsProps = VerticalBase &
  Only<"items" | "avatarLimit"> & {
    kind: "avatarStack";
    /** The users. Empty/undefined renders the placeholder-avatar empty state. */
    items?: AvatarGroupItem[];
    /**
     * Max rows before truncating to a "+N" line (the counter row counts).
     * Defaults to 3; `false` shows every avatar.
     */
    avatarLimit?: ValueDisplayLimit;
  };

/** Vertical files value — a wrapping grid of CardFiles. */
export type ValueDisplayVerticalFilesProps = VerticalBase &
  Only<"files" | "loadingCount"> & {
    kind: "files";
    /**
     * The file cards — `CardFile` elements. Every card fills its grid column
     * (106–184px). Empty/undefined renders the "No [Label]" placeholder.
     */
    files?: ReactNode;
    /** How many skeleton cards the loading state shows. Default 1. */
    loadingCount?: number;
  };

/** Vertical object-card value — one Card holding a ListItem with the object's data. */
export type ValueDisplayVerticalObjectCardProps = VerticalBase &
  Only<"card"> & {
    kind: "objectCard";
    /**
     * The card content — one `ListItem` element. ValueDisplay wraps it in the
     * `Card`. Empty/undefined renders the "No [Label]" placeholder.
     */
    card?: ReactNode;
  };

export type ValueDisplayProps =
  | ValueDisplayHorizontalTextProps
  | ValueDisplayHorizontalBadgeProps
  | ValueDisplayHorizontalLinkProps
  | ValueDisplayVerticalShortTextProps
  | ValueDisplayVerticalLongTextProps
  | ValueDisplayVerticalAvatarsProps
  | ValueDisplayVerticalFilesProps
  | ValueDisplayVerticalObjectCardProps;
