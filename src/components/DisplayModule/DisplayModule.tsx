import { Children, cloneElement, Fragment, isValidElement, KeyboardEvent, MouseEvent, ReactElement, ReactNode } from "react";
import clsx from "clsx";

import ItemTextBlock from "../ItemText/ItemText/ItemTextBlock";
import useControllableState from "../../hooks/useControllableState";
import { Icon } from "../Icon/Icon";
import { Divider } from "../Divider/Divider";
import AlertBanner from "../AlertBanner/AlertBanner";
import EmptyState from "../EmptyState/EmptyState";
import HoverTooltip from "../Tooltip/HoverTooltip";
import IconButton from "../IconButton/IconButton";
import TruncatingText from "../Tooltip/TruncatingText";

import styles from "./DisplayModule.module.scss";
import { DisplayModuleProps } from "./DisplayModule.types";

// ---- the header's Copy / Edit tooltips --------------------------------------
// A "copy" or "pen" IconButton in the header is always the same two actions, so
// the module gives them their tooltips itself rather than leaving every caller
// to remember (Daniel, 2026-09-28 — half the call sites had one and half did
// not). A button the caller has ALREADY wrapped in a HoverTooltip is left
// exactly as it is, so a more specific label ("Add warranty") still wins.
const HEADER_TOOLTIP: Record<string, string> = { copy: "Copy", pen: "Edit" };

/**
 * Fragments have to be unwrapped first: `Children.map` does NOT look inside
 * `<>…</>`, so a header that passes two buttons in a fragment would reach this
 * as ONE child and neither would get a tooltip (the SidePanelNavigation
 * gotcha).
 */
function flatten(node: ReactNode): ReactNode[] {
  return Children.toArray(node).flatMap((child) =>
    isValidElement(child) && child.type === Fragment ? flatten((child.props as { children?: ReactNode }).children) : [child],
  );
}

function withHeaderTooltips(slot: ReactNode): ReactNode {
  return flatten(slot).map((child, index) => {
    if (!isValidElement(child)) return child;
    if (child.type === HoverTooltip) return child;
    const props = child.props as { icon?: string };
    const text = child.type === IconButton && props.icon != null ? HEADER_TOOLTIP[props.icon] : undefined;
    if (text == null) return child;
    return (
      <HoverTooltip key={child.key ?? index} text={text}>
        {cloneElement(child as ReactElement)}
      </HoverTooltip>
    );
  });
}

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
        {/* The copy is ItemText — the title truncates with a full-text hover
            tooltip, and caption and the title badge stay mutually exclusive
            (the badge wins). */}
        <ItemTextBlock
          variant={caption != null && titleSlotRight == null ? "titleCaption" : "title"}
          title={title}
          titleSlotRight={titleSlotRight}
          caption={caption != null && titleSlotRight == null ? caption : undefined}
          captionLines="wrap"
        />
      </div>
      {slotRight != null && (
        <div className={styles.slotRight} onClick={(e: MouseEvent) => e.stopPropagation()}>
          {withHeaderTooltips(slotRight)}
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
      ctaIcon={banner.ctaIcon}
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
