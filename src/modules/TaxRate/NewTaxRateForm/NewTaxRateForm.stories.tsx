import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../../components/Button/Button";
import Toaster from "../../../components/Toast/Toaster";
import { QUICKBOOKS_VENDORS, TAX_RATE_ITEMS } from "../../../data/db";
import { DeviceFrame } from "../../../stories/helpers";

import NewTaxRateForm from "./NewTaxRateForm";
import { NewTaxRateFormProps } from "./NewTaxRateForm.types";

// The tax rate "Create" form (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "↳ Tax Rate" → "Create" Form 3254-79932): only the required fields, in a
// Dialog. Type "SF sales tax" into Name to see the duplicate error, or 120 into
// Percentage and leave the field for "Can't be greater than 100%".
const meta: Meta = {
  title: 'Modules/Pricebook Items/Tax Rate/"Create" Form',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const TAKEN_NAMES = TAX_RATE_ITEMS.map((item) => item.name);
const QUICKBOOKS: NewTaxRateFormProps["quickbooks"] = { vendors: QUICKBOOKS_VENDORS };

const Demo = ({
  breakpoint,
  quickbooks = QUICKBOOKS,
  fails = false,
}: {
  breakpoint: "desktop" | "mobile";
  quickbooks?: NewTaxRateFormProps["quickbooks"] | null;
  /** Create reports failure — the error toast, with the form left as it was. */
  fails?: boolean;
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
        quickbooks={quickbooks ?? undefined}
        existingNames={TAKEN_NAMES}
        onCreated={() => (fails ? false : undefined)}
        breakpoint={breakpoint}
      />
      <Toaster breakpoint={breakpoint} />
    </>
  );
};

/** The Figma frame: QuickBooks Desktop on. */
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

/** One QuickBooks vendor: it is the value, read-only, "The only vendor synced from QuickBooks". */
export const OneVendor: Story = {
  name: "One Vendor",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" quickbooks={{ vendors: QUICKBOOKS_VENDORS.slice(0, 1) }} />,
};

/** No QuickBooks Desktop — no Tax collection agency field. */
export const NoQuickbooks: Story = {
  name: "No QuickBooks",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" quickbooks={null} />,
};

/** QuickBooks Desktop with no vendor synced yet: the Prompt replaces the form. */
export const NoSyncedVendors: Story = {
  name: '"No Synced Vendors" Prompt',
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" quickbooks={{ vendors: [] }} />,
};

/** Create reports failure: the error toast, and the form keeps every value. */
export const CreateFails: Story = {
  name: "Create Fails",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" fails />,
};
