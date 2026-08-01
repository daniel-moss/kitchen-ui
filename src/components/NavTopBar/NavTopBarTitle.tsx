import { isValidElement, useEffect, useRef, useState } from "react";

import clsx from "clsx";

import useControllableState from "../../hooks/useControllableState";
import { Icon } from "../Icon/Icon";
import SelectList from "../SelectList/SelectList";
import SelectListItem from "../SelectList/SelectListItem";
import SelectListItemGroup from "../SelectList/SelectListItemGroup";

import styles from "./NavTopBarTitle.module.scss";
import { NavTopBarTitleProps } from "./NavTopBarTitle.types";

// NavTopBarTitle — the top bar's title combination: an optional left slot
// (Icon or any md avatar), the title, and an optional dropdown icon on the
// right. With `subPages` the title becomes a button: clicking it opens a
// SelectList with the stack's sibling lists (the same regular select list on
// mobile — the doc's Subpages rule). See Figma
// "#️⃣ NavTopBar_LeftElements_Title".
export default function NavTopBarTitle({
  title,
  slotLeft,
  dropdown = false,
  subPages,
  subPage,
  defaultSubPage,
  onSubPageChange,
  className,
}: NavTopBarTitleProps) {
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

  // The gap to the title differs by slot content: 8px after an icon, 10px
  // after an avatar (per Figma).
  const slotIsIcon = isValidElement(slotLeft) && slotLeft.type === Icon;

  const content = (
    <>
      {slotLeft != null && (
        <span className={clsx(styles.slotLeft, slotIsIcon ? styles.slotIcon : styles.slotAvatar)}>{slotLeft}</span>
      )}
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
        className={clsx(styles.root, styles.trigger)}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {content}
      </button>
      <div className={styles.listAnchor}>
        {/* breakpoint="desktop" keeps the INLINE list on mobile too — the
            doc's Subpages rule: "regular select list over select list drawer". */}
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
