import { ReactNode } from "react";

import clsx from "clsx";

import { Divider } from "../../components/Divider/Divider";

import styles from "./ActionBar.module.scss";

// Prototype-local component (Daniel's call: not part of the design system for
// now — it is not used widely enough). The primary-actions bar of a details
// page. Desktop: pinned on TOP of the details sidebar, divider below. Mobile:
// pinned at the BOTTOM of the screen, divider above; shown on any tab.
export interface ActionBarProps {
  /** "top" = the desktop sidebar bar; "bottom" = the mobile bottom bar. */
  placement?: "top" | "bottom";
  /**
   * Line the bar up with the navigation bar in the column next to it
   * (`placement="top"` only): 12px top/bottom padding, so the 36px buttons
   * make the row exactly 60px, and the bottom line drawn INSIDE the row as an
   * inset shadow instead of a Divider element under it. Both bars then end on
   * the same pixel.
   */
  matchNavBar?: boolean;
  /** The buttons row — e.g. a stretched Button + an ellipsis IconButton. */
  children: ReactNode;
  className?: string;
}

export default function ActionBar({ placement = "top", matchNavBar = false, children, className }: ActionBarProps) {
  const aligned = placement === "top" && matchNavBar;
  return (
    <div className={clsx(styles.root, className)}>
      {/* MEDIUM, not the default low contrast (Daniel, 2026-10-06): this line
          separates the bar from the page's content, the same weight the other
          structural dividers carry. */}
      {placement === "bottom" && <Divider contrast="medium" />}
      <div className={clsx(styles.buttons, placement === "bottom" && styles.bottom, aligned && styles.matchNavBar)}>
        {children}
      </div>
      {placement === "top" && !aligned && <Divider />}
    </div>
  );
}
