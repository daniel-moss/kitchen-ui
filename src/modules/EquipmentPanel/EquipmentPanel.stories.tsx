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
  title: 'Modules/Equipment/"Equipment" Side Panel',
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
  isPublicView,
}: {
  record: Equipment;
  breakpoint: "desktop" | "mobile";
  tab?: EquipmentPanelTab;
  isLoading?: boolean;
  state?: "content" | "error" | "offline";
  historyFilter?: "all" | "estimate" | "job" | "invoice";
  isPublicView?: boolean;
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
        isPublicView={isPublicView}
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

/**
 * By the Warranties tab the counts have arrived, so the counters show — the
 * navigation's, the module's, and the header avatar's warranty status.
 */
export const LoadingWarranties: Story = {
  name: "Loading — Warranties",
  parameters: { layout: "centered" },
  render: () => <Demo record={WALK_IN} breakpoint="desktop" tab="warranties" isLoading />,
};

/** The file count is known, so the list draws that many skeleton rows. */
export const LoadingFiles: Story = {
  name: "Loading — Files",
  parameters: { layout: "centered" },
  render: () => <Demo record={WALK_IN} breakpoint="desktop" tab="files" isLoading />,
};

/** The rows' object types are not known yet, so the avatars load too. */
export const LoadingHistory: Story = {
  name: "Loading — History",
  parameters: { layout: "centered" },
  render: () => <Demo record={WALK_IN} breakpoint="desktop" tab="history" isLoading />,
};

/**
 * The "Notes" edit form on its own (the shared "Text Area" form pattern):
 * desktop keeps a 12-row minimum, mobile fills the drawer's height.
 */
// ---- the PUBLIC view (Figma "Public View", 22438-33582) — what the client
// sees: no History tab, no editing, public files only.

export const PublicDesktop: Story = {
  name: "Public view — desktop",
  parameters: { layout: "centered" },
  render: () => <Demo record={WALK_IN} breakpoint="desktop" isPublicView />,
};

export const PublicMobile: Story = {
  name: "Public view — mobile",
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo record={WALK_IN} breakpoint="mobile" isPublicView />
    </DeviceFrame>
  ),
};

export const PublicWarranties: Story = {
  name: "Public view — warranties",
  parameters: { layout: "centered" },
  render: () => <Demo record={WALK_IN} breakpoint="desktop" tab="warranties" isPublicView />,
};

export const PublicFiles: Story = {
  name: "Public view — files",
  parameters: { layout: "centered" },
  render: () => <Demo record={WALK_IN} breakpoint="desktop" tab="files" isPublicView />,
};

/** Missing key details show as plain placeholders — no warning in public. */
export const PublicMissingKeyDetails: Story = {
  name: "Public view — missing key details",
  parameters: { layout: "centered" },
  render: () => <Demo record={MIXER} breakpoint="desktop" isPublicView />,
};

const NotesFormDemo = ({ breakpoint }: { breakpoint: "desktop" | "mobile" }) => {
  const [notes, setNotes] = useState(WALK_IN.notes ?? "");
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="lg" variant="subtle" onClick={() => setOpen(true)}>
        Edit notes
      </Button>
      {/* The same settings the panel passes. */}
      <EditNotesDialog
        open={open}
        onClose={() => setOpen(false)}
        notes={notes}
        showFieldLabel={false}
        toastSubject={'"Notes" module'}
        errorTitle={'Couldn\'t update "Notes" module'}
        onSave={setNotes}
        breakpoint={breakpoint}
      />
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

// The error / offline states are SidePanel's own behavior, documented and
// demonstrated on that component's page — the panel only forwards `state` and
// `onRetry`. No story here, so the two cannot drift (Daniel, 2026-09-29).
