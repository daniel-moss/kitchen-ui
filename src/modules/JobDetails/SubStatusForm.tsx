import { MouseEvent, useEffect, useState } from "react";

import AlertBanner from "../../components/AlertBanner/AlertBanner";
import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";

import { subStatusesFor } from "../../data/db";

import styles from "./jobForm.module.scss";

// The active sub-statuses a technician can be in (placeholder demo values).
// The company's ACTIVE sub-statuses, from the database — they used to be
// hardcoded as ["Travelling", "Working"], which are the tech's CHECK-IN
// statuses, not job sub-statuses (Daniel, 2026-10-05). This company configures
// none, and the menu item that opens this dialog is hidden with them
// (`COMPANY.subStatuses.active`), so the list is empty here by design.
const SUB_STATUSES = subStatusesFor("active").map((sub) => sub.name);

interface SubStatusFormProps {
  open: boolean;
  onClose: () => void;
  /** Dialog title (e.g. "Resume job" / "Change active status"). */
  title: string;
  /** Primary button label (e.g. "Resume" / "Change status"). */
  submitLabel: string;
  /** The optional reason field's label (e.g. "Resume reason" / "Status message"). */
  reasonLabel: string;
  /** Success toast title on submit. */
  toastTitle: string;
  /** Optional info-alert text at the top of the body (e.g. the Resume form). */
  banner?: string;
  /** Pre-filled sub-status (change forms) — empty for a fresh pick (resume). */
  initialSubStatus?: string;
  /** Pre-filled reason. */
  initialReason?: string;
  /** Commits the chosen sub-status (required) and reason (may be ""). */
  onSubmit: (subStatus: string, reason: string) => void;
  mobile?: boolean;
}

// A shared status form (Figma nodes 24096-19684 "Resume job" / 24101-15203
// "Change active status"): a required Sub-status select + an optional reason.
// Same shape as StartJobForm — the copy and pre-fill differ per use.
export default function SubStatusForm({
  open,
  onClose,
  title,
  submitLabel,
  reasonLabel,
  toastTitle,
  banner,
  initialSubStatus = "",
  initialReason = "",
  onSubmit,
  mobile = false,
}: SubStatusFormProps) {
  const [subStatus, setSubStatus] = useState(initialSubStatus);
  const [reason, setReason] = useState(initialReason);
  const [showError, setShowError] = useState(false);
  const subStatusPop = useSelectPopover(mobile);

  // A fresh open reloads the pre-fill; closing forces the nested select shut.
  useEffect(() => {
    if (!open) {
      setShowError(false);
      subStatusPop.close();
      return;
    }
    setSubStatus(initialSubStatus);
    setReason(initialReason);
    setShowError(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty = subStatus !== initialSubStatus || reason !== initialReason;

  const submit = () => {
    if (subStatus === "") {
      setShowError(true);
      return;
    }
    onSubmit(subStatus, reason);
    toast({ type: "success", title: toastTitle });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={dirty}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={submit}>
            {submitLabel}
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        {banner != null && <AlertBanner orientation="vertical">{banner}</AlertBanner>}

        {/* "Active status" — the sub-status an ACTIVE job carries, for the
            companies that enable them (Figma 24042-18897, error 24422-26522).
            It was "Job sub-status". */}
        <Input label="Active status">
          <SelectField
            value={subStatus || undefined}
            isValid={!showError}
            errorMessage="Choose Active status"
            open={subStatusPop.open}
            onClick={(e: MouseEvent<HTMLDivElement>) => subStatusPop.toggle(e.currentTarget)}
          />
        </Input>

        <Input label={reasonLabel} labelCondition="optional">
          <TextArea value={reason} onChange={(e) => setReason(e.target.value)} />
        </Input>
      </div>

      <SelectPopoverList pop={subStatusPop} mobile={mobile} title="Active status" searchable searchPlaceholder="Status...">
        <SelectListItemGroup>
          {SUB_STATUSES.map((s) => (
            <SelectListItem
              key={s}
              label={s}
              selected={s === subStatus}
              onClick={() => {
                setSubStatus(s);
                setShowError(false);
                subStatusPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </Dialog>
  );
}
