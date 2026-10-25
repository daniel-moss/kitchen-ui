import { useState } from "react";

import Button from "../../components/Button/Button";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectList from "../../components/SelectList/SelectList";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import useIsDesktop from "../../hooks/useIsDesktop";
import DismissCancelButton from "./DismissCancelButton";
import { SelectPopover, SelectPopoverList } from "./selectPopover";

// The "Labels" picker — THE one build of the "Labels" SelectList (Figma file
// XBFKW2ThcuVxPbQQHw1XY2, node 1950-34790; redesigned 2026-10-25). Every place
// that edits labels opens it: the side panels' "Labels" modules (dialog on
// desktop / drawer on mobile) and every form's Labels field through
// `LabelsField` (inline under the field on desktop / drawer on mobile).
//
// The design, by presentation:
// - dialog: Cancel + "Apply N" footer. The close ×, the scrim, Escape and
//   Cancel drop the picks — after a "Discard changes?" Prompt when anything
//   changed.
// - drawer: one full-width "Apply N"; swipe / scrim drop the picks, with the
//   same Prompt (a swipe springs the sheet back while it asks).
// - inline: NO footer — the picks apply as you tick, so whatever closes the
//   card (outside click, Escape, the field) leaves them applied. Same result
//   as Figma's "applied when closing": the badges under the field are frozen
//   while it is open, and only the field's counter moves live (the layout-
//   freeze rule).
// Everywhere: options A→Z; labels already on the object open in their own
// group on top (SelectList's "selected on top" — re-sorted only on reopen);
// "Apply" always carries the count — "Apply 0" too (Daniel, 2026-10-25,
// overriding the Figma note "no counter without a selection"); no labels
// at all = the caption-only empty state and no footer; an unmatched search
// offers "Create new label: <query>" in the footer, which creates, ticks and
// clears the search.
//
// It does NOT toast: the callers word their own ('"Labels" module updated'),
// and only the caller knows whether anything actually changed.

interface LabelsSelectListProps {
  open: boolean;
  /** Any dismissal that drops the picks — the close ×, the scrim, Cancel, the swipe. */
  onClose: () => void;
  /** The labels currently on the object, by name. Re-read every time it opens. */
  labels: string[];
  /** The workspace's label pool, by name. A created label joins it. */
  pool: string[];
  /**
   * Apply — the picked names, in pick order. The dialog/drawer caller closes
   * and toasts. Inline (with `pop`), it fires on EVERY tick and on create.
   */
  onSave: (labels: string[]) => void;
  /** A label was created from the search — for a caller that keeps it in its pool beyond this opening. */
  onCreate?: (label: string) => void;
  /**
   * A form field's popover (`useSelectPopover`). Given, the list opens under
   * that field — inline on desktop, drawer on mobile — instead of the dialog.
   * `LabelsField` wires it; a side panel leaves it out.
   */
  pop?: SelectPopover;
  /**
   * The dialog / drawer title. Default "Labels". The Tax rate panel names its
   * object ("Tax rate labels", Figma 1-7310) the way its other edit dialogs
   * do; a picker opened from INSIDE a form keeps the plain "Labels", because
   * the form's own title already names the object.
   */
  title?: string;
  breakpoint?: "auto" | "desktop" | "mobile";
}

const byName = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((name) => b.includes(name));

/** Figma's empty-state caption, broken over two lines where the node breaks it. */
const EMPTY_CAPTION = (
  <>
    No labels.
    <br />
    Start typing to add a new one.
  </>
);

export default function LabelsSelectList({
  open,
  onClose,
  labels,
  pool,
  onSave,
  onCreate,
  pop,
  title = "Labels",
  breakpoint = "auto",
}: LabelsSelectListProps) {
  const mobile = !useIsDesktop(breakpoint);
  const inline = pop != null && !mobile;

  const [picked, setPicked] = useState<string[]>(labels);
  // The pool is local so a label created in the flow can join it. Re-seeded on
  // every open — the caller keeps a created label if it wants it to last.
  const [options, setOptions] = useState<string[]>(pool);

  // Seed ONLY on the closed→open transition, and DURING render, not in an
  // effect: SelectList snapshots which options are selected (its "selected on
  // top" group) in its own effect, which runs BEFORE this component's — an
  // effect here would hand it last session's picks. Callers also build `pool`
  // inline, so it is a new array every render; keying on it reset the draft
  // after every tick (Daniel, 2026-09-28).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setPicked(labels);
      // Every label already ON the object is an option, even when the caller's
      // pool does not know it yet (one created in an earlier opening) —
      // otherwise it is counted in "Apply N" but never shown.
      setOptions([...pool, ...labels.filter((name) => !pool.includes(name))]);
    }
  }

  // Inline has no draft: the object's own labels are the selection.
  const selection = inline ? labels : picked;
  const change = (next: string[]) => (inline ? onSave(next) : setPicked(next));

  const toggle = (label: string) =>
    change(selection.includes(label) ? selection.filter((row) => row !== label) : [...selection, label]);

  // Create-from-search: the new label joins the pool AND becomes selected.
  const create = (query: string) => {
    const name = query.trim();
    if (name === "") return;
    if (!options.includes(name)) {
      setOptions((prev) => [...prev, name]);
      onCreate?.(name);
    }
    if (!selection.includes(name)) change([...selection, name]);
  };

  const dirty = !inline && !sameSet(picked, labels);
  const empty = options.length === 0;

  const apply = (
    <Button size="lg" variant="solid" onClick={() => onSave(picked)}>
      {`Apply ${picked.length}`}
    </Button>
  );
  const footer =
    inline || empty ? undefined : mobile ? (
      <PopoverFooter stretch>{apply}</PopoverFooter>
    ) : (
      <PopoverFooter slotLeft={<DismissCancelButton />}>{apply}</PopoverFooter>
    );

  const items = (
    <SelectListItemGroup>
      {[...options].sort(byName).map((label) => (
        <SelectListItem key={label} label={label} multiSelect selected={selection.includes(label)} onClick={() => toggle(label)} />
      ))}
    </SelectListItemGroup>
  );

  const shared = {
    title,
    multiSelect: true,
    searchable: true,
    searchPlaceholder: "Label...",
    state: empty ? ("empty" as const) : ("default" as const),
    emptyState: { caption: EMPTY_CAPTION },
    createFromSearch: { label: "Create new label:", noMatchCaption: "No labels match", onCreate: create },
    footer,
  };

  if (pop != null) {
    return (
      <SelectPopoverList pop={pop} mobile={mobile} {...shared} onClose={onClose} confirmOnDismiss={dirty}>
        {items}
      </SelectPopoverList>
    );
  }

  return (
    <SelectList
      variant={mobile ? "drawer" : "dialog"}
      open={open}
      onClose={onClose}
      confirmOnDismiss={dirty}
      breakpoint={mobile ? "mobile" : "desktop"}
      {...shared}
    >
      {items}
    </SelectList>
  );
}
