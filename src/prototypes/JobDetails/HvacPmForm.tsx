import { Fragment, MouseEvent, useEffect, useRef, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import { Divider } from "../../components/Divider/Divider";
import FormModule from "../../components/FormModule/FormModule";
import Input from "../../components/Input/Input";
import InputGroup from "../../components/Fields/InputGroup/InputGroup";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import TextField from "../../components/Fields/TextField/TextField";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { MINUTE_OPTIONS } from "./SchedulingForm";
import { SelectPopoverList, useSelectPopover } from "../../forms/shared/selectPopover";

import styles from "./HvacPmForm.module.scss";

// ---- the questionnaire (Figma "CSI – HVAC PM", node 24273-69208; copy
// re-extracted 2026-07-23 after Daniel's typo pass) ---------------------------

// Exported for HvacPmStepForm — the stepper variant shares the same lists
// (copy re-verified against the stepper design 24337-41981, 2026-07-27).
export const SECTIONS: { title: string; questions: string[] }[] = [
  {
    title: "A/C",
    questions: [
      "Clean evap / coils",
      "Flush pan, p-trap, drain lines",
      "Check for burnt wires",
      "Check for pitted contacts",
      "Check for carbon buildup",
      "Check electrical connections",
      "Check compressor terminals",
      "Lubricate fan motors / bearings",
      "Verify proper supply / voltage",
      "Check fan motor amp draw",
      "Check compressor amp draw",
      "Check suction pressures",
      "Check discharge pressures",
      "Verify T-Stats set points",
      "Verify T-Stats programming",
      "Replace belt(s) per PMA",
      "Replace filters(s) per PMA",
    ],
  },
  {
    title: "Heat / Gas",
    questions: [
      "Verify gas pressure",
      "Check gas valve / burner",
      "Check safety control",
      "Check heat exchanger cracks",
      "Check gas line / unit for leaks",
      "Check for proper combustion",
      "Clean burners / orifices",
      "Verify T-Stats set points",
      "Verify T-Stats programming",
      "Check operation of heat mode",
      "Check for combustion gases",
      "Clean flame sensors as required",
      "Replace belt(s) per PMA",
      "Replace filters(s) per PMA",
    ],
  },
  {
    title: "Electric",
    questions: [
      "Check electrical connections",
      "Check contactor",
      "Check sequencers",
      "Check heating elements",
      "Check heat strips (dust-free)",
      "Check high limit switch",
      "Replace belt(s) per PMA",
      "Replace filters(s) per PMA",
    ],
  },
  {
    title: "Make-up Air",
    questions: [
      "Verify gas pressure",
      "Check gas valve / burner",
      "Check safety control",
      "Check heat exchanger cracks",
      "Check gas line / unit for leaks",
      "Check sequencers",
      "Check heating elements",
      "Check electrical connections",
      "Verify T-Stats set points",
      "Verify T-Stats programming",
      "Check operation of heat mode",
      "Check for combustion gases",
      "Replace belt(s) per PMA",
      "Wash cleanable filters",
    ],
  },
  {
    title: "Exhaust",
    questions: [
      "Lubricate bearings",
      "Check rotation",
      "Take amp reading",
      "Adjust belt tension",
      "Check pulleys / sheaves",
      "Check all electric controls",
      "Check all electric connections",
      "Replace belt(s) per PMA",
    ],
  },
];

const TECHS_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

// ---- the draft --------------------------------------------------------------

export interface ChecklistAnswer {
  choice: "" | "OK" | "Issue" | "N/A";
  issueNote: string;
}

export interface HvacPmDraft {
  /** Keyed "<section>:<question>" (indexes — labels repeat across sections). */
  answers: Record<string, ChecklistAnswer>;
  repair: "" | "Yes" | "No";
  repairs: string;
  parts: string;
  techs: string;
  hours: string;
  minutes: string;
}

export const emptyHvacDraft = (): HvacPmDraft => ({ answers: {}, repair: "", repairs: "", parts: "", techs: "", hours: "", minutes: "" });

/** Anything filled at all — Save progress only changes the row state when true. */
export const hvacDraftHasContent = (d: HvacPmDraft) =>
  Object.values(d.answers).some((a) => a.choice !== "" || a.issueNote.trim() !== "") ||
  d.repair !== "" ||
  d.repairs.trim() !== "" ||
  d.parts.trim() !== "" ||
  d.techs !== "" ||
  d.hours !== "" ||
  d.minutes !== "";

const EMPTY_ANSWER: ChecklistAnswer = { choice: "", issueNote: "" };

interface HvacPmFormProps {
  open: boolean;
  onClose: () => void;
  /** Dialog title (= the form's name). Default "HVAC PM". */
  title?: string;
  /**
   * The v2 layout (Daniel, 2026-07-23): OK / Issue / N/A cards side by side;
   * the Issue TextArea renders BELOW the row, labeled "[question] – Issue"
   * (the label carries the connection the in-card reveal used to provide).
   */
  horizontal?: boolean;
  /** The saved draft to prefill (null = fresh form). */
  initial: HvacPmDraft | null;
  /** Save progress — no validation; the parent stores the draft + row state. */
  onSaveProgress: (draft: HvacPmDraft) => void;
  /** Submit — called only after full validation passes. */
  onSubmit: (draft: HvacPmDraft) => void;
  mobile?: boolean;
}

// The "HVAC PM" questionnaire (Figma 24273-69208): 5 checklist sections of
// OK / Issue / N/A questions ("Issue" reveals a required "Describe issue"
// TextArea) + the "Quote details" section — "Does repair required?" Yes/No,
// where Yes reveals the repair fields. Submit validates everything visible;
// Save progress saves whatever is filled and closes.
export default function HvacPmForm({
  open,
  onClose,
  title = "HVAC PM",
  horizontal = false,
  initial,
  onSaveProgress,
  onSubmit,
  mobile = false,
}: HvacPmFormProps) {
  const [draft, setDraft] = useState<HvacPmDraft>(emptyHvacDraft());
  const [showErrors, setShowErrors] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const techsPop = useSelectPopover(mobile);
  const minutePop = useSelectPopover(mobile);

  // A fresh open prefills from the saved draft (deep copy — edits must not
  // mutate the parent's stored answers).
  useEffect(() => {
    if (!open) {
      techsPop.close();
      minutePop.close();
      return;
    }
    setDraft(initial != null ? JSON.parse(JSON.stringify(initial)) : emptyHvacDraft());
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const answer = (id: string) => draft.answers[id] ?? EMPTY_ANSWER;
  const setAnswer = (id: string, patch: Partial<ChecklistAnswer>) =>
    setDraft((prev) => ({ ...prev, answers: { ...prev.answers, [id]: { ...(prev.answers[id] ?? EMPTY_ANSWER), ...patch } } }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial ?? emptyHvacDraft());

  // ---- validation (everything visible is required) --------------------------
  const unanswered = (id: string) => answer(id).choice === "";
  const issueMissing = (id: string) => answer(id).choice === "Issue" && answer(id).issueNote.trim() === "";
  const questionBad = (id: string) => unanswered(id) || issueMissing(id);
  const showYes = draft.repair === "Yes";
  const durationSet = (parseInt(draft.hours, 10) || 0) > 0 || (parseInt(draft.minutes, 10) || 0) > 0;
  const quoteBad: Record<string, boolean> = {
    repair: draft.repair === "",
    repairs: showYes && draft.repairs.trim() === "",
    parts: showYes && draft.parts.trim() === "",
    techs: showYes && draft.techs === "",
    time: showYes && !durationSet,
  };

  const submit = () => {
    const badIds: string[] = [];
    SECTIONS.forEach((s, si) => s.questions.forEach((_, qi) => questionBad(`${si}:${qi}`) && badIds.push(`${si}:${qi}`)));
    (["repair", "repairs", "parts", "techs", "time"] as const).forEach((k) => quoteBad[k] && badIds.push(k));
    if (badIds.length > 0) {
      setShowErrors(true);
      // Scroll the FIRST error into view (the dialog body scrolls).
      setTimeout(() => {
        bodyRef.current?.querySelector(`[data-qid="${CSS.escape(badIds[0])}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={dirty}
      footer={
        // Leading Cancel (closes directly — the DS form convention; the
        // discard prompt guards scrim/X) + trailing Save progress / Submit.
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="ghost" onClick={saveProgress}>
            Save progress
          </Button>
          <Button size="lg" variant="solid" onClick={submit}>
            Submit
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form} ref={bodyRef}>
        {SECTIONS.map((section, si) => (
          <Fragment key={section.title}>
            {si > 0 && <Divider className={styles.moduleDivider} />}
            <FormModule title={section.title}>
              {section.questions.map((q, qi) => {
                const id = `${si}:${qi}`;
                const a = answer(id);
                // Explicit error copy — the derived "Provide [label]" reads
                // broken on these labels.
                const issueField = (label: string) => (
                  <Input label={label}>
                    <TextArea
                      value={a.issueNote}
                      onChange={(e) => setAnswer(id, { issueNote: e.target.value })}
                      isValid={!(showErrors && issueMissing(id))}
                      errorMessage="Describe the issue"
                    />
                  </Input>
                );
                return (
                  <div key={id} data-qid={id} className={styles.question}>
                    <Input label={q}>
                    <RadioGroup
                      orientation={horizontal ? "horizontal" : "vertical"}
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
                        // v1: the TextArea expands INSIDE the card. v2
                        // (horizontal) renders it below the row instead — the
                        // narrow card can't hold a full-width field.
                        content={horizontal ? undefined : issueField("Describe issue")}
                      />
                      <RadioItem value="N/A" variant="card" label="N/A" />
                    </RadioGroup>
                    </Input>
                    {/* v2: the label "[question] – Issue" carries the visual
                        connection to the Issue card (Daniel's call). */}
                    {horizontal && a.choice === "Issue" && issueField(`${q} – Issue`)}
                  </div>
                );
              })}
            </FormModule>
          </Fragment>
        ))}

        <Divider className={styles.moduleDivider} />
        <FormModule title="Quote details">
          <div data-qid="repair">
            {/* "Does repair required?" is the design's copy (Daniel kept it). */}
            <Input label="Does repair required?">
              <RadioGroup
                orientation="horizontal"
                value={draft.repair}
                onChange={(v) => setDraft((prev) => ({ ...prev, repair: v as HvacPmDraft["repair"] }))}
                isValid={!(showErrors && quoteBad.repair)}
                errorMessage="Choose an option"
              >
                <RadioItem value="Yes" variant="card" label="Yes" />
                <RadioItem value="No" variant="card" label="No" />
              </RadioGroup>
            </Input>
          </div>

          {/* Yes reveals the repair fields; No hides them (all required). */}
          {showYes && (
            <>
              <div data-qid="repairs">
                <Input label="What repairs are required?">
                  <TextArea
                    value={draft.repairs}
                    onChange={(e) => setDraft((prev) => ({ ...prev, repairs: e.target.value }))}
                    isValid={!(showErrors && quoteBad.repairs)}
                    // Question-style labels break the derived "Provide [label]" copy.
                    errorMessage="Provide an answer"
                  />
                </Input>
              </div>
              <div data-qid="parts">
                <Input label="What parts will be needed?">
                  <TextArea
                    value={draft.parts}
                    onChange={(e) => setDraft((prev) => ({ ...prev, parts: e.target.value }))}
                    isValid={!(showErrors && quoteBad.parts)}
                    errorMessage="Provide an answer"
                  />
                </Input>
              </div>
              <div data-qid="techs">
                <Input label="How many techs are required?">
                  <SelectField
                    value={draft.techs || undefined}
                    isValid={!(showErrors && quoteBad.techs)}
                    errorMessage="Choose an option"
                    open={techsPop.open}
                    onClick={(e: MouseEvent<HTMLDivElement>) => techsPop.toggle(e.currentTarget)}
                  />
                </Input>
              </div>
              <div data-qid="time">
                {/* Same shape as Scheduling's Duration: typed hours + minute steps. */}
                <Input label="Estimated time to complete">
                  <InputGroup isValid={!(showErrors && quoteBad.time)}>
                    <TextField
                      value={draft.hours}
                      onChange={(e) => setDraft((prev) => ({ ...prev, hours: e.target.value.replace(/[^\d]/g, "") }))}
                      keyboard="numeric"
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
              </div>
            </>
          )}
        </FormModule>
      </div>

      {/* Techs picker (1–10) */}
      <SelectPopoverList pop={techsPop} mobile={mobile} title="How many techs are required?">
        <SelectListItemGroup>
          {TECHS_OPTIONS.map((t) => (
            <SelectListItem
              key={t}
              label={t}
              selected={t === draft.techs}
              onClick={() => {
                setDraft((prev) => ({ ...prev, techs: t }));
                techsPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      {/* Minutes picker */}
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
