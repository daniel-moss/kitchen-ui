import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../../components/Button/Button";
import Toaster from "../../../components/Toast/Toaster";
import {
  COMPANY,
  INVENTORY_LOCATIONS,
  PRODUCT_ITEMS,
  PRODUCT_SUBTYPES,
  QUICKBOOKS_ACCOUNTS,
  QUICKBOOKS_ASSET_ACCOUNTS,
  QUICKBOOKS_COGS_ACCOUNTS,
} from "../../../data/db";
import { DeviceFrame } from "../../../stories/helpers";

import NewProductForm from "./NewProductForm";
import { NewProductFormProps } from "./NewProductForm.types";

// The product "Create" form (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "Product" → "Create" Form 3167-7253): only the required fields, in a Dialog,
// shared by every flow that adds a product — the Pricebook's Products list,
// and the on-the-fly create from a job, estimate, invoice or purchase order
// line.
//
// Subtypes, the taken names, the inventory locations and the QuickBooks
// accounts all come from the demo database, so every check is live:
//
//   · type "Defrost timer" into Name to see the duplicate error;
//   · pick "Inventory" as the Stock type, and the Cost of goods and Inventory
//     asset accounts appear, opened on the company's defaults.
//
// The form before the 2026-11-16 redesign — vendors, scanner, inventory
// levels and the rest — is '[Archive] "Create" Form'.
const meta: Meta = {
  title: 'Modules/Pricebook Items/Product/"Create" Form',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const TAKEN_NAMES = PRODUCT_ITEMS.map((item) => item.name);
/** The demo company's inventory + QuickBooks Desktop (Detailed Split) setup. */
const INVENTORY: NewProductFormProps["inventory"] = {
  locations: INVENTORY_LOCATIONS,
  defaultTrackInventory: COMPANY.defaultTrackInventory,
};
const QUICKBOOKS: NewProductFormProps["quickbooks"] = {
  revenueAccounts: QUICKBOOKS_ACCOUNTS,
  cogsAccounts: QUICKBOOKS_COGS_ACCOUNTS,
  assetAccounts: QUICKBOOKS_ASSET_ACCOUNTS,
  defaultCogsAccountId: COMPANY.quickbooksDefaultCogsAccountId,
  defaultAssetAccountId: COMPANY.quickbooksDefaultAssetAccountId,
};

const Demo = ({
  breakpoint,
  subtypes = PRODUCT_SUBTYPES,
  requireSubtypes = false,
  cannotClassifySubtypes = false,
  useTaxes = true,
  inventory = INVENTORY,
  quickbooks = QUICKBOOKS,
  fails = false,
}: {
  breakpoint: "desktop" | "mobile";
  subtypes?: typeof PRODUCT_SUBTYPES;
  requireSubtypes?: boolean;
  cannotClassifySubtypes?: boolean;
  useTaxes?: boolean;
  inventory?: NewProductFormProps["inventory"] | null;
  quickbooks?: NewProductFormProps["quickbooks"] | null;
  /** Create reports failure — the error toast, with the form left as it was. */
  fails?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="lg" variant="subtle" leftIcon="plus" onClick={() => setOpen(true)}>
        New product
      </Button>
      <NewProductForm
        open={open}
        onClose={() => setOpen(false)}
        subtypes={subtypes}
        requireSubtypes={requireSubtypes}
        cannotClassifySubtypes={cannotClassifySubtypes}
        useTaxes={useTaxes}
        defaultIsTaxable={COMPANY.pricebookDefaultTaxableProduct}
        inventory={inventory ?? undefined}
        quickbooks={quickbooks ?? undefined}
        existingNames={TAKEN_NAMES}
        onCreated={() => (fails ? false : undefined)}
        breakpoint={breakpoint}
      />
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

/** The company requires a subtype, and has exactly one — it is chosen and read-only. */
export const OneRequiredSubtype: Story = {
  name: "One Required Subtype",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" requireSubtypes subtypes={PRODUCT_SUBTYPES.slice(0, 1)} />,
};

/** Required, with the whole list: the field blocks Create until something is picked. */
export const RequiredSubtype: Story = {
  name: "Required Subtype",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" requireSubtypes />,
};

/** Required, but the company has no subtypes — the field is not shown. */
export const NoSubtypes: Story = {
  name: "No Subtypes",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" requireSubtypes subtypes={[]} />,
};

/** A company that charges no tax — Taxability disappears with it. */
export const NoTaxes: Story = {
  name: "No Taxes",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" useTaxes={false} />,
};

/** No ACTIVE inventory location: Stock type is locked on Non-inventory, whatever the default says. */
export const NoInventoryLocations: Story = {
  name: "No Inventory Locations",
  parameters: { layout: "centered" },
  render: () => (
    <Demo
      breakpoint="desktop"
      inventory={{ locations: INVENTORY_LOCATIONS.filter((location) => !location.isActive), defaultTrackInventory: true }}
    />
  ),
};

/** No QuickBooks Desktop on the Detailed Split setup — no account fields. */
export const NoQuickbooks: Story = {
  name: "No QuickBooks",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" quickbooks={null} />,
};

/** Create reports failure: the error toast, and the form keeps every value. */
export const CreateFails: Story = {
  name: "Create Fails",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" fails />,
};

/** QuickBooks Desktop (Detailed Split) with no income account synced yet: the Prompt replaces the form. */
export const NoSyncedAccounts: Story = {
  name: '"No Synced Accounts" Prompt',
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" quickbooks={{ ...QUICKBOOKS, revenueAccounts: [] }} />,
};

/** The user can't classify subtypes, and the company requires one of 2+: the Prompt replaces the form. */
export const CantClassifySubtypes: Story = {
  name: '"Can\'t Classify Subtypes" Prompt',
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" requireSubtypes cannotClassifySubtypes />,
};
