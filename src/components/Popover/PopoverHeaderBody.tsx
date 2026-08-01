import clsx from "clsx";

import IconButton from "../IconButton/IconButton";
import HoverTooltip from "../Tooltip/HoverTooltip";

import styles from "./PopoverHeaderBody.module.scss";
import { PopoverHeaderBodyProps } from "./PopoverHeaderBody.types";

// The Body row of a PopoverHeader: an optional back button, the Content, and an
// optional close button. The close button ALWAYS shows a "Close" tooltip on
// hover/focus (rendered above everything via a portal).
export default function PopoverHeaderBody({
  children,
  back = false,
  close = true,
  onBack,
  onClose,
  className,
}: PopoverHeaderBodyProps) {
  return (
    <div className={clsx(styles.body, className)}>
      {back && (
        <span className={styles.back}>
          <IconButton variant="ghost" size="md" icon="arrow-left" aria-label="Back" onClick={onBack} />
        </span>
      )}

      <div className={styles.content}>{children}</div>

      {close && (
        <HoverTooltip text="Close" className={styles.close}>
          <IconButton variant="muted" size="md" icon="xmark" aria-label="Close" onClick={onClose} />
        </HoverTooltip>
      )}
    </div>
  );
}
