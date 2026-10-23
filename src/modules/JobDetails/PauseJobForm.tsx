import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import EmptyState from "../../components/EmptyState/EmptyState";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";

import { TEXT_SEPARATOR } from "../../utils/textSeparator";

import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";

import { COMPANY, subStatusesFor } from "../../data/db";
import type { JobSubStatusRecord } from "../../data/db/types";

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

const byName = (rows: JobSubStatusRecord[]) => [...rows].sort((a, b) => a.name.localeCompare(b.name));

/**
 * How each dialog's status list is GROUPED, each group sorted by name A to Z
 * (Figma 27189-56157). Quick-pause is one plain list; ON HOLD shows two
 * labelled groups — "External" waits on the client, "Internal" waits on us
 * (Daniel, 2026-10-05; Figma 24964-47219). The split is the database's own:
 * the two hold parents.
 */
export const STATUS_ROWS: Record<PauseType, { label?: string; rows: JobSubStatusRecord[] }[]> = {
  "quick-pause": [{ rows: byName(subStatusesFor("quickPaused")) }],
  "on-hold": [
    { label: "External", rows: byName(subStatusesFor("onHoldExternal")) },
    { label: "Internal", rows: byName(subStatusesFor("onHoldInternal")) },
  ],
};

/** The reason's preferred length (Figma 27189-56683): longer only WARNS. */
export const REASON_LIMIT = 60;

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
   * `checkOut` = the tech's time stops with the job; "Stay checked in" keeps
   * the running session going.
   */
  onPause: (type: string, subStatus: string, reason: string, checkOut: boolean) => void;
  /**
   * The viewer's running time session, e.g. "Working: 01:30:05" — shows the
   * clock choice. Null when the viewer's clock is not running: no choice.
   */
  runningSession?: string | null;
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
  /** The success toast's title (Figma 24058-15851 / 24963-43689). */
  toast: string;
  enabled: boolean;
  required: boolean;
}> = {
  "quick-pause": {
    title: "Pause job",
    submit: "Pause",
    submitIcon: "circle-pause",
    statusLabel: "Pause status",
    reasonLabel: "Pause reason",
    reasonHelp: "Why do you need to pause this job?",
    toast: "Job paused",
    enabled: COMPANY.subStatuses.quickPaused,
    required: COMPANY.subStatuses.quickPausedRequired,
  },
  "on-hold": {
    title: "Hold job",
    submit: "Hold",
    submitIcon: "circle-stop",
    statusLabel: "Hold status",
    reasonLabel: "Hold reason",
    reasonHelp: "Why do you need to hold this job?",
    // "is on hold", not "put on hold" (Figma 24963-43689).
    toast: "Job is on hold",
    enabled: COMPANY.subStatuses.onHold,
    required: COMPANY.subStatuses.onHoldRequired,
  },
};

// "Pause job" form (Figma 24058-15840): the Pause status select (only where
// the company has pause sub-statuses), the Pause reason, and — for a viewer
// whose clock runs — the "Stay checked in" / "Check out" choice.
export default function PauseJobForm({
  open,
  onClose,
  onPause,
  runningSession = null,
  mobile = false,
  type = "quick-pause",
}: PauseJobFormProps) {
  const copy = COPY[type];
  // Pause status (Figma 27189-56150): shown when the company has sub-statuses
  // for this status; required when it requires them AND there are 2+ to
  // choose from; with exactly one required, the system picks it (read-only).
  const groups = STATUS_ROWS[type];
  const statuses = groups.flatMap((group) => group.rows);
  const asksStatus = copy.enabled && statuses.length > 0;
  const onlyStatus = asksStatus && copy.required && statuses.length === 1 ? statuses[0].name : "";
  const statusRequired = asksStatus && copy.required && statuses.length > 1;

  const [subStatus, setSubStatus] = useState(onlyStatus);
  const [reason, setReason] = useState("");
  // "Check out" by default (Figma 24058-15849) — pausing usually means the
  // tech stops working, but they can keep their time running.
  const [session, setSession] = useState<"stay" | "checkOut">("checkOut");
  const [showError, setShowError] = useState(false);
  const subStatusPop = useSelectPopover(mobile);

  useEffect(() => {
    if (open) return;
    setSubStatus(onlyStatus);
    setReason("");
    setSession("checkOut");
    setShowError(false);
    subStatusPop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Pause reason (Figma 27189-56683): always shown; required only when the
  // PICKED sub-status requires a reason. A sub-status's own label replaces the
  // default help text, and past 60 characters a warning replaces either — it
  // never blocks the form.
  const picked = statuses.find((row) => row.name === subStatus);
  const reasonRequired = picked?.reasonRequired === true;
  const customHelp = picked?.reasonLabel != null && picked.reasonLabel !== "" ? picked.reasonLabel : undefined;
  const tooLong = reason.length > REASON_LIMIT;
  const reasonHelp = tooLong
    ? `${reason.length} / ${REASON_LIMIT} characters. Keep it short. Add details to the job summary.`
    : customHelp ?? copy.reasonHelp;

  const dirty = subStatus !== onlyStatus || reason !== "" || session !== "checkOut";

  const statusBad = statusRequired && subStatus === "";
  const reasonBad = reasonRequired && reason.trim() === "";

  const pause = () => {
    if (statusBad || reasonBad) {
      setShowError(true);
      return;
    }
    onPause(type, subStatus, reason, runningSession != null && session === "checkOut");
    toast({ type: "success", title: copy.toast });
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
            Hold are two dialogs now, so the entry point already said which. */}
        {asksStatus &&
          (onlyStatus !== "" ? (
            <Input label={copy.statusLabel} helpText="The only status available">
              <SelectField value={onlyStatus} readOnly />
            </Input>
          ) : (
            <Input label={copy.statusLabel} labelCondition={statusRequired ? undefined : "optional"}>
              <SelectField
                value={subStatus || undefined}
                isValid={!(showError && statusBad)}
                errorMessage={`Choose ${copy.statusLabel}`}
                open={subStatusPop.open}
                onClick={(e: MouseEvent<HTMLDivElement>) => subStatusPop.toggle(e.currentTarget)}
              />
            </Input>
          ))}

        <Input
          label={copy.reasonLabel}
          labelCondition={reasonRequired ? undefined : "optional"}
          helpText={reasonHelp}
          helpTextStatus={tooLong ? "warning" : undefined}
        >
          <TextArea value={reason} onChange={(e) => setReason(e.target.value)} isValid={!(showError && reasonBad)} />
        </Input>

        {/* Check in / out: only for a viewer whose clock runs. The label names
            the running session; "Check out" by default. */}
        {runningSession != null && (
          <Input label={`Your clock is running${TEXT_SEPARATOR}${runningSession}`}>
            <RadioGroup orientation="horizontal" value={session} onChange={(value) => setSession(value as "stay" | "checkOut")}>
              <RadioItem value="stay" variant="card" icon="arrow-right-to-arc" iconPack="solid" label="Stay checked in" />
              <RadioItem value="checkOut" variant="card" icon="arrow-left-from-arc" iconPack="solid" label="Check out" />
            </RadioGroup>
          </Input>
        )}
      </div>

      {asksStatus && onlyStatus === "" && (
        <SelectPopoverList
          pop={subStatusPop}
          mobile={mobile}
          title={copy.statusLabel}
          searchable
          searchPlaceholder="Status..."
          noResultsState={<EmptyState caption="No statuses match" />}
        >
          {/* A group shows only when it holds a status (Figma 27189-56903). */}
          {groups.filter((group) => group.rows.length > 0).map((group) => (
            <SelectListItemGroup
              key={group.label ?? "all"}
              label={group.label == null ? undefined : <GroupLabel variant="secondary" label={group.label} />}
            >
              {group.rows.map(({ name }) => (
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
      )}
    </Dialog>
  );
}
