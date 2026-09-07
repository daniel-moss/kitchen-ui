import { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { useState } from "react";

import Button from "../../components/Button/Button";
import AvatarEquipment from "../../components/Avatar/AvatarEquipment";
import AvatarUser from "../../components/Avatar/AvatarUser";
import { Icon } from "../../components/Icon/Icon";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import { users } from "../../data/users";
import { DeviceFrame, noop } from "../../stories/helpers";
import FormPreview from "./FormPreview";
import FormPreviewPanel from "./FormPreviewPanel";
import { HOT_SIDE_REPAIR_SCHEMA } from "./hotSideRepairSchema";
import { YES_NO_OPTIONS } from "./options";
import { FormAnswers, FormSchema } from "./schema.types";
import { SERVICE_CALL_SCHEMA } from "./serviceCallSchema";
import { TEXT_SEPARATOR } from "../../utils/textSeparator";

// FormPreview — a completed form rendered read-only from its schema + answers.
// The mapping comes from Figma "Mapping / Input -> Preview" (24469-37438) and
// "Mapping / FormModuleGroup -> Preview" (24470-39311).
const meta: Meta<typeof FormPreview> = {
  title: 'Modules/"Job Form" Preview',
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
        { key: "selectIcon", type: "select", label: "SelectField (icon)" },
        { key: "selectAvatar", type: "select", label: "SelectField (avatar)" },
        { key: "selectObject", type: "objectSelect", label: "SelectField (object)" },
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
        { key: "media", type: "media", label: "MediaField" },
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
  // A value with an icon / avatar in front of it — the element is the caller's.
  selectIcon: { text: "Value", slotLeft: <Icon icon="diamonds-4" size={14} /> },
  selectAvatar: { text: users[0].name, slotLeft: <AvatarUser size="xs" content="image" imageSrc={users[0].avatar} /> },
  selectObject: {
    title: `Oven${TEXT_SEPARATOR}Bosch`,
    caption: `Model: 01234${TEXT_SEPARATOR}Serial: 56789`,
    avatar: <AvatarEquipment size="xl" />,
  },
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
  media: [
    { name: "Burner.jpg", type: "image" as const },
    { name: "Manifold.jpg", type: "image" as const },
    { name: "Recap.mp4", type: "video" as const },
  ],
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
  equipment: {
    title: `Fryer #2${TEXT_SEPARATOR}Frymaster`,
    caption: `Model: FPP345${TEXT_SEPARATOR}Serial: 90210`,
    avatar: <AvatarEquipment size="xl" />,
  },
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
  equipment: {
    title: `Range${TEXT_SEPARATOR}Vulcan`,
    caption: `Model: V60F${TEXT_SEPARATOR}Serial: 4471`,
    avatar: <AvatarEquipment size="xl" />,
  },
  reportedIssue: "The left burner does not hold a flame.",
  operatingOnArrival: "No",
  dateTag: [{ name: "Date tag.jpg", type: "image" as const, size: 4_194_304 }],
  wideShot: [{ name: "Wide shot.jpg", type: "image" as const, size: 2_600_000 }],
  temperature: "312 °F",
  issuesText: "The pilot assembly is corroded and the thermocouple reading drops under load.",
  issuesMedia: [
    { name: "Pilot assembly.jpg", type: "image" as const, size: 512_000 },
    { name: "Thermocouple.jpg", type: "image" as const, size: 890_000 },
  ],
  actionsTaken: "Cleaned the pilot assembly, replaced the thermocouple and re-tested the burner.",
  functioningOnDeparture: "Yes",
  needReturn: "No",
  partsPicture: "Yes",
  safetyConcerns: "The gas line fitting behind the unit should be re-sealed on the next visit.",
  finalVideo: [{ name: "Recap.mp4", type: "video" as const, size: 18_800_000 }],
  checkOut: "Marta Reyes, kitchen manager",
};

/**
 * "Hot Side - Repair" — a form with no modules: the answers render as one flat
 * list, with the object card and the file grids.
 */
export const HotSideRepair: Story = {
  parameters: { layout: "centered" },
  render: () => (
    <Frame>
      <FormPreview schema={HOT_SIDE_REPAIR_SCHEMA} answers={HOT_SIDE_ANSWERS} />
    </Frame>
  ),
};

// ---- the panel (how the preview is really shown) ---------------------------

const PanelDemo = ({ breakpoint }: { breakpoint: "desktop" | "mobile" }) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="lg" variant="subtle" leftIcon="eye" onClick={() => setOpen(true)}>
        Preview form
      </Button>
      <FormPreviewPanel
        open={open}
        onClose={() => setOpen(false)}
        schema={HOT_SIDE_REPAIR_SCHEMA}
        answers={HOT_SIDE_ANSWERS}
        title="Hot Side - Repair"
        breakpoint={breakpoint}
        // The consumer owns the items; here a stand-in for the form's own menu.
        headerMenu={(close) => (
          <MenuItemGroup>
            <MenuItem label="Edit" slotLeft={<Icon icon="pen" container="square" />} onClick={close} />
            <MenuItem label="Rename" slotLeft={<Icon icon="text-size" container="square" />} onClick={close} />
            <MenuItem label="Duplicate" slotLeft={<Icon icon="clone" container="square" />} onClick={close} />
          </MenuItemGroup>
        )}
      />
    </>
  );
};

/** The preview as it is really shown: a SidePanel over the page. */
export const PanelDesktop: Story = {
  parameters: { layout: "centered" },
  render: () => <PanelDemo breakpoint="desktop" />,
};

/** Mobile: the panel fills the screen. */
export const PanelMobile: Story = {
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame>
      <PanelDemo breakpoint="mobile" />
    </DeviceFrame>
  ),
};
