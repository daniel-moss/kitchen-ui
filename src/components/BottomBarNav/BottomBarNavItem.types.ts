import { MouseEvent } from "react";

export interface BottomBarNavItemProps {
  /** Icon name (18px; regular — solid when active). */
  icon: string;
  /** Accessible name — the item is icon-only. */
  label: string;
  /** The current section: gray-a3 fill + solid icon. */
  active?: boolean;
  /**
   * Solid gray-12 icon at REST, no fill — the bar's Create button adjustment
   * (the doc: the icon "has an updated color and weight").
   */
  strong?: boolean;
  isDisabled?: boolean;
  /** Renders a real link when set, a button otherwise. */
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  className?: string;
}
