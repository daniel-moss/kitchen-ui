import { ReactNode } from "react";

import { ItemTextLineColor } from "../ItemText/ItemTextLine.types";

/**
 * ItemValue has no properties of its own — everything it shows belongs to the
 * `ItemTextLine` inside it, so these props forward straight through. The
 * chevron is the one thing it adds, and it is not configurable.
 */
export interface ItemValueProps {
  /** The value text. A row with no value yet shows its placeholder copy here. */
  value?: ReactNode;
  /**
   * Value color. Default "strong"; use "placeholder" for a value that is not
   * set. The chevron never follows it.
   */
  color?: ItemTextLineColor;
  /**
   * Optional slot before the value — an Avatar or an Icon, with the same
   * defaults as any `ItemTextLine` slot. An Icon here DOES follow the value's
   * color, because it sits inside the line.
   */
  slotLeft?: ReactNode;
  className?: string;
}
