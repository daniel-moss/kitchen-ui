import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../../components/Button/Button";
import Toaster from "../../../components/Toast/Toaster";
import { COMPANY, OTHER_ITEMS, OTHER_SUBTYPES, QUICKBOOKS_ACCOUNTS } from "../../../data/db";
import { DeviceFrame } from "../../../stories/helpers";

import NewOtherChargeForm from "./NewOtherChargeForm";
import { NewOtherChargeFormProps } from "./NewOtherChargeForm.types";

// The other charge "Create" form (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "↳ Other Charges" → "Create" Form 3249-72815): only the required fields, in a
// Dialog, shared by every flow that adds an other charge — the Pricebook's
// Other charges list, and the "Add charge" footer of the Other charges list on
// a job, estimate or invoice.
//
// Subtypes, the taken names and the QuickBooks accounts come from the demo
// database, so every check is live: type "Trip charge" into Name to see the
// duplicate error.
const meta: Meta = {
  title: 'Modules/Pricebook Items/Other Charge/"Create" Form',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const TAKEN_NAMES = OTHER_ITEMS.map((item) => item.name);
/** The demo company's QuickBooks Desktop (Detailed Split) setup. */
const QUICKBOOKS: NewOtherChargeFormProps["quickbooks"] = { accounts: QUICKBOOKS_ACCOUNTS };

const Demo = ({
  breakpoint,
  subtypes = OTHER_SUBTYPES,
  requireSubtypes = false,
  useTaxes = true,
  quickbooks = QUICKBOOKS,
  fails = false,
}: {
  breakpoint: "desktop" | "mobile";
  subtypes?: typeof OTHER_SUBTYPES;
  requireSubtypes?: boolean;
  useTaxes?: boolean;
  quickbooks?: NewOtherChargeFormProps["quickbooks"] | null;
  /** Create reports failure — the error toast, with the form left as it was. */
  fails?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="lg" variant="subtle" leftIcon="plus" onClick={() => setOpen(true)}>
        New other charge
      </Button>
      <NewOtherChargeForm
        open={open}
        onClose={() => setOpen(false)}
        subtypes={subtypes}
        requireSubtypes={requireSubtypes}
        useTaxes={useTaxes}
        defaultIsTaxable={COMPANY.pricebookDefaultTaxableOther}
        quickbooks={quickbooks ?? undefined}
        existingNames={TAKEN_NAMES}
        onCreated={() => (fails ? false : undefined)}
        breakpoint={breakpoint}
      />
      <Toaster breakpoint={breakpoint} />
    </>
  );
};

/** The Figma frame: a required subtype, taxes on, QuickBooks Desktop on. */
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
  render: () => <Demo breakpoint="desktop" requireSubtypes subtypes={OTHER_SUBTYPES.slice(0, 1)} />,
};

/** Subtypes are optional for this company — the field is not shown; it is set later in the side panel. */
export const OptionalSubtype: Story = {
  name: "Optional Subtype",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" />,
};

/** A company that charges no tax — Taxability disappears with it. */
export const NoTaxes: Story = {
  name: "No Taxes",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" requireSubtypes useTaxes={false} />,
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
