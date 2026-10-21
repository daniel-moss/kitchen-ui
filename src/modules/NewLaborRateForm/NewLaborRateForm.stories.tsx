import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../components/Button/Button";
import Toaster from "../../components/Toast/Toaster";
import { LABOR_ITEMS, LABOR_SUBTYPES, QUICKBOOKS_ACCOUNTS } from "../../data/db";
import { DeviceFrame } from "../../stories/helpers";

import NewLaborRateForm from "./NewLaborRateForm";

// The "Create" form for a labor rate (Figma file qhebbfbPHDVnv8IF1EC7Zg,
// section 3054-8527) — only the required fields, in a Dialog, shared by every
// flow that adds a labor rate. The form before this redesign is kept as
// '[Archive] "Create" Form'.
//
// Desktop and Mobile show the node's company: it requires a subtype, uses
// taxes with labor taxable by default, and is on QuickBooks Desktop with the
// detailed line-item scheme. Subtypes and the taken names come from the demo
// database — type "Standard labor rate" to see "Labor rate with this name already
// exists".
const meta: Meta = {
  title: 'Modules/Labor Rate/"Create" Form',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const TAKEN_NAMES = LABOR_ITEMS.map((item) => item.name);

const Demo = ({
  breakpoint,
  subtypes = LABOR_SUBTYPES,
  fails = false,
  slow = false,
  requireSubtypes = true,
  quickbooks = { accounts: QUICKBOOKS_ACCOUNTS },
}: {
  breakpoint: "desktop" | "mobile";
  /** The company's labor subtypes — none, one, or the whole table. */
  subtypes?: typeof LABOR_SUBTYPES;
  /** Create reports failure — the error toast, with the form left as it was. */
  fails?: boolean;
  /** A slow create, so the in-flight state is visible. */
  slow?: boolean;
  /** The company requires a subtype (`require_subtypes`). */
  requireSubtypes?: boolean;
  /** The QuickBooks Desktop block. null = no integration (no field). */
  quickbooks?: { accounts: typeof QUICKBOOKS_ACCOUNTS } | null;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="lg" variant="subtle" leftIcon="plus" onClick={() => setOpen(true)}>
        New labor rate
      </Button>
      <NewLaborRateForm
        open={open}
        onClose={() => setOpen(false)}
        subtypes={subtypes}
        requireSubtypes={requireSubtypes}
        defaultTaxable
        quickbooks={quickbooks ?? undefined}
        existingNames={TAKEN_NAMES}
        onCreated={
          fails
            ? () => false
            : slow
              ? () => new Promise<void>((resolve) => setTimeout(resolve, 2500))
              : undefined
        }
        breakpoint={breakpoint}
      />
      {/* The form's toasts need a mounted Toaster. */}
      <Toaster breakpoint={breakpoint} />
    </>
  );
};

export const Desktop: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" />,
};

export const Mobile: Story = {
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo breakpoint="mobile" />
    </DeviceFrame>
  ),
};

/**
 * A company that requires a subtype and writes exactly one: there is nothing
 * to choose, so the field is read-only with that subtype, and says why.
 */
export const OneSubtype: Story = {
  name: "One Required Subtype",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" subtypes={[LABOR_SUBTYPES[0]]} />,
};

/**
 * The company does NOT require a subtype: the form asks required fields only,
 * so there is no Subtype field. A subtype can be set later in the side panel.
 */
export const SubtypeNotRequired: Story = {
  name: "Subtype Not Required",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" requireSubtypes={false} />,
};

/** A company with no subtypes at all — the field is not rendered. */
export const NoSubtypes: Story = {
  name: "No Subtypes",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" subtypes={[]} />,
};

/**
 * Only one income account is synced: the Revenue account field is read-only
 * with that account, and the form saves it.
 */
export const OneAccount: Story = {
  name: "One QuickBooks Account",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" quickbooks={{ accounts: [QUICKBOOKS_ACCOUNTS[0]] }} />,
};

/** No QuickBooks Desktop detailed scheme — no revenue account field. */
export const NoQuickBooks: Story = {
  name: "No QuickBooks",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" quickbooks={null} />,
};

/**
 * A slow create, so the in-flight state can be seen: Create spins and keeps its
 * width, Cancel and the ✕ are disabled, and the dialog ignores the scrim, the
 * Escape key and the mobile swipe until the request answers.
 */
export const Creating: Story = {
  name: "Creating",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" slow />,
};

/** Create fails — the error toast, and the form keeps what was typed. */
export const CreateFails: Story = {
  name: "Create Fails",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" fails />,
};
