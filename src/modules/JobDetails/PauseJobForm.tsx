import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import CheckboxItem from "../../components/Checkbox/CheckboxItem";
import Dialog from "../../components/Dialog/Dialog";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";

import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";

import { COMPANY, subStatusesFor } from "../../data/db";
import { useCurrentJobId } from "./currentJob";

import styles from "./jobForm.module.scss";

// The sub-statuses available per pause Type (placeholder demo values).
// The reasons each pause type offers, from the database (2026-09-28 — they used
// to be invented here and did not match the workspace's own list). The form has
// ONE "on hold" type; the database splits hold reasons by who is being waited
// on, so both kinds are offered together and `isInternalHold` tells them apart
// again wherever the colour matters.
export const PAUSE_SUB_STATUSES: Record<string, string[]> = {
  "quick-pause": subStatusesFor("quickPaused").map((sub) => sub.name),
  "on-hold": [...subStatusesFor("onHoldExternal"), ...subStatusesFor("onHoldInternal")].map((sub) => sub.name),
};

/**
 * How each dialog's status list is GROUPED. Quick-pause is one plain list;
 * ON HOLD shows two labelled groups — "External" waits on the client,
 * "Internal" waits on us (Daniel, 2026-10-05; Figma 24964-47219). The split
 * is the database's own: the two hold parents.
 */
export const STATUS_GROUPS: Record<PauseType, { label?: string; names: string[] }[]> = {
  "quick-pause": [{ names: subStatusesFor("quickPaused").map((sub) => sub.name) }],
  "on-hold": [
    { label: "External", names: subStatusesFor("onHoldExternal").map((sub) => sub.name) },
    { label: "Internal", names: subStatusesFor("onHoldInternal").map((sub) => sub.name) },
  ],
};

/**
 * Which "On hold" reasons wait on something INSIDE the company. The Job
 * lifecycle module colors those rows brown instead of crimson (the DS
 * `BadgeJobStatus` on-hold variants); the rest wait on the client and stay
 * crimson.
 *
 * It now ASKS THE DATABASE (2026-09-28), which stores the kind on the reason
 * itself — exactly as the real app does — instead of keeping a hand-written
 * list of names here that had to be kept in step.
 */
export const INTERNAL_ON_HOLD = subStatusesFor("onHoldInternal").map((sub) => sub.name);

interface PauseJobFormProps {
  open: boolean;
  onClose: () => void;
  /**
   * Pauses with the chosen Type (quick-pause | on-hold), sub-status and reason.
   * `checkOut` = the tech's time stops with the job; unticked, the running
   * session keeps going.
   */
  onPause: (type: string, subStatus: string, reason: string, checkOut: boolean) => void;
  mobile?: boolean;
  /**
   * WHICH dialog this is. "Pause" and "Hold" are two menu items opening two
   * dialogs (Figma 24058-15840 / 24963-43684, 2026-10-05) — the Pause-type
   * RadioGroup is gone, so the entry point decides and every label follows.
   */
  type?: PauseType;
}

export type PauseType = "quick-pause" | "on-hold";

/** The copy each dialog carries. Everything else about them is identical. */
const COPY: Record<PauseType, {
  title: string;
  submit: string;
  /** The primary button's left icon — its status icon (Figma 24058-15850 / 24963-43688). */
  submitIcon: string;
  statusLabel: string;
  reasonLabel: string;
  reasonHelp: string;
  toast: string;
  enabled: boolean;
}> = {
  "quick-pause": {
    title: "Pause job",
    submit: "Pause",
    submitIcon: "circle-pause",
    statusLabel: "Pause status",
    reasonLabel: "Pause reason",
    reasonHelp: "Why do you need to pause this job?",
    toast: "paused",
    enabled: COMPANY.subStatuses.quickPaused,
  },
  "on-hold": {
    title: "Hold job",
    submit: "Hold",
    submitIcon: "circle-stop",
    statusLabel: "On hold status",
    reasonLabel: "On hold reason",
    reasonHelp: "Why do you need to hold this job?",
    // "is on hold", not "put on hold" (Figma 24963-43689).
    toast: "is on hold",
    enabled: COMPANY.subStatuses.onHold,
  },
};

// "Pause job" form (Figma node 24058-15840): a required Pause-type choice —
// Quick-pause (amber circle-pause) / On hold (crimson circle-stop), card radios
// with a description — that reveals a required Sub-status select, then an
// optional Pause reason, then the "Check out" checkbox. No read-only
// job-identity group.
export default function PauseJobForm({ open, onClose, onPause, mobile = false, type = "quick-pause" }: PauseJobFormProps) {
  const jobId = useCurrentJobId();
  const copy = COPY[type];
  // The status select exists only where the company configured sub-statuses
  // for this status (the node's annotation).
  const asksStatus = copy.enabled && PAUSE_SUB_STATUSES[type].length > 0;
  const [subStatus, setSubStatus] = useState("");
  const [reason, setReason] = useState("");
  // Checked by default (node annotation on 24512-62825) — pausing usually means
  // the tech stops working, but they can now keep their time running.
  const [checkOut, setCheckOut] = useState(true);
  const [showError, setShowError] = useState(false);
  const subStatusPop = useSelectPopover(mobile);

  useEffect(() => {
    if (open) return;
    setSubStatus("");
    setReason("");
    setCheckOut(true);
    setShowError(false);
    subStatusPop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty = subStatus !== "" || reason !== "";

  // The status is required wherever it is asked for.
  const pause = () => {
    if (asksStatus && subStatus === "") {
      setShowError(true);
      return;
    }
    onPause(type, subStatus, reason, checkOut);
    toast({ type: "success", title: `"${jobId}" ${copy.toast}` });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={copy.title}
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
          <Button size="lg" variant="solid" leftIcon={copy.submitIcon} onClick={pause}>
            {copy.submit}
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        {/* The Pause-TYPE RadioGroup is gone (Daniel, 2026-10-05): Pause and
            Hold are two dialogs now, so the entry point already said which.
            The status select is shown only where the company configured
            sub-statuses for this status. */}
        {asksStatus && (
          <Input label={copy.statusLabel}>
            <SelectField
              value={subStatus || undefined}
              isValid={!(showError && subStatus === "")}
              errorMessage={`Choose ${copy.statusLabel}`}
              open={subStatusPop.open}
              onClick={(e: MouseEvent<HTMLDivElement>) => subStatusPop.toggle(e.currentTarget)}
            />
          </Input>
        )}

        <Input label={copy.reasonLabel} labelCondition="optional" helpText={copy.reasonHelp}>
          <TextArea value={reason} onChange={(e) => setReason(e.target.value)} />
        </Input>

        {/* Pausing no longer checks the tech out by itself (Figma 24512-62825):
            this card decides it, and it is ticked by default. */}
        <CheckboxItem
          variant="card"
          icon="arrow-left-from-arc"
          label="Check out"
          caption="Stop tracking your time"
          checked={checkOut}
          onChange={(e) => setCheckOut(e.target.checked)}
        />
      </div>

      <SelectPopoverList
        pop={subStatusPop}
        mobile={mobile}
        title={copy.statusLabel}
        searchable
        searchPlaceholder="Status..."
      >
        {STATUS_GROUPS[type].map((group) => (
          <SelectListItemGroup
            key={group.label ?? "all"}
            label={group.label == null ? undefined : <GroupLabel variant="secondary" label={group.label} />}
          >
            {group.names.map((name) => (
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
        ))}
      </SelectPopoverList>
    </Dialog>
  );
}
