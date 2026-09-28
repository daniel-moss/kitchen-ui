import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../components/Button/Button";
import Toaster from "../../components/Toast/Toaster";
import { Warranty, warrantyById } from "../../data/db";
import { DeviceFrame } from "../../stories/helpers";

import WarrantyPanel from "./WarrantyPanel";

// The "Warranty" side panel (Figma "Warranty Side Panel — Next Update", page
// "👍 Validated"). One module every warranty object uses: the caller hands over
// the record, the panel renders the two display modules — General details and
// Notes — with no navigation and no footer.
//
// Four demo warranties out of the database:
//   w-wd-walkin-parts  Manufacturer parts — ACTIVE, both dates, notes filled.
//   w-wd-walkin-labor  Installer labor — EXPIRED, and no notes (empty state).
//   w-wd-griddle       Extended parts + labor — UPCOMING (starts next).
//   w-bc-oven          Rental full coverage — no end date, no notes.
const meta: Meta = {
  title: 'Modules/"Warranty" Side Panel',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const ACTIVE = warrantyById("w-wd-walkin-parts")!;
const EXPIRED = warrantyById("w-wd-walkin-labor")!;
const UPCOMING = warrantyById("w-wd-griddle")!;
const NO_END_DATE = warrantyById("w-bc-oven")!;

const Demo = ({
  record,
  breakpoint,
  isLoading,
  state,
  fails = false,
}: {
  record: Warranty;
  breakpoint: "desktop" | "mobile";
  isLoading?: boolean;
  state?: "content" | "error" | "offline";
  /** Every action reports failure — the three designed error toasts. */
  fails?: boolean;
}) => {
  // The panel holds no record of its own — the caller is the source of truth,
  // so every Save lands here.
  const [warranty, setWarranty] = useState<Warranty>(record);
  const [open, setOpen] = useState(true);

  return (
    <>
      <Button size="lg" variant="subtle" onClick={() => setOpen(true)}>
        Open warranty
      </Button>
      <WarrantyPanel
        open={open}
        onClose={() => setOpen(false)}
        warranty={warranty}
        isLoading={isLoading}
        state={state}
        breakpoint={breakpoint}
        onSaveDetails={(edits) => (fails ? false : void setWarranty((prev) => ({ ...prev, ...edits })))}
        onSaveNotes={(notes) => (fails ? false : void setWarranty((prev) => ({ ...prev, details: notes === "" ? undefined : notes })))}
        onDelete={() => (fails ? false : setOpen(false))}
      />
      <Toaster breakpoint={breakpoint} />
    </>
  );
};

export const Desktop: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" />,
};

export const Mobile: Story = {
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo record={ACTIVE} breakpoint="mobile" />
    </DeviceFrame>
  ),
};

/** Starts after today — the blue "Upcoming" status. */
export const Upcoming: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo record={UPCOMING} breakpoint="desktop" />,
};

/** Past its end date — the muted "Expired" status, and no notes yet. */
export const Expired: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo record={EXPIRED} breakpoint="desktop" />,
};

/**
 * An unset end date shows the "No End date" placeholder; the status then
 * follows the start date alone (node 21869-12456).
 */
export const NoEndDate: Story = {
  name: "No end date",
  parameters: { layout: "centered" },
  render: () => <Demo record={NO_END_DATE} breakpoint="desktop" />,
};

/** Both module bodies render skeletons, and every action button is hidden. */
export const Loading: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" isLoading />,
};

/** Save and Delete report failure — the three "Could not …" toasts. */
export const ActionsFail: Story = {
  name: "Actions fail",
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" fails />,
};

export const Error: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" state="error" />,
};
