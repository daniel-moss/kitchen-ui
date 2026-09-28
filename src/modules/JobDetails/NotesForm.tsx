import { useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import TextArea from "../../components/Fields/TextArea/TextArea";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { toast } from "../../components/Toast/Toaster";

/**
 * The hint bubble on the dialog title (Figma 23869-13367 / 23869-13366 —
 * desktop bubble above the trigger, mobile drawer). Copy is the node's.
 */
const NOTES_HINT =
  'Notes specific to this service. E.g. "My time logged is actually 3 hours" or "Client wants a quote on a new unit".';

interface NotesFormProps {
  open: boolean;
  onClose: () => void;
  /** The note as the module has it now. */
  value: string;
  /** Commits the edited note. */
  onSave: (notes: string) => void;
  mobile?: boolean;
}

// The "Notes to dispatcher(s)" edit form (Figma 21820-75363: desktop dialog
// 23869-11730 / mobile drawer 23869-11734). One bare TextArea in the body — no
// field label, the dialog title IS the label — and a Cancel / Save footer.
export default function NotesForm({ open, onClose, value, onSave, mobile = false }: NotesFormProps) {
  const [notes, setNotes] = useState(value);

  // A fresh open starts from what the module has now.
  useEffect(() => {
    if (open) setNotes(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // The node's toasts (23869-11739). Quotes are doubled to match every other
  // toast in the prototype (Daniel, 2026-08-06 — Figma writes them single).
  const save = () => {
    onSave(notes);
    toast({ type: "success", title: '"Notes to dispatcher(s)" module updated' });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Notes to dispatcher(s)"
      titleHintContent={NOTES_HINT}
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={notes !== value}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={save}>
            Save
          </Button>
        </PopoverFooter>
      }
    >
      <TextArea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onClear={() => setNotes("")}
        clearPromptLabel="notes to dispatcher(s)"
      />
    </Dialog>
  );
}
