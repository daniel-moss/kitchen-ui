import { useEffect, useState } from "react";

import Dialog from "../../components/Dialog/Dialog";
import EmptyState from "../../components/EmptyState/EmptyState";
import TextArea from "../../components/Fields/TextArea/TextArea";
import FormModule from "../../components/FormModule/FormModule";
import FormModuleGroup from "../../components/FormModule/FormModuleGroup";
import StepItem from "../../components/StepItemGroup/StepItem";
import StepItemGroup from "../../components/StepItemGroup/StepItemGroup";
import { StepItemProgress } from "../../components/StepItemGroup/StepItem.types";
import { toast } from "../../components/Toast/Toaster";
import { EQUIPMENT_LABELS } from "../../data/db";
import type { Equipment as EquipmentRecord, Job, LaborItem } from "../../data/db";
import EquipmentPanel from "../EquipmentPanel/EquipmentPanel";
import { ManagedFile } from "../AddFilesForm/files";
import { NewEquipment } from "../NewEquipmentForm/NewEquipmentForm.types";
import FilesStepModule from "../NewJobSeriesForm/Job/FilesModule";
import { EquipmentSelectField } from "../shared/EquipmentPicker";

import ChargesSegment from "./Charges/ChargesSegment";
import { CheckInOutResult } from "./CheckInOutField";
import { EquipmentDetailModule } from "./CompleteJobForm";
import { Equipment, EquipmentAvatar } from "./equipment";
import { useJobTexts } from "./jobWork";
import { usePauseFields } from "./PauseJobForm";
import { recordFor } from "./ServicePanel";

import completeStyles from "./CompleteJobForm.module.scss";
import formStyles from "./jobForm.module.scss";

// "Hold job" — the DETAILED flow (Figma section 27210-61490, Daniel 2026-11-14).
// A company whose Demo setting "Hold job" is "Detailed" gets this instead of
// the one "Hold job" dialog. A 4-step focus Dialog:
//
// 1. Equipment (redesigned, Figma 27210-57604) — the job's equipment (the
//    standard multi-select field) and an open details card per piece whose
//    "Edit" opens the Equipment side panel; "No equipment" when none. REQUIRED
//    when the job's "Make equipment required" is on: Next shows "Choose
//    Equipment".
// 2. Summary — Work summary (REQUIRED), Notes to dispatcher(s), Files. No
//    Generate button and no caption (Daniel: there is no Forms step).
// 3. Charges — works the same as the Charges tab: the line items and the
//    Subtotal, NO Profitability (Daniel).
// 4. Status — the "Hold job" dialog's fields, the same build (`usePauseFields`):
//    Hold status, Hold reason, Check in / out. "Hold" finishes.
//
// Back / Next only — the step bar is not clickable (Daniel). The Equipment and
// Charges steps edit the JOB directly — they show exactly what the Equipment
// module and the Charges tab show, and a change there is saved at once (Daniel,
// 2026-11-14). The Summary step and the Status step are a draft until "Hold":
// cancelling drops them, after "Discard changes?" when something changed.

const STEP_LABELS = ["Equipment", "Summary", "Charges", "Status"];
const SUMMARY_STEP = 1;
const STATUS_STEP = 3;

/** Everything the flow collected — the job page applies it on "Hold". */
export interface HoldJobDetailedResult {
  summary: string;
  notes: string;
  files: ManagedFile[];
  subStatus: string;
  reason: string;
  clock: CheckInOutResult;
}

export interface HoldJobDetailedFormProps {
  open: boolean;
  onClose: () => void;
  onHold: (result: HoldJobDetailedResult) => void;
  /** The job (the database record) — the Charges step and the saved texts read it. */
  job: Job;
  /** The job's equipment (ids into the pool) — the LIVE list. */
  equipmentIds: string[];
  /** Changes the job's equipment at once (the Equipment module follows). */
  onEquipmentIdsChange: (ids: string[]) => void;
  /** The location's equipment. */
  equipmentPool: Equipment[];
  /** The job's "Make equipment required" — the Equipment step must have one. */
  isEquipmentRequired?: boolean;
  /** Creates a piece in the location's pool (the New-equipment form). */
  onCreateEquipment: (values: NewEquipment) => Equipment;
  /** The location's display name — the New-equipment form's caption. */
  locationLabel: string;
  /** Charges: the pricebook rates and the "New labor rate" footer action. */
  laborRates?: LaborItem[];
  onAddLaborRate?: () => void;
  /** The viewer is an assignee: the Check In / Out control shows. */
  showCheckIn?: boolean;
  /** The viewer's running session; null = checked out. */
  runningSession?: string | null;
  mobile?: boolean;
}

export default function HoldJobDetailedForm({
  open,
  onClose,
  onHold,
  job,
  equipmentIds,
  onEquipmentIdsChange,
  equipmentPool,
  isEquipmentRequired = false,
  onCreateEquipment,
  locationLabel,
  laborRates,
  onAddLaborRate,
  showCheckIn = true,
  runningSession = null,
  mobile = false,
}: HoldJobDetailedFormProps) {
  const savedTexts = useJobTexts(job.id);

  const [step, setStep] = useState(0);
  // The drafts — copied from the job when the flow opens.
  const [summary, setSummary] = useState(savedTexts.summary);
  const [notes, setNotes] = useState(savedTexts.notes);
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [summaryError, setSummaryError] = useState(false);
  const [equipmentError, setEquipmentError] = useState(false);
  // The Equipment side panel ("Edit"). The record stays after closing so the
  // slide-out can play (the Service tab's rule).
  const [previewed, setPreviewed] = useState<EquipmentRecord | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const pauseFields = usePauseFields({ open, type: "on-hold", showCheckIn, runningSession, mobile });

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setSummary(savedTexts.summary);
    setNotes(savedTexts.notes);
    setFiles([]);
    setSummaryError(false);
    setEquipmentError(false);
    setPanelOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Equipment and Charges are saved as they change, so only the drafts count.
  const dirty =
    summary !== savedTexts.summary ||
    notes !== savedTexts.notes ||
    files.length > 0 ||
    pauseFields.dirty;

  const progressOf = (i: number): StepItemProgress => (i === step ? "current" : i < step ? "completed" : "incompleted");

  const next = () => {
    // Equipment: required when the job says so (Figma "Equipment" Input 29570-48030).
    if (step === 0 && isEquipmentRequired && equipmentIds.length === 0) {
      setEquipmentError(true);
      return;
    }
    // Summary: the Work summary is required (Daniel, 2026-11-14).
    if (step === SUMMARY_STEP && summary.trim() === "") {
      setSummaryError(true);
      return;
    }
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  };

  const hold = () => {
    if (!pauseFields.validate()) return;
    const { subStatus, reason, clock } = pauseFields.result();
    onHold({ summary, notes, files, subStatus, reason, clock });
    toast({ type: "success", title: pauseFields.copy.toast });
    onClose();
  };

  const picked = equipmentPool.filter((row) => equipmentIds.includes(row.id));

  return (
    <Dialog
      type="focus"
      open={open}
      onClose={onClose}
      title="Hold job"
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={dirty}
      stepGroup={
        <StepItemGroup>
          {STEP_LABELS.map((label, i) => (
            <StepItem key={label} label={label} progress={progressOf(i)} />
          ))}
        </StepItemGroup>
      }
      currentStep={step}
      stepCount={STEP_LABELS.length}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={next}
      onFinish={hold}
      finalActionLabel={pauseFields.copy.submit}
      finalActionIcon={pauseFields.copy.submitIcon}
      finalActionIconPack="solid"
    >
      {/* Step 1 — Equipment (Figma 27210-57605). */}
      {step === 0 && (
        <FormModule title="Equipment" caption="Add the equipment you worked on and check its details">
          <div className={completeStyles.stack}>
            <EquipmentSelectField
              value={equipmentIds}
              onChange={(ids) => {
                onEquipmentIdsChange(ids);
                setEquipmentError(false);
              }}
              isValid={!equipmentError}
              errorMessage="Choose Equipment"
              options={equipmentPool}
              onCreate={onCreateEquipment}
              locationLabel={locationLabel}
              mobile={mobile}
            />
            {picked.length === 0 && <EmptyState caption="No equipment" />}
            {picked.map((row) => (
              <EquipmentDetailModule
                key={row.id}
                equipment={row}
                avatar={<EquipmentAvatar equipment={row} size="lg" />}
                onEdit={() => {
                  setPreviewed(recordFor(row, job.locationId));
                  setPanelOpen(true);
                }}
                // Takes the piece off the JOB at once, like the field (live step).
                onRemove={() => onEquipmentIdsChange(equipmentIds.filter((id) => id !== row.id))}
              />
            ))}
          </div>
        </FormModule>
      )}

      {/* Step 2 — Summary (Figma 27267-68477). */}
      {step === SUMMARY_STEP && (
        <FormModuleGroup>
          <FormModule title="Work summary">
            <TextArea
              value={summary}
              isValid={!(summaryError && summary.trim() === "")}
              errorMessage="Provide Work summary"
              onChange={(e) => setSummary(e.target.value)}
            />
          </FormModule>
          <FormModule
            title="Notes to dispatcher(s)"
            titleCondition="optional"
            titleHintContent="Internal notes shared with the dispatcher(s) managing this job — the customer does not see them."
          >
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormModule>
          <FilesStepModule value={files} onChange={setFiles} mobile={mobile} />
        </FormModuleGroup>
      )}

      {/* Step 3 — Charges (Figma 27267-69257): the Charges tab's segment on a
          job's SAVED lines (changes show on the tab at once), without
          Profitability. */}
      {step === 2 && (
        <FormModule title="Charges" caption="Add labor rates, products, and any other charges or discounts">
          <ChargesSegment
            job={job}
            mobile={mobile}
            laborRates={laborRates}
            onAddLaborRate={onAddLaborRate}
            showProfitability={false}
          />
        </FormModule>
      )}

      {/* Step 4 — Status (Figma 27267-70070): the "Hold job" dialog's fields.
          Kept MOUNTED (hidden) so its values survive Back / Next. */}
      <div className={formStyles.form} style={{ display: step === STATUS_STEP ? undefined : "none" }}>
        {pauseFields.fields}
      </div>
      {pauseFields.list}

      {/* "Edit" → the Equipment side panel (Figma annotation). Like the Service
          tab's, its edits stay in the panel for now. */}
      {previewed != null && (
        <EquipmentPanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          equipment={previewed}
          breakpoint={mobile ? "mobile" : "desktop"}
          onSaveDetails={(edits) => setPreviewed((prev) => (prev == null ? prev : { ...prev, ...edits }))}
          onSaveLabels={(labels) =>
            setPreviewed((prev) =>
              prev == null ? prev : { ...prev, labelIds: EQUIPMENT_LABELS.filter((label) => labels.includes(label.name)).map((label) => label.id) },
            )
          }
          onSaveNotes={(notes) => setPreviewed((prev) => (prev == null ? prev : { ...prev, notes: notes === "" ? undefined : notes }))}
        />
      )}
    </Dialog>
  );
}
