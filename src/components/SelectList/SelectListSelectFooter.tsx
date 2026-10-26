import { ReactNode } from "react";

import Button from "../Button/Button";
import SelectListFooter from "./SelectListFooter";

/**
 * The "Select N" footer of a multi-select SelectList DRAWER — the visible
 * action of the standard multi-select behaviour on mobile (Figma "Labels"
 * SelectList 12921-10208 and "New Job" Equipment 17189-78623; Daniel
 * 2026-10-26). A solid "Select N" counts the options that WILL be selected;
 * pressing it closes the list, and closing applies (see `useSelectionDraft`).
 * There is no Cancel on mobile: swiping the drawer down applies too.
 *
 * - no `slotLeft`: the button fills the row (Figma ActionBar `fullWidth`).
 * - `slotLeft`: one ghost action on the left (e.g. "Add equipment"), the
 *   button on the right (ActionBar `slotLeft`).
 *
 * The desktop inline card shows NO such button — closing it applies.
 */
export interface SelectListSelectFooterProps {
  /** How many options are selected in the draft. */
  count: number;
  /** Closes the list (closing applies the draft). */
  onSelect: () => void;
  /** Optional ghost lg Button on the left, e.g. "Add equipment". */
  slotLeft?: ReactNode;
}

export default function SelectListSelectFooter({ count, onSelect, slotLeft }: SelectListSelectFooterProps) {
  const button = (
    <Button size="lg" variant="solid" onClick={onSelect}>
      {`Select ${count}`}
    </Button>
  );
  return slotLeft != null ? (
    <SelectListFooter variant="actionBar" slotLeft={slotLeft}>
      {button}
    </SelectListFooter>
  ) : (
    <SelectListFooter variant="actionBar" stretch>
      {button}
    </SelectListFooter>
  );
}
