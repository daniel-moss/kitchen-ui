import { ReactNode } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";

export interface NavBottomBarProps {
  /**
   * The NavBottomBarItem elements. They share the width (capped at 112px
   * each) and stay centered. Only ONE item should be `active` at a time.
   */
  children: ReactNode;
  /**
   * The bar exists ONLY on mobile (≤ 1024px) — on desktop it renders
   * nothing (the NavSidebar takes over). "auto" (default) follows the
   * viewport; "mobile" forces it (stories, tests).
   */
  breakpoint?: Breakpoint;
  className?: string;
}
