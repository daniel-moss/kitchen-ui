import clsx from "clsx";

import { Icon } from "../Icon/Icon";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";
import TruncatingText from "../Tooltip/TruncatingText";

import styles from "./StepItem.module.scss";
import { StepItemProgress, StepItemProps } from "./StepItem.types";

// progress → the solid status icon. Colors + status line come from the SCSS.
const ICON: Record<StepItemProgress, string> = {
  incompleted: "circle-dashed",
  current: "circle-half-stroke",
  completed: "circle-check",
  warning: "warning",
  error: "circle-xmark",
};

// The progress states that draw a status line (incompleted has none).
const HAS_LINE: Record<StepItemProgress, boolean> = {
  incompleted: false,
  current: true,
  completed: true,
  warning: true,
  error: true,
};

// A single step in a Stepper. Interactive (a <button>) when given an onClick —
// otherwise a static <div>. See Figma "_StepItem".
export default function StepItem({
  progress,
  label,
  onClick,
  isDisabled = false,
  isLoading = false,
  _isHovered = false,
  _isFocused = false,
  isPressed = false,
  className,
  ...rest
}: StepItemProps) {
  const isButton = !!onClick && !isLoading;

  const classes = clsx(
    styles.step,
    styles[progress],
    {
      [styles.interactive]: isButton,
      [styles.isHovered]: _isHovered,
      [styles.isFocused]: _isFocused,
      [styles.isPressed]: isPressed,
      [styles.isDisabled]: isDisabled,
    },
    className,
  );

  const content = (
    <>
      <span className={styles.row}>
        <span className={styles.icon}>
          <Icon icon={ICON[progress]} pack="solid" size={14} isLoading={isLoading} />
        </span>
        {isLoading ? (
          <span className={styles.skeleton}>
            <SkeletonTypography variant="captionMD" />
          </span>
        ) : (
          <TruncatingText text={label} className={styles.label} />
        )}
      </span>
      {HAS_LINE[progress] && !isLoading && <span className={styles.line} aria-hidden />}
    </>
  );

  if (isButton) {
    return (
      <button type="button" className={classes} onClick={onClick} disabled={isDisabled} {...rest}>
        {content}
      </button>
    );
  }

  return (
    <div className={classes} aria-disabled={isDisabled || undefined} {...rest}>
      {content}
    </div>
  );
}
