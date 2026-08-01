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
  /** The buttons row — e.g. a stretched Button + an ellipsis IconButton. */
  children: ReactNode;
  className?: string;
}

export default function ActionBar({ placement = "top", children, className }: ActionBarProps) {
  return (
    <div className={clsx(styles.root, className)}>
      {placement === "bottom" && <Divider />}
      <div className={clsx(styles.buttons, placement === "bottom" && styles.bottom)}>{children}</div>
      {placement === "top" && <Divider />}
    </div>
  );
}
