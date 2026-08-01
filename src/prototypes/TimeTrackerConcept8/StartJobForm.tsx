import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import CheckboxItem from "../../components/Checkbox/CheckboxItem";
import Dialog from "../../components/Dialog/Dialog";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import { JOB_ID } from "./jobData";
import { SelectPopoverList, useSelectPopover } from "./selectPopover";

import styles from "./jobForm.module.scss";

// Generic company sub-statuses (Figma 24044-14555 — placeholder demo values;
// Travelling / Working moved into the Check in card in this concept).
const SUB_STATUSES = ["Sub-status 1", "Sub-status 2", "Sub-status 3", "Sub-status 4", "Sub-status 5"];

// The check-in statuses inside the Check in card (Figma 24191-72766).
const CHECK_IN_STATUSES = [
  { value: "Travelling", icon: "van" },
  { value: "Working", icon: "wrench-simple" },
];

interface StartJobFormProps {
  open: boolean;
  onClose: () => void;
  /**
   * Starts (or resumes) the job. `checkIn` = the Check in card's state;
   * `status` = the chosen check-in status ("" when not checking in).
   */
  onStart: (subStatus: string, reason: string, checkIn: boolean, status: string) => void;
  mobile?: boolean;
  /** Dialog title. Default "Start job". */
  title?: string;
  /** Primary button copy. Default "Start job". */
  submitLabel?: string;
  /** The optional reason TextArea's label. Default "Start reason". */
  reasonLabel?: string;
  /** Success toast title. Default '"JOB-ID" started'. */
  toastTitle?: string;
  /** The check-in RadioGroup's label. Default "What time do you want to track?". */
  statusGroupLabel?: string;
  /**
   * Shows the "Check in" card. The OFFICE view hides it — the office can
   * start/resume a job but can not track the tech's time. Default true.
   */
  showCheckIn?: boolean;
}

// The "Start job" form (Figma 24048-13283): Job sub-status select + optional
// reason + a "Check in" CheckboxItem card (selected by default) whose content
// is a Travelling / Working radio pair. The SAME form serves "Resume job"
// (Figma 24096-19684) via the copy props — resume has NO banner.
export default function StartJobForm({
  open,
  onClose,
  onStart,
  mobile = false,
  title = "Start job",
  submitLabel = "Start job",
  reasonLabel = "Start reason",
  toastTitle = `"${JOB_ID}" started`,
  statusGroupLabel = "What time do you want to track?",
  showCheckIn = true,
}: StartJobFormProps) {
  const [subStatus, setSubStatus] = useState("");
  const [reason, setReason] = useState("");
  const [checkIn, setCheckIn] = useState(true);
  const [status, setStatus] = useState("");
  const [showError, setShowError] = useState(false);
  const subStatusPop = useSelectPopover(mobile);

  // A fresh open resets the draft; closing also forces the nested select shut.
  useEffect(() => {
    if (open) return;
    setSubStatus("");
    setReason("");
    setCheckIn(true);
    setStatus("");
    setShowError(false);
    subStatusPop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty = subStatus !== "" || reason !== "" || (showCheckIn && (!checkIn || status !== ""));

  // Sub-status is required; with check-in on, a status is required too.
  // Without the card (office) nothing tracking-related is sent.
  const start = () => {
    const tracking = showCheckIn && checkIn;
    if (subStatus === "" || (tracking && status === "")) {
      setShowError(true);
      return;
    }
    onStart(subStatus, reason, tracking, tracking ? status : "");
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
          <Button size="lg" variant="solid" onClick={start}>
            {submitLabel}
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        <Input label="Job sub-status">
          <SelectField
            value={subStatus || undefined}
            isValid={!(showError && subStatus === "")}
            open={subStatusPop.open}
            onClick={(e: MouseEvent<HTMLDivElement>) => subStatusPop.toggle(e.currentTarget)}
          />
        </Input>

        <Input label={reasonLabel} labelCondition="optional">
          <TextArea value={reason} onChange={(e) => setReason(e.target.value)} />
        </Input>

        {/* Check in — selected by default; its content holds the status pair.
            A missing status puts the WHOLE card in error, not just the radios. */}
        {showCheckIn && (
        <CheckboxItem
          variant="card"
          icon="arrow-right-to-arc"
          label="Check in"
          caption="Start tracking your time"
          checked={checkIn}
          error={showError && checkIn && status === ""}
          onChange={(e) => {
            setCheckIn(e.target.checked);
            // Unchecking the card resets the status choice (Daniel).
            if (!e.target.checked) setStatus("");
            setShowError(false);
          }}
          content={
            <Input label={statusGroupLabel}>
              <RadioGroup
                orientation={mobile ? "vertical" : "horizontal"}
                value={status}
                onChange={(v) => {
                  setStatus(v);
                  setShowError(false);
                }}
                isValid={!(showError && checkIn && status === "")}
                errorMessage="Choose an option"
              >
                {CHECK_IN_STATUSES.map((s) => (
                  <RadioItem key={s.value} value={s.value} variant="card" icon={s.icon} iconPack="regular" label={s.value} />
                ))}
              </RadioGroup>
            </Input>
          }
        />
        )}
      </div>

      {/* Sub-status picker */}
      <SelectPopoverList
        pop={subStatusPop}
        mobile={mobile}
        title="Job sub-status"
        searchable
        searchPlaceholder="Search by status name..."
      >
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
