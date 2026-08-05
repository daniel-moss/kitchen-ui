import { YES_NO_OPTIONS } from "./options";
import { FormOption, FormSchema } from "./schema.types";

// The "Service call" form as data (Figma 24277-27279). The form dialog
// (src/prototypes/JobDetails/ServiceCallForm.tsx) and its preview both read
// their labels, options and reveal rules from here — one source of truth.
//
// The Voltage / Phase / Gas option sets are NOT in the design (no list nodes) —
// invented, flagged to Daniel 2026-07-27.

export const VOLTAGE_OPTIONS: FormOption[] = [{ value: "115V" }, { value: "208V" }, { value: "230V" }, { value: "460V" }];
export const PHASE_OPTIONS: FormOption[] = [{ value: "Single phase" }, { value: "Three phase" }];
export const GAS_OPTIONS: FormOption[] = [{ value: "Natural gas" }, { value: "Propane" }];
export const PAYMENT_OPTIONS: FormOption[] = [{ value: "Check" }, { value: "Cash" }, { value: "CC" }];
/** 1–5 techs, plus "5+". */
export const TECH_COUNT_OPTIONS: FormOption[] = ["1", "2", "3", "4", "5", "5+"].map((value) => ({ value }));

const isYes = (value: unknown) => value === "Yes";
const isNo = (value: unknown) => value === "No";

export const SERVICE_CALL_SCHEMA: FormSchema = {
  id: "service-call",
  name: "Service call",
  modules: [
    {
      id: "equipment-warranty",
      title: "Equipment / Warranty",
      fields: [
        // The equipment picker is fed by the job's live Equipment module, so it
        // carries no fixed options — the answer holds the equipment's name.
        { key: "equipment", type: "select", label: "Equipment" },
        { key: "voltage", type: "select", label: "Voltage", options: VOLTAGE_OPTIONS },
        { key: "phase", type: "select", label: "Phase", options: PHASE_OPTIONS },
        { key: "gas", type: "select", label: "Gas type", options: GAS_OPTIONS },
        { key: "warranty", type: "radio", label: "Is this unit under warranty?", options: YES_NO_OPTIONS },
        // Revealed INSIDE the "Yes" radio card; previewed as its own answer.
        {
          key: "warrantyCovered",
          type: "textArea",
          label: "What is covered?",
          visibleWhen: (answers) => isYes(answers.warranty),
        },
        { key: "verifiedMfg", type: "radio", label: "Have you verified w/ MFG?", options: YES_NO_OPTIONS, orientation: "horizontal" },
        {
          key: "csiSticker",
          type: "radio",
          label: "Is this unit tagged w/ CSI sticker?",
          options: YES_NO_OPTIONS,
          orientation: "horizontal",
        },
      ],
    },
    {
      id: "diagnosis",
      title: "Diagnosis / Issues",
      fields: [
        {
          key: "operationalOnArrival",
          type: "radio",
          label: "Unit operational on arrival?",
          options: YES_NO_OPTIONS,
          orientation: "horizontal",
        },
        { key: "diagnosisSteps", type: "textArea", label: "Explain steps to diagnosis" },
        { key: "confirmedIssue", type: "textArea", label: "Did you confirm the issue?" },
      ],
    },
    {
      id: "resolution",
      title: "Resolution",
      fields: [
        {
          key: "repairCompleted",
          type: "radio",
          label: "Was the repair completed on this visit?",
          options: YES_NO_OPTIONS,
          orientation: "horizontal",
        },
        // "Yes" reveals the rest of the module.
        {
          key: "repairsCompleted",
          type: "textArea",
          label: "What repairs were completed?",
          visibleWhen: (answers) => isYes(answers.repairCompleted),
        },
        {
          key: "partsInstalled",
          type: "textArea",
          label: "What parts were installed?",
          visibleWhen: (answers) => isYes(answers.repairCompleted),
        },
        {
          key: "maintenanced",
          type: "textArea",
          label: "Unit maintenanced / clean?",
          visibleWhen: (answers) => isYes(answers.repairCompleted),
        },
      ],
    },
    {
      id: "quote-details",
      title: "Quote details",
      fields: [
        {
          key: "fullyOperational",
          type: "radio",
          label: "Is the unit fully operational?",
          options: YES_NO_OPTIONS,
          orientation: "horizontal",
        },
        // "No" reveals the rest of the module.
        {
          key: "repairsRequired",
          type: "textArea",
          label: "What repairs are required?",
          visibleWhen: (answers) => isNo(answers.fullyOperational),
        },
        {
          key: "partsNeeded",
          type: "textArea",
          label: "What parts will be needed?",
          visibleWhen: (answers) => isNo(answers.fullyOperational),
        },
        {
          key: "techs",
          type: "chips",
          label: "How many techs are required?",
          options: TECH_COUNT_OPTIONS,
          visibleWhen: (answers) => isNo(answers.fullyOperational),
        },
        {
          key: "time",
          type: "duration",
          label: "Estimated time to complete",
          visibleWhen: (answers) => isNo(answers.fullyOperational),
        },
      ],
    },
    {
      id: "cod",
      title: "COD",
      fields: [
        {
          key: "payment",
          type: "radio",
          label: "How are you collecting payment?",
          options: PAYMENT_OPTIONS,
          orientation: "horizontal",
        },
      ],
    },
    {
      id: "notes",
      title: "Additional / Daily notes",
      optional: true,
      // No label of its own — the module title labels the answer.
      fields: [{ key: "notes", type: "textArea", optional: true }],
    },
  ],
};
