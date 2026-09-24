import { HTMLAttributes, ReactNode } from "react";

interface ItemGroupBaseProps extends HTMLAttributes<HTMLDivElement> {
  /** The items of the group — ListItems (list view) or Cards (cards view). */
  children: ReactNode;
  /**
   * Layout of the items. `list` (default) stacks ListItems vertically; `cards`
   * lays Cards out in a wrap grid (each card flexes 106–184px). `separated` is
   * list-only.
   */
  view?: "list" | "cards";
  /**
   * Cards view only: size the columns as if the group held this many cards
   * (instead of its own count). Set it to the largest count among sibling
   * groups so several groups in one module share ONE uniform card width.
   * Defaults to this group's own card count.
   */
  cardCountBasis?: number;
  className?: string;
}

/**
 * Items area. `separated` puts a divider between every two items (common in
 * settings) — a separated group can not be truncated.
 */
type ItemGroupItemsProps =
  | {
      separated?: false;
      /**
       * Show only the first N items plus a full-width "Show X more" button.
       * Expanding is two-way: once open the button becomes "Show less" and
       * collapses the group back to the first N.
       */
      truncateAfter?: number;
      /**
       * Enables drag-and-drop reorder: dragging a ListItem's grip handle
       * dims the original, floats a lifted copy, and marks the drop position
       * with a black line. Called on drop with the item's old and new index —
       * reorder your items array there (the group renders `children` as-is).
       * The items need `isDraggable`.
       */
      onReorder?: (fromIndex: number, toIndex: number) => void;
    }
  | { separated: true; truncateAfter?: never; onReorder?: never };

/**
 * Header. The accordion exists only in the labeled variant — it is the header
 * that collapses the group, so there has to be one. The bottom divider does
 * NOT need a label: stacked groups separate the same way whether or not they
 * are labeled (Figma, 2026-09-23).
 */
type ItemGroupHeaderProps =
  | {
      label?: undefined;
      /**
       * 1px divider at the very bottom of the group, inset 16px on each side.
       * Set it when another group renders below this one — the gap between
       * groups is 0, the divider does the separation.
       */
      divider?: boolean;
      isAccordion?: never;
      open?: never;
      defaultOpen?: never;
      onOpenChange?: never;
      disabled?: never;
    }
  | {
      /** A GroupLabel element shown as the group header (12px margins). */
      label: ReactNode;
      /**
       * 1px divider at the very bottom of the group, inset 16px on each side
       * (Figma). Set it when another group renders below this one — the gap
       * between groups is 0, the divider does the separation.
       */
      divider?: boolean;
      isAccordion?: false;
      open?: never;
      defaultOpen?: never;
      onOpenChange?: never;
      disabled?: never;
    }
  | {
      label: ReactNode;
      divider?: boolean;
      /**
       * The GroupLabel header becomes a toggle that expands / collapses the
       * items (the group injects the accordion props into the GroupLabel).
       *
       * An accordion is NEVER truncated — collapsing is what it does — so
       * `truncateAfter` does not type-check alongside it (the doc, "Accordion";
       * Figma has no accordion + truncated variant).
       */
      isAccordion: true;
      truncateAfter?: never;
      /** Controlled open state. */
      open?: boolean;
      /** Uncontrolled initial state. Default false. */
      defaultOpen?: boolean;
      onOpenChange?: (open: boolean) => void;
      /** Accordion only — the header is dimmed and non-interactive. */
      disabled?: boolean;
    };

export type ItemGroupProps = ItemGroupBaseProps & ItemGroupItemsProps & ItemGroupHeaderProps;
