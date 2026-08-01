import clsx from "clsx";

import Popover from "../Popover/Popover";
import DrawerHeader from "../Popover/DrawerHeader";

import styles from "./Hint.module.scss";
import { HintProps } from "./Hint.types";

const ALIGN_CLASS = { start: styles.alignStart, center: styles.alignCenter, end: styles.alignEnd };
const TONGUE_CLASS = {
  top: styles.tongueTop,
  bottom: styles.tongueBottom,
  left: styles.tongueLeft,
  right: styles.tongueRight,
};

// Hint — an explanation attached to something on the screen. inline = the
// floating bubble: indicator (info/success/warning/error) + optional title +
// caption (or a free slot via children), with a tongue on any of the four
// sides (aligned start/center/end, 12px corner inset). drawer = the mobile
// presentation, a bottom sheet with the same content. Pure presentation —
// showing it on HintTrigger hover is HoverHint's job. See Figma "Hint".
export default function Hint({
  variant = "inline",
  state = "info",
  indicator = true,
  title,
  caption,
  children,
  tongue = "bottom",
  tongueAlignment = "center",
  open = true,
  onClose,
  className,
  style,
}: HintProps) {
  const content =
    children ?? (
      <div className={clsx(styles.text, variant === "drawer" && styles.textMobile)}>
        {indicator && <span className={clsx(styles.indicator, styles[state])} aria-hidden="true" />}
        <div className={styles.copy}>
          {title != null && <span className={styles.title}>{title}</span>}
          {caption != null && <span className={styles.caption}>{caption}</span>}
        </div>
      </div>
    );

  if (variant === "drawer") {
    return (
      <Popover drawer open={open} onClose={onClose} header={<DrawerHeader variant="dragHandle" />} className={className} style={style}>
        {content}
      </Popover>
    );
  }

  return (
    <div role="status" className={clsx(styles.hint, className)} style={style}>
      <div className={styles.body}>{content}</div>
      <span className={clsx(styles.tongue, TONGUE_CLASS[tongue], ALIGN_CLASS[tongueAlignment])} aria-hidden="true" />
    </div>
  );
}
