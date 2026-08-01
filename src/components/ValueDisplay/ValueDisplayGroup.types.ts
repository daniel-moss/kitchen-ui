import { ReactNode } from "react";

export interface ValueDisplayGroupProps {
  /**
   * The ValueDisplays. The group splits them by `orientation` and enforces
   * the doc's order: horizontal pairs first (stacked 4px apart), then each
   * vertical pair as its own section — every section separated by a Divider
   * with 12px around it.
   */
  children: ReactNode;
  className?: string;
}
