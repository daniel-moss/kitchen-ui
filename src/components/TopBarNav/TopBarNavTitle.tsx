import { useEffect, useRef, useState } from "react";

import clsx from "clsx";

import useControllableState from "../../hooks/useControllableState";
import { Icon } from "../Icon/Icon";
import SelectList from "../SelectList/SelectList";
import SelectListItem from "../SelectList/SelectListItem";
import SelectListItemGroup from "../SelectList/SelectListItemGroup";

import styles from "./TopBarNavTitle.module.scss";
import { TopBarNavTitleProps } from "./TopBarNavTitle.types";

// TopBarNavTitle — the top bar's title assembly: an optional avatar slot
// (fixed 36px / xl), the heading-style title, and an optional dropdown icon.
// With `subPages` the title becomes a button: clicking it opens a SelectList
// with the stack's sibling pages (inline on mobile too — the doc's Sub-pages
// rule). See Figma TopBarNav "#️⃣ Title" / "#️⃣ isDropdown".
export default function TopBarNavTitle({
  title,
  slotLeft,
  dropdown = false,
  subPages,
  subPage,
  defaultSubPage,
  onSubPageChange,
  className,
}: TopBarNavTitleProps) {
  const hasSubPages = subPages != null && subPages.length > 0;
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useControllableState(
    subPage,
    defaultSubPage ?? subPages?.[0]?.id ?? "",
    onSubPageChange,
  );
  const wrapRef = useRef<HTMLDivElement>(null);

  // Clicking outside the title + list closes the list.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current != null && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const content = (
    <>
      {slotLeft != null && <span className={styles.slotLeft}>{slotLeft}</span>}
      <span className={styles.title}>{title}</span>
      {(dropdown || hasSubPages) && (
        <span className={styles.dropdown} aria-hidden="true">
          <Icon icon="angles-up-down" size={14} />
        </span>
      )}
    </>
  );

  if (!hasSubPages) {
    return <div className={clsx(styles.root, className)}>{content}</div>;
  }

  return (
    <div ref={wrapRef} className={clsx(styles.wrap, className)}>
      <button
        type="button"
        className={clsx(styles.root, styles.trigger, open && styles.triggerOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {content}
      </button>
      <div className={styles.listAnchor}>
        {/* breakpoint="desktop" keeps the INLINE list on mobile too — the
            doc: "The SelectList pops up inline on mobile". */}
        <SelectList variant="inline" breakpoint="desktop" open={open} onClose={() => setOpen(false)}>
          <SelectListItemGroup>
            {subPages.map((p) => (
              <SelectListItem
                key={p.id}
                label={p.label}
                selected={p.id === selectedId}
                onClick={() => {
                  setSelectedId(p.id);
                  setOpen(false);
                }}
              />
            ))}
          </SelectListItemGroup>
        </SelectList>
      </div>
    </div>
  );
}
