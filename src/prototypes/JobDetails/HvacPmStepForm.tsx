import { MouseEvent, useEffect, useState } from "react";

import clsx from "clsx";

import Button from "../../components/Button/Button";
import Chip from "../../components/Chip/Chip";
import Dialog from "../../components/Dialog/Dialog";
import InputGroup from "../../components/Fields/InputGroup/InputGroup";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import TextField from "../../components/Fields/TextField/TextField";
import Input from "../../components/Input/Input";
import InputHelpText from "../../components/InputHelpText/InputHelpText";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import StepItemGroup from "../../components/StepItemGroup/StepItemGroup";
import StepItem from "../../components/StepItemGroup/StepItem";
import { StepItemProgress } from "../../components/StepItemGroup/StepItem.types";
import { ChecklistAnswer, SECTIONS } from "./HvacPmForm";
import { DURATION_PRESETS, MINUTE_OPTIONS } from "./SchedulingForm";
import { SelectPopoverList, useSelectPopover } from "../../forms/shared/selectPopover";

import styles from "./HvacPmStepForm.module.scss";

// ---- the steps (Figma "CSI / HVAC PM" stepper, node 24337-41981) ------------
// The 5 checklist sections + Quote + Notes. Submit lives on Notes (the last
// step); every step is freely reachable from the step bar.

const STEP_LABELS = [...SECTIONS.map((s) => s.title), "Quote", "Notes"];
const QUOTE_STEP = SECTIONS.length; // 5
const NOTES_STEP = SECTIONS.length + 1; // 6

// Reduced to 1–5 + "5+" (Daniel 2026-07-27; the design's 1–10/"10+" set was
// cut). Exported — ServiceCallForm uses the same set (Daniel's "keep 5+").
export const TECHS_OPTIONS = ["1", "2", "3", "4", "5", "5+"];

// ---- the draft --------------------------------------------------------------

export interface HvacPmStepDraft {
  /** Keyed "<section>:<question>" (indexes — labels repeat across sections). */
  answers: Record<string, ChecklistAnswer>;
  repair: "" | "Yes" | "No";
  repairs: string;
  parts: string;
  techs: string; // "1".."10" | "10+"
  hours: string;
  minutes: string;
  notes: string;
}

export const emptyHvacStepDraft = (): HvacPmStepDraft => ({
  answers: {},
  repair: "",
  repairs: "",
  parts: "",
  techs: "",
  hours: "",
  minutes: "",
  notes: "",
});

/** Anything filled at all — Save progress only changes the row state when true. */
export const hvacStepDraftHasContent = (d: HvacPmStepDraft) =>
  Object.values(d.answers).some((a) => a.choice !== "" || a.issueNote.trim() !== "") ||
  d.repair !== "" ||
  d.repairs.trim() !== "" ||
  d.parts.trim() !== "" ||
  d.techs !== "" ||
  d.hours !== "" ||
  d.minutes !== "" ||
  d.notes.trim() !== "";

const EMPTY_ANSWER: ChecklistAnswer = { choice: "", issueNote: "" };

// ---- per-step validation / completion ---------------------------------------

const answerOf = (d: HvacPmStepDraft, id: string) => d.answers[id] ?? EMPTY_ANSWER;
const questionBad = (d: HvacPmStepDraft, id: string) => {
  const a = answerOf(d, id);
  return a.choice === "" || (a.choice === "Issue" && a.issueNote.trim() === "");
};
const durationSet = (d: HvacPmStepDraft) => (parseInt(d.hours, 10) || 0) > 0 || (parseInt(d.minutes, 10) || 0) > 0;
const quoteRevealed = (d: HvacPmStepDraft) => d.repair === "Yes";

/** Everything required on the step is missing/invalid → the step is invalid. */
const stepInvalid = (d: HvacPmStepDraft, i: number): boolean => {
  if (i < QUOTE_STEP) return SECTIONS[i].questions.some((_, qi) => questionBad(d, `${i}:${qi}`));
  if (i === QUOTE_STEP)
    return (
      d.repair === "" ||
      (quoteRevealed(d) && (d.repairs.trim() === "" || d.parts.trim() === "" || d.techs === "" || !durationSet(d)))
    );
  return false; // Notes is optional — never invalid
};

/** Every required field on the step answered (Notes: any text). */
const stepComplete = (d: HvacPmStepDraft, i: number): boolean => {
  if (i === NOTES_STEP) return d.notes.trim() !== "";
  return !stepInvalid(d, i);
};

/** Where a reopened form lands: the first not-completed step (else Notes). */
const firstIncompleteStep = (d: HvacPmStepDraft) => {
  const i = STEP_LABELS.findIndex((_, s) => !stepComplete(d, s));
  return i === -1 ? NOTES_STEP : i;
};

interface HvacPmStepFormProps {
  open: boolean;
  onClose: () => void;
  /** Dialog title (= the form's name). */
  title?: string;
  /** The saved draft to prefill (null = fresh form). */
  initial: HvacPmStepDraft | null;
  /** Save progress — no validation; the parent stores the draft + row state. */
  onSaveProgress: (draft: HvacPmStepDraft) => void;
  /** Submit — called only after full validation passes. */
  onSubmit: (draft: HvacPmStepDraft) => void;
  mobile?: boolean;
}

// The "HVAC - PM" stepper questionnaire (Figma 24337-41981): the HVAC PM
// checklists as a 7-step focus Dialog — one section per step, then Quote
// ("Does repair required?" Yes reveals the repair fields; no default
// selection) and Notes (optional "Additional / Daily notes"). Steps are freely
// navigable; Submit (Notes only) validates everything and HIGHLIGHTS the
// invalid steps in the step bar — no auto-jump (Daniel: focus dialogs don't
// jump; auto-scroll is for default dialogs). Save progress saves and closes.
export default function HvacPmStepForm({
  open,
  onClose,
  title = "HVAC - PM",
  initial,
  onSaveProgress,
  onSubmit,
  mobile = false,
}: HvacPmStepFormProps) {
  const [draft, setDraft] = useState<HvacPmStepDraft>(emptyHvacStepDraft());
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const minutePop = useSelectPopover(mobile);

  // A fresh open prefills from the saved draft (deep copy — edits must not
  // mutate the parent's stored answers) and lands on the first not-completed
  // step (Daniel's rule).
  useEffect(() => {
    if (!open) {
      minutePop.close();
      return;
    }
    const start = initial != null ? (JSON.parse(JSON.stringify(initial)) as HvacPmStepDraft) : emptyHvacStepDraft();
    setDraft(start);
    setStep(firstIncompleteStep(start));
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const answer = (id: string) => answerOf(draft, id);
  const setAnswer = (id: string, patch: Partial<ChecklistAnswer>) =>
    setDraft((prev) => ({ ...prev, answers: { ...prev.answers, [id]: { ...(prev.answers[id] ?? EMPTY_ANSWER), ...patch } } }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial ?? emptyHvacStepDraft());

  const unanswered = (id: string) => answer(id).choice === "";
  const issueMissing = (id: string) => answer(id).choice === "Issue" && answer(id).issueNote.trim() === "";
  const showYes = quoteRevealed(draft);
  const quoteBad = {
    repair: draft.repair === "",
    repairs: showYes && draft.repairs.trim() === "",
    parts: showYes && draft.parts.trim() === "",
    techs: showYes && draft.techs === "",
    time: showYes && !durationSet(draft),
  };

  // current > error > completed — the DS StepItem takes ONE progress value;
  // the current step's own problems show inline on its fields.
  const progressOf = (i: number): StepItemProgress => {
    if (i === step) return "current";
    if (showErrors && stepInvalid(draft, i)) return "error";
    if (stepComplete(draft, i)) return "completed";
    return "incompleted";
  };

  const submit = () => {
    const firstBad = STEP_LABELS.findIndex((_, i) => stepInvalid(draft, i));
    if (firstBad !== -1) {
      // Highlight the bad steps AND jump to the first one (Daniel 2026-07-27).
      setShowErrors(true);
      setStep(firstBad);
      return;
    }
    onSubmit(draft);
    onClose();
  };

  // Focusing (or tapping — Safari does not focus buttons on click) any invalid
  // field clears ALL error states at once (Daniel 2026-07-27): field errors
  // and the step-bar highlights.
  const clearErrors = () => setShowErrors(false);
  const invalidField = (bad: boolean) =>
    showErrors && bad ? { "data-invalid": true, onFocus: clearErrors, onPointerDown: clearErrors } : {};

  const saveProgress = () => {
    onSaveProgress(draft);
    onClose();
  };

  // ---- step bodies ----------------------------------------------------------

  const question = (si: number, qi: number) => {
    const id = `${si}:${qi}`;
    const a = answer(id);
    return (
      <div key={id} {...invalidField(questionBad(draft, id))}>
      <Input label={SECTIONS[si].questions[qi]}>
        <RadioGroup
          value={a.choice}
          onChange={(v) => setAnswer(id, { choice: v as ChecklistAnswer["choice"] })}
          isValid={!(showErrors && unanswered(id))}
          errorMessage="Choose an option"
        >
          <RadioItem value="OK" variant="card" label="OK" />
          <RadioItem
            value="Issue"
            variant="card"
            label="Issue"
            // The textarea reveals INSIDE the Issue card, below its divider
            // (the design's in-card content slot).
            content={
              <Input label="Describe the issue">
                <TextArea
                  value={a.issueNote}
                  onChange={(e) => setAnswer(id, { issueNote: e.target.value })}
                  isValid={!(showErrors && issueMissing(id))}
                  errorMessage="Describe the issue"
                />
              </Input>
            }
          />
          <RadioItem value="N/A" variant="card" label="N/A" />
        </RadioGroup>
      </Input>
      </div>
    );
  };

  const quoteStep = (
    <>
      {/* "Does repair required?" is the design's copy (kept from v1). */}
      <div {...invalidField(quoteBad.repair)}>
      <Input label="Does repair required?">
        <RadioGroup
          orientation="horizontal"
          value={draft.repair}
          onChange={(v) => setDraft((prev) => ({ ...prev, repair: v as HvacPmStepDraft["repair"] }))}
          isValid={!(showErrors && quoteBad.repair)}
          errorMessage="Choose an option"
        >
          <RadioItem value="Yes" variant="card" label="Yes" />
          <RadioItem value="No" variant="card" label="No" />
        </RadioGroup>
      </Input>
      </div>

      {/* Yes reveals the repair fields (all required); No reveals nothing. */}
      {showYes && (
        <>
          <div {...invalidField(quoteBad.repairs)}>
          <Input label="What repairs are required?">
            <TextArea
              value={draft.repairs}
              onChange={(e) => setDraft((prev) => ({ ...prev, repairs: e.target.value }))}
              isValid={!(showErrors && quoteBad.repairs)}
              errorMessage="Provide an answer"
            />
          </Input>
          </div>
          <div {...invalidField(quoteBad.parts)}>
          <Input label="What parts will be needed?">
            <TextArea
              value={draft.parts}
              onChange={(e) => setDraft((prev) => ({ ...prev, parts: e.target.value }))}
              isValid={!(showErrors && quoteBad.parts)}
              errorMessage="Provide an answer"
            />
          </Input>
          </div>

          {/* Techs — a single-select chip row (the design: no select field). */}
          <div {...invalidField(quoteBad.techs)}>
          <Input label="How many techs are required?">
            <div className={styles.chipsField}>
              <div className={clsx(styles.chips, styles.fillChips)}>
                {TECHS_OPTIONS.map((t) => (
                  <Chip
                    key={t}
                    size="lg"
                    className={styles.techChip}
                    active={t === draft.techs}
                    onClick={() => setDraft((prev) => ({ ...prev, techs: t }))}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
              {showErrors && quoteBad.techs && (
                <InputHelpText status="error" slotLeft>
                  Choose an option
                </InputHelpText>
              )}
            </div>
          </Input>
          </div>

          {/* Duration — the Scheduling form's shape: hr + min group, preset chips. */}
          <div className={styles.stack} {...invalidField(quoteBad.time)}>
            <Input label="Estimated time to complete">
              <InputGroup isValid={!(showErrors && quoteBad.time)}>
                <TextField
                  value={draft.hours}
                  onChange={(e) => setDraft((prev) => ({ ...prev, hours: e.target.value.replace(/[^\d]/g, "") }))}
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
    </>
  );

  const notesStep = (
    <Input label="Additional / Daily notes" labelCondition="optional">
      <TextArea value={draft.notes} onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))} />
    </Input>
  );

  return (
    <Dialog
      type="focus"
      open={open}
      onClose={onClose}
      title={title}
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={dirty}
      stepGroup={
        // Every step is always clickable — free navigation (Daniel's rule).
        <StepItemGroup>
          {STEP_LABELS.map((label, i) => (
            <StepItem key={label} label={label} progress={progressOf(i)} onClick={() => setStep(i)} />
          ))}
        </StepItemGroup>
      }
      currentStep={step}
      stepCount={STEP_LABELS.length}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={() => setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1))}
      onFinish={submit}
      finalActionLabel="Submit"
      secondaryAction={
        <Button size="lg" variant="ghost" leftIcon="save" onClick={saveProgress}>
          Save progress
        </Button>
      }
    >
      {step < QUOTE_STEP && SECTIONS[step].questions.map((_, qi) => question(step, qi))}
      {step === QUOTE_STEP && quoteStep}
      {step === NOTES_STEP && notesStep}

      {/* Minutes picker (desktop anchored card / mobile drawer). */}
      <SelectPopoverList pop={minutePop} mobile={mobile} title="Minutes">
        <SelectListItemGroup>
          {MINUTE_OPTIONS.map((m) => (
            <SelectListItem
              key={m}
              label={m}
              selected={m === draft.minutes}
              onClick={() => {
                setDraft((prev) => ({ ...prev, minutes: m }));
                minutePop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </Dialog>
  );
}
