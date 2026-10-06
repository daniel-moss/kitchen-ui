import { useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import TextArea from "../../components/Fields/TextArea/TextArea";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { toast } from "../../components/Toast/Toaster";

import textDialog from "../shared/textDialog.module.scss";

import useSummaryGenerator from "./summaryGenerator";

interface WorkSummaryFormProps {
  open: boolean;
  onClose: () => void;
  /** The summary as the module has it now. */
  value: string;
  /** Commits the edited summary. */
  onSave: (summary: string) => void;
  /** False → Generate is disabled (a form is still incomplete). */
  canGenerate?: boolean;
  mobile?: boolean;
}

// The "Work summary" edit form (Figma 24273-81702: desktop dialog 24273-81709 /
// mobile drawer 24273-81713). A bare TextArea, and a footer with THREE buttons:
// Cancel (ghost, left), then "Generate summary" (GHOST with the wand — Daniel
// 2026-08-25, the design's subtle; renamed from "Generate" 2026-10-06, the
// same copy the module's own button carries) and Save (solid).
export default function WorkSummaryForm({
  open,
  onClose,
  value,
  onSave,
  canGenerate = true,
  mobile = false,
}: WorkSummaryFormProps) {
  const [summary, setSummary] = useState(value);
  // Same "thinking then typing" animation as the Complete-job flow's Generate.
  const gen = useSummaryGenerator(setSummary);

  // A fresh open starts from what the module has now; closing mid-typing stops
  // the animation so it cannot keep writing into a closed dialog.
  useEffect(() => {
    gen.reset();
    if (open) setSummary(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = () => {
    onSave(summary);
    toast({ type: "success", title: '"Work summary" module updated' });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Work summary"
      breakpoint={mobile ? "mobile" : "desktop"}
      // Mobile: the sheet takes the whole screen so the field can use it all.
      fillHeight
      confirmOnDismiss={summary !== value}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button
            size="lg"
            variant="ghost"
            leftIcon="wand-magic-sparkles"
            isDisabled={!canGenerate || gen.busy}
            isProcessing={gen.phase === "thinking"}
            onClick={gen.generate}
          >
            Generate summary
          </Button>
          <Button size="lg" variant="solid" isDisabled={gen.busy} onClick={save}>
            Save
          </Button>
        </PopoverFooter>
      }
    >
      {/* The TEXT DIALOG height rules (Daniel, 2026-10-06; the Text-Area
          form's own Figma doc): 12 rows minimum on DESKTOP, and on MOBILE no
          minimum at all — the drawer takes the screen (`fillHeight`) and the
          field stretches to use it. Both come from the shared
          `textDialog` sheet, the same one EditNotesDialog and the Cancel-job
          form use.

          The class goes on a bare carrier because this body has NO `Input`:
          the dialog title IS the field's label, so there is nothing else to
          hang it on. The sheet's selectors are structural, so a plain div
          carries them. */}
      <div className={mobile ? textDialog.fillField : textDialog.tallField}>
        <TextArea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          onClear={() => setSummary("")}
          clearPromptLabel="work summary"
        />
      </div>
    </Dialog>
  );
}
