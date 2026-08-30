import { MouseEvent, useEffect, useRef, useState } from "react";

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
import MenuItem from "../../components/Menu/MenuItem";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { DURATION_PRESETS, MINUTE_OPTIONS } from "./SchedulingForm";
import {
  Equipment,
  EquipmentAvatar,
  equipmentCaption,
  equipmentCaptionText,
  equipmentLabel,
  equipmentTitle,
} from "./equipment";
import { fieldMap, optionValues } from "../../forms/formSchema/options";
import { FormOption } from "../../forms/formSchema/schema.types";
import {
  GAS_OPTIONS,
  PHASE_OPTIONS,
  SERVICE_CALL_SCHEMA,
  TECH_COUNT_OPTIONS,
  VOLTAGE_OPTIONS,
} from "../../forms/formSchema/serviceCallSchema";
import ObjectCard from "../../forms/shared/ObjectCard";
import { SelectPopoverList, useSelectPopover } from "../../forms/shared/selectPopover";
import { noop } from "./shared";

import styles from "./ServiceCallForm.module.scss";

// Labels and option sets come from the SCHEMA
// (src/forms/formSchema/serviceCallSchema.ts) — the same data the read-only
// preview is built from, so the form and its preview cannot drift apart.
const F = fieldMap(SERVICE_CALL_SCHEMA);
const labelOf = (key: string) => F[key].label ?? "";
const moduleOf = (id: string) => SERVICE_CALL_SCHEMA.modules.find((m) => m.id === id);
const moduleTitle = (id: string) => moduleOf(id)?.title ?? "";
const TECHS_OPTIONS = optionValues(TECH_COUNT_OPTIONS);

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
  /** The job's live Equipment-module list (the picker rows). */
  equipment: Equipment[];
  /** The saved draft to prefill (null = fresh form). */
  initial: ServiceCallDraft | null;
  /** Save progress — no validation; the parent stores the draft + row state. */
  onSaveProgress: (draft: ServiceCallDraft) => void;
  /** Submit — called only after full validation passes. */
  onSubmit: (draft: ServiceCallDraft) => void;
  mobile?: boolean;
}

// The "Service call" form (Figma 24461-33199 "Edit"): a standard Dialog with 6
// FormModules. Equipment / Warranty (the equipment object picker, three spec
// selects, warranty with an in-card
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
  const bodyRef = useRef<HTMLDivElement>(null);
  const equipmentPop = useSelectPopover(mobile);
  const voltagePop = useSelectPopover(mobile);
  const phasePop = useSelectPopover(mobile);
  const gasPop = useSelectPopover(mobile);
  const techsPop = useSelectPopover(mobile);
  const minutePop = useSelectPopover(mobile);

  // A fresh open prefills from the saved draft (deep copy — edits must not
  // mutate the parent's stored answers).
  useEffect(() => {
    if (!open) {
      equipmentPop.close();
      voltagePop.close();
      phasePop.close();
      gasPop.close();
      techsPop.close();
      minutePop.close();
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
  // The card under the field grows the layout, so it is frozen while the list
  // is open (the layout-freeze rule) — the field's own value stays live.
  const shownEquipment = equipmentPop.freeze(selectedEquipment);
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

  // A radio field straight from the schema — label, options and orientation.
  const radioField = (key: keyof ServiceCallDraft & keyof typeof bad) => {
    const schemaField = F[key];
    const options = schemaField.type === "radio" ? schemaField.options : [];
    return (
      <div {...field(key)}>
        <Input label={labelOf(key)}>
          <RadioGroup
            orientation={schemaField.type === "radio" ? schemaField.orientation : undefined}
            value={draft[key] as string}
            onChange={(v) => set(key, v as never)}
            isValid={!(showErrors && bad[key])}
            errorMessage="Choose an option"
          >
            {options.map((o) => (
              <RadioItem key={o.value} value={o.value} variant="card" label={o.label ?? o.value} />
            ))}
          </RadioGroup>
        </Input>
      </div>
    );
  };

  const textAreaField = (key: keyof ServiceCallDraft & keyof typeof bad) => (
    <div {...field(key)}>
      <Input label={labelOf(key)}>
        <TextArea
          value={draft[key] as string}
          onChange={(e) => set(key, e.target.value as never)}
          isValid={!(showErrors && bad[key])}
          errorMessage="Provide an answer"
        />
      </Input>
    </div>
  );

  const specSelect = (key: "voltage" | "phase" | "gas" | "techs", pop: ReturnType<typeof useSelectPopover>) => (
    <div {...field(key)}>
      <Input label={labelOf(key)}>
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
    key: "voltage" | "phase" | "gas" | "techs",
    options: FormOption[],
    pop: ReturnType<typeof useSelectPopover>,
  ) => (
    <SelectPopoverList pop={pop} mobile={mobile} title={labelOf(key)}>
      <SelectListItemGroup>
        {optionValues(options).map((o) => (
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
        <FormModule title={moduleTitle("equipment-warranty")}>
          {/* Equipment — an INLINE select list; the pick then shows as a card
              12px under the field (Figma DS 29019-62714). The card is FROZEN
              while the list is open (the layout-freeze rule) so it can never
              push the trigger away from its anchored card. */}
          <div {...field("equipment")}>
            <div className={styles.objectField}>
              <Input label={labelOf("equipment")}>
                <SelectField
                  value={selectedEquipment != null ? equipmentLabel(selectedEquipment) : undefined}
                  isValid={!(showErrors && bad.equipment)}
                  open={equipmentPop.open}
                  onClick={(e: MouseEvent<HTMLDivElement>) => equipmentPop.toggle(e.currentTarget)}
                />
              </Input>
              {shownEquipment != null && (
                <ObjectCard
                  avatar={<EquipmentAvatar equipment={shownEquipment} />}
                  title={equipmentTitle(shownEquipment)}
                  caption={equipmentCaptionText(shownEquipment)}
                  onClick={noop}
                />
              )}
            </div>
          </div>

          {specSelect("voltage", voltagePop)}
          {specSelect("phase", phasePop)}
          {specSelect("gas", gasPop)}

          {/* Warranty — vertical Yes/No; Yes reveals the in-card textarea. */}
          <div {...field("warranty")}>
            <Input label={labelOf("warranty")}>
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
                      <Input label={labelOf("warrantyCovered")}>
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

          {radioField("verifiedMfg")}
          {radioField("csiSticker")}
        </FormModule>

        <Divider className={styles.moduleDivider} />
        <FormModule title={moduleTitle("diagnosis")}>
          {radioField("operationalOnArrival")}
          {textAreaField("diagnosisSteps")}
          {textAreaField("confirmedIssue")}
        </FormModule>

        <Divider className={styles.moduleDivider} />
        <FormModule title={moduleTitle("resolution")}>
          {radioField("repairCompleted")}
          {/* Yes reveals the rest of the module; No reveals nothing. */}
          {showRepair && (
            <>
              {textAreaField("repairsCompleted")}
              {textAreaField("partsInstalled")}
              {textAreaField("maintenanced")}
            </>
          )}
        </FormModule>

        <Divider className={styles.moduleDivider} />
        <FormModule title={moduleTitle("quote-details")}>
          {radioField("fullyOperational")}
          {/* No reveals the rest of the module; Yes reveals nothing. */}
          {showQuote && (
            <>
              {textAreaField("repairsRequired")}
              {textAreaField("partsNeeded")}

              {/* Techs — a SelectField since the 2026-08-06 Figma update. */}
              {specSelect("techs", techsPop)}

              {/* Duration — the Scheduling shape: hr + min group, preset chips. */}
              <div className={styles.stack} {...field("time")}>
                <Input label={labelOf("time")}>
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
                      size="md"
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
        <FormModule title={moduleTitle("cod")}>{radioField("payment")}</FormModule>

        <Divider className={styles.moduleDivider} />
        {/* The notes field repeats the module title as its label — every Input
            carries one (Daniel, 2026-08-06). */}
        <FormModule title={moduleTitle("notes")} titleCondition={moduleOf("notes")?.optional ? "optional" : undefined}>
          <Input label={labelOf("notes")} labelCondition="optional">
            <TextArea value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
          </Input>
        </FormModule>
      </div>

      {/* The Equipment picker: an INLINE list under the field (Daniel,
          2026-08-06 — it used to be a dialog). SINGLE select (Daniel's
          override of the design's checkboxes), search, A→Z, object rows.
          "Add equipment" opens the New-equipment form from ANOTHER Figma file
          — not built, noop (flagged). */}
      <SelectPopoverList
        pop={equipmentPop}
        mobile={mobile}
        title={labelOf("equipment")}
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
              label={equipmentTitle(e)}
              searchText={`${equipmentLabel(e)} ${equipmentCaption(e)}`}
              caption={equipmentCaptionText(e)}
              avatar={<EquipmentAvatar equipment={e} />}
              selected={e.id === draft.equipmentId}
              onClick={() => {
                set("equipmentId", e.id);
                equipmentPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      {specPicker("voltage", VOLTAGE_OPTIONS, voltagePop)}
      {specPicker("phase", PHASE_OPTIONS, phasePop)}
      {specPicker("gas", GAS_OPTIONS, gasPop)}
      {specPicker("techs", TECH_COUNT_OPTIONS, techsPop)}

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
