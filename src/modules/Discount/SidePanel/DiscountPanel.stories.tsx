import { ReactNode, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../../components/Button/Button";
import Toaster from "../../../components/Toast/Toaster";
import { ChargeItem, DISCOUNT_ITEMS, DISCOUNT_LABELS, LABOR_ITEMS, OTHER_ITEMS, PRODUCT_ITEMS } from "../../../data/db";
import { cap, DeviceFrame, noop } from "../../../stories/helpers";

import GeneralModule from "./modules/GeneralModule";
import PricingModule from "./modules/PricingModule";
import DiscountPanel from "./DiscountPanel";
import { DiscountPermissions } from "./DiscountPanel.types";

// The "Discount" side panel (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "↳ Discount" → Side Panel 3251-77853). One module every discount uses:
// Details (General · Pricing · Labels · Description · Internal notes · Info),
// Accounting and History.
//
// Demo discounts out of the database:
//   disc-contract-labor   ACTIVE and synced, every module filled.
//   disc-rev-manager      REVIEW — system-minted, so no creator, no subtype
//                         and no account: the modules warn, Confirm waits.
//   disc-grand-opening    INACTIVE — read-only, with Reactivate.
//
// The Labels, Description, Internal notes, Info, Accounting and History
// modules are the pricebook's SHARED ones — their own states are on the Labor
// rate and Product panel pages, not repeated here.
const meta: Meta = {
  title: "Modules/Pricebook Items/Discount/Side Panel",
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const byId = (id: string) => DISCOUNT_ITEMS.find((row) => row.id === id)!;

const ACTIVE = byId("disc-contract-labor");
const REVIEW = byId("disc-rev-manager");
const INACTIVE = byId("disc-grand-opening");
/** A $0 discount — allowed (Daniel, 2026-11-23). */
const ZERO = byId("disc-rev-adjustment");

const LABEL_POOL = DISCOUNT_LABELS.map((label) => label.name);
/** Production's names are unique across the WHOLE pricebook. */
const TAKEN_NAMES = [...DISCOUNT_ITEMS, ...OTHER_ITEMS, ...LABOR_ITEMS, ...PRODUCT_ITEMS].map((row) => row.name);

/** A module shown on its own, at the width it has inside the panel, with a caption per variation. */
const ModuleColumn = ({ items, render }: { items: [string, ChargeItem][]; render: (record: ChargeItem) => ReactNode }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 368 }}>
    {items.map(([caption, record]) => (
      <div key={caption} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={cap}>{caption}</span>
        {render(record)}
      </div>
    ))}
  </div>
);

/** The name → id map the Labels picker's result is written back through. */
const labelIdsOf = (names: string[]): string[] => DISCOUNT_LABELS.filter((label) => names.includes(label.name)).map((label) => label.id);

const Demo = ({
  record,
  breakpoint,
  isLoading,
  accounting = true,
  requireSubtypes = false,
  permissions,
  fails = false,
}: {
  record: ChargeItem;
  breakpoint: "desktop" | "mobile";
  isLoading?: boolean;
  accounting?: boolean;
  /** The company requires a subtype — a discount without one then warns. */
  requireSubtypes?: boolean;
  permissions?: DiscountPermissions;
  /** Every action reports failure — the designed error toasts. */
  fails?: boolean;
}) => {
  const [discount, setDiscount] = useState<ChargeItem>(record);
  const [open, setOpen] = useState(true);

  const edit = (changes: Partial<ChargeItem>) => (fails ? false : void setDiscount((prev) => ({ ...prev, ...changes })));

  return (
    <>
      <Button size="lg" variant="subtle" onClick={() => setOpen(true)}>
        Open discount
      </Button>
      <DiscountPanel
        open={open}
        onClose={() => setOpen(false)}
        discount={discount}
        labelPool={LABEL_POOL}
        existingNames={TAKEN_NAMES}
        hasQuickbooksAccounting={accounting}
        requireSubtypes={requireSubtypes}
        permissions={permissions}
        isLoading={isLoading}
        breakpoint={breakpoint}
        onSaveGeneral={(edits) => edit(edits)}
        onSavePricing={(edits) => edit(edits)}
        onSaveAccounting={(quickbooksAccountId) => edit({ quickbooksAccountId })}
        onSaveLabels={(labels) => edit({ labelIds: labelIdsOf(labels) })}
        onSaveDescription={(summary) => edit({ summary })}
        onSaveNotes={(notes) => edit({ notes })}
        onDeactivate={() => edit({ isActive: false })}
        onReactivate={() => edit({ isActive: true })}
        onConfirm={() => edit({ status: "active" })}
        onDelete={() => (fails ? false : setOpen(false))}
      />
      <Toaster breakpoint={breakpoint} />
    </>
  );
};

export const Desktop: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" requireSubtypes />,
};

export const Mobile: Story = {
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo record={ACTIVE} breakpoint="mobile" requireSubtypes />
    </DeviceFrame>
  ),
};

/**
 * An unvetted discount: the amber Review status, no context menu, a footer
 * with Delete + Confirm — and every module editable. It has no subtype and no
 * revenue account, so General and Accounting warn and Confirm stays disabled.
 */
export const Review: Story = {
  name: '"Review" Status',
  parameters: { layout: "centered" },
  render: () => <Demo record={REVIEW} breakpoint="desktop" requireSubtypes />,
};

/** Inactive: read-only. Every pen and the context menu are gone, and the footer offers Reactivate. */
export const Inactive: Story = {
  name: '"Inactive" Status',
  parameters: { layout: "centered" },
  render: () => <Demo record={INACTIVE} breakpoint="desktop" requireSubtypes />,
};

/** The "General" module on its own — and its "Warning" state when a required subtype is missing. */
export const General: Story = {
  name: '"General" Module',
  parameters: { layout: "centered" },
  render: () => (
    <ModuleColumn
      items={[
        ["Default", ACTIVE],
        ["Warning — the company requires a subtype", REVIEW],
      ]}
      render={(record) => <GeneralModule discount={record} onEdit={noop} missingSubtype={record === REVIEW} />}
    />
  ),
};

/** The "Pricing" module on its own (Shared Modules → Pricing → Discount): one row, the stored negative amount. */
export const Pricing: Story = {
  name: '"Pricing" Module',
  parameters: { layout: "centered" },
  render: () => (
    <ModuleColumn
      items={[
        ["Discount", ACTIVE],
        ["$0.00 — allowed", ZERO],
      ]}
      render={(record) => <PricingModule discount={record} onEdit={noop} />}
    />
  ),
};

/** No QuickBooks Desktop on the Detailed Split setup: the "Accounting" tab is gone. */
export const NoAccounting: Story = {
  name: "No QuickBooks Accounting",
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" accounting={false} />,
};

/** A user with none of the three pricebook permissions: every pen, the menu and both Review actions disappear. */
export const NoPermissions: Story = {
  name: "No Permissions",
  parameters: { layout: "centered" },
  render: () => <Demo record={REVIEW} breakpoint="desktop" permissions={{ edit: false, deactivate: false, remove: false }} />,
};

/** Every module body renders skeletons and every action button is hidden. */
export const Loading: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" isLoading />,
};

/** Every save and action reports failure — the designed "Couldn't …" toasts. */
export const ActionsFail: Story = {
  name: "Actions Fail",
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" fails />,
};
