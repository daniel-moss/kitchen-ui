import { ReactNode } from "react";

export interface PopoverFooterTextProps {
  /**
   * The label — `body-500-compact` (Inter Medium 14/20). Fills the space
   * between the footer edge and the buttons and truncates with an ellipsis
   * when it does not fit.
   */
  children: ReactNode;
  /**
   * Icon name shown before the label (any icon, e.g. "calendar"). 14px,
   * regular, `--size-2` (8px) gap to the label.
   */
  icon?: string;
  /**
   * The label color — any CSS color, normally a token
   * (`var(--text-subtle)`). Default `var(--text-strong)`.
   */
  color?: string;
  /**
   * The icon color, when it should differ from the label. Defaults to
   * `color`.
   */
  iconColor?: string;
  className?: string;
}
