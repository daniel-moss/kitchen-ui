import { isValidElement, KeyboardEvent, MouseEvent } from "react";
import clsx from "clsx";

import useControllableState from "../../hooks/useControllableState";
import { Icon } from "../Icon/Icon";
import { Divider } from "../Divider/Divider";
import AlertBanner from "../AlertBanner/AlertBanner";
import EmptyState from "../EmptyState/EmptyState";
import TruncatingText from "../Tooltip/TruncatingText";

import styles from "./DisplayModule.module.scss";
import { DisplayModuleProps } from "./DisplayModule.types";

// DisplayModule — a card section with a header + body. `default` stacks header /
// divider / body; `accordion` makes the header an interactive toggle that
// collapses the body; `bodyOnly` is just the body. An optional status ring and
// alert banner wrap it, like Card. See Figma "DisplayModule".
export default function DisplayModule({
  variant = "default",
  title,
  titleSlotRight,
  caption,
  slotLeft,
  slotRight,
  content,
  bodyPadded = true,
  error = false,
  onRetry,
  status = "none",
  banner,
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  className,
  ...rest
}: DisplayModuleProps) {
  const [isOpen, setOpen] = useControllableState(open, defaultOpen, onOpenChange);

  const toggle = () => setOpen(!isOpen);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  // Any real status draws the ring; a banner needs one too.
  const hasStatus = status !== "none";
  const showBanner = banner != null && hasStatus;

  const header = (
    <div className={styles.header}>
      {slotLeft != null && <div className={styles.slotLeft}>{slotLeft}</div>}
      <div className={styles.copy}>
        <div className={styles.title}>
          {/* A string title truncates with a full-text tooltip on hover (like
              PopoverHeader); a node title falls back to a plain truncating span. */}
          {typeof title === "string" ? (
            <TruncatingText text={title} className={styles.titleText} />
          ) : (
            <span className={styles.titleText}>{title}</span>
          )}
          {titleSlotRight != null && <span className={styles.titleSlot}>{titleSlotRight}</span>}
        </div>
        {/* caption and the title badge are mutually exclusive; the badge wins. */}
        {caption != null && titleSlotRight == null && <span className={styles.caption}>{caption}</span>}
      </div>
      {slotRight != null && (
        <div className={styles.slotRight} onClick={(e: MouseEvent) => e.stopPropagation()}>
          {slotRight}
        </div>
      )}
    </div>
  );

  const bannerNode = showBanner ? (
    <AlertBanner
      type="banner"
      status={status}
      orientation={banner.ctaLabel ? "horizontal" : "vertical"}
      ctaLabel={banner.ctaLabel as string}
      ctaHref={banner.ctaHref}
      ctaOnClick={banner.ctaOnClick}
      onDismiss={banner.onDismiss}
    >
      {banner.children}
    </AlertBanner>
  ) : null;

  // "No fetching data" — the body shows the same error view as Dialog / Card.
  const bodyContent = error ? (
    <EmptyState
      error
      icon="circle-xmark"
      title="Hmm, something went wrong"
      caption="An error occurred while fetching data"
      primaryAction={{ label: "Reload", leftIcon: "arrows-rotate", onClick: onRetry }}
    />
  ) : (
    content
  );

  // An EmptyState body (the error state's, or one passed as `content`) brings
  // its own 32px padding — don't add the default content padding around it.
  // `bodyPadded={false}` says the same thing for any other content.
  const isEmptyStateContent = isValidElement(content) && content.type === EmptyState;
  const bodyClass = clsx(styles.body, (error || isEmptyStateContent || !bodyPadded) && styles.bodyFlush);

  let body;
  if (variant === "bodyOnly") {
    body = <div className={bodyClass}>{bodyContent}</div>;
  } else if (variant === "accordion") {
    body = (
      <>
        <div
          className={clsx(styles.headerRow, isOpen && styles.open, disabled && styles.disabled)}
          role="button"
          tabIndex={disabled ? undefined : 0}
          aria-expanded={isOpen}
          aria-disabled={disabled || undefined}
          onClick={disabled ? undefined : toggle}
          onKeyDown={disabled ? undefined : onKeyDown}
        >
          <span className={clsx(styles.caret, isOpen && styles.caretOpen)}>
            <Icon icon="caret-down" pack="solid" size={14} />
          </span>
          {header}
        </div>
        <div className={clsx(styles.collapse, isOpen && styles.collapseOpen)}>
          <div className={styles.collapseInner}>
            <Divider />
            <div className={bodyClass}>{bodyContent}</div>
          </div>
        </div>
      </>
    );
  } else {
    body = (
      <>
        <div className={styles.headerRow}>{header}</div>
        <Divider />
        <div className={bodyClass}>{bodyContent}</div>
      </>
    );
  }

  return (
    <div
      className={clsx(
        styles.module,
        variant === "accordion" && styles.accordion,
        showBanner && styles.hasBanner,
        hasStatus && styles.ring,
        hasStatus && styles[status],
        className,
      )}
      {...rest}
    >
      {bannerNode}
      {body}
    </div>
  );
}
