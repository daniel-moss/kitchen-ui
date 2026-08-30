import { FormFieldSchema, FormModuleSchema, FormSchema } from "./schema.types";

// The "PM - HVAC" form as data (Figma "CSI / HVAC PM" stepper 24337-41981).
// Unlike the other schemas this form is a STEPPER: 5 checklist sections, then
// Quote, then Notes. Each step becomes one module carrying its step name, and
// the preview renders the steps per "Mapping / Step -> Preview" (24631-58494) —
// the step's name as a heading over the step's answers.
//
// None of the steps groups its fields into FormModules, so every module here is
// title-less: the step's content is the flat answer list. The mapping supports
// both shapes; this form only uses one of them.

/**
 * The checklist steps — the single source of truth for the questions. The
 * stepper form (`HvacPmStepForm`) renders the same lists, so a question is
 * written once. Copy verified against the stepper design (2026-07-27).
 */
export const HVAC_PM_SECTIONS: { title: string; questions: string[] }[] = [
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

/** The Quote step's tech-count chips (Daniel 2026-07-27: 1–5 + "5+"). */
export const HVAC_PM_TECHS_OPTIONS = ["1", "2", "3", "4", "5", "5+"];

/** The step names, in order — the checklist sections, then Quote and Notes. */
export const HVAC_PM_STEPS = [...HVAC_PM_SECTIONS.map((s) => s.title), "Quote", "Notes"];

/**
 * One checklist question = TWO fields, the same way the form asks it: the
 * OK / Issue choice, then the "Describe the issue" text that the Issue card
 * reveals. The revealed text is only previewed when the answer IS "Issue",
 * exactly like Service call's reveals.
 *
 * The keys match the draft's ("<section>:<question>" by index), so the answers
 * map needs no translation.
 */
const checklistFields = (sectionIndex: number, questions: string[]): FormFieldSchema[] =>
  questions.flatMap((question, questionIndex) => {
    const key = `${sectionIndex}:${questionIndex}`;
    return [
      {
        key,
        label: question,
        type: "radio",
        options: [{ value: "OK" }, { value: "Issue" }],
      } as FormFieldSchema,
      {
        key: `${key}#note`,
        label: "Describe the issue",
        type: "textArea",
        visibleWhen: (answers) => answers[key] === "Issue",
      } as FormFieldSchema,
    ];
  });

const CHECKLIST_MODULES: FormModuleSchema[] = HVAC_PM_SECTIONS.map((section, index) => ({
  id: `section-${index}`,
  step: section.title,
  fields: checklistFields(index, section.questions),
}));

// The Quote step: "Yes" reveals every other field, "No" ends the step.
const QUOTE_MODULE: FormModuleSchema = {
  id: "quote",
  step: "Quote",
  fields: [
    // "Does repair required?" is the design's copy.
    { key: "repair", label: "Does repair required?", type: "radio", options: [{ value: "Yes" }, { value: "No" }] },
    {
      key: "repairs",
      label: "What repairs are required?",
      type: "textArea",
      visibleWhen: (answers) => answers.repair === "Yes",
    },
    {
      key: "parts",
      label: "What parts will be needed?",
      type: "textArea",
      visibleWhen: (answers) => answers.repair === "Yes",
    },
    {
      key: "techs",
      label: "How many techs are required?",
      type: "chips",
      options: HVAC_PM_TECHS_OPTIONS.map((value) => ({ value })),
      visibleWhen: (answers) => answers.repair === "Yes",
    },
    {
      key: "time",
      label: "Estimated time to complete",
      type: "duration",
      visibleWhen: (answers) => answers.repair === "Yes",
    },
  ],
};

const NOTES_MODULE: FormModuleSchema = {
  id: "notes",
  step: "Notes",
  fields: [{ key: "notes", label: "Additional / Daily notes", type: "textArea", optional: true }],
};

export const HVAC_PM_SCHEMA: FormSchema = {
  id: "hvac-pm",
  name: "PM - HVAC",
  modules: [...CHECKLIST_MODULES, QUOTE_MODULE, NOTES_MODULE],
};
