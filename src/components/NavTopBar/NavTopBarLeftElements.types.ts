import { MouseEvent, ReactNode } from "react";

export interface NavTopBarLeftElementsProps {
  /** The title assembly — a `NavTopBarTitle` element. */
  children: ReactNode;
  /** Left slot: the back IconButton (arrow-left, 32 ghost). Shown when set. */
  onBack?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Right slot: the actions IconButton (ellipsis, 32 ghost). Shown when set. */
  onActions?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** The actions button shows its pressed look — e.g. while its menu is open. */
  actionsPressed?: boolean;
  className?: string;
}
