import { useEffect, useRef, useState } from "react";

import Avatar from "../../components/Avatar/Avatar";
import Button from "../../components/Button/Button";
import Counter from "../../components/Counter/Counter";
import Dialog from "../../components/Dialog/Dialog";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import FormModule from "../../components/FormModule/FormModule";
import FormModuleGroup from "../../components/FormModule/FormModuleGroup";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import ListItem from "../../components/ListItem/ListItem";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import ListItemTextRight from "../../components/ListItem/ListItemTextRight";
import MenuItem from "../../components/Menu/MenuItem";
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
import FormsModule from "./FormsModule";
import {
  Equipment,
  EquipmentAvatar,
  equipmentCaption,
  equipmentCaptionText,
  equipmentLabel,
  equipmentTitle,
} from "./equipment";
import { noop, slot } from "./shared";

import styles from "./CompleteJobForm.module.scss";

// ---------------------------------------------------------------------------
// "Complete job" — the 5-step focus Dialog (Figma section 24106-16424):
// Equipment · Forms · Summary · Charges · Signature. Each step maps to a job
// module; the DS `Dialog type="focus"` owns the step footer (Cancel/Back →
// Next). Signature is NOT built yet — it shows in the step bar but is
// unreachable (Next on Charges is a no-op, Daniel).
// ---------------------------------------------------------------------------

const STEP_LABELS = ["Equipment", "Forms", "Summary", "Charges", "Signature"];
const FORMS_STEP = 1;
const CHARGES_STEP = 3;

// Job total time = how long the JOB was active (not the tech's tracked time).
// Placeholder for the prototype (Figma 24401-45608).
const JOB_TOTAL_TIME = "2 hr 23 min";
const JOB_TOTAL_SPAN = "Across 1 day";

// A default AI summary (the prototype "generates" this). Reads like a summary of
// the completed "Ice Machine - Repair" form.
const DEFAULT_SUMMARY =
  "Diagnosed and repaired the Hoshizaki ice machine (Model KM-660). Found a clogged water inlet valve restricting flow to the reservoir; cleaned the valve, flushed the supply line, and replaced the inlet filter. Cycled the unit and confirmed normal ice production and drain flow. Recommended a follow-up descaling service in 6 months.";

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
const EQUIPMENT_DETAILS: Record<number, EquipmentDetails> = {
  1: {
    category: "HVAC",
    type: "Air handler",
    ownership: "Owned",
    area: "The kitchen",
    installDate: "January 1, 2026",
    warranty: "covered",
    notes:
      "🔥 Gas Supply: Connected to main gas line; shut-off valve behind unit\n⚡ Electrical Info: 120V ignition system; breaker panel in storage room\n🛑 Safety Concerns: High heat exposure – allow cooldown before servicing\n📦 Spare Parts Availability: Spare burner tubes in storage, shelf B-3\n🧰 Maintenance: Belts and filters last checked during the previous PM visit",
  },
  2: { category: "Cooking", type: "Griddle", ownership: "Owned", area: "Cook line", installDate: "March 12, 2024", warranty: "expired", notes: "" },
  3: { category: "Refrigeration", type: "Ice machine", ownership: "Leased", area: "Back kitchen", installDate: "June 5, 2023", warranty: "covered", notes: "" },
  4: { category: "Cooking", type: "Oven", ownership: "Owned", area: "The kitchen", installDate: "September 20, 2022", warranty: "none", notes: "" },
  5: {
    category: "Refrigeration",
    type: "Walk-in cooler",
    ownership: "Owned",
    area: "Storage room",
    installDate: "November 2, 2021",
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

// The centered "Job total time" widget (Figma 24401-45608).
const JobTotalTimeWidget = () => (
  <DisplayModule
    variant="bodyOnly"
    content={
      <div className={styles.totalTime}>
        <span className={styles.totalLabel}>Job total time</span>
        <div className={styles.totalValueBlock}>
          <span className={styles.totalValue}>{JOB_TOTAL_TIME}</span>
          <span className={styles.totalCaption}>{JOB_TOTAL_SPAN}</span>
        </div>
      </div>
    }
  />
);

// One charges group as its own DisplayModule (Figma 24395-36688): header (label
// + Counter + plus) over the line items + a group-total footer. Rows are
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
                avatar: <Avatar type="object" content="icon" icon={group.icon} size="xl" />,
                right: <ListItemTextRight variant="titleCaption" title={it.total} caption={it.unit} />,
                slotRight: <IconButton icon="ellipsis" variant="ghost" size="md" aria-label="More actions" onClick={noop} />,
                isClickable: true as const,
                onClick: noop,
              };
              return draggable ? <ListItem key={it.id} {...common} isDraggable /> : <ListItem key={it.id} {...common} />;
            })}
          </ItemGroup>
          <div className={styles.subtotalRow}>
            <span className={styles.subtotalLabel}>{group.label} total:</span>
            <span className={styles.subtotalValue}>{group.subtotal}</span>
          </div>
        </div>
      }
    />
  );
}

interface CompleteJobFormProps {
  open: boolean;
  onClose: () => void;
  /** The job's equipment (ids into the pool) — the LIVE list, shared with the
   *  Equipment module (Daniel: equipment is shared, the rest is a snapshot). */
  equipmentIds: number[];
  onEquipmentIdsChange: (next: number[]) => void;
  /** The location's equipment — the LIVE pool (the New-equipment form appends
   *  to it), so a piece created on the job shows up here too. */
  equipmentPool: Equipment[];
  mobile?: boolean;
}

type GenPhase = "idle" | "thinking" | "typing";

export default function CompleteJobForm({ open, onClose, equipmentIds, onEquipmentIdsChange, equipmentPool, mobile = false }: CompleteJobFormProps) {
  const [step, setStep] = useState(0);
  const [workSummary, setWorkSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [formsDone, setFormsDone] = useState({ all: false, any: false });
  const [skipFormsOpen, setSkipFormsOpen] = useState(false);
  const [equipmentListOpen, setEquipmentListOpen] = useState(false);
  const [genPhase, setGenPhase] = useState<GenPhase>("idle");

  // Generate-animation timers (thinking delay + the typewriter ticks).
  const genTimers = useRef<number[]>([]);
  const clearGen = () => {
    genTimers.current.forEach((t) => window.clearTimeout(t));
    genTimers.current = [];
  };

  // A fresh open resets the flow (the forms/summary/charges are a snapshot).
  useEffect(() => {
    clearGen();
    if (!open) return;
    setStep(0);
    setWorkSummary("");
    setNotes("");
    setGenPhase("idle");
    setSkipFormsOpen(false);
    setEquipmentListOpen(false);
  }, [open]);
  useEffect(() => () => clearGen(), []);

  const jobEquipment = equipmentPool.filter((e) => equipmentIds.includes(e.id));

  // Step progress: the current step is half-stroke, passed steps show the jade
  // check — EXCEPT Forms, which shows the amber WARNING when it was moved past
  // without every form completed (Skip-forms). Signature is never reached.
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
    // Charges → Signature is not built (Daniel): Next does nothing.
    if (step === CHARGES_STEP) return;
    advance();
  };

  // Generate: first "AI thinking" (button spinner), then TYPE the summary into
  // the field character by character (prototype animation, Daniel).
  const generate = () => {
    clearGen();
    setWorkSummary("");
    setGenPhase("thinking");
    genTimers.current.push(
      window.setTimeout(() => {
        setGenPhase("typing");
        let i = 0;
        const tick = () => {
          i = Math.min(DEFAULT_SUMMARY.length, i + 3);
          setWorkSummary(DEFAULT_SUMMARY.slice(0, i));
          if (i < DEFAULT_SUMMARY.length) genTimers.current.push(window.setTimeout(tick, 18));
          else setGenPhase("idle");
        };
        tick();
      }, 1100),
    );
  };

  return (
    <>
      <Dialog
        type="focus"
        open={open}
        onClose={onClose}
        title="Complete job"
        breakpoint={mobile ? "mobile" : "desktop"}
        requireScrollToEnd
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
        onFinish={noop}
        finalActionLabel="Complete job"
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
          <FormsModule mobile={mobile} stepVariant onCompletionChange={setFormsDone} />
        </div>

        {/* Step 3 — Summary */}
        {step === 2 && (
          <FormModuleGroup>
            <JobTotalTimeWidget />
            <FormModule title="Work summary" caption="Roopairs can generate summary based on completed forms or you can fill it out manually">
              <div className={styles.genStack}>
                <Button
                  variant="subtle"
                  size="lg"
                  isFullWidth
                  leftIcon="wand-magic-sparkles"
                  isDisabled={!formsDone.any || genPhase !== "idle"}
                  isProcessing={genPhase === "thinking"}
                  onClick={generate}
                >
                  Generate
                </Button>
                <TextArea value={workSummary} onChange={(e) => setWorkSummary(e.target.value)} />
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

        {/* Step 4 — Charges (one DisplayModule per group + Discounts + subtotal) */}
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
                content={
                  <div className={styles.chargeBody}>
                    <EmptyState caption="No discounts here yet" />
                    <div className={styles.subtotalRow}>
                      <span className={styles.subtotalLabel}>Discounts total:</span>
                      <span className={styles.subtotalMuted}>$0.00</span>
                    </div>
                  </div>
                }
              />
              {/* Job subtotal — the sum of the groups, less discounts. */}
              <div className={styles.jobSubtotal}>
                <span className={styles.jobSubtotalLabel}>Job subtotal</span>
                <span className={styles.jobSubtotalValue}>{JOB_SUBTOTAL}</span>
              </div>
            </div>
          </FormModule>
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
    </>
  );
}
