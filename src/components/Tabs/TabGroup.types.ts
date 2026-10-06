import { HTMLAttributes, ReactNode } from "react";

import { TabItemSize } from "./TabItem.types";

/**
 * Figma's style names; mapped internally to the TabItem variant. The segmented
 * look that used to be `contained` is its own component now — SegmentedControl.
 */
export type TabGroupVariant = "pill" | "underlined";

export interface TabGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /**
   * **pill** (a soft filled shape marks the selection) or **underlined** (a
   * line on the row's bottom edge). Default "pill".
   */
  variant?: TabGroupVariant;
  /**
   * Passed to every child TabItem. Default "md". The underlined style ignores
   * it — with no height and no horizontal padding, its sizes draw the same tab.
   */
  size?: TabItemSize;

  /** Selected tab value (controlled). */
  value?: string;
  /** Uncontrolled initial selected value. */
  defaultValue?: string;
  /** Called with the newly-selected tab value. */
  onChange?: (value: string) => void;

  /** TabItem children (each with a `value`). */
  children: ReactNode;

  /** Stretch to the container width; the tabs share it equally. Default false. */
  isFullWidth?: boolean;

  className?: string;
}
