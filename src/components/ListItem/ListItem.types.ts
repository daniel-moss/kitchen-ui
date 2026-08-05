import { MouseEvent, ReactNode } from "react";

import { ListItemBodyProps } from "./ListItemBody.types";

interface ListItemBaseProps extends ListItemBodyProps {
  /** Dimmed, non-interactive. For the interactive variants. */
  disabled?: boolean;
}

/**
 * Bottom-slot axis. The bottom instance is a MOBILE-ONLY layout adaptation
 * (Figma ListItem doc, "Bottom elements"), so a row that carries one has to
 * stay plain: it must not be clickable, draggable, or an accordion. That rule
 * is enforced here — `slotBottom` only type-checks on the static row.
 */
type ListItemBottomProps =
  | {
      /**
       * Bottom slot — exactly ONE instance, stretched to the full row width:
       * a Button (subtle lg, isFullWidth), a TabGroup (contained, isFullWidth),
       * or a SelectField (isFullWidth). TextField / DateField come later.
       * Only allowed on a static row.
       */
      slotBottom?: ReactNode;
      isClickable?: false;
      isDraggable?: false;
      isAccordion?: false;
    }
  | { slotBottom?: never };

/**
 * Clickable axis. With `isClickable` the row is a button (hover / press /
 * focus states); right-slot and bottom-slot clicks do not trigger it. With
 * `toggle`, the WHOLE row is an on/off switch (a Toggle in the right slot
 * always means a clickable row) — like MenuItem's toggle.
 */
type ListItemClickProps =
  | {
      isClickable?: false;
      onClick?: never;
      toggle?: never;
      checked?: never;
      defaultChecked?: never;
      onCheckedChange?: never;
      toggleDisabled?: never;
    }
  | {
      isClickable: true;
      onClick?: (event: MouseEvent<HTMLDivElement>) => void;
      toggle?: never;
      checked?: never;
      defaultChecked?: never;
      onCheckedChange?: never;
      toggleDisabled?: never;
    }
  | {
      isClickable: true;
      /**
       * The row is an on/off switch (role="switch"): clicking anywhere flips
       * the ToggleSwitch shown at the end of the right slot. Other `slotRight`
       * instances render before the switch; their clicks do NOT flip the row.
       */
      toggle: true;
      /** Controlled on/off state. */
      checked?: boolean;
      /** Uncontrolled initial state. Default false. */
      defaultChecked?: boolean;
      onCheckedChange?: (checked: boolean) => void;
      onClick?: (event: MouseEvent<HTMLDivElement>) => void;
      /**
       * Disables ONLY the switch: it dims and the row stops flipping it, but
       * the row itself stays alive (hover, drag, other slot instances) —
       * unlike `disabled`, which dims the whole row.
       */
      toggleDisabled?: boolean;
    };

/**
 * Draggable axis. `isDraggable` adds the grip handle on the left; the
 * `isDragging` look (lifted card) is driven by the consumer's drag-and-drop
 * state — the reorder wiring itself belongs to the future list container.
 * Freely combines with the clickable axis (clickable + draggable rows).
 */
type ListItemDragProps =
  | { isDraggable?: false; isDragging?: never }
  | {
      isDraggable: true;
      /** The lifted-card look while this row is being dragged. */
      isDragging?: boolean;
    };

/**
 * Accordion — the fifth variant, exclusive with the clickable / draggable
 * axes. The row is a collapsible header (caret + body); the children render
 * in the body region below a divider when open. Like DisplayModule's
 * accordion: open shows a gray-a2 container, the header keeps the clickable
 * states, and only the header dims when disabled.
 */
export type ListItemProps =
  | (ListItemBaseProps &
      ListItemClickProps &
      ListItemDragProps &
      ListItemBottomProps & {
        isAccordion?: false;
        open?: never;
        defaultOpen?: never;
        onOpenChange?: never;
        children?: never;
      })
  | (ListItemBaseProps & {
      isAccordion: true;
      /** Not available on an accordion — see `ListItemBottomProps`. */
      slotBottom?: never;
      /** Controlled open state. */
      open?: boolean;
      /** Uncontrolled initial state. Default false. */
      defaultOpen?: boolean;
      onOpenChange?: (open: boolean) => void;
      /** The collapsible body content, shown below a divider when open. */
      children?: ReactNode;
      /** Dimmed, non-interactive (the header only — the open body stays). */
      disabled?: boolean;
      isClickable?: never;
      onClick?: never;
      toggle?: never;
      checked?: never;
      defaultChecked?: never;
      onCheckedChange?: never;
      toggleDisabled?: never;
      isDraggable?: never;
      isDragging?: never;
    });
