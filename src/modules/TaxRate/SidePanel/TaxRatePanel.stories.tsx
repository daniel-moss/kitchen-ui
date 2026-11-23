import { ReactNode, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../../components/Button/Button";
import Toaster from "../../../components/Toast/Toaster";
import { TAX_RATE_ITEMS, TAX_RATE_LABELS, TaxRateItem } from "../../../data/db";
import { cap, DeviceFrame, noop } from "../../../stories/helpers";
import AccountingModule from "../../shared/AccountingModule";

import PricingModule from "./modules/PricingModule";
import { accountingOf } from "./taxRateData";
import TaxRatePanel from "./TaxRatePanel";
import { TaxRatePermissions } from "./TaxRatePanel.types";

// The "Tax rate" side panel (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "↳ Tax Rate" → Side Panel 3254-80299). Two tabs: Details (General · Pricing
// · Labels · Description · Internal notes · Info) and Accounting (the shared
// module's tax rate mode — "Tax collection agency"). No History tab.
//
// The demo rates come from the database; the Review and Inactive ones are the
// first rows of their state, and "No agency" is a confirmed rate with its
// agency cleared — the Accounting "Warning".
const meta: Meta = {
  title: "Modules/Pricebook Items/Tax Rate/Side Panel",
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const ACTIVE = TAX_RATE_ITEMS.find((row) => row.isActive && row.status === "active" && row.quickbooksVendorId != null)!;
const REVIEW: TaxRateItem = { ...(TAX_RATE_ITEMS.find((row) => row.status === "review") ?? ACTIVE), status: "review", quickbooksVendorId: undefined };
const INACTIVE: TaxRateItem = { ...(TAX_RATE_ITEMS.find((row) => !row.isActive) ?? ACTIVE), isActive: false };
const NO_AGENCY: TaxRateItem = { ...ACTIVE, quickbooksVendorId: undefined };
/** "Tax exempt" — a real 0% rate. */
const ZERO = TAX_RATE_ITEMS.find((row) => row.rate === 0) ?? { ...ACTIVE, rate: 0 };

const LABEL_POOL = TAX_RATE_LABELS.map((label) => label.name);
const labelIdsOf = (names: string[]) => TAX_RATE_LABELS.filter((label) => names.includes(label.name)).map((label) => label.id);

/** A module shown on its own, at the width it has inside the panel, with a caption per variation. */
const ModuleColumn = ({ items, render }: { items: [string, TaxRateItem][]; render: (record: TaxRateItem) => ReactNode }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 368 }}>
    {items.map(([caption, record]) => (
      <div key={caption} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={cap}>{caption}</span>
        {render(record)}
      </div>
    ))}
  </div>
);

const Demo = ({
  record,
  breakpoint,
  isLoading,
  accounting = true,
  permissions,
  fails = false,
}: {
  record: TaxRateItem;
  breakpoint: "desktop" | "mobile";
  isLoading?: boolean;
  accounting?: boolean;
  permissions?: TaxRatePermissions;
  /** Every action reports failure — the designed error toasts. */
  fails?: boolean;
}) => {
  const [rate, setRate] = useState<TaxRateItem>(record);
  const [open, setOpen] = useState(true);
  const edit = (changes: Partial<TaxRateItem>) => (fails ? false : void setRate((prev) => ({ ...prev, ...changes })));

  return (
    <>
      <Button size="lg" variant="subtle" onClick={() => setOpen(true)}>
        Open tax rate
      </Button>
      <TaxRatePanel
        open={open}
        onClose={() => setOpen(false)}
        rate={rate}
        labelPool={LABEL_POOL}
        existingNames={TAX_RATE_ITEMS.map((row) => row.name)}
        hasQuickbooksAccounting={accounting}
        permissions={permissions}
        isLoading={isLoading}
        breakpoint={breakpoint}
        onSaveGeneral={(edits) => edit(edits)}
        onSavePricing={(edits) => edit(edits)}
        onSaveAccounting={(quickbooksVendorId) => edit({ quickbooksVendorId })}
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

/** Review with no agency: the Accounting tab warns, and Confirm stays disabled until one is chosen. */
export const Review: Story = {
  name: '"Review" Status',
  parameters: { layout: "centered" },
  render: () => <Demo record={REVIEW} breakpoint="desktop" />,
};

/** Inactive: read-only, no menu, Reactivate in the footer. */
export const Inactive: Story = {
  name: '"Inactive" Status',
  parameters: { layout: "centered" },
  render: () => <Demo record={INACTIVE} breakpoint="desktop" />,
};

/** The "Pricing" module on its own: one row, the percentage — 0% included. */
export const Pricing: Story = {
  name: '"Pricing" Module',
  parameters: { layout: "centered" },
  render: () => (
    <ModuleColumn
      items={[
        ["Percentage", ACTIVE],
        ["0.00% — allowed", ZERO],
      ]}
      render={(record) => <PricingModule rate={record} onEdit={noop} />}
    />
  ),
};

/** The "Accounting" module's tax rate mode: the agency, and its "Warning" when it is missing. */
export const Accounting: Story = {
  name: '"Accounting" Module',
  parameters: { layout: "centered" },
  render: () => (
    <ModuleColumn
      items={[
        ["Tax collection agency", ACTIVE],
        ["Warning — no agency", NO_AGENCY],
      ]}
      render={(record) => <AccountingModule accounting={accountingOf(record)} isTaxRate onEdit={noop} />}
    />
  ),
};

/** No QuickBooks Desktop: the "Accounting" tab is gone. */
export const NoAccounting: Story = {
  name: "No QuickBooks Accounting",
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" accounting={false} />,
};

/** No pricebook permissions: every pen, the menu and both Review actions disappear. */
export const NoPermissions: Story = {
  name: "No Permissions",
  parameters: { layout: "centered" },
  render: () => <Demo record={REVIEW} breakpoint="desktop" permissions={{ edit: false, deactivate: false, remove: false }} />,
};

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
