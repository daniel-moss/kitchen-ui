import { useCallback, useEffect, useRef, useState } from "react";

import Avatar from "../../components/Avatar/Avatar";
import Button from "../../components/Button/Button";
import Counter from "../../components/Counter/Counter";
import Dialog from "../../components/Dialog/Dialog";
import { Divider } from "../../components/Divider/Divider";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import TextField from "../../components/Fields/TextField/TextField";
import FormModule from "../../components/FormModule/FormModule";
import FormModuleGroup from "../../components/FormModule/FormModuleGroup";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import Input from "../../components/Input/Input";
import LinkButton from "../../components/LinkButton/LinkButton";
import ListItem from "../../components/ListItem/ListItem";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import ListItemSlotIcon from "../../components/ListItem/ListItemSlotIcon";
import ListItemTextRight from "../../components/ListItem/ListItemTextRight";
import MenuItem from "../../components/Menu/MenuItem";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import Prompt from "../../components/Prompt/Prompt";
import SelectList from "../../components/SelectList/SelectList";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import StepItemGroup from "../../components/StepItemGroup/StepItemGroup";
import StepItem from "../../components/StepItemGroup/StepItem";
import { StepItemProgress } from "../../components/StepItemGroup/StepItem.types";
import { toast } from "../../components/Toast/Toaster";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import ValueDisplay from "../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../components/ValueDisplay/ValueDisplayGroup";
import { GROUPS, ChargeGroup } from "./ChargesTab";
import FormsModule, { FormAvatar, FormSummary } from "./FormsModule";
import {
  Equipment,
  EquipmentAvatar,
  equipmentCaption,
  equipmentCaptionText,
  equipmentLabel,
  equipmentTitle,
} from "./equipment";
import { DEFAULT_LOCATION, locationCaption } from "./jobData";
import { noop, slot } from "./shared";
import SignaturePad from "./SignaturePad";
import { SignatureResult } from "./SignatureModule";
import useSummaryGenerator from "./summaryGenerator";

import styles from "./CompleteJobForm.module.scss";

// ---------------------------------------------------------------------------
// "Complete job" — the 5-step focus Dialog (Figma section 24106-16424):
// Equipment · Forms · Summary · Charges · Signature. Each step maps to a job
// module; the DS `Dialog type="focus"` owns the step footer (Cancel/Back →
// Next). The last step adds a "Skip signature" secondary action.
// ---------------------------------------------------------------------------

const STEP_LABELS = ["Equipment", "Forms", "Summary", "Charges", "Signature"];
const FORMS_STEP = 1;
const SUMMARY_STEP = 2;
const SIGNATURE_STEP = 4;

// Job subtotal = the sum of the group totals, less discounts (none here).
const money = (s: string) => parseFloat(s.replace(/[$,]/g, "")) || 0;
const JOB_SUBTOTAL = `$${GROUPS.reduce((n, g) => n + money(g.subtotal), 0).toFixed(2)}`;

// ---- warranty statuses (Figma "Warranty Status" 21958-10447) ----------------
type WarrantyStatus = "covered" | "partial" | "expired" | "none";
const WARRANTY_META: Record<WarrantyStatus, { icon?: string; color: string; label: string }> = {
  covered: { icon: "shield-halved", color: "var(--text-success)", label: "Covered" },
  partial: { icon: "shield-exclamation", color: "var(--text-warning)", label: "Partially covered" },
  expired: { icon: "shield-xmark", color: "var(--text-placeholder)", label: "Expired" },
  none: { color: "var(--text-placeholder)", label: "No Warranty" },
};

// ---- equipment details (placeholder; not on the base Equipment model) --------
interface EquipmentDetails {
  category: string;
  type: string;
  ownership: string;
  area: string;
  installDate: string;
  warranty: WarrantyStatus;
  notes: string;
}
const EQUIPMENT_DETAILS: Record<string, EquipmentDetails> = {
  "eq-wd-reachin": {
    category: "Refrigeration",
    type: "Reach-in freezer",
    ownership: "Owned",
    area: "Storage room",
    installDate: "November 2, 2021",
    warranty: "covered",
    notes:
      "🔥 Gas Supply: Connected to main gas line; shut-off valve behind unit\n⚡ Electrical Info: 120V ignition system; breaker panel in storage room\n🛑 Safety Concerns: High heat exposure – allow cooldown before servicing\n📦 Spare Parts Availability: Spare burner tubes in storage, shelf B-3\n🧰 Maintenance: Belts and filters last checked during the previous PM visit",
  },
  "eq-wd-griddle": { category: "Cooking", type: "Griddle", ownership: "Owned", area: "Cook line", installDate: "March 12, 2024", warranty: "expired", notes: "" },
  "eq-wd-range": { category: "Cooking", type: "Range", ownership: "Owned", area: "Hot line", installDate: "August 2, 2021", warranty: "expired", notes: "" },
  "eq-wd-mixer": { category: "Food preparation", type: "Dough mixer", ownership: "Unknown", area: "", installDate: "", warranty: "none", notes: "" },
  "eq-wd-walkin": {
    category: "Refrigeration",
    type: "Walk-in cooler",
    ownership: "Owned",
    area: "Back kitchen",
    installDate: "March 14, 2022",
    warranty: "partial",
    notes:
      "❄️ Refrigerant: R-404A low-temperature system; recovery required before opening the loop\n🚪 Door: 48\" magnetic gasket replaced in 2024\n🛑 Safety: Confirm the defrost cycle is off before servicing the evaporator coils",
  },
};

// A value's copy button (Figma shows one on Name / Manufacturer / Model / Serial
// / Installation date) — lg muted, real clipboard + a toast.
const CopyButton = ({ value, label }: { value: string; label: string }) => (
  <IconButton
    icon="copy"
    variant="muted"
    size="lg"
    aria-label={`Copy ${label.toLowerCase()}`}
    onClick={() => {
      navigator.clipboard?.writeText(value);
      toast({ type: "success", title: "Copied to clipboard" });
    }}
  />
);

// One selected equipment shown as a collapsible module with its detail group.
// "Open details" opens the Equipment side panel — NOT built (noop, per Daniel).
function EquipmentDetailModule({ equipment }: { equipment: Equipment }) {
  // The five demo pieces keep their details above; equipment CREATED in the
  // prototype (New-equipment form) carries its own and has no warranty record.
  const d: EquipmentDetails = EQUIPMENT_DETAILS[equipment.id] ?? {
    category: equipment.category ?? "",
    type: equipment.type ?? "",
    ownership: equipment.ownership ?? "",
    area: equipment.area ?? "",
    installDate: equipment.installDate ?? "",
    warranty: "none",
    notes: equipment.notes ?? "",
  };
  const w = WARRANTY_META[d.warranty];
  return (
    <DisplayModule
      variant="accordion"
      defaultOpen
      title={equipment.name}
      slotRight={
        <Button variant="ghost" size="md" rightIcon="arrow-right" onClick={noop}>
          Open details
        </Button>
      }
      content={
        <ValueDisplayGroup>
          <ValueDisplay label="Name" value={equipment.name} slotRight={<CopyButton value={equipment.name} label="Name" />} />
          <ValueDisplay label="Manufacturer" value={equipment.manufacturer} slotRight={<CopyButton value={equipment.manufacturer} label="Manufacturer" />} />
          <ValueDisplay label="Model number" value={equipment.model} slotRight={<CopyButton value={equipment.model} label="Model number" />} />
          <ValueDisplay label="Serial number" value={equipment.serial} slotRight={<CopyButton value={equipment.serial} label="Serial number" />} />
          <ValueDisplay label="Category" value={d?.category} />
          <ValueDisplay label="Type" value={d?.type} />
          <ValueDisplay label="Ownership" value={d?.ownership} />
          <ValueDisplay label="Area" value={d?.area} />
          <ValueDisplay label="Installation date" value={d?.installDate} slotRight={d?.installDate ? <CopyButton value={d.installDate} label="Installation date" /> : undefined} />
          <ValueDisplay
            label="Warranty"
            value={w.label}
            valueColor={w.color}
            slotLeft={w.icon ? <span style={{ color: w.color, display: "inline-flex" }}><Icon icon={w.icon} pack="solid" size={14} container="square" /></span> : undefined}
          />
          <ValueDisplay label="Notes" orientation="vertical" value={d?.notes || undefined} lineLimit={4} />
        </ValueDisplayGroup>
      }
    />
  );
}

// One charges group as its own DisplayModule (Figma 24395-36688): header (label
// + Counter + plus) over the line items. NO group-total footer — the 2026-08-07
// node dropped it; only the Job subtotal below the modules remains. Rows are
// clickable (noop) and draggable — drag only when the group has more than one
// row (Daniel; a single row has nothing to reorder).
function ChargeModule({ group }: { group: ChargeGroup }) {
  const [items, setItems] = useState(group.items);
  const draggable = items.length > 1;
  const reorder = (from: number, to: number) =>
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  return (
    <DisplayModule
      title={group.label}
      titleSlotRight={<Counter value={items.length} />}
      slotRight={
        <HoverTooltip text={`Add ${group.label.toLowerCase()} charge`}>
          <IconButton icon="plus" variant="ghost" size="md" aria-label={`Add ${group.label.toLowerCase()} charge`} onClick={noop} />
        </HoverTooltip>
      }
      content={
        <div className={styles.chargeBody}>
          <ItemGroup onReorder={draggable ? reorder : undefined}>
            {items.map((it) => {
              const common = {
                variant: "titleCaption" as const,
                title: it.title,
                caption: it.caption,
                captionLines: 1 as const,
                avatar: <Avatar shape="square" content="icon" icon={group.icon} size="xl" />,
                right: <ListItemTextRight variant="titleCaption" title={it.total} caption={it.unit} />,
                slotRight: <IconButton icon="ellipsis" variant="ghost" size="md" aria-label="More actions" onClick={noop} />,
                isClickable: true as const,
                onClick: noop,
              };
              return draggable ? <ListItem key={it.id} {...common} isDraggable /> : <ListItem key={it.id} {...common} />;
            })}
          </ItemGroup>
        </div>
      }
    />
  );
}

// One charges group on the SIGNATURE step: the same rows, read-only — no plus,
// no ⋯, no drag; the row opens the charge (noop) and shows an angle-right
// (Figma 24395-37211).
const ChargeSummaryModule = ({ group }: { group: ChargeGroup }) => (
  <DisplayModule
    title={group.label}
    content={
      <div className={styles.chargeBody}>
        <ItemGroup>
          {group.items.map((it) => (
            <ListItem
              key={it.id}
              variant="titleCaption"
              title={it.title}
              caption={it.caption}
              captionLines={1}
              avatar={<Avatar shape="square" content="icon" icon={group.icon} size="xl" />}
              right={<ListItemTextRight variant="titleCaption" title={it.total} caption={it.unit} />}
              slotRight={<ListItemSlotIcon icon="angle-right" />}
              isClickable
              onClick={noop}
            />
          ))}
        </ItemGroup>
      </div>
    }
  />
);

interface CompleteJobFormProps {
  open: boolean;
  onClose: () => void;
  /**
   * The job was completed — through the signature or through "Skip and
   * complete". The caller moves the job to "Completed", files the signature
   * into the Summary tab's Signature module and opens the Send-summary form.
   */
  onCompleted: (signature: SignatureResult) => void;
  /** The job's equipment (ids into the pool) — the LIVE list, shared with the
   *  Equipment module (Daniel: equipment is shared, the rest is a snapshot). */
  equipmentIds: string[];
  onEquipmentIdsChange: (next: string[]) => void;
  /** The location's equipment — the LIVE pool (the New-equipment form appends
   *  to it), so a piece created on the job shows up here too. */
  equipmentPool: Equipment[];
  /**
   * The job facts the Signature step recaps, straight from the modules that own
   * them: Type / Recall to / Service come from the SERVICE module, Source ID
   * from Job properties (Daniel, 2026-08-07). `sourceId` is undefined when the
   * job's source does not provide one, and `recallTo` is null unless the job is
   * a recall — both rows then disappear.
   */
  jobFacts: {
    jobId: string;
    sourceId?: string;
    isRecall: boolean;
    recallTo: string | null;
    service: string;
  };
  mobile?: boolean;
}

export default function CompleteJobForm({ open, onClose, onCompleted, equipmentIds, onEquipmentIdsChange, equipmentPool, jobFacts, mobile = false }: CompleteJobFormProps) {
  const [step, setStep] = useState(0);
  const [workSummary, setWorkSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [formsDone, setFormsDone] = useState({ all: false, any: false, count: 0 });
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [skipFormsOpen, setSkipFormsOpen] = useState(false);
  const [equipmentListOpen, setEquipmentListOpen] = useState(false);
  // Summary step: the Work summary is required, so Next can fail (Figma
  // "Missing Value" 24429-51496 — "Provide Work summary").
  const [summaryError, setSummaryError] = useState(false);
  // Signature step: the pad and "Signed by" are both required. The pad hands
  // over a capture function so the drawn ink can travel to the Signature module.
  const captureInk = useRef<(() => string | null) | null>(null);
  const registerCapture = useCallback((capture: () => string | null) => {
    captureInk.current = capture;
  }, []);
  const [hasSignature, setHasSignature] = useState(false);
  const [signedBy, setSignedBy] = useState("");
  const [signatureErrors, setSignatureErrors] = useState(false);
  // Skip signature (Figma 24561-137021): its reason is required too.
  const [skipSignatureOpen, setSkipSignatureOpen] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [skipReasonError, setSkipReasonError] = useState(false);

  // Generate: "AI thinking" spinner, then the summary is typed in. Shared with
  // the Work summary module's edit form so both behave the same.
  const gen = useSummaryGenerator(setWorkSummary);

  // The Forms step owns the preview panel; the Signature step's read-only list
  // opens it through this (registered by FormsModule).
  const openFormPreview = useRef<((id: number) => void) | null>(null);
  const registerPreview = useCallback((open: (id: number) => void) => {
    openFormPreview.current = open;
  }, []);
  // FormsModule reports through effects — a new function identity every render
  // would make it report in a loop.
  const handleFormsChange = useCallback((next: FormSummary[]) => setForms(next), []);

  // A fresh open resets the flow (the forms/summary/charges are a snapshot).
  useEffect(() => {
    gen.reset();
    if (!open) return;
    setStep(0);
    setWorkSummary("");
    setNotes("");
    setSkipFormsOpen(false);
    setEquipmentListOpen(false);
    setSummaryError(false);
    setHasSignature(false);
    setSignedBy("");
    setSignatureErrors(false);
    setSkipSignatureOpen(false);
    setSkipReason("");
    setSkipReasonError(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const jobEquipment = equipmentPool.filter((e) => equipmentIds.includes(e.id));
  const completedForms = forms.filter((f) => f.completed);

  // Step progress: the current step is half-stroke, passed steps show the jade
  // check — EXCEPT Forms, which shows the amber WARNING when it was moved past
  // without every form completed (Skip-forms).
  const progressOf = (i: number): StepItemProgress => {
    if (i === step) return "current";
    if (i === FORMS_STEP && i < step) return formsDone.all ? "completed" : "warning";
    if (i < step) return "completed";
    return "incompleted";
  };

  const advance = () => setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));

  const handleNext = () => {
    // Forms: all completed → advance; otherwise the Skip-forms warning prompt.
    if (step === FORMS_STEP && !formsDone.all) {
      setSkipFormsOpen(true);
      return;
    }
    // Summary: the Work summary is required.
    if (step === SUMMARY_STEP && workSummary.trim() === "") {
      setSummaryError(true);
      return;
    }
    advance();
  };

  // "Complete job" validates the signature step, then hands the COLLECTED
  // signature over: the flow closes, the job turns Completed, the Signature
  // module fills in and the Send-summary form opens.
  const handleFinish = () => {
    if (!hasSignature || signedBy.trim() === "") {
      setSignatureErrors(true);
      return;
    }
    onCompleted({ state: "collected", signedBy: signedBy.trim(), date: new Date(), ink: captureInk.current?.() ?? undefined });
  };

  return (
    <>
      <Dialog
        type="focus"
        open={open}
        onClose={onClose}
        title="Complete job"
        breakpoint={mobile ? "mobile" : "desktop"}
        stepGroup={
          <StepItemGroup>
            {STEP_LABELS.map((label, i) => (
              <StepItem
                key={label}
                label={label}
                progress={progressOf(i)}
                // Only already-passed steps are clickable (jump back); forward
                // moves go through Next so the Skip gating still applies.
                onClick={i < step ? () => setStep(i) : undefined}
              />
            ))}
          </StepItemGroup>
        }
        currentStep={step}
        stepCount={STEP_LABELS.length}
        onBack={() => setStep((s) => Math.max(0, s - 1))}
        onNext={handleNext}
        onFinish={handleFinish}
        finalActionLabel="Complete job"
        // The Signature step alone offers a way out of signing.
        secondaryAction={
          step === SIGNATURE_STEP ? (
            <Button size="lg" variant="subtle" onClick={() => setSkipSignatureOpen(true)}>
              Skip signature
            </Button>
          ) : undefined
        }
      >
        {/* Step 1 — Equipment */}
        {step === 0 && (
          <FormModule title="Equipment" caption="Make sure the following equipment details are correct">
            <div className={styles.stack}>
              <SelectField
                multiSelect
                count={jobEquipment.length}
                value={jobEquipment.length === 1 ? jobEquipment[0].name : undefined}
                multiSelectLabel="Equipment selected"
                onClearSelection={() => onEquipmentIdsChange([])}
                onClick={() => setEquipmentListOpen(true)}
                open={equipmentListOpen}
              />
              {jobEquipment.map((e) => (
                <EquipmentDetailModule key={e.id} equipment={e} />
              ))}
            </div>
          </FormModule>
        )}

        {/* Step 2 — Forms (kept mounted across steps so its state persists;
            reports completion up for the Skip gating + the Generate button). */}
        <div style={{ display: step === FORMS_STEP ? undefined : "none" }}>
          <FormsModule
            mobile={mobile}
            stepVariant
            onCompletionChange={setFormsDone}
            onFormsChange={handleFormsChange}
            registerPreview={registerPreview}
          />
        </div>

        {/* Step 3 — Summary */}
        {step === SUMMARY_STEP && (
          <FormModuleGroup>
            <FormModule title="Work summary" caption="Roopairs can generate summary based on completed forms or you can fill it out manually">
              <div className={styles.genStack}>
                {/* The button is only offered when the job HAS forms; with
                    forms but none completed it stays, disabled, and SAYS so
                    (Figma 24429-51511). */}
                {formsDone.count > 0 && (
                  <Button
                    variant="subtle"
                    size="lg"
                    isFullWidth
                    leftIcon="wand-magic-sparkles"
                    isDisabled={!formsDone.any || gen.busy}
                    isProcessing={gen.phase === "thinking"}
                    onClick={gen.generate}
                  >
                    {formsDone.any ? "Generate" : "No completed forms"}
                  </Button>
                )}
                {/* The error clears as soon as there IS a summary — typed or
                    generated (Generate writes straight into the value). */}
                <TextArea
                  value={workSummary}
                  isValid={!(summaryError && workSummary.trim() === "")}
                  errorMessage="Provide Work summary"
                  onChange={(e) => setWorkSummary(e.target.value)}
                />
              </div>
            </FormModule>
            <FormModule
              title="Notes to dispatcher(s)"
              titleCondition="optional"
              titleHintContent="Internal notes shared with the dispatcher(s) managing this job — the customer does not see them."
            >
              <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </FormModule>
          </FormModuleGroup>
        )}

        {/* Step 4 — Charges: one DisplayModule per group + Discounts, then the
            Job subtotal. The groups carry NO total row of their own any more
            (Figma 24429-51526, 2026-08-07). */}
        {step === 3 && (
          <FormModule title="Charges" caption="Add labor, products, and any other charges or discounts">
            <div className={styles.stack}>
              {GROUPS.map((g) => (
                <ChargeModule key={g.key} group={g} />
              ))}
              {/* Discounts — no discounts yet (empty state). */}
              <DisplayModule
                title="Discounts"
                slotRight={
                  <HoverTooltip text="Add discount">
                    <IconButton icon="plus" variant="ghost" size="md" aria-label="Add discount" onClick={noop} />
                  </HoverTooltip>
                }
                content={<EmptyState caption="No discounts here yet" />}
              />
              {/* Job subtotal — the sum of the groups, less discounts. */}
              <div className={styles.jobSubtotal}>
                <span className={styles.jobSubtotalLabel}>Job subtotal</span>
                <span className={styles.jobSubtotalValue}>{JOB_SUBTOTAL}</span>
              </div>
            </div>
          </FormModule>
        )}

        {/* Step 5 — Signature: a read-only recap of the job the customer signs
            off (Figma 24395-37211), then the signature pad + "Signed by". */}
        {step === SIGNATURE_STEP && (
          <div className={styles.signatureStep}>
            <div className={styles.recap}>
              <div className={styles.client}>
                <span className={styles.clientName}>{DEFAULT_LOCATION.client}</span>
                <span className={styles.clientAddress}>{locationCaption(DEFAULT_LOCATION)}</span>
              </div>

              <div className={styles.stack}>
                {/* The job's facts, from the Service + Job-properties modules.
                    Source ID only when the source provides one; Recall to only
                    on a recall (Daniel, 2026-08-07). */}
                <DisplayModule
                  variant="bodyOnly"
                  content={
                    <ValueDisplayGroup>
                      <ValueDisplay label="Job ID" value={jobFacts.jobId} />
                      {jobFacts.sourceId != null && <ValueDisplay label="Source ID" value={jobFacts.sourceId} />}
                      <ValueDisplay
                        label="Type"
                        value={jobFacts.isRecall ? "Recall" : "New"}
                        // The same icons the Service module and its edit form
                        // use: sparkle = New, clock-rotate-left = Recall.
                        slotLeft={
                          <Icon
                            icon={jobFacts.isRecall ? "clock-rotate-left" : "sparkle"}
                            pack="regular"
                            size={14}
                            container="square"
                          />
                        }
                      />
                      {jobFacts.isRecall && jobFacts.recallTo != null && (
                        <ValueDisplay
                          label="Recall to"
                          kind="linkButton"
                          link={
                            <LinkButton rightIcon="arrow-up-right" onClick={noop}>
                              {jobFacts.recallTo}
                            </LinkButton>
                          }
                        />
                      )}
                      <ValueDisplay label="Service" value={jobFacts.service} />
                    </ValueDisplayGroup>
                  }
                />

                <DisplayModule title="Work summary" content={<p className={styles.paragraph}>{workSummary}</p>} />

                {/* ONLY the completed forms, read-only — with none the module
                    does not show at all (Daniel, 2026-08-07). A row opens the
                    same preview panel the Forms step uses. */}
                {completedForms.length > 0 && (
                  <DisplayModule
                    title="Forms"
                    content={
                      <div className={styles.chargeBody}>
                        <ItemGroup>
                          {completedForms.map((f) => (
                            <ListItem
                              key={f.id}
                              variant="titleCaption"
                              title={f.name}
                              caption={f.caption}
                              captionLines={1}
                              avatar={<FormAvatar state="completed" />}
                              slotRight={<ListItemSlotIcon icon="angle-right" />}
                              isClickable
                              onClick={() => openFormPreview.current?.(f.id)}
                            />
                          ))}
                        </ItemGroup>
                      </div>
                    }
                  />
                )}

                {GROUPS.map((g) => (
                  <ChargeSummaryModule key={g.key} group={g} />
                ))}
              </div>

              <div className={styles.jobSubtotal}>
                <span className={styles.jobSubtotalLabel}>Subtotal</span>
                <span className={styles.jobSubtotalValue}>{JOB_SUBTOTAL}</span>
              </div>
            </div>

            <Divider />

            {/* The pad and the field are direct children, so FormModule's own
                24px content gap separates them (Daniel, 2026-08-07). */}
            <FormModule title="Signature">
              <SignaturePad
                isValid={!(signatureErrors && !hasSignature)}
                errorMessage="Collect Signature"
                onInkChange={setHasSignature}
                registerCapture={registerCapture}
              />
              <Input label="Signed by">
                <TextField
                  value={signedBy}
                  isValid={!(signatureErrors && signedBy.trim() === "")}
                  onChange={(e) => setSignedBy(e.target.value)}
                />
              </Input>
            </FormModule>
          </div>
        )}

        {/* Add equipment (same pool + multi-select as the Equipment module). */}
        <SelectList
          variant={mobile ? "drawer" : "dialog"}
          breakpoint={mobile ? "mobile" : "desktop"}
          title="Equipment"
          open={equipmentListOpen}
          onClose={() => setEquipmentListOpen(false)}
          multiSelect
          searchable
          searchPlaceholder="Search by equipment name..."
          noResultsCaption="Try a different search or add a new equipment"
          footer={
            <SelectListFooter>
              <MenuItem label="Add equipment" slotLeft={slot("plus")} onClick={noop} />
            </SelectListFooter>
          }
        >
          <SelectListItemGroup>
            {[...equipmentPool]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((e) => {
                const selected = equipmentIds.includes(e.id);
                return (
                  <SelectListItem
                    key={e.id}
                    variant="object"
                    multiSelect
                    label={equipmentTitle(e)}
                    searchText={`${equipmentLabel(e)} ${equipmentCaption(e)}`}
                    caption={equipmentCaptionText(e)}
                    avatar={<EquipmentAvatar equipment={e} />}
                    selected={selected}
                    onClick={() => onEquipmentIdsChange(selected ? equipmentIds.filter((id) => id !== e.id) : [...equipmentIds, e.id])}
                  />
                );
              })}
          </SelectListItemGroup>
        </SelectList>
      </Dialog>

      {/* Skip the form(s)? — fires on Next when not every form is completed.
          Figma 24401-44489 (its body copy wrongly said "equipment" — corrected).
          Amber warning icon on the RIGHT (DS Prompt gained actionIconPosition +
          actionIconClassName; Button gained rightIconPack for the solid glyph). */}
      <Prompt
        open={skipFormsOpen}
        breakpoint={mobile ? "mobile" : "desktop"}
        title="Skip the form(s)?"
        body="Some forms are not completed. Are you sure you want to continue?"
        actionLabel="Skip form(s)"
        actionIcon="warning"
        actionIconPack="solid"
        actionIconPosition="right"
        actionIconClassName={styles.warnIcon}
        onAction={() => {
          setSkipFormsOpen(false);
          advance();
        }}
        onCancel={() => setSkipFormsOpen(false)}
      />

      {/* "Skip signature" (Figma 24561-137021) — a reason is required. Its
          "Skip and complete" completes the job the same way the signature does,
          so it hands over to the Send-summary form too. */}
      <Dialog
        open={skipSignatureOpen}
        onClose={() => setSkipSignatureOpen(false)}
        title="Skip signature"
        breakpoint={mobile ? "mobile" : "desktop"}
        confirmOnDismiss={skipReason !== ""}
        footer={
          <PopoverFooter
            leadingButton={
              <Button size="lg" variant="ghost" onClick={() => setSkipSignatureOpen(false)}>
                Cancel
              </Button>
            }
          >
            <Button
              size="lg"
              variant="solid"
              onClick={() => {
                if (skipReason.trim() === "") {
                  setSkipReasonError(true);
                  return;
                }
                setSkipSignatureOpen(false);
                // Skipping still completes the job — the module shows the
                // "skipped" state with this reason instead of the ink.
                onCompleted({ state: "skipped", skipReason: skipReason.trim(), date: new Date() });
              }}
            >
              Skip and complete
            </Button>
          </PopoverFooter>
        }
      >
        <Input label="Skip reason" helpText="Why you can't collect a signature?">
          <TextArea
            value={skipReason}
            isValid={!(skipReasonError && skipReason.trim() === "")}
            onChange={(e) => setSkipReason(e.target.value)}
          />
        </Input>
      </Dialog>
    </>
  );
}
