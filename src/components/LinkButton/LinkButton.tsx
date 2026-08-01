import { forwardRef, MouseEvent, Ref } from "react";
import clsx from "clsx";

import debounce from "../../utils/debounce";

import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";
import { Icon } from "../Icon/Icon";

import styles from "./LinkButton.module.scss";
import { LinkButtonProps } from "./LinkButton.types";

// An inline, underlined text link styled as a button. Renders a real <a> when
// `href` is given (navigation), otherwise a <button> (action). See
// Kitchen UI/components/link-button.md.
function LinkButtonRoot(props: LinkButtonProps, ref: Ref<HTMLAnchorElement | HTMLButtonElement>) {
  const {
    children,
    size = "md",
    colorScheme = "black",
    className,

    leftIcon,
    leftIconClassName,
    rightIcon,
    rightIconClassName,

    href,
    target,
    rel,
    type = "button",

    onClick,
    noDebounce = false,

    isTabbable = true,
    isDisabled = false,
    isLoading = false,

    _isHovered = false,
    isPressed = false,
    _isFocused = false,

    ...rest
  } = props;

  const iconSize = 14;
  const isLink = href !== undefined;
  const inactive = isDisabled || isLoading;

  const classes = clsx(
    styles.base,
    styles[`${size}Size`],
    styles[`${colorScheme}Scheme`],
    {
      [styles.isLoading]: isLoading,
      [styles.isDisabled]: isDisabled,
      [styles.isHovered]: _isHovered,
      [styles.isPressed]: isPressed,
      [styles.isFocused]: _isFocused,
    },
    className,
  );

  const handleClick =
    onClick && !noDebounce ? debounce((event: MouseEvent<HTMLElement>) => onClick(event)) : onClick;

  const content = (
    <>
      {leftIcon && (
        <span className={styles.icon}>
          <Icon icon={leftIcon} className={leftIconClassName} pack="regular" size={iconSize} isLoading={isLoading} />
        </span>
      )}

      {isLoading ? (
        <SkeletonTypography variant={size === "sm" ? "captionMD" : "bodyCompact"} width={size === "sm" ? 44 : 48} />
      ) : (
        <span className={styles.label}>{children}</span>
      )}

      {rightIcon && (
        <span className={styles.icon}>
          <Icon icon={rightIcon} className={rightIconClassName} pack="regular" size={iconSize} isLoading={isLoading} />
        </span>
      )}
    </>
  );

  if (isLink) {
    return (
      <a
        className={classes}
        href={inactive ? undefined : href}
        target={target}
        rel={rel}
        onClick={handleClick}
        aria-disabled={isDisabled || undefined}
        aria-busy={isLoading || undefined}
        tabIndex={isTabbable && !inactive ? undefined : -1}
        ref={ref as Ref<HTMLAnchorElement>}
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      className={classes}
      type={type}
      onClick={handleClick}
      disabled={inactive}
      aria-busy={isLoading || undefined}
      aria-pressed={isPressed || undefined}
      tabIndex={isTabbable && !inactive ? 0 : -1}
      ref={ref as Ref<HTMLButtonElement>}
      {...rest}
    >
      {content}
    </button>
  );
}

const LinkButton = forwardRef(LinkButtonRoot);

export default LinkButton;
