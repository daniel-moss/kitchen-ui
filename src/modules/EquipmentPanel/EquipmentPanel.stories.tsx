import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../components/Button/Button";
import Toaster from "../../components/Toast/Toaster";
import { EQUIPMENT_LABELS, Equipment, equipmentById } from "../../data/db";
import { DeviceFrame } from "../../stories/helpers";

import EquipmentPanel from "./EquipmentPanel";
import EditNotesDialog from "../shared/EditNotesDialog";
import { EquipmentPanelTab } from "./EquipmentPanel.types";

// The "Equipment" side panel (Figma "Equipment Side Panel — Next Update", page
// "👍 Validated"). One module every equipment object uses: the caller hands
// over the record, the panel renders the four tabs.
//
// Two demo pieces out of the database:
//   eq-wd-walkin  Walk-in Cooler — every module filled; two warranties (one
//                 expired) make the Warranty row "Partially covered", and its
//                 History has all three groups.
//   eq-wd-mixer   Dough Mixer — no manufacturer / model / serial, so the panel
//                 shows the WARNING state, and no labels, notes or files.
const meta: Meta = {
  title: 'Modules/"Equipment" Side Panel',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const WALK_IN = equipmentById("eq-wd-walkin")!;
const MIXER = equipmentById("eq-wd-mixer")!;

/** The name → id map the Labels form's result is written back through. */
const labelIdsOf = (names: string[]): string[] =>
  EQUIPMENT_LABELS.filter((label) => names.includes(label.name)).map((label) => label.id);

const Demo = ({
  record,
  breakpoint,
  tab,
  isLoading,
  state,
  historyFilter,
}: {
  record: Equipment;
  breakpoint: "desktop" | "mobile";
  tab?: EquipmentPanelTab;
  isLoading?: boolean;
  state?: "content" | "error" | "offline";
  historyFilter?: "all" | "estimate" | "job" | "invoice";
}) => {
  // The panel holds no record of its own — the caller is the source of truth,
  // so every Save lands here.
  const [equipment, setEquipment] = useState<Equipment>(record);
  const [open, setOpen] = useState(true);

  return (
    <>
      <Button size="lg" variant="subtle" onClick={() => setOpen(true)}>
        Open equipment
      </Button>
      <EquipmentPanel
        open={open}
        onClose={() => setOpen(false)}
        equipment={equipment}
        defaultTab={tab}
        isLoading={isLoading}
        state={state}
        defaultHistoryFilter={historyFilter}
        breakpoint={breakpoint}
        onSaveDetails={(edits) => setEquipment((prev) => ({ ...prev, ...edits }))}
        onSaveLabels={(labels) => setEquipment((prev) => ({ ...prev, labelIds: labelIdsOf(labels) }))}
        onSaveNotes={(notes) => setEquipment((prev) => ({ ...prev, notes: notes === "" ? undefined : notes }))}
      />
      <Toaster />
    </>
  );
};

export const Desktop: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo record={WALK_IN} breakpoint="desktop" />,
};

export const Mobile: Story = {
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo record={WALK_IN} breakpoint="mobile" />
    </DeviceFrame>
  ),
};

/** Manufacturer, model number and serial number are all missing. */
export const MissingKeyDetails: Story = {
  name: "Warning — missing key details",
  parameters: { layout: "centered" },
  render: () => <Demo record={MIXER} breakpoint="desktop" />,
};

export const Warranties: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo record={WALK_IN} breakpoint="desktop" tab="warranties" />,
};

export const Files: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo record={WALK_IN} breakpoint="desktop" tab="files" />,
};

export const History: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo record={WALK_IN} breakpoint="desktop" tab="history" />,
};

/** Filtered to Jobs — the rest is counted in the "hidden by filter" bar. */
export const HistoryFiltered: Story = {
  name: "History — filtered",
  parameters: { layout: "centered" },
  render: () => <Demo record={WALK_IN} breakpoint="desktop" tab="history" historyFilter="job" />,
};

/** Every tab's empty state — the mixer has no warranties, files or history. */
export const Empty: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo record={MIXER} breakpoint="desktop" tab="warranties" />,
};

/**
 * The Details tab does not know the warranty and file counts yet, so the
 * navigation hides both counters.
 */
export const LoadingDetails: Story = {
  name: "Loading — Details",
  parameters: { layout: "centered" },
  render: () => <Demo record={WALK_IN} breakpoint="desktop" isLoading />,
};

/** By the Warranties tab the counts have arrived, so the counters show. */
export const LoadingWarranties: Story = {
  name: "Loading — Warranties",
  parameters: { layout: "centered" },
  render: () => <Demo record={WALK_IN} breakpoint="desktop" tab="warranties" isLoading />,
};

/**
 * The "Notes" edit form on its own (the shared "Text Area" form pattern):
 * desktop keeps a 12-row minimum, mobile fills the drawer's height.
 */
const NotesFormDemo = ({ breakpoint }: { breakpoint: "desktop" | "mobile" }) => {
  const [notes, setNotes] = useState(WALK_IN.notes ?? "");
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="lg" variant="subtle" onClick={() => setOpen(true)}>
        Edit notes
      </Button>
      <EditNotesDialog open={open} onClose={() => setOpen(false)} notes={notes} onSave={setNotes} breakpoint={breakpoint} />
      <Toaster />
    </>
  );
};

export const NotesFormDesktop: Story = {
  name: "Notes form — desktop",
  parameters: { layout: "centered" },
  render: () => <NotesFormDemo breakpoint="desktop" />,
};

export const NotesFormMobile: Story = {
  name: "Notes form — mobile",
  parameters: { layout: "centered" },
  // A Dialog always portals to document.body, so a DeviceFrame cannot contain
  // it — the drawer fills the Storybook viewport instead.
  render: () => <NotesFormDemo breakpoint="mobile" />,
};

export const Error: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo record={WALK_IN} breakpoint="desktop" state="error" />,
};
