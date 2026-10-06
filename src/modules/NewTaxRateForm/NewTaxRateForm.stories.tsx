import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../components/Button/Button";
import Toaster from "../../components/Toast/Toaster";
import { QUICKBOOKS_VENDORS, TAX_RATE_LABELS } from "../../data/db";
import { DeviceFrame } from "../../stories/helpers";

import NewTaxRateForm from "./NewTaxRateForm";

// The reusable "New tax rate" form (Figma file "New Tax Rate Form — Current
// Version", section 1-7817) — assembled from DS components and shared by every
// flow that adds a tax rate (the Pricebook's Tax rates list, and the on-the-fly
// create from an invoice or estimate).
//
// Labels and QuickBooks vendors both come from the demo database. The vendor
// list is what makes the two QuickBooks pieces appear: the workspace is on
// QuickBooks Desktop, where production REQUIRES a tax rate to name the agency
// it is collected for.
const meta: Meta = {
  title: 'Modules/Tax Rate/"New Tax Rate" Form',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const LABEL_POOL = TAX_RATE_LABELS.map((label) => label.name);

const Demo = ({
  breakpoint,
  fails = false,
  quickbooks = true,
}: {
  breakpoint: "desktop" | "mobile";
  /** Create reports failure — the designed error toast. */
  fails?: boolean;
  /** Whether the company is on QuickBooks Desktop. */
  quickbooks?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="lg" variant="subtle" leftIcon="plus" onClick={() => setOpen(true)}>
        New tax rate
      </Button>
      <NewTaxRateForm
        open={open}
        onClose={() => setOpen(false)}
        labelPool={LABEL_POOL}
        quickbooksVendors={quickbooks ? QUICKBOOKS_VENDORS : undefined}
        // Returning false is how a caller reports a failed create — it shows
        // the designed error toast and keeps the form open.
        onCreated={fails ? () => false : undefined}
        onPreview={() => {}}
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
 * A company with no accounting integration: the QuickBooks notice and the
 * "QuickBooks tax collection agency" field are both gone, leaving the four
 * fields every company fills.
 */
export const NoQuickBooks: Story = {
  name: "No QuickBooks Integration",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" quickbooks={false} />,
};

/** Create fails — the error toast, and the form keeps what was typed. */
export const CreateFails: Story = {
  name: "Create Fails",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" fails />,
};
