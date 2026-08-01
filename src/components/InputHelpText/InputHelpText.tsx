import clsx from "clsx";

import { Icon } from "../Icon/Icon";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";

import styles from "./InputHelpText.module.scss";
import { InputHelpTextProps, InputHelpTextStatus } from "./InputHelpText.types";

// The status icon per non-neutral status (Font Awesome regular).
const STATUS_ICON: Record<Exclude<InputHelpTextStatus, "neutral">, string> = {
  info: "circle-info",
  success: "circle-check",
  warning: "triangle-exclamation",
  error: "circle-xmark",
};

// A help-text line below an input or group. Colored by status, with an optional
// left icon (the status icon, or a custom one for neutral) and a loading
// skeleton. See Figma "InputHelpText".
export default function InputHelpText({
  children,
  status = "neutral",
  slotLeft = false,
  icon,
  isLoading = false,
  className,
  ...rest
}: InputHelpTextProps) {
  const leftIcon = status === "neutral" ? icon : STATUS_ICON[status];
  const showIcon = slotLeft && !isLoading && leftIcon != null;

  return (
    <div className={clsx(styles.help, styles[status], className)} {...rest}>
      {isLoading ? (
        <SkeletonTypography variant="captionSM" />
      ) : (
        <>
          {showIcon && (
            <span className={styles.icon}>
              <Icon icon={leftIcon} size={14} />
            </span>
          )}
          <span className={styles.text}>{children}</span>
        </>
      )}
    </div>
  );
}
