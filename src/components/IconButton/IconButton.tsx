import clsx from "clsx";
import { forwardRef } from "react";

import debounce from "../../utils/debounce";

import { Icon } from "../Icon/Icon";

import styles from "./IconButton.module.scss";
import { IconButtonProps } from "./IconButton.types";

function IconButtonRoot(props: IconButtonProps, ref: React.Ref<HTMLButtonElement>) {
  const {
    icon = "diamonds-4",
    iconPack = "regular",
    iconClassName,
    size = "md",
    variant = "solid",
    type = "button",
    className,

    isTabbable = true,

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

  // Icon size is strict: always 14px, regardless of the container size.
  const iconSize = 14;

  return (
    <button
      className={clsx(
        styles.base,
        className,
        {
          [styles.isProcessing]: isProcessing,
          [styles.isLoading]: isLoading,
          [styles.isFocused]: _isFocused,
          [styles.isHovered]: _isHovered,
          [styles.isPressed]: isPressed,
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
      {isProcessing ? (
        // Processing: spinning spinner-third. Square dims never change, so the
        // icon just swaps in place (no width juggling like Button).
        <Icon icon="spinner-third" pack={variant === "solid" ? "solid" : "regular"} spin size={iconSize} />
      ) : (
        // Loading reuses Icon's own placeholder (a pulsing solid circle); the
        // fill is set per variant via --ku-skeleton-fill in the SCSS.
        <Icon icon={icon} pack={iconPack} className={iconClassName} size={iconSize} isLoading={isLoading} />
      )}
    </button>
  );
}

const IconButton = forwardRef(IconButtonRoot);

export default IconButton;
