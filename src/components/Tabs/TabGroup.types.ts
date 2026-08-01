import { HTMLAttributes, ReactNode } from "react";

import { TabItemOrientation, TabItemSize } from "./TabItem.types";

/** Figma's style names; mapped internally to the TabItem variant. */
export type TabGroupVariant = "default" | "contained" | "underlined";

export interface TabGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /**
   * default / contained (segmented track) / underlined. Default "default".
   * Note (Figma spec): underlined is defined for `sm`/`md` sizes only.
   */
  variant?: TabGroupVariant;
  /** Passed to every child TabItem. Default "md". */
  size?: TabItemSize;
  /**
   * Stack the icon over the label in each tab. Only the contained variant
   * supports it (matches TabItem), and it is specced for `lg`. Default
   * "horizontal".
   */
  orientation?: TabItemOrientation;

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
