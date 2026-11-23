import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../../components/Button/Button";
import Toaster from "../../../components/Toast/Toaster";
import { DISCOUNT_ITEMS, DISCOUNT_SUBTYPES, QUICKBOOKS_ACCOUNTS } from "../../../data/db";
import { DeviceFrame } from "../../../stories/helpers";

import NewDiscountForm from "./NewDiscountForm";
import { NewDiscountFormProps } from "./NewDiscountForm.types";

// The discount "Create" form (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "↳ Discount" → "Create" Form 3251-77813): only the required fields, in a
// Dialog — the Pricebook's Discounts list, and "Add discount" in the Discounts
// list on a job, estimate or invoice.
//
// Type "Referral credit" into Name to see the duplicate error.
const meta: Meta = {
  title: 'Modules/Pricebook Items/Discount/"Create" Form',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const TAKEN_NAMES = DISCOUNT_ITEMS.map((item) => item.name);
const QUICKBOOKS: NewDiscountFormProps["quickbooks"] = { accounts: QUICKBOOKS_ACCOUNTS };

const Demo = ({
  breakpoint,
  subtypes = DISCOUNT_SUBTYPES,
  requireSubtypes = false,
  cannotClassifySubtypes = false,
  quickbooks = QUICKBOOKS,
  fails = false,
}: {
  breakpoint: "desktop" | "mobile";
  subtypes?: typeof DISCOUNT_SUBTYPES;
  requireSubtypes?: boolean;
  /** The user has the "can't classify subtypes" flag. */
  cannotClassifySubtypes?: boolean;
  quickbooks?: NewDiscountFormProps["quickbooks"] | null;
  /** Create reports failure — the error toast, with the form left as it was. */
  fails?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="lg" variant="subtle" leftIcon="plus" onClick={() => setOpen(true)}>
        New discount
      </Button>
      <NewDiscountForm
        open={open}
        onClose={() => setOpen(false)}
        subtypes={subtypes}
        requireSubtypes={requireSubtypes}
        cannotClassifySubtypes={cannotClassifySubtypes}
        quickbooks={quickbooks ?? undefined}
        existingNames={TAKEN_NAMES}
        onCreated={() => (fails ? false : undefined)}
        breakpoint={breakpoint}
      />
      <Toaster breakpoint={breakpoint} />
    </>
  );
};

/** The Figma frame: a required subtype, QuickBooks Desktop on. */
export const Desktop: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" requireSubtypes />,
};

export const Mobile: Story = {
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo breakpoint="mobile" requireSubtypes />
    </DeviceFrame>
  ),
};

/** The company requires a subtype, and has exactly one — it is chosen and read-only. */
export const OneRequiredSubtype: Story = {
  name: "One Required Subtype",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" requireSubtypes subtypes={DISCOUNT_SUBTYPES.slice(0, 1)} />,
};

/** Subtypes are optional for this company — the field is not shown; it is set later in the side panel. */
export const OptionalSubtype: Story = {
  name: "Optional Subtype",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" />,
};

/** No QuickBooks Desktop on the Detailed Split setup — no Revenue account field. */
export const NoQuickbooks: Story = {
  name: "No QuickBooks",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" requireSubtypes quickbooks={null} />,
};

/** Create reports failure: the error toast, and the form keeps every value. */
export const CreateFails: Story = {
  name: "Create Fails",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" requireSubtypes fails />,
};

/** QuickBooks Desktop (Detailed Split) with no income account synced yet: the Prompt replaces the form. */
export const NoSyncedAccounts: Story = {
  name: '"No Synced Accounts" Prompt',
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" quickbooks={{ accounts: [] }} />,
};

/** The user can't classify subtypes, and the company requires one of 2+: the Prompt replaces the form. */
export const CantClassifySubtypes: Story = {
  name: '"Can\'t Classify Subtypes" Prompt',
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" requireSubtypes cannotClassifySubtypes />,
};
