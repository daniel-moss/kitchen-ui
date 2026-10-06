import { MouseEvent, useEffect, useState } from "react";

import AlertBanner from "../../components/AlertBanner/AlertBanner";
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

import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";
import { TECH_STATUSES } from "./TimesheetPanel";

import { useCurrentJobId } from "./currentJob";

import styles from "./jobForm.module.scss";

// NO sub-status field here (Daniel, 2026-09-28). An active job is simply
// "Active": the tech's CHECK-IN status — Travelling / Working, in the card
// below — already says what they are doing, so an active sub-status would be a
// second answer to the same question. Roopairs advises companies not to
// configure them, and the demo assumes none. Paused and on-hold jobs still ask
// for a reason, in PauseJobForm.

interface StartJobFormProps {
  open: boolean;
  onClose: () => void;
  /**
   * Starts (or resumes) the job. `checkIn` = the Check in card's state;
   * `status` = the chosen check-in status ("" when not checking in).
   */
  onStart: (reason: string, checkIn: boolean, status: string, subStatus?: string) => void;
  mobile?: boolean;
  /** Dialog title. Default "Start job". */
  title?: string;
  /** Primary button copy. Default "Start" (Figma 24042-17549). */
  submitLabel?: string;
  /**
   * Primary button's left icon. Default "circle-play" (Figma 24042-14995) —
   * it fits Start and the Resume reuse alike. Pass "" for none.
   */
  submitIcon?: string;
  /** The optional reason TextArea's label. Default "Start reason". */
  reasonLabel?: string;
  /** Success toast title. Default '"JOB-ID" started'. */
  toastTitle?: string;
  /**
   * Optional info AlertBanner above the fields, dismissible. Resuming a
   * COMPLETED job uses it to warn that a new signature is needed
   * (Figma 24567-140277); plain Start / Resume have no banner.
   */
  banner?: string;
  /**
   * The company's ACTIVE sub-statuses. Sub-statuses are a per-company switch
   * (`CompanySettings.subStatuses`): where active ones are configured, the job
   * REQUIRES one to start or resume, and this adds the "Active status" select
   * above the reason (Figma 24042-18897, error 24422-26522, list 24044-14180).
   *
   * The demo company has the active half OFF — the tech's check-in status
   * stands in for it — so the page passes nothing and the field never renders.
   * See the "Active sub-statuses" story for what it looks like when it is on.
   */
  activeSubStatuses?: string[];
}

// The "Start job" form (Figma 24048-13283, 2026-07-27 update): Job sub-status
// select + optional reason + a "Check in" CheckboxItem card (selected by
// default) whose content is a VERTICAL stack of card radios over the four
// tech statuses (error "Choose your status"). The SAME form serves "Resume job"
// (Figma 24096-19684) via the copy props — resuming a PAUSED job has no banner,
// resuming a COMPLETED one passes `banner` (Figma 24567-140277).
export default function StartJobForm({
  open,
  onClose,
  onStart,
  mobile = false,
  title = "Start job",
  submitLabel = "Start",
  submitIcon = "circle-play",
  reasonLabel = "Start reason",
  toastTitle,
  banner,
  activeSubStatuses = [],
}: StartJobFormProps) {
  const jobId = useCurrentJobId();
  // The default needs the job id, and a default argument cannot call a hook.
  const title_ = toastTitle ?? `"${jobId}" started`;
  const [reason, setReason] = useState("");
  const [checkIn, setCheckIn] = useState(true);
  const [status, setStatus] = useState("");
  const [showError, setShowError] = useState(false);
  const [bannerShown, setBannerShown] = useState(true);
  // The "Active status" select exists only where the company configured one.
  const asksSubStatus = activeSubStatuses.length > 0;
  const [subStatus, setSubStatus] = useState("");
  const subStatusPop = useSelectPopover(mobile);

  // A fresh open resets the draft; closing also forces the nested selects shut.
  useEffect(() => {
    if (open) return;
    setReason("");
    setCheckIn(true);
    setStatus("");
    setShowError(false);
    setBannerShown(true);
    setSubStatus("");
    subStatusPop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty = reason !== "" || !checkIn || status !== "" || subStatus !== "";

  // An offered sub-status is required; with check-in on, a status is too.
  const start = () => {
    if ((asksSubStatus && subStatus === "") || (checkIn && status === "")) {
      setShowError(true);
      return;
    }
    onStart(reason, checkIn, status, subStatus);
    toast({ type: "success", title: title_ });
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
          <Button size="lg" variant="solid" leftIcon={submitIcon === "" ? undefined : submitIcon} onClick={start}>
            {submitLabel}
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        {banner != null && bannerShown && (
          <AlertBanner orientation="vertical" status="info" onDismiss={() => setBannerShown(false)}>
            {banner}
          </AlertBanner>
        )}

        {/* "Active status" — only for companies that configure active
            sub-statuses (Figma 24042-18897). */}
        {asksSubStatus && (
          <Input label="Active status">
            <SelectField
              value={subStatus || undefined}
              isValid={!(showError && subStatus === "")}
              errorMessage="Choose Active status"
              open={subStatusPop.open}
              onClick={(e: MouseEvent<HTMLDivElement>) => subStatusPop.toggle(e.currentTarget)}
            />
          </Input>
        )}

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

      {/* The Active-status picker — desktop card / mobile drawer. */}
      {asksSubStatus && (
        <SelectPopoverList pop={subStatusPop} mobile={mobile} title="Active status" searchable searchPlaceholder="Status...">
          <SelectListItemGroup>
            {activeSubStatuses.map((name) => (
              <SelectListItem
                key={name}
                label={name}
                selected={name === subStatus}
                onClick={() => {
                  setSubStatus(name);
                  setShowError(false);
                  subStatusPop.close();
                }}
              />
            ))}
          </SelectListItemGroup>
        </SelectPopoverList>
      )}
    </Dialog>
  );
}
