import { Children, cloneElement, isValidElement, ReactElement, ReactNode, useLayoutEffect, useRef, useState } from "react";

import clsx from "clsx";

import AvatarGroup from "../../Avatar/AvatarGroup";
import { AvatarGroupProps } from "../../Avatar/AvatarGroup.types";
import AvatarUser from "../../Avatar/AvatarUser";
import Badge from "../../Badge/Badge";
import { SkeletonTypography } from "../../SkeletonTypography/SkeletonTypography";
import HoverTooltip from "../../Tooltip/HoverTooltip";
import styles from "./CellBody.module.scss";
import { CellBodyProps } from "./CellBody.types";

/** Shown when a text, number or badge cell has no value. */
const EMPTY_PLACEHOLDER = "—";

/** The assignee tooltip when nobody is assigned. */
const NO_ASSIGNEES = "No assignees";

// The assignee avatar is fixed at md. AvatarGroup's inline geometry (see
// AvatarGroup.tsx) puts each avatar `STEP` from the previous one and the last
// one takes the full `PX`, so n avatars occupy (n-1)*STEP + PX. Inverting that
// gives how many fit a measured width — the doc's "as many avatars as fit".
const AVATAR_PX = 28;
const AVATAR_STEP = AVATAR_PX - 2;

const avatarsThatFit = (width: number) => Math.max(1, Math.floor((width - AVATAR_PX) / AVATAR_STEP) + 1);

// Reports whether an element's content overflows it horizontally — what tells
// the cell that its copy is truncated and so needs the full-copy tooltip.
//
// The effect runs on EVERY render on purpose, with no dependency list. Turning
// the tooltip on wraps the value in HoverTooltip's own span, which unmounts the
// span this was watching and mounts a new one — with a dependency list the
// observer would be left on the detached node and the cell would stop
// responding to width changes. Re-measuring costs nothing: setting the same
// boolean bails out of the re-render.
function useTruncation() {
  const ref = useRef<HTMLSpanElement>(null);
  const [isTruncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el == null) return undefined;
    // A hidden or not-yet-laid-out element measures 0 — nothing to conclude.
    const measure = () => {
      if (el.clientWidth === 0) return;
      setTruncated(el.scrollWidth > el.clientWidth + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  });

  return { ref, isTruncated };
}

// The width the value actually has, so the assignee group can be sized to it.
// Same reason as above for re-running every render: the observed span is
// replaced when the tooltip wrapper appears around it.
function useContentWidth() {
  const ref = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el == null) return undefined;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  });

  return { ref, width };
}

/**
 * One data cell in a table body row.
 *
 * The cell owns its horizontal padding, its alignment and — when it is the last
 * pinned column — the boundary line on its right edge. It does NOT own its
 * height or the row divider: both belong to `TableRow`, and the cell fills the
 * height it is given, with its content centred vertically.
 *
 * `content` says what kind of value this is, and the cell applies that type's
 * rules itself: how it truncates, what an empty cell looks like, what it shows
 * while loading, and what it reveals on hover. That way a column cannot
 * disagree with itself — an empty money cell keeps the column's alignment, and
 * an empty assignee cell shows a dashed avatar rather than a text dash.
 *
 * WHAT THE CELL REVEALS ON HOVER. The cell is the trigger, not the value
 * inside it, so the whole cell responds. It shows, in order of precedence:
 * an explicit `tooltip` (the per-column case — extra data, no truncation
 * needed); "No assignees", or the full assignee stack, on an assignee cell;
 * every badge's copy, one per line, when badges have collapsed into "+N"; and
 * the full copy when text has been truncated. All of them are placed on top and
 * left-aligned. Tooltips are hover-only, so nothing is hidden behind a gesture
 * a touch device cannot make.
 */
export function CellBody({
  children,
  content = "text",
  align,
  colorScheme = "default",
  isTabular,
  width,
  isPinned = false,
  pinnedOffset = 0,
  isLastPinned = false,
  isLoading = false,
  slotLeft,
  slotRight,
  tooltip,
  className,
}: CellBodyProps) {
  // Numbers are a right-aligned, tabular column unless told otherwise.
  const resolvedAlign = align ?? (content === "number" ? "right" : "left");
  const resolvedTabular = isTabular ?? content === "number";

  const items = Children.toArray(children).filter((child) => child !== null && child !== "");
  const isEmpty = items.length === 0 || children === "";

  const { ref: textRef, isTruncated } = useTruncation();
  const { ref: contentRef, width: contentWidth } = useContentWidth();
  // The tooltip trigger is the CELL, so hovering anywhere in it — its side
  // padding included — reveals the value, and the tooltip is placed against the
  // cell's own box rather than against the content inside it.
  const cellRef = useRef<HTMLDivElement>(null);

  // The assignee group the caller passed, so the cell can both size it to the
  // width and name its people in the tooltip without the caller repeating the
  // list.
  const soleChild = items.length === 1 ? items[0] : null;
  const assigneeGroup =
    content === "assignee" && isValidElement(soleChild) && soleChild.type === AvatarGroup
      ? (soleChild as ReactElement<AvatarGroupProps>)
      : null;
  const assignees = assigneeGroup?.props.items;

  // How many WHOLE badges fit the width — the doc's rule (Daniel, 2026-09-04:
  // "The cell shows as many badges as fit the width... show as many as fit
  // and hide the rest under the '+N' badge"). Badges are never squeezed and
  // their widths vary with their copy, so the fit comes from REAL widths: a
  // hidden twin renders every badge plus the widest possible counter, and the
  // largest count whose row (with the counter, when one is needed) fits the
  // cell wins. The assignee cell's philosophy, with measurement in place of
  // fixed avatar geometry. Never fewer than one badge, and the equality guard
  // is what keeps the every-render effect (the file's convention) from
  // looping.
  const measureRef = useRef<HTMLSpanElement>(null);
  const [badgeFit, setBadgeFit] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (content !== "badge" || isEmpty || isLoading) return;
    const measurer = measureRef.current;
    const available = contentRef.current?.clientWidth ?? 0;
    if (measurer == null || available === 0) return;
    const widths = [...measurer.children].map((el) => (el as HTMLElement).offsetWidth);
    const counterWidth = widths.pop() ?? 0;
    const GAP = 6; // --size-1_5, the badge row's gap
    let fit = 1;
    for (let count = widths.length; count >= 1; count -= 1) {
      const badgesWidth = widths.slice(0, count).reduce((sum, w) => sum + w, 0) + (count - 1) * GAP;
      const rowWidth = badgesWidth + (count < widths.length ? GAP + counterWidth : 0);
      if (rowWidth <= available) {
        fit = count;
        break;
      }
    }
    setBadgeFit((current) => (current === fit ? current : fit));
  });

  // Badge copy for the tooltip: each Badge's own children, in order.
  const badgeLabels = items.map((item) =>
    isValidElement(item) ? ((item.props as { children?: ReactNode }).children ?? null) : item,
  );

  const renderValue = (): ReactNode => {
    if (isEmpty) {
      // An assignee column keeps its avatar shape when nobody is assigned; the
      // other types fall back to the dash.
      return content === "assignee" ? (
        <AvatarUser content="placeholder" size="md" />
      ) : (
        <span ref={textRef} className={clsx(styles.text, styles.subtle)}>
          {EMPTY_PLACEHOLDER}
        </span>
      );
    }

    // Badges: as many whole ones as FIT, the rest under "+N" (see the fit
    // measurement above). Until the first measurement lands they all render —
    // the layout effect resolves before paint, so nothing flashes.
    if (content === "badge") {
      const shown = badgeFit ?? items.length;
      if (shown < items.length) {
        return (
          <>
            {items.slice(0, shown)}
            <Badge>{`+${items.length - shown}`}</Badge>
          </>
        );
      }
    }

    // Assignees: the cell — not the caller — decides how many avatars fit the
    // width it ended up with; the rest become the group's counter. So a `max`
    // on the group is overridden, and callers need not pass one. Before the
    // first measurement the group is left as it came.
    if (assigneeGroup != null && assignees != null && contentWidth > 0) {
      return cloneElement(assigneeGroup, { max: avatarsThatFit(contentWidth) });
    }

    const value = items.length === 1 ? items[0] : children;

    // A plain string is the cell's own to style and truncate; a Badge or an
    // AvatarGroup brings its own look and is rendered untouched.
    return typeof value === "string" ? (
      <span ref={textRef} className={clsx(styles.text, { [styles.tabular]: resolvedTabular })}>
        {value}
      </span>
    ) : (
      value
    );
  };

  // While loading each content type shows a shape of its own kind, not a text
  // line: one badge for a badge column, one avatar for an assignee column.
  const renderLoading = (): ReactNode => {
    if (content === "badge") return <Badge isLoading>Loading</Badge>;
    if (content === "assignee") return <AvatarUser size="md" isLoading />;
    return <SkeletonTypography variant="bodyCompact" className={styles.skeleton} />;
  };

  // What hovering the cell reveals. An explicit `tooltip` always wins — that is
  // the per-column case, which does not depend on anything being truncated.
  const hover = (() => {
    if (tooltip != null) {
      return typeof tooltip === "string"
        ? ({ variant: "text", text: tooltip } as const)
        : ({ variant: "slot", content: tooltip } as const);
    }
    if (content === "assignee") {
      if (isEmpty) return { variant: "text", text: NO_ASSIGNEES } as const;
      if (assignees != null && assignees.length > 0) return { variant: "avatarGroup", items: assignees } as const;
      return null;
    }
    if (content === "badge" && !isEmpty && badgeFit != null && badgeFit < items.length) {
      return {
        variant: "slot",
        content: (
          <span className={styles.badgeTooltip}>
            {badgeLabels.map((label, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <span key={index}>{label}</span>
            ))}
          </span>
        ),
      } as const;
    }
    if (!isEmpty && isTruncated && typeof (items.length === 1 ? items[0] : children) === "string") {
      return { variant: "text", text: items[0] as string } as const;
    }
    return null;
  })();

  const body = (
    <span ref={contentRef} className={styles.content}>
      {slotLeft != null && <span className={styles.slotLeft}>{slotLeft}</span>}
      {renderValue()}
    </span>
  );

  return (
    <div
      ref={cellRef}
      role="cell"
      className={clsx(
        styles.cell,
        styles[resolvedAlign],
        styles[`${content}Content`],
        // The scheme lives on the CELL, so its colour reaches the value AND the
        // left slot's icon — the doc's rule that the icon inherits the colour
        // on every variant except "default" and "subtle".
        styles[colorScheme],
        { [styles.pinned]: isPinned, [styles.lastPinned]: isLastPinned },
        className,
      )}
      style={{
        ...(width === undefined ? undefined : { width, minWidth: width }),
        // The sticky offset — where this cell freezes while the table scrolls.
        ...(isPinned ? { left: pinnedOffset } : undefined),
      }}
    >
      {isLoading ? (
        renderLoading()
      ) : (
        <>
          {/* The measuring twin — every badge at natural width plus the widest
              possible counter. Hidden, out of flow, never interactive. */}
          {content === "badge" && !isEmpty && (
            <span ref={measureRef} aria-hidden="true" className={styles.badgeMeasure}>
              {items}
              <Badge>{`+${Math.max(items.length - 1, 1)}`}</Badge>
            </span>
          )}
          {/* `triggerRef` hands HoverTooltip the cell itself: no wrapper is
              rendered around the value (an inline-flex span here would break
              the row, since the cell is a flex child carrying its own width),
              the whole cell is the hover area, and the tooltip is measured
              against the cell so it sits above or below IT. */}
          {hover != null ? (
            <HoverTooltip
              variant={hover.variant}
              text={"text" in hover ? hover.text : undefined}
              items={"items" in hover ? hover.items : undefined}
              content={"content" in hover ? hover.content : undefined}
              textAlign="left"
              triggerRef={cellRef}
            >
              {body}
            </HoverTooltip>
          ) : (
            body
          )}
          {slotRight}
        </>
      )}
    </div>
  );
}
