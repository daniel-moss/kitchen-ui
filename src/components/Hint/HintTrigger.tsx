import clsx from "clsx";

import { Icon } from "../Icon/Icon";

import styles from "./HintTrigger.module.scss";
import { HintTriggerProps } from "./HintTrigger.types";

// A small hint icon (circle-info) with a hover color swap and a 32×32 hit area.
// It's the trigger — wire hover/focus (desktop) or tap (mobile) to open a Hint
// or Tooltip. (See hint-trigger.md.)
export default function HintTrigger({
  icon = "circle-info",
  _isHovered = false,
  className,
  ...rest
}: HintTriggerProps) {
  return (
    <span
      className={clsx(styles.trigger, { [styles.hovered]: _isHovered }, className)}
      role="button"
      tabIndex={0}
      aria-label="More info"
      {...rest}
    >
      <Icon icon={icon} pack="solid" size={14} />
    </span>
  );
}
