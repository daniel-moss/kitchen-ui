import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import CheckboxItem from "../../components/Checkbox/CheckboxItem";
import Dialog from "../../components/Dialog/Dialog";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import { Icon } from "../../components/Icon/Icon";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import { JOB_ID } from "./jobData";
import { SelectPopoverList, useSelectPopover } from "../../forms/shared/selectPopover";
import { TECH_STATUSES } from "./TimesheetPanel";

import styles from "./jobForm.module.scss";

// Generic company sub-statuses (Figma 24044-14555 — placeholder demo values;
// the tech statuses live in the Check in card's Status select instead).
const SUB_STATUSES = ["Sub-status 1", "Sub-status 2", "Sub-status 3", "Sub-status 4", "Sub-status 5"];

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
}

// The "Start job" form (Figma 24048-13283, 2026-07-27 update): Job sub-status
// select + optional reason + a "Check in" CheckboxItem card (selected by
// default) whose content is a VERTICAL stack of card radios over the four
// tech statuses (error "Choose your status"). The SAME form serves "Resume job"
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
}: StartJobFormProps) {
  const [subStatus, setSubStatus] = useState("");
  const [reason, setReason] = useState("");
  const [checkIn, setCheckIn] = useState(true);
  const [status, setStatus] = useState("");
  const [showError, setShowError] = useState(false);
  const subStatusPop = useSelectPopover(mobile);

  // A fresh open resets the draft; closing also forces the nested selects shut.
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

  const dirty = subStatus !== "" || reason !== "" || !checkIn || status !== "";

  // Sub-status is required; with check-in on, a status is required too.
  const start = () => {
    if (subStatus === "" || (checkIn && status === "")) {
      setShowError(true);
      return;
    }
    onStart(subStatus, reason, checkIn, status);
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
            // Figma 24048-13283: the status is a VERTICAL stack of card
            // radios, one per tech status — not a select + popover.
            <Input label="Your status">
              <RadioGroup
                value={status}
                onChange={(v) => {
                  setStatus(v);
                  setShowError(false);
                }}
                isValid={!(showError && checkIn && status === "")}
                errorMessage="Choose your status"
              >
                {TECH_STATUSES.map((s) => (
                  <RadioItem key={s.value} value={s.value} variant="card" icon={s.icon} iconPack="regular" label={s.value} />
                ))}
              </RadioGroup>
            </Input>
          }
        />
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
