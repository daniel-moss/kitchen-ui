import { MouseEvent as ReactMouseEvent } from "react";
import clsx from "clsx";

import { Divider } from "../Divider/Divider";

import styles from "./PopoverFooter.module.scss";
import { PopoverFooterProps } from "./PopoverFooter.types";

// Is a real TEXT-ENTRY field focused — i.e. is an on-screen keyboard up? Same
// test the drawer's bottom-inset rule uses (`input:not([readonly])`), so a
// SelectField (a role=button div) or a DateField (a readOnly input opening the
// calendar) does not count.
const textFieldFocused = (node: Element | null) =>
  (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) && !node.readOnly;

// Tapping a footer button while the keyboard is up used to do nothing but
// dismiss the keyboard (real iPhone, 2026-08-19). iOS blurs the focused field as
// the DEFAULT ACTION of mousedown; the blur dismisses the keyboard, the sheet
// grows back to full height, and the FOOTER MOVES DOWN out from under the
// finger — so the click iOS synthesizes ~300ms later carries a stale hit-test
// and never reaches the button. Preventing that one default keeps focus where it
// is: nothing moves, the click lands, and the keyboard goes away with the sheet
// a moment later.
//
// mousedown, NOT pointerdown: preventing a touch pointerdown can suppress the
// compatibility mouse events altogether — including the click we need.
// The option rows need none of this; SelectListItem already activates on
// pointerup, which is why they keep working while this button did not.
const keepFocusThroughTap = (e: ReactMouseEvent<HTMLDivElement>) => {
  // Only while a keyboard is actually up, so ordinary footers behave as before.
  if (!textFieldFocused(document.activeElement)) return;
  // …and never swallow a tap meant to focus a field inside the footer itself.
  if (textFieldFocused(e.target as Element)) return;
  e.preventDefault();
};

// Action bar for popover-like containers (Popover, Dialog, SidePanel, …). A
// full-width Divider on top plus a Body row of buttons. An optional leading
// Cancel (ghost) is pinned far left; the trailing buttons hug the right edge
// (or stretch to fill the width in the navigation/mobile variant).
// See Kitchen UI/components/popover-footer.md.
//
// `medium` (--gray-a4) since 2026-08-20, Daniel — it was `low` (--gray-a3), and
// PopoverHeader's bottom line moved with it so the two stay a pair. FLAGGED: the
// Figma component still draws --gray-a3 (node 24979-75098), so the node needs
// the same change.
export default function PopoverFooter({
  children,
  leadingButton,
  stretch = false,
  className,
}: PopoverFooterProps) {
  return (
    <div className={clsx(styles.footer, className)} onMouseDown={keepFocusThroughTap}>
      <Divider orientation="horizontal" contrast="medium" />
      <div className={clsx(styles.body, { [styles.stretch]: stretch })}>
        {leadingButton}
        <div className={styles.buttons}>{children}</div>
      </div>
    </div>
  );
}
