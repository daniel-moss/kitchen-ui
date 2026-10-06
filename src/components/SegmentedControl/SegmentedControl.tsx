import { Children, cloneElement, CSSProperties, Fragment, isValidElement, KeyboardEvent, MouseEvent, ReactElement, useEffect, useLayoutEffect, useRef, useState } from "react";

import clsx from "clsx";

import styles from "./SegmentedControl.module.scss";
import { SegmentProps } from "./Segment.types";
import { SegmentedControlProps } from "./SegmentedControl.types";

// Injected onto each child, plus the hook the keyboard walk reads.
type InjectedProps = Partial<SegmentProps> & { "data-segment-value"?: string };

// The sliding surface's box, relative to the track.
type IndicatorRect = { x: number; y: number; w: number; h: number };

// SegmentedControl — a track holding two to six Segments edge to edge, with a
// divider between each pair and exactly one segment selected. It switches
// between views of the SAME content; navigating between sections is TabGroup's
// job. See Figma "SegmentedControl" (set 31446-51268).
//
// The row is a radio group: one tab stop, and the arrows move the focus and
// select as they go — the ChipGroup `selectionMode="single"` behaviour, owned
// here because this control also owns the value.
export default function SegmentedControl({
  children,
  value,
  defaultValue,
  onChange,
  size = "lg",
  orientation = "horizontal",
  isFullWidth = false,
  className,
  ...rest
}: SegmentedControlProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);

  const items = Children.toArray(children).filter(isValidElement) as ReactElement<SegmentProps>[];
  const values = items.map((item) => item.props.value);

  // One segment is always selected — with nothing set, the first one is.
  const current = (isControlled ? value : internal) ?? values[0];
  const selectedIndex = values.indexOf(current);

  useEffect(() => {
    if (items.length < 2 || items.length > 6) {
      console.warn(`SegmentedControl: ${items.length} segments — the control is built for two to six. Past six, use a Select.`);
    }
  }, [items.length]);

  const select = (next: string) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  // ---- the sliding surface -------------------------------------------------
  // The selection is ONE shared element the control moves to the selected
  // segment — the segments never paint it themselves. Measured rather than
  // computed: the segments hug their own labels, so only layout knows where
  // they are. The TabGroup indicator's mechanics — a ResizeObserver for the
  // track, a re-measure once Inter has loaded (it reflows the labels), and no
  // transition on the first placement.
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);
  const [isReady, setIsReady] = useState(false);
  const selectedIsWarning = selectedIndex !== -1 && items[selectedIndex]?.props.isWarning === true;

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list == null) return undefined;

    const measure = () => {
      const selected = list.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]');
      if (selected == null) {
        setIndicator(null);
        return;
      }
      const track = list.getBoundingClientRect();
      const box = selected.getBoundingClientRect();
      setIndicator({ x: box.left - track.left, y: box.top - track.top, w: box.width, h: box.height });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [current, size, orientation, isFullWidth, values.join("|")]);

  // The first placement lands instantly; the slide starts from the next one.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const indicatorStyle: CSSProperties =
    indicator == null
      ? {}
      : { transform: `translate(${indicator.x}px, ${indicator.y}px)`, width: indicator.w, height: indicator.h };

  // The arrows walk the enabled segments and click as they land, so the
  // selection follows the focus the way a radio group's does.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const NAV = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
    if (!NAV.includes(event.key)) return;

    const list = listRef.current;
    if (list == null) return;
    const buttons = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)'));
    if (buttons.length === 0) return;
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) return;

    event.preventDefault();
    const last = buttons.length - 1;
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? last
          : event.key === "ArrowRight" || event.key === "ArrowDown"
            ? (index + 1) % buttons.length
            : (index - 1 + buttons.length) % buttons.length;

    buttons[next]?.focus();
    buttons[next]?.click();
  };

  // The tab stop: the selected segment, else the first enabled one, so the
  // control is always reachable.
  const rovingIndex = (() => {
    if (selectedIndex !== -1 && items[selectedIndex]?.props.isDisabled !== true) return selectedIndex;
    return items.findIndex((item) => item.props.isDisabled !== true);
  })();

  return (
    <div
      ref={listRef}
      role="radiogroup"
      className={clsx(styles.control, isFullWidth && styles.fullWidth, className)}
      onKeyDown={onKeyDown}
      {...rest}
    >
      {indicator != null && (
        <span
          aria-hidden="true"
          className={clsx(styles.indicator, selectedIsWarning && styles.indicatorWarning, isReady && styles.indicatorReady)}
          style={indicatorStyle}
        />
      )}
      {items.map((item, index) => {
        const itemValue = item.props.value;
        const isSelected = index === selectedIndex;

        const segment = cloneElement(item, {
          size: item.props.size ?? size,
          orientation: item.props.orientation ?? orientation,
          isSelected,
          // The control paints the selection; a Segment only does when it is
          // used on its own, outside a control.
          hasSelectedSurface: false,
          tabIndex: index === rovingIndex ? 0 : -1,
          "data-segment-value": itemValue,
          onClick: (event: MouseEvent<HTMLButtonElement>) => {
            item.props.onClick?.(event);
            if (itemValue != null) select(itemValue);
          },
        } as InjectedProps);

        // The divider after this segment is hidden when it touches the
        // selection — on either side — and the last segment never has one.
        // Hidden with opacity, never removed: a removed divider takes its 1px
        // with it and the whole row shifts.
        const isLast = index === items.length - 1;
        const touchesSelection = index === selectedIndex || index + 1 === selectedIndex;

        return (
          <Fragment key={itemValue ?? index}>
            {segment}
            {!isLast && <span aria-hidden="true" className={clsx(styles.divider, touchesSelection && styles.dividerHidden)} />}
          </Fragment>
        );
      })}
    </div>
  );
}
