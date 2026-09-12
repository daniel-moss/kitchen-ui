import { HTMLAttributes, ReactNode } from "react";

/**
 * Selection mode (Figma `select`). single shows a right check-circle when
 * selected; multi shows a left checkbox; counter is a quantity row — the row
 * click adds a copy, and while `count` > 0 the count shows in the tag
 * position with a circle-minus decrement button on the right.
 */
export type SelectListItemSelect = "single" | "multi" | "counter";

interface SelectListItemBaseProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * default = a compact text row (36px). object = a taller row (60px) that always
   * has an avatar on the left and a title + caption (medium title). Default "default".
   */
  variant?: "default" | "object";

  /** The option label (the title in the object variant). */
  label?: ReactNode;
  /**
   * Extra text SelectList's built-in search matches against INSTEAD of `label`
   * — for rows where the user may type more than the label (e.g. an object
   * row's caption, or its group's client name).
   */
  searchText?: string;
  /** Left slot (default variant only) — an Icon (`container="square"`) or a 20px (xs) user/object Avatar. */
  slotLeft?: ReactNode;
  /** Object variant only — the mandatory left avatar. Any avatar type; size must be xl (36px). */
  avatar?: ReactNode;

  /** Selection mode. Default "single". */
  select?: SelectListItemSelect;
  /** DEPRECATED — alias for `select="multi"` (kept for older call sites). */
  multiSelect?: boolean;
  /** Selected state (single / multi; counter derives it from `count` > 0). */
  selected?: boolean;
  /** Dimmed, non-interactive. */
  disabled?: boolean;
  /**
   * Non-interactive, but READABLE: only the checkbox dims to 30% — the label,
   * caption, avatar and tag keep their normal colours, and the row takes no
   * hover, press or focus state. Use it to SHOW what is ticked when the user
   * may not change it; `disabled` instead says the option is unavailable and
   * dims the whole row.
   *
   * MULTI-SELECT only — Figma draws `state=readOnly` for `select=multi` in both
   * variants and nowhere else (nodes 29462-25287 / 25291 / 25342 / 25345). On a
   * single or counter row it is ignored, with a console warning.
   */
  readOnly?: boolean;

  /**
   * OBJECT only — what the caption reads when the value is missing, e.g.
   * "No Location name" on a location with no name of its own.
   *
   * The row's standard empty behaviour, from the ListItem Template copy doc
   * (Figma 27171-15212): "The placeholder is shown if the value is missing.
   * The placeholder inherits the `--text-placeholder` token." The doc gives
   * the copy per object — Location, Equipment, Warranty, Contact — always
   * "No " + the field as it is named ("No Location name", "No Manufacturer",
   * "No End date").
   *
   * It is shown INSTEAD of `caption` whenever `caption` is null or
   * undefined, so the caller passes the value it has and this in case it has
   * none. Without it a missing caption simply renders nothing, which is what
   * every row did before 2026-09-12.
   */
  captionPlaceholder?: ReactNode;

  /** Object only — caption ABOVE the title (Figma titleCaptionReversed). */
  reversed?: boolean;
  /** Object only — right text block title (Medium 14, right-aligned). */
  rightTitle?: ReactNode;
  /** Object only — right text block caption (13, subtle). */
  rightCaption?: ReactNode;
  /** Object only — right block caption ABOVE its title. */
  rightReversed?: boolean;

  className?: string;
}

/**
 * Copy rules: on the DEFAULT variant, caption below OR a tag to the right —
 * never both. The OBJECT variant may combine its caption with a right-slot
 * tag (Figma "Copy Slot Right"). Counter rows support NO static tag (the
 * count IS the tag), and on the default variant no caption either.
 */
export type SelectListItemProps = SelectListItemBaseProps &
  (
    | { select?: "single" | "multi"; caption?: ReactNode; tag?: ReactNode; count?: never; onDecrement?: never }
    | {
        select: "counter";
        /** Object variant only — ignored on the default variant. */
        caption?: ReactNode;
        tag?: never;
        /** Number of copies. While > 0 the row renders selected (count + minus). */
        count?: number;
        /** The circle-minus click — remove one copy. */
        onDecrement?: () => void;
      }
  );
