import { useEffect, useState } from "react";

import Button from "../../../components/Button/Button";
import CheckboxItem from "../../../components/Checkbox/CheckboxItem";
import Dialog from "../../../components/Dialog/Dialog";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import RadioGroup from "../../../components/Radio/RadioGroup";
import RadioItem from "../../../components/Radio/RadioItem";
import { toast } from "../../../components/Toast/Toaster";
import { semanticIcons } from "../../../styles/semanticIcons";

// ---------------------------------------------------------------------------
// "Download PDF" — Figma section 24592-39416 (redesigned 2026-10-27).
//
// ONE field: the job PDF's version, a RadioGroup of two cards — Private
// (everything) or Public (no sensitive information). Nothing is picked when
// the form opens, and "Download" validates it ("Choose version", RadioGroup
// 27348-27747).
//
// A job with a PARENT estimate adds "Include parent estimate PDF" under the
// picked card (RadioItem 27348-28115). It shows on BOTH cards, it is not
// ticked by default, and it keeps its tick when you switch cards — it is one
// value, drawn in whichever card is picked.
// ---------------------------------------------------------------------------

type VersionKey = "private" | "public";

/** The PDF versions every job has. */
const VERSIONS: { key: VersionKey; label: string; icon: string; caption: string }[] = [
  { key: "private", label: "Private", icon: semanticIcons.private, caption: "Includes all the data" },
  { key: "public", label: "Public", icon: semanticIcons.public, caption: "Does not include sensitive information" },
];

// Simulated download: ONE processing toast, resolving into the success one
// (Figma 21136-58247). The designed error toast — "Couldn't download" /
// "Something went wrong. Please try again." — would take its place on a real
// failure; nothing fails here, so it never shows.
const runDownload = () => {
  const id = toast({ type: "processing", title: "Downloading..." });
  window.setTimeout(() => toast.update(id, { type: "success", title: "Downloaded" }), 2000);
};

export interface DownloadPdfFormProps {
  open: boolean;
  onClose: () => void;
  /** The job has a parent estimate — the picked card offers its PDF too. */
  hasParentEstimate?: boolean;
  mobile?: boolean;
}

export default function DownloadPdfForm({ open, onClose, hasParentEstimate = false, mobile = false }: DownloadPdfFormProps) {
  const [version, setVersion] = useState<VersionKey | "">("");
  const [includeEstimate, setIncludeEstimate] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // A fresh open starts over — nothing picked, nothing ticked.
  useEffect(() => {
    if (!open) return;
    setVersion("");
    setIncludeEstimate(false);
    setShowErrors(false);
  }, [open]);

  const invalid = version === "";

  const handleDownload = () => {
    if (invalid) {
      setShowErrors(true);
      return;
    }
    runDownload();
    onClose();
  };

  // The same checkbox in either card, so the tick survives a card switch.
  const estimateCheckbox = hasParentEstimate ? (
    <CheckboxItem
      label="Include parent estimate PDF"
      checked={includeEstimate}
      onChange={() => setIncludeEstimate((v) => !v)}
    />
  ) : undefined;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Download PDF"
      breakpoint={mobile ? "mobile" : "desktop"}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" leftIcon="download" onClick={handleDownload}>
            Download
          </Button>
        </PopoverFooter>
      }
    >
      {/* No label: the dialog title already names the choice (the node's
          Input has its header off). */}
      <Input>
        <RadioGroup
          value={version}
          onChange={(v) => setVersion(v as VersionKey)}
          isValid={!(showErrors && invalid)}
          errorMessage="Choose version"
        >
          {VERSIONS.map((v) => (
            <RadioItem
              key={v.key}
              value={v.key}
              variant="card"
              label={v.label}
              icon={v.icon}
              iconPack="regular"
              caption={v.caption}
              content={estimateCheckbox}
            />
          ))}
        </RadioGroup>
      </Input>
    </Dialog>
  );
}
