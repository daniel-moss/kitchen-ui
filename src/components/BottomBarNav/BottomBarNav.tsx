import clsx from "clsx";

import useIsDesktop from "../../hooks/useIsDesktop";
import { Divider } from "../Divider/Divider";

import styles from "./BottomBarNav.module.scss";
import { BottomBarNavProps } from "./BottomBarNav.types";

// BottomBarNav — the mobile bottom navigation bar: a top Divider separating
// it from the content, then the items sharing the width (each capped at
// 112px, centered), 8px padding. MOBILE ONLY (≤ 1024px) — on desktop it
// renders nothing (the SidebarNav is the desktop navigation). The consumer
// fixes it to the bottom of the screen; the safe area below comes from the
// shared drawer inset variable (PhoneViewport computes it, DeviceFrame mocks
// it). See Figma "BottomBarNav".
export default function BottomBarNav({ children, breakpoint = "auto", className }: BottomBarNavProps) {
  const isDesktop = useIsDesktop(breakpoint);
  if (isDesktop) return null;

  return (
    <nav className={clsx(styles.bar, className)}>
      <Divider contrast="medium" />
      <div className={styles.inner}>{children}</div>
    </nav>
  );
}
