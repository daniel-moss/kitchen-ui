import { ReactNode } from "react";

import { ListItemContentProps } from "./ListItemContent.types";

/**
 * The body of a ListItem: the content region (its props are flattened here)
 * plus an optional right slot.
 */
export interface ListItemBodyProps extends ListItemContentProps {
  /**
   * Right slot — up to 3 instances, 8px apart, vertically centered on the
   * 40px row. Supported instances: ListItemSlotIcon (open / open-in-tab),
   * ListItemSlotProgress (a ProgressRing in its 32px box), IconButton (md),
   * Button (subtle lg), TabGroup (contained lg), SelectField (width adapts to
   * its value), Toggle, AvatarUser (lg), AvatarLive, or an AvatarGroup (lg).
   * TextField / DateField come later.
   */
  slotRight?: ReactNode;
}
