import { useEffect, useState } from "react";

import AlertBanner from "../../../components/AlertBanner/AlertBanner";
import Button from "../../../components/Button/Button";
import CheckboxGroup from "../../../components/Checkbox/CheckboxGroup";
import CheckboxItem from "../../../components/Checkbox/CheckboxItem";
import Dialog from "../../../components/Dialog/Dialog";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import { toast } from "../../../components/Toast/Toaster";
import { semanticIcons } from "../../../styles/semanticIcons";

// ---------------------------------------------------------------------------
// "Download PDF" — Figma section 24592-39416.
//
// The job's PDFs are downloaded from here. Every object has a PUBLIC and a
// PRIVATE version, and both versions of the form are the same shape — one
// labeled field per object, holding that object's two version cards:
//
//   Parent    (24592-39452 / 24592-39428) — the job HAS a parent estimate, so
//               there are two fields: "Estimate" and "Job".
//   No Parent (24609-45503 / 24609-45501) — no parent estimate, so the "Job"
//               field is the only one.
//
// Not ticking an object's cards simply means it is not downloaded, so there is
// no separate object picker.
// ---------------------------------------------------------------------------

type ObjectKey = "estimate" | "job";
type VersionKey = "private" | "public";

/** One labeled field per object. "estimate" only exists with a parent estimate. */
const OBJECTS: { key: ObjectKey; label: string }[] = [
  { key: "estimate", label: "Estimate" },
  { key: "job", label: "Job" },
];

/** The PDF versions every object has. */
const VERSIONS: { key: VersionKey; label: string; icon: string; caption: string }[] = [
  { key: "private", label: "Private", icon: semanticIcons.filePrivate, caption: "Includes all the data" },
  { key: "public", label: "Public", icon: semanticIcons.filePublic, caption: "Does not include sensitive information" },
];

/**
 * The form validates as a WHOLE: one version anywhere is enough. So the message
 * is a general banner above the footer, not a per-field one (Figma 24610-47808).
 */
const GENERAL_ERROR = "Choose at least one option";

const NO_VERSIONS: Record<ObjectKey, VersionKey[]> = { estimate: [], job: [] };

// Simulated download: ONE processing toast for all the picked PDFs, resolving
// into the success one (Figma 21136-58247). The designed error toast — "Could
// not download PDF(s)" / "Something went wrong. Please try again." — would take
// its place on a real failure; nothing fails here, so it never shows.
const runDownload = () => {
  const id = toast({ type: "processing", title: "Downloading..." });
  window.setTimeout(() => toast.update(id, { type: "success", title: "Downloaded" }), 2000);
};

export interface DownloadPdfFormProps {
  open: boolean;
  onClose: () => void;
  /** The job has a parent estimate — adds the "Estimate" field above "Job". */
  hasParentEstimate?: boolean;
  mobile?: boolean;
}

export default function DownloadPdfForm({ open, onClose, hasParentEstimate = false, mobile = false }: DownloadPdfFormProps) {
  // Each object's picked versions. Without a parent estimate only "job" is shown
  // — its "estimate" entry stays empty and never reaches the UI.
  const [versions, setVersions] = useState<Record<ObjectKey, VersionKey[]>>(NO_VERSIONS);
  const [showErrors, setShowErrors] = useState(false);

  // A fresh open starts over — everything unchecked (Daniel, 2026-08-10).
  useEffect(() => {
    if (!open) return;
    setVersions(NO_VERSIONS);
    setShowErrors(false);
  }, [open]);

  const fields = hasParentEstimate ? OBJECTS : OBJECTS.filter((o) => o.key === "job");

  const toggleVersion = (key: ObjectKey, version: VersionKey) =>
    setVersions((prev) => ({
      ...prev,
      [key]: prev[key].includes(version) ? prev[key].filter((v) => v !== version) : [...prev[key], version],
    }));

  // One version ANYWHERE is enough (Daniel, 2026-08-10).
  const invalid = fields.every((o) => versions[o.key].length === 0);
  const showError = showErrors && invalid;

  const handleDownload = () => {
    if (invalid) {
      setShowErrors(true);
      return;
    }
    runDownload();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Download PDF"
      breakpoint={mobile ? "mobile" : "desktop"}
      errorMessage={
        showError ? (
          <AlertBanner type="banner" status="error" orientation="vertical">
            {GENERAL_ERROR}
          </AlertBanner>
        ) : undefined
      }
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
      {fields.map((o) => (
        <Input key={o.key} label={o.label}>
          {/* The error is the general banner's, so it is set PER ITEM and the
              group stays VALID — an invalid CheckboxGroup would add its own
              inline message back under the cards. */}
          <CheckboxGroup>
            {VERSIONS.map((v) => (
              <CheckboxItem
                key={v.key}
                label={v.label}
                icon={v.icon}
                iconPack="regular"
                caption={v.caption}
                checked={versions[o.key].includes(v.key)}
                onChange={() => toggleVersion(o.key, v.key)}
                error={showError}
              />
            ))}
          </CheckboxGroup>
        </Input>
      ))}
    </Dialog>
  );
}
