import { isValidElement, useEffect } from "react";

import clsx from "clsx";

import { Icon } from "../Icon/Icon";
import { Skeleton } from "../Skeleton/Skeleton";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";

import styles from "./TabItem.module.scss";
import { TabItemProps } from "./TabItem.types";

// TabItem — one tab of a TabGroup: **pill** (a soft filled shape marks the
// selection) or **underline** (a line on the row's bottom edge), md (32px) or
// lg (36px), an optional slot (an Icon or an `xs`/20px avatar) before the
// label, an optional counter after it, and `warning` for a problem behind the
// tab. The label and a default-coloured Icon are `--text-subtle` on a resting
// inactive tab and `--text-strong` everywhere else — the CSS drives both
// through `color`. See Figma "Tab" (set 28689-123318).
//
// A tab is not placed on its own: TabGroup lays the row out, owns the selection
// and injects `variant`, `size` and `selected`.
export default function TabItem({
  variant = "pill",
  size = "md",
  selected = false,
  slotLeft,
  counter,
  selectedSurface = true,
  warning = false,
  disabled = false,
  loading = false,
  children,
  className,
  type = "button",
  ...rest
}: TabItemProps) {
  // Two rules the Figma set carries as absent combinations. `slotLeft` and
  // `children` are ReactNodes, so the types cannot express either — the Chip
  // precedent is to report them instead.
  const warningWithoutLabel = warning && children == null;
  const counterWithoutLabel = counter != null && children == null;
  useEffect(() => {
    if (warningWithoutLabel) {
      console.warn("TabItem: warning needs a label — a coloured glyph on its own says nothing.");
    }
    if (counterWithoutLabel) {
      console.warn("TabItem: counter needs a label — a number beside an icon reads as a statistic, not a place to go.");
    }
  }, [warningWithoutLabel, counterWithoutLabel]);

  // The warning IS the icon (per the doc page), so it takes the slot over
  // rather than colouring whatever the caller put there.
  const slotContent = warning ? <Icon icon="warning" pack="solid" size={14} /> : slotLeft;

  // Loading replaces the slot with a circle — 14px for an Icon, the avatar's
  // own 20px otherwise (the Chip rule).
  const isIconSlot = isValidElement(slotContent) && slotContent.type === Icon;
  const slotSize = isIconSlot ? 14 : 20;
  const slot = loading && slotContent != null ? <Skeleton circle width={slotSize} height={slotSize} /> : slotContent;

  return (
    <button
      type={type}
      className={clsx(
        styles.tab,
        styles[variant],
        styles[size],
        selected && styles.selected,
        // The group owns the moving line → this tab drops its own mark.
        selected && !selectedSurface && styles.noSurface,
        warning && styles.warning,
        loading && styles.loading,
        className,
      )}
      disabled={disabled}
      role="tab"
      aria-selected={selected}
      aria-busy={loading || undefined}
      {...rest}
    >
      {slot != null && <span className={styles.slot}>{slot}</span>}
      {loading ? (
        <SkeletonTypography variant="bodyCompact" width={40} />
      ) : (
        (children != null || counter != null) && (
          <span className={styles.text}>
            {children != null && <span>{children}</span>}
            {counter != null && <span className={styles.counter}>{counter}</span>}
          </span>
        )
      )}
    </button>
  );
}
