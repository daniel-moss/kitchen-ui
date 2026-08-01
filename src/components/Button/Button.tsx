import clsx from "clsx";
import { forwardRef } from "react";

import debounce from "../../utils/debounce";

import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";
import { Icon } from "../Icon/Icon";

import styles from "./Button.module.scss";
import { ButtonProps } from "./Button.types";

function ButtonRoot(props: ButtonProps, ref: React.Ref<HTMLButtonElement>) {
  const {
    children,
    size,
    variant,
    type = "button",
    className,

    isTabbable = true,
    isFullWidth = false,

    leftIcon,
    leftIconPack,
    leftIconClassName,
    rightIcon,
    rightIconPack,
    rightIconClassName,

    onClick,
    noDebounce = false,

    _isFocused = false,
    _isHovered = false,
    isPressed = false,
    isProcessing = false,
    isDisabled = false,
    isLoading = false,

    ...rest
  } = props;

  const iconSize = 14;

  return (
    <button
      className={clsx(
        styles.base,
        className,
        {
          [styles.isLoading]: isLoading,
          [styles.isProcessing]: isProcessing,
          [styles.isFocused]: _isFocused,
          [styles.isHovered]: _isHovered,
          [styles.isPressed]: isPressed,
          [styles.fullWidth]: isFullWidth,
        },
        styles[`${variant}Variant`],
        styles[`${size}Size`],
      )}
      type={type}
      onClick={
        onClick && !noDebounce
          ? debounce((event: React.MouseEvent<HTMLButtonElement>) => onClick(event))
          : onClick
      }
      disabled={isDisabled || isProcessing || isLoading}
      aria-disabled={isDisabled}
      aria-busy={isProcessing}
      aria-pressed={isPressed}
      tabIndex={isTabbable && !isDisabled ? 0 : -1}
      ref={ref}
      {...rest}
    >
      {leftIcon && (
        <span className={clsx({ [styles.iconHidden]: isProcessing })}>
          <Icon icon={leftIcon} pack={leftIconPack} className={leftIconClassName} size={iconSize} isLoading={isLoading} />
        </span>
      )}

      {children && (
        <span className={clsx({ [styles.childrenHidden]: isProcessing })}>
          {isLoading ? (
            <span className={styles.contentSkeleton}>
              <SkeletonTypography variant="bodyCompact" width={40} />
            </span>
          ) : (
            children
          )}
        </span>
      )}

      {isProcessing && (
        <span className={styles.spinnerWrapper}>
          <Icon icon="spinner-third" pack={variant === "solid" ? "solid" : "regular"} spin size={iconSize} />
        </span>
      )}

      {rightIcon && (
        <span className={clsx({ [styles.iconHidden]: isProcessing })}>
          <Icon icon={rightIcon} pack={rightIconPack} className={rightIconClassName} size={iconSize} isLoading={isLoading} />
        </span>
      )}
    </button>
  );
}

const Button = forwardRef(ButtonRoot);

export default Button;
