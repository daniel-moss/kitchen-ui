import { MouseEvent, useEffect, useRef, useState } from "react";

import clsx from "clsx";

import AvatarEquipment from "../../components/Avatar/AvatarEquipment";
import Button from "../../components/Button/Button";
import Chip from "../../components/Chip/Chip";
import Dialog from "../../components/Dialog/Dialog";
import { Divider } from "../../components/Divider/Divider";
import InputGroup from "../../components/Fields/InputGroup/InputGroup";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import TextField from "../../components/Fields/TextField/TextField";
import FormModule from "../../components/FormModule/FormModule";
import { Icon } from "../../components/Icon/Icon";
import Input from "../../components/Input/Input";
import InputHelpText from "../../components/InputHelpText/InputHelpText";
import MenuItem from "../../components/Menu/MenuItem";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectList from "../../components/SelectList/SelectList";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { TECHS_OPTIONS } from "./HvacPmStepForm";
import { DURATION_PRESETS, MINUTE_OPTIONS } from "./SchedulingForm";
import { Equipment, equipmentCaption, equipmentLabel } from "./ServicePanel";
import { SelectPopoverList, useSelectPopover } from "../../forms/shared/selectPopover";
import { noop } from "./shared";

import styles from "./ServiceCallForm.module.scss";

// The Voltage / Phase / Gas type option sets are NOT in the design (no list
// nodes) — invented, flagged to Daniel 2026-07-27.
const VOLTAGE_OPTIONS = ["115V", "208V", "230V", "460V"];
const PHASE_OPTIONS = ["Single phase", "Three phase"];
const GAS_OPTIONS = ["Natural gas", "Propane"];

type YesNo = "" | "Yes" | "No";

// ---- the draft --------------------------------------------------------------

export interface ServiceCallDraft {
  equipmentId: number | null;
  voltage: string;
  phase: string;
  gas: string;
  warranty: YesNo;
  /** "What is covered?" — required when warranty is Yes (in-card reveal). */
  warrantyCovered: string;
  verifiedMfg: YesNo;
  csiSticker: YesNo;
  operationalOnArrival: YesNo;
  diagnosisSteps: string;
  confirmedIssue: string;
  /** Yes reveals the rest of the Resolution module. */
  repairCompleted: YesNo;
  repairsCompleted: string;
  partsInstalled: string;
  maintenanced: string;
  /** No reveals the rest of the Quote details module. */
  fullyOperational: YesNo;
  repairsRequired: string;
  partsNeeded: string;
  techs: string;
  hours: string;
  minutes: string;
  payment: "" | "Check" | "Cash" | "CC";
  notes: string;
}

export const emptyServiceCallDraft = (): ServiceCallDraft => ({
  equipmentId: null,
  voltage: "",
  phase: "",
  gas: "",
  warranty: "",
  warrantyCovered: "",
  verifiedMfg: "",
  csiSticker: "",
  operationalOnArrival: "",
  diagnosisSteps: "",
  confirmedIssue: "",
  repairCompleted: "",
  repairsCompleted: "",
  partsInstalled: "",
  maintenanced: "",
  fullyOperational: "",
  repairsRequired: "",
  partsNeeded: "",
  techs: "",
  hours: "",
  minutes: "",
  payment: "",
  notes: "",
});

/** Anything filled at all — Save progress only changes the row state when true. */
export const serviceCallDraftHasContent = (d: ServiceCallDraft) =>
  JSON.stringify(d) !== JSON.stringify(emptyServiceCallDraft());

interface ServiceCallFormProps {
  open: boolean;
  onClose: () => void;
  /** Dialog title (= the form's name). */
  title?: string;
  /** The job's live Equipment-module list (chips + the picker rows). */
  equipment: Equipment[];
  /** The saved draft to prefill (null = fresh form). */
  initial: ServiceCallDraft | null;
  /** Save progress — no validation; the parent stores the draft + row state. */
  onSaveProgress: (draft: ServiceCallDraft) => void;
  /** Submit — called only after full validation passes. */
  onSubmit: (draft: ServiceCallDraft) => void;
  mobile?: boolean;
}

// The "Service call" form (Figma 24277-27279): a standard Dialog with 6
// FormModules. Equipment / Warranty (equipment picker + quick-pick chips from
// the job's Equipment module, three spec selects, warranty with an in-card
// "What is covered?" reveal), Diagnosis / Issues, Resolution ("Was the repair
// completed on this visit?" — Yes reveals the rest), Quote details ("Is the
// unit fully operational?" — No reveals the rest), COD, and optional notes.
// Submit validates everything visible and scrolls to the first error (default
// dialogs auto-scroll — Daniel's rule); focusing any invalid field clears all
// error states. Save progress saves and closes.
export default function ServiceCallForm({
  open,
  onClose,
  title = "Service call",
  equipment,
  initial,
  onSaveProgress,
  onSubmit,
  mobile = false,
}: ServiceCallFormProps) {
  const [draft, setDraft] = useState<ServiceCallDraft>(emptyServiceCallDraft());
  const [showErrors, setShowErrors] = useState(false);
  const [equipmentListOpen, setEquipmentListOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const voltagePop = useSelectPopover(mobile);
  const phasePop = useSelectPopover(mobile);
  const gasPop = useSelectPopover(mobile);
  const minutePop = useSelectPopover(mobile);

  // A fresh open prefills from the saved draft (deep copy — edits must not
  // mutate the parent's stored answers).
  useEffect(() => {
    if (!open) {
      voltagePop.close();
      phasePop.close();
      gasPop.close();
      minutePop.close();
      setEquipmentListOpen(false);
      return;
    }
    setDraft(initial != null ? (JSON.parse(JSON.stringify(initial)) as ServiceCallDraft) : emptyServiceCallDraft());
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = <K extends keyof ServiceCallDraft>(key: K, value: ServiceCallDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial ?? emptyServiceCallDraft());

  const selectedEquipment = equipment.find((e) => e.id === draft.equipmentId);
  // Sorted by equipment name A→Z (the design annotation).
  const sortedEquipment = [...equipment].sort((a, b) => equipmentLabel(a).localeCompare(equipmentLabel(b)));

  // ---- validation (everything visible is required; notes optional) ----------
  const showRepair = draft.repairCompleted === "Yes";
  const showQuote = draft.fullyOperational === "No";
  const durationSet = (parseInt(draft.hours, 10) || 0) > 0 || (parseInt(draft.minutes, 10) || 0) > 0;

  const bad: Record<string, boolean> = {
    equipment: draft.equipmentId == null,
    voltage: draft.voltage === "",
    phase: draft.phase === "",
    gas: draft.gas === "",
    warranty: draft.warranty === "",
    warrantyCovered: draft.warranty === "Yes" && draft.warrantyCovered.trim() === "",
    verifiedMfg: draft.verifiedMfg === "",
    csiSticker: draft.csiSticker === "",
    operationalOnArrival: draft.operationalOnArrival === "",
    diagnosisSteps: draft.diagnosisSteps.trim() === "",
    confirmedIssue: draft.confirmedIssue.trim() === "",
    repairCompleted: draft.repairCompleted === "",
    repairsCompleted: showRepair && draft.repairsCompleted.trim() === "",
    partsInstalled: showRepair && draft.partsInstalled.trim() === "",
    maintenanced: showRepair && draft.maintenanced.trim() === "",
    fullyOperational: draft.fullyOperational === "",
    repairsRequired: showQuote && draft.repairsRequired.trim() === "",
    partsNeeded: showQuote && draft.partsNeeded.trim() === "",
    techs: showQuote && draft.techs === "",
    time: showQuote && !durationSet,
    payment: draft.payment === "",
  };
  // The visual order — submit scrolls to the FIRST bad field.
  const FIELD_ORDER = [
    "equipment",
    "voltage",
    "phase",
    "gas",
    "warranty",
    "warrantyCovered",
    "verifiedMfg",
    "csiSticker",
    "operationalOnArrival",
    "diagnosisSteps",
    "confirmedIssue",
    "repairCompleted",
    "repairsCompleted",
    "partsInstalled",
    "maintenanced",
    "fullyOperational",
    "repairsRequired",
    "partsNeeded",
    "techs",
    "time",
    "payment",
  ];

  const submit = () => {
    const firstBad = FIELD_ORDER.find((k) => bad[k]);
    if (firstBad != null) {
      setShowErrors(true);
      // Default dialogs auto-scroll to the first error (Daniel's rule).
      setTimeout(() => {
        bodyRef.current?.querySelector(`[data-qid="${firstBad}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 0);
      return;
    }
    onSubmit(draft);
    onClose();
  };

  const saveProgress = () => {
    onSaveProgress(draft);
    onClose();
  };

  // Focusing (or tapping — Safari does not focus buttons on click) any invalid
  // field clears ALL error states at once (Daniel's rule).
  const clearErrors = () => setShowErrors(false);
  const field = (key: string) => ({
    "data-qid": key,
    ...(showErrors && bad[key] ? { onFocus: clearErrors, onPointerDown: clearErrors } : {}),
  });

  const yesNo = (key: keyof ServiceCallDraft & keyof typeof bad, label: string) => (
    <div {...field(key)}>
      <Input label={label}>
        <RadioGroup
          orientation="horizontal"
          value={draft[key] as string}
          onChange={(v) => set(key, v as never)}
          isValid={!(showErrors && bad[key])}
          errorMessage="Choose an option"
        >
          <RadioItem value="Yes" variant="card" label="Yes" />
          <RadioItem value="No" variant="card" label="No" />
        </RadioGroup>
      </Input>
    </div>
  );

  const textAreaField = (key: keyof ServiceCallDraft & keyof typeof bad, label: string) => (
    <div {...field(key)}>
      <Input label={label}>
        <TextArea
          value={draft[key] as string}
          onChange={(e) => set(key, e.target.value as never)}
          isValid={!(showErrors && bad[key])}
          errorMessage="Provide an answer"
        />
      </Input>
    </div>
  );

  const specSelect = (
    key: "voltage" | "phase" | "gas",
    label: string,
    pop: ReturnType<typeof useSelectPopover>,
  ) => (
    <div {...field(key)}>
      <Input label={label}>
        <SelectField
          value={draft[key] || undefined}
          isValid={!(showErrors && bad[key])}
          open={pop.open}
          onClick={(e: MouseEvent<HTMLDivElement>) => pop.toggle(e.currentTarget)}
        />
      </Input>
    </div>
  );

  const specPicker = (
    key: "voltage" | "phase" | "gas",
    title2: string,
    options: string[],
    pop: ReturnType<typeof useSelectPopover>,
  ) => (
    <SelectPopoverList pop={pop} mobile={mobile} title={title2}>
      <SelectListItemGroup>
        {options.map((o) => (
          <SelectListItem
            key={o}
            label={o}
            selected={o === draft[key]}
            onClick={() => {
              set(key, o);
              pop.close();
            }}
          />
        ))}
      </SelectListItemGroup>
    </SelectPopoverList>
  );

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
          <Button size="lg" variant="ghost" leftIcon="save" onClick={saveProgress}>
            Save progress
          </Button>
          <Button size="lg" variant="solid" onClick={submit}>
            Submit
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form} ref={bodyRef}>
        <FormModule title="Equipment / Warranty">
          {/* Equipment — the picker select + quick-pick chips from the job's
              Equipment module (only when the job has equipment). */}
          <div {...field("equipment")}>
            <div className={styles.stack}>
              <Input label="Equipment">
                <SelectField
                  value={selectedEquipment != null ? equipmentLabel(selectedEquipment) : undefined}
                  isValid={!(showErrors && bad.equipment)}
                  open={equipmentListOpen}
                  onClick={() => setEquipmentListOpen(true)}
                />
              </Input>
              {equipment.length > 0 && (
                <div className={styles.chips}>
                  {sortedEquipment.map((e) => (
                    <Chip
                      key={e.id}
                      size="lg"
                      slotLeft={<Icon icon="plus" />}
                      active={e.id === draft.equipmentId}
                      onClick={() => set("equipmentId", e.id)}
                    >
                      {equipmentLabel(e)}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          </div>

          {specSelect("voltage", "Voltage", voltagePop)}
          {specSelect("phase", "Phase", phasePop)}
          {specSelect("gas", "Gas type", gasPop)}

          {/* Warranty — vertical Yes/No; Yes reveals the in-card textarea. */}
          <div {...field("warranty")}>
            <Input label="Is this unit under warranty?">
              <RadioGroup
                value={draft.warranty}
                onChange={(v) => set("warranty", v as YesNo)}
                isValid={!(showErrors && bad.warranty)}
                errorMessage="Choose an option"
              >
                <RadioItem
                  value="Yes"
                  variant="card"
                  label="Yes"
                  content={
                    <div {...field("warrantyCovered")}>
                      <Input label="What is covered?">
                        <TextArea
                          value={draft.warrantyCovered}
                          onChange={(e) => set("warrantyCovered", e.target.value)}
                          isValid={!(showErrors && bad.warrantyCovered)}
                          errorMessage="Provide an answer"
                        />
                      </Input>
                    </div>
                  }
                />
                <RadioItem value="No" variant="card" label="No" />
              </RadioGroup>
            </Input>
          </div>

          {yesNo("verifiedMfg", "Have you verified w/ MFG?")}
          {yesNo("csiSticker", "Is this unit tagged w/ CSI sticker?")}
        </FormModule>

        <Divider className={styles.moduleDivider} />
        <FormModule title="Diagnosis / Issues">
          {yesNo("operationalOnArrival", "Unit operational on arrival?")}
          {textAreaField("diagnosisSteps", "Explain steps to diagnosis")}
          {textAreaField("confirmedIssue", "Did you confirm the issue?")}
        </FormModule>

        <Divider className={styles.moduleDivider} />
        <FormModule title="Resolution">
          {yesNo("repairCompleted", "Was the repair completed on this visit?")}
          {/* Yes reveals the rest of the module; No reveals nothing. */}
          {showRepair && (
            <>
              {textAreaField("repairsCompleted", "What repairs were completed?")}
              {textAreaField("partsInstalled", "What parts were installed?")}
              {textAreaField("maintenanced", "Unit maintenanced / clean?")}
            </>
          )}
        </FormModule>

        <Divider className={styles.moduleDivider} />
        <FormModule title="Quote details">
          {yesNo("fullyOperational", "Is the unit fully operational?")}
          {/* No reveals the rest of the module; Yes reveals nothing. */}
          {showQuote && (
            <>
              {textAreaField("repairsRequired", "What repairs are required?")}
              {textAreaField("partsNeeded", "What parts will be needed?")}

              {/* Techs — the chip row (fills the width, 1–5 + "5+"). */}
              <div {...field("techs")}>
                <Input label="How many techs are required?">
                  <div className={styles.chipsField}>
                    <div className={clsx(styles.chips, styles.fillChips)}>
                      {TECHS_OPTIONS.map((t) => (
                        <Chip
                          key={t}
                          size="lg"
                          className={styles.techChip}
                          active={t === draft.techs}
                          onClick={() => set("techs", t)}
                        >
                          {t}
                        </Chip>
                      ))}
                    </div>
                    {showErrors && bad.techs && (
                      <InputHelpText status="error" slotLeft>
                        Choose an option
                      </InputHelpText>
                    )}
                  </div>
                </Input>
              </div>

              {/* Duration — the Scheduling shape: hr + min group, preset chips. */}
              <div className={styles.stack} {...field("time")}>
                <Input label="Estimated time to complete">
                  <InputGroup isValid={!(showErrors && bad.time)}>
                    <TextField
                      value={draft.hours}
                      onChange={(e) => set("hours", e.target.value.replace(/[^\d]/g, ""))}
                      keyboard="numeric"
                      placeholder="00"
                      suffix="hr"
                    />
                    <SelectField
                      value={draft.minutes}
                      suffix="min"
                      open={minutePop.open}
                      onClick={(e: MouseEvent<HTMLDivElement>) => minutePop.toggle(e.currentTarget)}
                    />
                  </InputGroup>
                </Input>
                <div className={styles.chips}>
                  {DURATION_PRESETS.map((p) => (
                    <Chip
                      key={p.label}
                      size="lg"
                      active={p.hours === String(parseInt(draft.hours, 10) || 0) && p.minutes === draft.minutes}
                      onClick={() => setDraft((prev) => ({ ...prev, hours: p.hours, minutes: p.minutes }))}
                    >
                      {p.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </>
          )}
        </FormModule>

        <Divider className={styles.moduleDivider} />
        <FormModule title="COD">
          <div {...field("payment")}>
            <Input label="How are you collecting payment?">
              <RadioGroup
                orientation="horizontal"
                value={draft.payment}
                onChange={(v) => set("payment", v as ServiceCallDraft["payment"])}
                isValid={!(showErrors && bad.payment)}
                errorMessage="Choose an option"
              >
                <RadioItem value="Check" variant="card" label="Check" />
                <RadioItem value="Cash" variant="card" label="Cash" />
                <RadioItem value="CC" variant="card" label="CC" />
              </RadioGroup>
            </Input>
          </div>
        </FormModule>

        <Divider className={styles.moduleDivider} />
        <FormModule title="Additional / Daily notes" titleCondition="optional">
          <TextArea value={draft.notes} onChange={(e) => set("notes", e.target.value)} clearPromptLabel="Additional / Daily notes" />
        </FormModule>
      </div>

      {/* The Equipment picker (Figma 24244-21291): SINGLE select (Daniel's
          override of the design's checkboxes), search, A→Z, object rows.
          "Add equipment" opens the New-equipment form from ANOTHER Figma file
          — not built, noop (flagged). */}
      <SelectList
        variant={mobile ? "drawer" : "dialog"}
        breakpoint={mobile ? "mobile" : "desktop"}
        title="Equipment"
        open={equipmentListOpen}
        onClose={() => setEquipmentListOpen(false)}
        searchable
        searchPlaceholder="Search by equipment name..."
        state={equipment.length === 0 ? "empty" : "default"}
        emptyState={{
          icon: "cube",
          title: "No equipment here yet",
          caption: "Add equipment to see it here",
          actionLabel: "Add equipment",
          onAction: noop,
        }}
        noResultsCaption="Try a different search or add a new equipment"
        footer={
          <SelectListFooter>
            <MenuItem label="Add equipment" slotLeft={<Icon icon="plus" />} onClick={noop} />
          </SelectListFooter>
        }
      >
        <SelectListItemGroup>
          {sortedEquipment.map((e) => (
            <SelectListItem
              key={e.id}
              variant="object"
              label={equipmentLabel(e)}
              caption={equipmentCaption(e)}
              avatar={<AvatarEquipment size="xl" />}
              selected={e.id === draft.equipmentId}
              onClick={() => {
                set("equipmentId", e.id);
                setEquipmentListOpen(false);
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectList>

      {specPicker("voltage", "Voltage", VOLTAGE_OPTIONS, voltagePop)}
      {specPicker("phase", "Phase", PHASE_OPTIONS, phasePop)}
      {specPicker("gas", "Gas type", GAS_OPTIONS, gasPop)}

      {/* Minutes picker */}
      <SelectPopoverList pop={minutePop} mobile={mobile} title="Minutes">
        <SelectListItemGroup>
          {MINUTE_OPTIONS.map((m) => (
            <SelectListItem
              key={m}
              label={m}
              selected={m === draft.minutes}
              onClick={() => {
                set("minutes", m);
                minutePop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </Dialog>
  );
}
