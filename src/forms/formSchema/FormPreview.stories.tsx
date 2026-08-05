import { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import FormPreview from "./FormPreview";
import { HOT_SIDE_REPAIR_SCHEMA } from "./hotSideRepairSchema";
import { YES_NO_OPTIONS } from "./options";
import { FormAnswers, FormSchema } from "./schema.types";
import { SERVICE_CALL_SCHEMA } from "./serviceCallSchema";

// FormPreview — a completed form rendered read-only from its schema + answers.
// The mapping comes from Figma "Mapping / Input -> Preview" (24469-37438) and
// "Mapping / FormModuleGroup -> Preview" (24470-39311).
const meta: Meta<typeof FormPreview> = {
  title: "Forms/Form Preview",
  component: FormPreview,
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj<typeof FormPreview>;

// The preview column — the width a SidePanel body gives it.
const Frame = ({ children }: { children: ReactNode }) => (
  <div style={{ width: 400, maxWidth: "100%", padding: 16 }}>{children}</div>
);

// ---- every input type, one answer each (the mapping frame as a story) -------

const MAPPING_SCHEMA: FormSchema = {
  id: "mapping",
  name: "Input mapping",
  modules: [
    {
      id: "mapping",
      title: "Title",
      caption: "Caption",
      // The form's AlertBanner is never previewed — passing one changes nothing.
      banner: "Insert your content here.",
      fields: [
        { key: "text", type: "text", label: "TextField" },
        { key: "affixed", type: "text", label: "TextField (Prefix & Suffix)", prefix: "Prefix", suffix: "Suffix" },
        { key: "helped", type: "text", label: "TextField (HelpText)", helpText: "Help text" },
        { key: "optional", type: "text", label: "TextField (optional)", optional: true },
        { key: "optionalEmpty", type: "text", label: "TextField (optional, empty)", optional: true },
        { key: "textArea", type: "textArea", label: "TextArea" },
        { key: "select", type: "select", label: "SelectField (single-select)", options: [{ value: "Value" }] },
        { key: "selectSuffix", type: "select", label: "SelectField (Suffix)", options: [{ value: "Value" }], suffix: "Suffix" },
        {
          key: "multiSelect",
          type: "multiSelect",
          label: "SelectField (Multi-select)",
          options: [{ value: "First option" }, { value: "Second option" }, { value: "Third option" }],
        },
        { key: "date", type: "date", label: "DateField" },
        { key: "dateTime", type: "dateTime", label: "InputGroup (Date + Slot Time)" },
        { key: "duration", type: "duration", label: "InputGroup (Duration)" },
        { key: "freeTime", type: "dateTime", label: "InputGroup (Date + Free Time)" },
        {
          key: "checkbox",
          type: "checkbox",
          label: "CheckboxGroup",
          options: [{ value: "Option 1" }, { value: "Option 2" }, { value: "Option 3" }],
        },
        {
          key: "radio",
          type: "radio",
          label: "RadioGroup",
          options: [{ value: "Option 1" }, { value: "Option 2" }],
        },
        { key: "yesNo", type: "radio", label: "RadioGroup (Yes / No)", options: YES_NO_OPTIONS },
        { key: "chipsSingle", type: "chips", label: "ChipGroup (Single-select)", options: ["1", "2", "3", "4", "5"].map((value) => ({ value })) },
        {
          key: "chipsMulti",
          type: "chips",
          label: "ChipGroup (Multi-select)",
          multiple: true,
          options: ["1", "2", "3", "4", "5"].map((value) => ({ value })),
        },
      ],
    },
  ],
};

const MAPPING_ANSWERS: FormAnswers = {
  text: "Value",
  affixed: "Value",
  helped: "Value",
  optional: "Value",
  // optionalEmpty is left out on purpose — an empty optional answer is hidden.
  textArea:
    "The product team convened late in the afternoon to review the latest iteration of the interface, focusing on clarity, consistency, and the cumulative impact of small interaction decisions.",
  select: "Value",
  selectSuffix: "Value",
  // Picked out of order — the preview lists them in the OPTION order.
  multiSelect: ["Second option", "First option"],
  date: new Date(2026, 0, 1),
  dateTime: { date: new Date(2026, 0, 1), time: "12:00 PM" },
  duration: { hours: "2", minutes: "30" },
  freeTime: { date: new Date(2026, 0, 1), time: "09:30 AM" },
  checkbox: ["Option 1", "Option 2"],
  radio: "Option 1",
  yesNo: "Yes",
  chipsSingle: "4",
  chipsMulti: ["3", "4"],
};

/** One answer per input type — the Figma mapping frame, rendered. */
export const Mapping: Story = {
  parameters: { layout: "centered" },
  render: () => (
    <Frame>
      <FormPreview schema={MAPPING_SCHEMA} answers={MAPPING_ANSWERS} />
    </Frame>
  ),
};

// ---- a real filled form -----------------------------------------------------

const SERVICE_CALL_ANSWERS: FormAnswers = {
  equipment: "Fryer #2",
  voltage: "208V",
  phase: "Three phase",
  gas: "Natural gas",
  warranty: "Yes",
  warrantyCovered: "Parts and labor until March 2027.",
  verifiedMfg: "Yes",
  csiSticker: "No",
  operationalOnArrival: "No",
  diagnosisSteps: "Checked the gas supply, measured the manifold pressure and tested the ignition module.",
  confirmedIssue: "Yes — the ignition module fails to spark on a cold start.",
  repairCompleted: "Yes",
  repairsCompleted: "Replaced the ignition module and cleaned the burners.",
  partsInstalled: "Ignition module, gasket kit.",
  maintenanced: "Yes, the unit was cleaned after the repair.",
  fullyOperational: "No",
  repairsRequired: "The gas valve is leaking and has to be replaced.",
  partsNeeded: "Gas valve, two fittings.",
  techs: "2",
  time: { hours: "2", minutes: "30" },
  payment: "Check",
  notes: "The client asked to be called before the next visit.",
};

/** The "Service call" form, completed. */
export const ServiceCall: Story = {
  parameters: { layout: "centered" },
  render: () => (
    <Frame>
      <FormPreview schema={SERVICE_CALL_SCHEMA} answers={SERVICE_CALL_ANSWERS} />
    </Frame>
  ),
};

// ---- the hiding rules -------------------------------------------------------

// "No" on the reveal questions hides everything they would have asked, so the
// whole Resolution module disappears; the optional notes are left empty, so
// that module disappears too.
const HIDDEN_ANSWERS: FormAnswers = {
  ...SERVICE_CALL_ANSWERS,
  repairCompleted: "No",
  repairsCompleted: "Replaced the ignition module and cleaned the burners.",
  partsInstalled: "Ignition module, gasket kit.",
  maintenanced: "Yes, the unit was cleaned after the repair.",
  fullyOperational: "Yes",
  notes: "",
};

/** Hidden answers: unrevealed fields, empty optional fields and empty modules. */
export const HiddenAnswers: Story = {
  parameters: { layout: "centered" },
  render: () => (
    <Frame>
      <FormPreview schema={SERVICE_CALL_SCHEMA} answers={HIDDEN_ANSWERS} />
    </Frame>
  ),
};

// ---- the flat form ----------------------------------------------------------

const HOT_SIDE_ANSWERS: FormAnswers = {
  checkIn: "Marta Reyes, kitchen manager",
  equipmentName: "Hot side range, ID 4471",
  reportedIssue: "The left burner does not hold a flame.",
  operatingOnArrival: "No",
  temperature: "312 °F",
  issuesText: "The pilot assembly is corroded and the thermocouple reading drops under load.",
  actionsTaken: "Cleaned the pilot assembly, replaced the thermocouple and re-tested the burner.",
  functioningOnDeparture: "Yes",
  needReturn: "No",
  partsPicture: "Yes",
  safetyConcerns: "The gas line fitting behind the unit should be re-sealed on the next visit.",
  checkOut: "Marta Reyes, kitchen manager",
  standaloneQuote: "No",
};

/**
 * "Hot Side - Repair" — a form with no modules: the answers render as one flat
 * list. Its media answers are not shown yet (waiting for the ValueDisplay
 * update), so the photo and video fields are missing from this preview.
 */
export const HotSideRepair: Story = {
  parameters: { layout: "centered" },
  render: () => (
    <Frame>
      <FormPreview schema={HOT_SIDE_REPAIR_SCHEMA} answers={HOT_SIDE_ANSWERS} />
    </Frame>
  ),
};
