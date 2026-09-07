import { MouseEvent } from "react";

export interface BottomBarNavItemProps {
  /** Icon name (18px; regular — solid when active). */
  icon: string;
  /** Accessible name — the item is icon-only. */
  label: string;
  /** The current section: gray-a3 fill + solid icon. */
  active?: boolean;
  isDisabled?: boolean;
  /** Renders a real link when set, a button otherwise. */
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  className?: string;
}
