import { MouseEvent, useEffect, useState } from "react";

import AlertBanner from "../../components/AlertBanner/AlertBanner";
import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import EmptyState from "../../components/EmptyState/EmptyState";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import { Icon } from "../../components/Icon/Icon";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";

import { JobSubStatusRecord } from "../../data/db/types";
import DismissCancelButton from "../shared/DismissCancelButton";
import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";
import CheckInOutField, { useCheckInOut } from "./CheckInOutField";

import styles from "./jobForm.module.scss";

// The demo company has NO active sub-statuses (Daniel, 2026-09-28): the tech's
// CHECK-IN status — Travelling / Working, in the card below — already says what
// they are doing. So on the page the "Active status" field never shows; the
// form still follows every Figma rule for a company that has them (27154-50245),
// and the stories show those states.

interface StartJobFormProps {
  open: boolean;
  onClose: () => void;
  /**
   * Starts (or resumes) the job. `checkIn` = "Check in" was picked;
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
  /** The reason TextArea's label. Default "Start reason". */
  reasonLabel?: string;
  /** Success toast title. Default "Job started" (Figma 24045-12359). */
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
  activeSubStatuses?: JobSubStatusRecord[];
  /**
   * The company REQUIRES an active sub-status (`subStatuses.activeRequired`).
   * Off → the field is "(optional)". On with ONE sub-status → the system picks
   * it: the field is read-only, "The only status available". Default true.
   */
  activeStatusRequired?: boolean;
  /**
   * The check in / out choice — only for a viewer who is an ASSIGNEE and is not
   * checked in yet (Figma 27163-52433). Default true.
   */
  showCheckIn?: boolean;
}

// The "Start job" form (Figma 24048-13283, re-read 2026-10-25): Active status
// select + Start reason + the shared Check In / Out control (checked-out state,
// "Check in" picked by default).
// The SAME form serves "Resume job"
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
  activeStatusRequired = true,
  showCheckIn = true,
}: StartJobFormProps) {
  const toastTitle_ = toastTitle ?? "Job started";
  // Active status (Figma 27154-50245): shown when the company has active
  // sub-statuses; required when it requires them AND there are 2+ to choose
  // from; with exactly one required, the system picks it (read-only).
  const statuses = [...activeSubStatuses].sort((a, b) => a.name.localeCompare(b.name));
  const asksSubStatus = statuses.length > 0;
  const onlyStatus = activeStatusRequired && statuses.length === 1 ? statuses[0].name : "";
  const subStatusRequired = activeStatusRequired && statuses.length > 1;

  const [reason, setReason] = useState("");
  // "Check in" is picked by default — no company preference exists in the demo.
  // Start never meets a running session (`showCheckIn` is false then).
  const clock = useCheckInOut({ open, shown: showCheckIn, checkedIn: false, defaults: { checkedIn: "stay", checkedOut: "change" } });
  const [showError, setShowError] = useState(false);
  const [bannerShown, setBannerShown] = useState(true);
  const [subStatus, setSubStatus] = useState(onlyStatus);
  const subStatusPop = useSelectPopover(mobile);

  // A fresh open resets the draft; closing also forces the nested selects shut.
  useEffect(() => {
    if (open) return;
    setReason("");
    setShowError(false);
    setBannerShown(true);
    setSubStatus(onlyStatus);
    subStatusPop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Start reason (Figma 27154-51867): always shown; required only when the
  // PICKED sub-status requires a reason. Its custom label is the help text.
  const picked = statuses.find((row) => row.name === subStatus);
  const reasonRequired = picked?.reasonRequired === true;
  const reasonHelp = picked?.reasonLabel != null && picked.reasonLabel !== "" ? picked.reasonLabel : undefined;

  const dirty = reason !== "" || clock.dirty || subStatus !== onlyStatus;

  const subStatusBad = subStatusRequired && subStatus === "";
  const reasonBad = reasonRequired && reason.trim() === "";

  const start = () => {
    if (subStatusBad || reasonBad || clock.statusBad) {
      setShowError(true);
      return;
    }
    onStart(reason, clock.checkIn, clock.checkIn ? clock.status : "", subStatus);
    toast({ type: "success", title: toastTitle_ });
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
        <PopoverFooter leadingButton={<DismissCancelButton />}>
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
            sub-statuses (Figma 27154-50245). */}
        {asksSubStatus &&
          (onlyStatus !== "" ? (
            <Input label="Active status" helpText="The only status available">
              <SelectField value={onlyStatus} readOnly />
            </Input>
          ) : (
            <Input label="Active status" labelCondition={subStatusRequired ? undefined : "optional"}>
              <SelectField
                value={subStatus || undefined}
                isValid={!(showError && subStatusBad)}
                errorMessage="Choose Active status"
                open={subStatusPop.open}
                onClick={(e: MouseEvent<HTMLDivElement>) => subStatusPop.toggle(e.currentTarget)}
              />
            </Input>
          ))}

        <Input label={reasonLabel} labelCondition={reasonRequired ? undefined : "optional"} helpText={reasonHelp}>
          <TextArea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            isValid={!(showError && reasonBad)}
          />
        </Input>

        {/* Check In / Out (Figma 27163-52433): only for an assignee who is
            not checked in yet. */}
        {showCheckIn && (
          <CheckInOutField
            runningSession={null}
            choice={clock.choice}
            onChoiceChange={(choice) => {
              clock.setChoice(choice);
              setShowError(false);
            }}
            status={clock.status}
            onStatusChange={(status) => {
              clock.setStatus(status);
              setShowError(false);
            }}
            showError={showError}
            mobile={mobile}
          />
        )}
      </div>

      {/* The Active-status picker — desktop card / mobile drawer. */}
      {asksSubStatus && onlyStatus === "" && (
        <SelectPopoverList
          pop={subStatusPop}
          mobile={mobile}
          title="Active status"
          searchable
          searchPlaceholder="Status..."
          noResultsState={<EmptyState caption="No statuses match" />}
        >
          <SelectListItemGroup>
            {statuses.map(({ name }) => (
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
