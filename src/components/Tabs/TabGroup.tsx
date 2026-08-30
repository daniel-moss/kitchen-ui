import { Children, cloneElement, CSSProperties, isValidElement, KeyboardEvent, MouseEvent, ReactElement, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";

import { TabGroupDefaultSizeContext } from "./TabGroupDefaultSizeContext";
import { TabItemProps, TabItemVariant } from "./TabItem.types";

import styles from "./TabGroup.module.scss";
import { TabGroupProps } from "./TabGroup.types";

// Figma's group style → the TabItem variant it lays out.
const VARIANT_TO_ITEM: Record<TabGroupProps["variant"] & string, TabItemVariant> = {
  default: "default",
  contained: "container",
  underlined: "underline",
};

// Injected onto each child; a superset of TabItemProps plus the roving data hook.
type InjectedProps = Partial<TabItemProps> & { "data-tab-value"?: string };

// The sliding indicator's box, relative to the tablist.
type IndicatorRect = { x: number; y: number; w: number; h: number };

// TabGroup — lays out TabItem children as a tablist and owns the selection.
// It injects the variant + size into each child, marks the selected one, wires
// clicks to onChange, and adds roving-tabindex + arrow-key navigation. For the
// contained / underlined styles a single shared indicator (the raised surface /
// the bottom line) slides to the selected tab. See Figma "TabGroup".
export default function TabGroup({ variant = "default", size: sizeProp, orientation = "horizontal", value, defaultValue, onChange, children, isFullWidth = false, className, ...rest }: TabGroupProps) {
  // An explicit size wins; else a container's default (TopBarNav provides
  // "lg" for its bars); else "md".
  const contextSize = useContext(TabGroupDefaultSizeContext);
  const size = sizeProp ?? contextSize ?? "md";
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const selectedValue = isControlled ? value : internal;

  const listRef = useRef<HTMLDivElement>(null);
  const itemVariant = VARIANT_TO_ITEM[variant];

  // contained / underlined slide one shared indicator to the selected tab;
  // default keeps its per-tab soft fill.
  const animated = variant === "contained" || variant === "underlined";
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);
  const [ready, setReady] = useState(false);

  const select = (v: string) => {
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };

  const items = Children.toArray(children).filter(isValidElement) as ReactElement<TabItemProps>[];

  // The single tab stop (roving tabindex): the selected tab, else the first
  // enabled one so the group is always reachable by keyboard.
  const enabledValues = items.filter((it) => !it.props.disabled).map((it) => it.props.value);
  const rovingValue = selectedValue != null && enabledValues.includes(selectedValue) ? selectedValue : enabledValues[0];
  // Stable dependency for the measure effect: re-run when the tab set changes.
  const valuesKey = items.map((it) => it.props.value ?? "").join("|");

  const focusValue = (v: string | undefined) => {
    if (v == null) return;
    listRef.current?.querySelector<HTMLButtonElement>(`[data-tab-value="${CSS.escape(v)}"]`)?.focus();
  };

  // Measure the selected tab and place the indicator over it.
  useLayoutEffect(() => {
    if (!animated) {
      setIndicator(null);
      return;
    }
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      if (selectedValue == null) {
        setIndicator(null);
        return;
      }
      const sel = list.querySelector<HTMLElement>(`[data-tab-value="${CSS.escape(String(selectedValue))}"]`);
      if (!sel) {
        setIndicator(null);
        return;
      }
      const lr = list.getBoundingClientRect();
      const r = sel.getBoundingClientRect();
      setIndicator({ x: r.left - lr.left, y: r.top - lr.top, w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    let cancelled = false;
    // Inter can reflow tab widths after it loads — re-measure once fonts settle.
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [animated, selectedValue, size, orientation, isFullWidth, valuesKey]);

  // The first placement is instant; enable the slide only afterwards.
  useEffect(() => {
    if (!animated) return undefined;
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, [animated]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const NAV = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
    if (!NAV.includes(e.key) || enabledValues.length === 0) return;
    e.preventDefault();

    const current = Math.max(0, enabledValues.indexOf(rovingValue));
    let next = current;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (current + 1) % enabledValues.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (current - 1 + enabledValues.length) % enabledValues.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = enabledValues.length - 1;

    const nextValue = enabledValues[next];
    if (nextValue != null) {
      select(nextValue);
      focusValue(nextValue);
    }
  };

  const injected = items.map((child) => {
    const v = child.props.value;
    const isSelected = v != null && v === selectedValue;
    return cloneElement(child, {
      variant: itemVariant,
      size,
      orientation,
      selected: isSelected,
      // The group owns the moving surface / line for the animated variants.
      selectedSurface: animated ? false : undefined,
      tabIndex: v != null && v === rovingValue ? 0 : -1,
      "data-tab-value": v,
      onClick: (e: MouseEvent<HTMLButtonElement>) => {
        child.props.onClick?.(e);
        if (v != null) select(v);
      },
    } as InjectedProps);
  });

  const indicatorStyle: CSSProperties =
    indicator == null
      ? {}
      : variant === "underlined"
        ? { transform: `translateX(${indicator.x}px)`, width: indicator.w }
        : { transform: `translate(${indicator.x}px, ${indicator.y}px)`, width: indicator.w, height: indicator.h };

  return (
    <div ref={listRef} role="tablist" className={clsx(styles.group, styles[variant], isFullWidth && styles.fullWidth, className)} onKeyDown={onKeyDown} {...rest}>
      {animated && indicator && (
        <span
          aria-hidden="true"
          className={clsx(styles.indicator, variant === "underlined" ? styles.indicatorUnderlined : styles.indicatorContained, ready && styles.indicatorReady)}
          style={indicatorStyle}
        />
      )}
      {injected}
    </div>
  );
}
