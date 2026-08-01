import { HTMLAttributes } from "react";

export interface HintTriggerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Icon name. Default "circle-info". */
  icon?: string;
  /** Force the hover look (for stories). */
  _isHovered?: boolean;
}
