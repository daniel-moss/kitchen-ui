import { useEffect, useRef, useState } from "react";

/**
 * THE standard multi-select behaviour of a SelectList opened from a field
 * (Daniel, 2026-10-26; Figma "Labels" SelectList 12921-10208, "New Job"
 * Equipment 17189-78623):
 *
 * - Ticking an option changes a DRAFT only. The field behind the list does
 *   not move while the list is open.
 * - Closing the list APPLIES the draft — whatever closes it: a click outside,
 *   Escape, the field itself, swiping the drawer down, or a footer action
 *   (e.g. "Add …"). No Cancel and no "Discard changes?" prompt.
 * - Desktop (inline card): no apply button — closing is how you confirm. A
 *   footer, when there is one, is a MenuItem (e.g. "Add equipment").
 * - Mobile (drawer): a visible "Select N" button (`SelectListSelectFooter`,
 *   `count` = `selection.length`) that closes the list, optionally with one
 *   ghost action on its left. Swiping down applies just the same.
 *
 * A list that IS an edit form (its own Dialog with Cancel / "Select N", e.g.
 * the side panels' Labels on desktop) follows the Dialog rules instead.
 *
 * It watches `open` itself, so every way the list closes is covered — a
 * popover closed by an outside click never calls the list's `onClose`.
 *
 *   const draft = useSelectionDraft(open, value, onChange);
 *   <SelectListItem selected={draft.isSelected(id)} onClick={() => draft.toggle(id)} />
 */
export function useSelectionDraft<T>(open: boolean, value: T[], onApply: (next: T[]) => void) {
  const [draft, setDraft] = useState<T[]>(value);

  // Seed on the closed→open transition DURING render (not in an effect), so
  // SelectList's "selected on top" snapshot — taken in its own effect, which
  // runs before this component's — sees the right picks. Never keyed on
  // `value`: callers rebuild that array on every render.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }

  // Apply on the open→closed transition, only when something changed.
  const latest = useRef({ draft, value, onApply });
  latest.current = { draft, value, onApply };
  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current && !open) {
      const { draft: picked, value: saved, onApply: apply } = latest.current;
      const changed = picked.length !== saved.length || picked.some((item) => !saved.includes(item));
      if (changed) apply(picked);
    }
    prevOpen.current = open;
  }, [open]);

  const toggle = (item: T) => setDraft((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));

  return {
    /** The picks while the list is open (the saved value while it is closed). */
    selection: open ? draft : value,
    isSelected: (item: T) => (open ? draft : value).includes(item),
    toggle,
    /** Replace the draft — e.g. tick an item created from the search. */
    setDraft,
  };
}
