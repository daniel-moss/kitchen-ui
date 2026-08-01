import { CSSProperties, forwardRef, KeyboardEvent, MouseEvent } from "react";
import clsx from "clsx";

import AlertBanner from "../AlertBanner/AlertBanner";
import EmptyState from "../EmptyState/EmptyState";

import styles from "./Card.module.scss";
import { CardProps } from "./Card.types";

// An interactive container for any kind of content. Optional alert ring (a 1px
// status-colored border) and alert banner (pinned at the top). Non-interactive
// while disabled or loading; shows an error EmptyState when content fails to
// load. See Figma "Card".
const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    children,
    onClick,
    status = "info",
    ring = false,
    banner,
    padding = 16,
    disabled = false,
    loading = false,
    dragging = false,
    error = false,
    onRetry,
    className,
    bodyClassName,
    style,
    ...rest
  },
  ref,
) {
  // Not interactive while disabled, loading, dragging, or showing the error state.
  const interactive = !disabled && !loading && !error && !dragging;
  // A banner always carries its matching ring.
  const showRing = ring || !!banner;

  const bodyStyle: CSSProperties = {
    padding: typeof padding === "number" ? `${padding}px` : padding,
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || !onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(e as unknown as MouseEvent<HTMLElement>);
    }
  };

  const body = error ? (
    // Content failed to load — the same error view used by Dialog.
    <div className={clsx(styles.body, banner && styles.bodyUnderBanner, bodyClassName)} style={bodyStyle}>
      <EmptyState
        error
        icon="circle-xmark"
        title="Hmm, something went wrong"
        caption="An error occurred while fetching data"
        primaryAction={{ label: "Reload", leftIcon: "arrows-rotate", onClick: onRetry }}
      />
    </div>
  ) : (
    <div
      className={clsx(styles.body, banner && styles.bodyUnderBanner, bodyClassName)}
      style={bodyStyle}
      onClick={interactive ? onClick : undefined}
      onKeyDown={handleKeyDown}
      role={interactive && onClick ? "button" : undefined}
      tabIndex={interactive && onClick ? 0 : undefined}
    >
      {children}
    </div>
  );

  return (
    <div
      ref={ref}
      className={clsx(
        styles.card,
        interactive && styles.interactive,
        disabled && styles.disabled,
        loading && styles.loading,
        dragging && styles.dragging,
        showRing && styles.ring,
        showRing && styles[status],
        className,
      )}
      style={style}
      {...rest}
    >
      {banner && (
        <AlertBanner
          type="banner"
          status={status}
          orientation={banner.ctaLabel ? "horizontal" : "vertical"}
          ctaLabel={banner.ctaLabel as string}
          ctaHref={banner.ctaHref}
          ctaOnClick={banner.ctaOnClick}
          onDismiss={banner.onDismiss}
          // The banner sits outside the interactive body: its clicks never
          // trigger the card's onClick, and it gets no hover/press tint.
          onClick={(e) => e.stopPropagation()}
        >
          {banner.children}
        </AlertBanner>
      )}
      {body}
    </div>
  );
});

export default Card;
