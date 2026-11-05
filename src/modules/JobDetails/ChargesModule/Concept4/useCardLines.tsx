import { Dispatch, SetStateAction, useState } from "react";

import type { Charge } from "../../../../data/db";
import { newCharge } from "../chargeLines";
import { DeleteLinePrompt } from "../LinePanels/LinePanel";

import { moved } from "./CardGroup";

/** The open form: the pricebook item and, on an edit, the line. */
interface OpenForm<Item> {
  item: Item;
  chargeId?: string;
  /** What the Delete prompt names. */
  title?: string;
}

/**
 * What every group of Concept 4 does with its lines, whatever their type: the plus
 * opens the type's SelectList; a pick opens the type's form with the item as the
 * template ("Add"); a card opens it on the line ("Save"), and Delete lives in that
 * form, behind the shared prompt. The concept keeps the lines, for the subtotal.
 *
 * @param noun What the prompt and the toast call a line: "labor rate", "product"…
 */
export default function useCardLines<Item>(lines: Charge[], setLines: Dispatch<SetStateAction<Charge[]>>, noun: string, mobile: boolean) {
  const [listOpen, setListOpen] = useState(false);
  const [form, setForm] = useState<OpenForm<Item> | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const breakpoint = mobile ? ("mobile" as const) : ("desktop" as const);

  const openForm = (next: OpenForm<Item>) => {
    setForm(next);
    setFormOpen(true);
  };

  return {
    lines,
    breakpoint,
    /** For `CardGroup`. */
    group: {
      count: lines.length,
      onAdd: () => setListOpen(true),
      onReorder: (from: number, to: number) => setLines((list) => moved(list, from, to)),
    },
    /** For the type's SelectList: open, close, and what a pick does. */
    list: {
      open: listOpen,
      onClose: () => setListOpen(false),
      onSelect: (item: Item) => openForm({ item }),
      breakpoint,
    },
    /** A card's click. */
    edit: (item: Item, charge: Charge) => openForm({ item, chargeId: charge.id, title: charge.title }),
    /** The item the form is open on. */
    item: form?.item,
    /** The line the form is open on. None: a new line. */
    editing: lines.find((charge) => charge.id === form?.chargeId),
    /** For the type's form. */
    formProps: {
      open: formOpen,
      onClose: () => setFormOpen(false),
      onDelete: form?.chargeId != null ? () => setDeleting(true) : undefined,
      breakpoint,
    },
    /** Add a new line, or put the edited one back in its place. */
    commit: (title: string, patch: Partial<Charge>) =>
      setLines((list) =>
        form?.chargeId == null ? [...list, newCharge(title, patch)] : list.map((charge) => (charge.id === form.chargeId ? { ...charge, ...patch } : charge)),
      ),
    deletePrompt: (
      <DeleteLinePrompt
        open={deleting}
        noun={noun}
        title={form?.title ?? ""}
        onConfirm={() => {
          setDeleting(false);
          setFormOpen(false);
          setLines((list) => list.filter((charge) => charge.id !== form?.chargeId));
        }}
        onCancel={() => setDeleting(false)}
        breakpoint={breakpoint}
      />
    ),
  };
}
