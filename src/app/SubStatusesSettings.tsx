import { MouseEvent, useEffect, useState } from "react";

import Button from "../components/Button/Button";
import Dialog from "../components/Dialog/Dialog";
import SelectField from "../components/Fields/SelectField/SelectField";
import TextField from "../components/Fields/TextField/TextField";
import IconButton from "../components/IconButton/IconButton";
import Input from "../components/Input/Input";
import ItemGroup from "../components/ItemGroup/ItemGroup";
import ListItem from "../components/ListItem/ListItem";
import PopoverFooter from "../components/Popover/PopoverFooter";
import SelectListItem from "../components/SelectList/SelectListItem";
import SelectListItemGroup from "../components/SelectList/SelectListItemGroup";
import ToggleItem from "../components/Toggle/ToggleItem";
import HoverTooltip from "../components/Tooltip/HoverTooltip";
import { CheckInAction, CheckInAfter, JobSubStatusRecord, ReasonHelpTexts, SubStatusParent } from "../data/db";
import { SelectPopoverList, useSelectPopover } from "../modules/shared/selectPopover";
import { joinWithSeparator } from "../utils/textSeparator";

import ChoiceField from "./ChoiceField";
import { useCompanySettings } from "./store/CompanySettingsStore";

import styles from "./DemoSettingsPage.module.scss";

// The sub-status LISTS of the Demo settings page (Daniel, 2026-11-14). Under
// each sub-status switch, while it is on: the company's sub-statuses of that
// kind, each with its reason rules — whether the reason is required, and an
// optional help text for the reason field. Without one, the dialog shows its
// own GENERIC help text. A row click edits; the × removes; "Add status" adds.
//
// No reordering: every dialog lists sub-statuses A to Z (Figma 27189-56157).

/** The three switches on the page, and the database parents each one covers. */
export type SubStatusKind = "active" | "quickPaused" | "onHold";

const PARENTS: Record<SubStatusKind, SubStatusParent[]> = {
  active: ["active"],
  quickPaused: ["quickPaused"],
  onHold: ["onHoldExternal", "onHoldInternal"],
};

/**
 * The dialogs whose reason field each switch covers, with the key of their
 * GENERIC help text (`COMPANY.reasonHelpTexts`, Daniel 2026-11-14).
 */
const GENERIC_FIELDS: Record<SubStatusKind, { key: keyof ReasonHelpTexts; dialog: string }[]> = {
  active: [
    { key: "start", dialog: "Start" },
    { key: "resume", dialog: "Resume" },
    { key: "changeActiveStatus", dialog: "Change active status" },
  ],
  quickPaused: [{ key: "pause", dialog: "Pause" }],
  onHold: [{ key: "hold", dialog: "Hold" }],
};

/** The actions each switch's generic check in / out rule covers. */
const CHECK_IN_ACTIONS: Record<SubStatusKind, { action: CheckInAction; label: string; also?: string }[]> = {
  active: [
    { action: "start", label: "Start", also: "Change active status follows it too" },
    { action: "resume", label: "Resume" },
  ],
  quickPaused: [{ action: "pause", label: "Pause", also: "Change pause status follows it too" }],
  onHold: [{ action: "hold", label: "Hold", also: "Change hold status follows it too" }],
};

const CHECK_IN_OPTIONS: { value: CheckInAfter; label: string }[] = [
  { value: "in", label: "Checked in" },
  { value: "out", label: "Checked out" },
];

const checkInLabel = (after: CheckInAfter) => (after === "in" ? "Checked in" : "Checked out");

/**
 * The generic reason help texts of one switch's dialogs — shown when the
 * picked sub-status has no help text of its own, or none is picked. They
 * apply whether the sub-status switch is on or off: the reason field is
 * always there. Empty = no help text.
 */
export function GenericReasonHelpFields({ kind, mobile }: { kind: SubStatusKind; mobile: boolean }) {
  const { settings, update } = useCompanySettings();
  const texts = settings.reasonHelpTexts;
  return (
    <div className={`${styles.statusList} ${styles.nested}`}>
      {/* The generic check in / out rule per action (Daniel, 2026-11-14): only
          the dialog's PRESELECTED option — the tech can pick the other. */}
      {CHECK_IN_ACTIONS[kind].map(({ action, label, also }) => (
        <ChoiceField
          key={action}
          label={`After ${label}, the tech is`}
          helpText={`The preselected Check in / out option. A status can have its own rule${also != null ? `. ${also}` : ""}`}
          value={settings.checkInAfter[action]}
          options={CHECK_IN_OPTIONS}
          onChange={(next) => next != null && update({ checkInAfter: { ...settings.checkInAfter, [action]: next } })}
          mobile={mobile}
        />
      ))}
      {GENERIC_FIELDS[kind].map(({ key, dialog }) => (
        <Input
          key={key}
          label={`${dialog} reason help text`}
          labelCondition="optional"
          helpText="The generic one: shown when the status has no help text of its own"
        >
          <TextField
            value={texts[key]}
            onChange={(event) => update({ reasonHelpTexts: { ...texts, [key]: event.target.value } })}
          />
        </Input>
      ))}
    </div>
  );
}

const HOLD_TYPES: { value: SubStatusParent; label: string }[] = [
  { value: "onHoldExternal", label: "External: waiting on the client" },
  { value: "onHoldInternal", label: "Internal: waiting on us" },
];

const holdTypeLabel = (parent: SubStatusParent) => (parent === "onHoldInternal" ? "Internal" : "External");

const hasHelp = (sub: JobSubStatusRecord) => sub.reasonLabel != null && sub.reasonLabel !== "";

type SubStatusValues = Pick<JobSubStatusRecord, "name" | "status" | "reasonRequired" | "reasonLabel" | "checkInAfter">;

const CHECK_IN_RULES: { value: "generic" | CheckInAfter; label: string }[] = [
  { value: "generic", label: "Same as the generic rule" },
  { value: "in", label: "Checked in" },
  { value: "out", label: "Checked out" },
];

/** Add (no `sub`) or edit one sub-status. */
function SubStatusDialog({
  open,
  kind,
  sub,
  genericHelp,
  genericCheckIn,
  takenNames,
  mobile,
  onClose,
  onSave,
}: {
  open: boolean;
  kind: SubStatusKind;
  sub?: JobSubStatusRecord;
  /** What the dialogs show when this status has no help text: the generic texts, quoted. */
  genericHelp: string;
  /** The OTHER sub-statuses' names of this kind — a name must be unique. */
  takenNames: string[];
  mobile: boolean;
  onClose: () => void;
  onSave: (values: SubStatusValues) => void;
  /** What "Same as the generic rule" means for this kind, e.g. "Checked in (Start), Checked in (Resume)". */
  genericCheckIn: string;
}) {
  const [name, setName] = useState("");
  const [parent, setParent] = useState<SubStatusParent>(PARENTS[kind][0]);
  const [reasonRequired, setReasonRequired] = useState(false);
  const [help, setHelp] = useState("");
  const [checkIn, setCheckIn] = useState<"generic" | CheckInAfter>("generic");
  const [submitted, setSubmitted] = useState(false);
  const pop = useSelectPopover(mobile);

  useEffect(() => {
    if (!open) return;
    setName(sub?.name ?? "");
    setParent(sub?.status ?? PARENTS[kind][0]);
    setReasonRequired(sub?.reasonRequired === true);
    setHelp(sub?.reasonLabel ?? "");
    setCheckIn(sub?.checkInAfter ?? "generic");
    setSubmitted(false);
  }, [open, sub, kind]);

  const trimmed = name.trim();
  const nameError =
    trimmed === ""
      ? "Enter name"
      : takenNames.some((taken) => taken.toLowerCase() === trimmed.toLowerCase())
        ? "This status already exists"
        : undefined;
  const dirty =
    trimmed !== (sub?.name ?? "") ||
    parent !== (sub?.status ?? PARENTS[kind][0]) ||
    reasonRequired !== (sub?.reasonRequired === true) ||
    help.trim() !== (sub?.reasonLabel ?? "") ||
    checkIn !== (sub?.checkInAfter ?? "generic");

  const save = () => {
    if (nameError != null) {
      setSubmitted(true);
      return;
    }
    onSave({
      name: trimmed,
      status: parent,
      reasonRequired,
      reasonLabel: help.trim() === "" ? undefined : help.trim(),
      checkInAfter: checkIn === "generic" ? undefined : checkIn,
    });
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={sub == null ? "New status" : "Edit status"}
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
            <Button size="lg" variant="solid" onClick={save}>
              {sub == null ? "Add" : "Save"}
            </Button>
          </PopoverFooter>
        }
      >
        <Input label="Name">
          <TextField
            value={name}
            onChange={(event) => setName(event.target.value)}
            isValid={!(submitted && nameError != null)}
            errorMessage={nameError}
          />
        </Input>
        {kind === "onHold" && (
          <Input label="Type" helpText="Internal holds show a brown badge, external ones a crimson badge">
            <SelectField
              value={HOLD_TYPES.find((type) => type.value === parent)?.label}
              open={pop.open}
              onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
            />
          </Input>
        )}
        <ToggleItem
          label="Reason required"
          caption="Off: the Reason field is optional"
          checked={reasonRequired}
          onChange={(event) => setReasonRequired(event.target.checked)}
        />
        <Input
          label="Reason help text"
          labelCondition="optional"
          helpText={`Empty: the generic help text shows — ${genericHelp}`}
        >
          <TextField value={help} onChange={(event) => setHelp(event.target.value)} />
        </Input>
        <ChoiceField
          label="After this status, the tech is"
          helpText={`The preselected Check in / out option. Generic rule: ${genericCheckIn}`}
          value={checkIn}
          options={CHECK_IN_RULES}
          onChange={(next) => next != null && setCheckIn(next)}
          mobile={mobile}
        />
      </Dialog>
      {kind === "onHold" && (
        <SelectPopoverList pop={pop} mobile={mobile} title="Type">
          <SelectListItemGroup>
            {HOLD_TYPES.map((type) => (
              <SelectListItem
                key={type.value}
                label={type.label}
                selected={type.value === parent}
                onClick={() => {
                  setParent(type.value);
                  pop.close();
                }}
              />
            ))}
          </SelectListItemGroup>
        </SelectPopoverList>
      )}
    </>
  );
}

/** One kind's list + "Add status", shown under its switch. */
export default function SubStatusList({ kind, mobile }: { kind: SubStatusKind; mobile: boolean }) {
  const { settings, update } = useCompanySettings();
  const all = settings.jobSubStatuses;
  const parents = PARENTS[kind];
  const rows = all.filter((sub) => parents.includes(sub.status)).sort((a, b) => a.name.localeCompare(b.name));
  // The dialog's target: null = adding, a sub-status = editing it. Kept after
  // the dialog closes, so its title does not flip to "New status" while it
  // animates out.
  const [open, setOpen] = useState(false);
  const [editing, setEditingTarget] = useState<JobSubStatusRecord | null>(null);
  const setEditing = (target: JobSubStatusRecord | null) => {
    setEditingTarget(target);
    setOpen(true);
  };

  const save = (values: SubStatusValues) => {
    if (editing == null) {
      const id = `sub-${Date.now().toString(36)}`;
      update({ jobSubStatuses: [...all, { id, ...values }] });
    } else {
      update({ jobSubStatuses: all.map((sub) => (sub.id === editing.id ? { id: sub.id, ...values } : sub)) });
    }
  };

  // While the switch is on, the dialogs need something to offer.
  const lastOne = rows.length <= 1;

  return (
    <div className={`${styles.statusList} ${styles.nested}`}>
      <ItemGroup>
        {rows.map((sub) => (
          <ListItem
            key={sub.id}
            variant="titleCaption"
            title={sub.name}
            caption={joinWithSeparator(
              kind === "onHold" ? holdTypeLabel(sub.status) : undefined,
              sub.reasonRequired === true ? "Reason required" : "Reason optional",
              hasHelp(sub) ? "Own help text" : "Generic help text",
              sub.checkInAfter != null ? checkInLabel(sub.checkInAfter) : undefined,
            )}
            isClickable
            onClick={() => setEditing(sub)}
            slotRight={
              <HoverTooltip text={lastOne ? "Keep at least one status" : "Remove"}>
                <IconButton
                  icon="xmark"
                  variant="muted"
                  size="md"
                  aria-label={`Remove ${sub.name}`}
                  isDisabled={lastOne}
                  onClick={() => update({ jobSubStatuses: all.filter((s) => s.id !== sub.id) })}
                />
              </HoverTooltip>
            }
          />
        ))}
      </ItemGroup>
      <Button size="lg" variant="subtle" leftIcon="plus" onClick={() => setEditing(null)}>
        Add status
      </Button>
      <SubStatusDialog
        open={open}
        kind={kind}
        sub={editing ?? undefined}
        genericCheckIn={CHECK_IN_ACTIONS[kind]
          .map(({ action, label }) => {
            const rule = checkInLabel(settings.checkInAfter[action]);
            return CHECK_IN_ACTIONS[kind].length > 1 ? `${rule} (${label})` : rule;
          })
          .join(", ")}
        genericHelp={GENERIC_FIELDS[kind]
          .map(({ key, dialog }) => {
            const text = settings.reasonHelpTexts[key];
            const quoted = text === "" ? "none" : `"${text}"`;
            return GENERIC_FIELDS[kind].length > 1 ? `${quoted} (${dialog})` : quoted;
          })
          .join(", ")}
        takenNames={rows.filter((sub) => sub.id !== editing?.id).map((sub) => sub.name)}
        mobile={mobile}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </div>
  );
}
