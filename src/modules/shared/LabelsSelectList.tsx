import { useEffect, useRef, useState } from "react";

import Button from "../../components/Button/Button";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectList from "../../components/SelectList/SelectList";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import useIsDesktop from "../../hooks/useIsDesktop";

// The "Labels" picker — a multi-select SelectList (desktop dialog / mobile
// drawer) with search, create-from-search and a Cancel + Save footer.
// Documented in the "Labels Select List" Figma file (XBFKW2ThcuVxPbQQHw1XY2,
// node 1950-34790).
//
// SHARED since 2026-09-28 (Daniel: "maybe it makes sense to extract the Labels
// SelectList and make it sharable"): the Equipment side panel and the Job
// Details "Labels" module opened the same design from two separate builds, and
// they had already drifted — Job Details searched with "Search by label..."
// while the node and the Equipment panel both say "Label...", and Job Details
// had no create-from-search at all.
//
// It does NOT toast: the two callers word their own ('"Labels" updated' on the
// equipment, '"Labels" module updated' on the job, node 23863-17981), and only
// the caller knows whether anything actually changed.

interface LabelsSelectListProps {
  open: boolean;
  /** Any dismissal — the close ×, the scrim, or Cancel. Picks are dropped. */
  onClose: () => void;
  /** The labels currently on the object, by name. Re-read every time it opens. */
  labels: string[];
  /** The workspace's label pool, by name. A created label is added on top of it. */
  pool: string[];
  /** Save — the picked names, in pick order. The caller closes and toasts. */
  onSave: (labels: string[]) => void;
  /**
   * The dialog / drawer title. Default "Labels". The Tax rate panel names its
   * object ("Tax rate labels", Figma 1-7310) the way its other edit dialogs
   * do; a picker opened from INSIDE a form keeps the plain "Labels", because
   * the form's own title already names the object.
   */
  title?: string;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function LabelsSelectList({
  open,
  onClose,
  labels,
  pool,
  onSave,
  title = "Labels",
  breakpoint = "auto",
}: LabelsSelectListProps) {
  const mobile = !useIsDesktop(breakpoint);

  const [picked, setPicked] = useState<string[]>(labels);
  // The pool is local so a label created in the flow can join it. Re-seeded on
  // every open — a created label lives only as long as the form.
  const [options, setOptions] = useState<string[]>(pool);

  // Seed ONLY on the closed→open transition, never on a plain re-render.
  //
  // Callers build `pool` inline (`JOB_LABELS.map(…)`), so it is a NEW array on
  // every render. An effect keyed on `[open, labels, pool]` therefore re-ran
  // after every state change while the form was open and reset the draft:
  // un-ticking a label ticked itself straight back (Daniel, 2026-09-28).
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      setPicked(labels);
      setOptions(pool);
    }
    wasOpen.current = open;
  }, [open, labels, pool]);

  const toggle = (label: string) =>
    setPicked((prev) => (prev.includes(label) ? prev.filter((row) => row !== label) : [...prev, label]));

  // Create-from-search: the new label joins the pool AND becomes selected (the
  // "Create New Label" annotation in the Labels Select List file).
  const create = (query: string) => {
    const name = query.trim();
    if (name === "" || options.includes(name)) return;
    setOptions((prev) => [...prev, name]);
    setPicked((prev) => [...prev, name]);
  };

  return (
    <SelectList
      variant={mobile ? "drawer" : "dialog"}
      title={title}
      open={open}
      onClose={onClose}
      multiSelect
      searchable
      searchPlaceholder="Label..."
      breakpoint={mobile ? "mobile" : "desktop"}
      emptyState={{ icon: "tag", title: "No labels here yet", caption: "Start typing to create a new label" }}
      createFromSearch={{ label: "Create new label:", onCreate: create }}
      footer={
        <PopoverFooter
          slotLeft={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={() => onSave(picked)}>
            Save
          </Button>
        </PopoverFooter>
      }
    >
      <SelectListItemGroup>
        {options.map((label) => (
          <SelectListItem key={label} label={label} multiSelect selected={picked.includes(label)} onClick={() => toggle(label)} />
        ))}
      </SelectListItemGroup>
    </SelectList>
  );
}
