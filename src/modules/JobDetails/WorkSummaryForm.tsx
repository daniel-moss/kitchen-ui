import { useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import TextArea from "../../components/Fields/TextArea/TextArea";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { toast } from "../../components/Toast/Toaster";

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
// Cancel (ghost, left), then Generate (GHOST with the wand — Daniel 2026-08-25,
// the design's subtle) and Save (solid).
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
            Generate
          </Button>
          <Button size="lg" variant="solid" isDisabled={gen.busy} onClick={save}>
            Save
          </Button>
        </PopoverFooter>
      }
    >
      <TextArea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        onClear={() => setSummary("")}
        clearPromptLabel="work summary"
      />
    </Dialog>
  );
}
