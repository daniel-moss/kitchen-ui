import { ReactNode, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../components/Button/Button";
import Toaster from "../../components/Toast/Toaster";
import { LABOR_ITEMS, LABOR_LABELS, LaborItem, laborItemById } from "../../data/db";
import { cap, DeviceFrame, noop } from "../../stories/helpers";

import AccountingModule from "./modules/AccountingModule";
import GeneralModule from "./modules/GeneralModule";
import PricingModule from "./modules/PricingModule";
import { laborRateStatusOf } from "./laborRateData";
import LaborRatePanel from "./LaborRatePanel";
import { LaborRatePermissions } from "./LaborRatePanel.types";

// The "Labor rate" side panel (Figma '"Labor Rate" Side Panel — Next Update',
// page "➡️ Designs"). One module every labor rate uses: the caller hands over
// the record, the panel renders the six display modules — General · Pricing ·
// Labels · Description · Internal notes · Accounting.
//
// Eight demo rates out of the database, each one a case the panel draws:
//   after-hours-labor     ACTIVE and synced, every module filled.
//   rev-walk-in-call      REVIEW — system-minted from a free-text line item,
//                         so no creator, no subtype, no account and nothing
//                         editable.
//   boiler-descale        INACTIVE — read-only, with the Reactivate banner.
//   installation-labor    a FIXED markup ($50 + $100 = $150).
//   refrigerant-recovery  a PERCENT markup ($80 × 2.75 = $220).
//   standard-labor        imported from QuickBooks: no creator, no subtype.
//   helper-labor          "Unknown" creator (an onboarding load), never synced.
//   fryer-service         edited since its last sync — the "Not synced" case.
const meta: Meta = {
  title: 'Modules/Labor Rate/"Labor Rate" Side Panel',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const ACTIVE = laborItemById("after-hours-labor")!;
const REVIEW = laborItemById("rev-walk-in-call")!;
const INACTIVE = laborItemById("boiler-descale")!;
const FIXED_MARKUP = laborItemById("installation-labor")!;
const PERCENT_MARKUP = laborItemById("refrigerant-recovery")!;
const IMPORTED = laborItemById("standard-labor")!;
const UNKNOWN_CREATOR = laborItemById("helper-labor")!;
const NOT_SYNCED = laborItemById("fryer-service")!;
/** A flat-rate item, so the "/hr" suffix has its counter-example. */
const FLAT_RATE = laborItemById("emergency-call-out")!;

const LABEL_POOL = LABOR_LABELS.map((label) => label.name);

/**
 * A module shown on its own, at the width it has inside the panel (400px minus
 * the body's 16px sides), with a caption per variation.
 */
const ModuleColumn = ({
  items,
  render,
}: {
  items: [string, LaborItem][];
  render: (record: LaborItem) => ReactNode;
}) => (
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
const labelIdsOf = (names: string[]): string[] =>
  LABOR_LABELS.filter((label) => names.includes(label.name)).map((label) => label.id);

const Demo = ({
  record,
  breakpoint,
  isLoading,
  state,
  accounting = true,
  permissions,
  fails = false,
}: {
  record: LaborItem;
  breakpoint: "desktop" | "mobile";
  isLoading?: boolean;
  state?: "content" | "error" | "offline";
  accounting?: boolean;
  permissions?: LaborRatePermissions;
  /** Every action reports failure — the designed error toasts. */
  fails?: boolean;
}) => {
  // The panel holds no record of its own — the caller is the source of truth,
  // so every save lands here.
  const [rate, setRate] = useState<LaborItem>(record);
  const [open, setOpen] = useState(true);

  const edit = (changes: Partial<LaborItem>) => (fails ? false : void setRate((prev) => ({ ...prev, ...changes })));

  return (
    <>
      <Button size="lg" variant="subtle" onClick={() => setOpen(true)}>
        Open labor rate
      </Button>
      <LaborRatePanel
        open={open}
        onClose={() => setOpen(false)}
        rate={rate}
        labelPool={LABEL_POOL}
        existingNames={LABOR_ITEMS.map((row) => row.name)}
        hasQuickbooksAccounting={accounting}
        permissions={permissions}
        isLoading={isLoading}
        state={state}
        breakpoint={breakpoint}
        onSaveGeneral={(edits) => edit(edits)}
        onSavePricing={(edits) => edit(edits)}
        onSaveAccounting={(quickbooksAccountId) => edit({ quickbooksAccountId })}
        onSaveLabels={(labels) => edit({ labelIds: labelIdsOf(labels) })}
        onSaveSummary={(summary) => edit({ summary })}
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

/**
 * An unvetted item: the amber Review status, no context menu, NO pens at all,
 * and a footer with Delete + Confirm. Production confirms an item on every
 * save, so editing one here would accept it silently — Confirm is the only way
 * in. The Accounting module drops its sync rows, and the item has neither a
 * creator nor a revenue account: the system minted it from a line item.
 */
export const Review: Story = {
  name: '"Review" Status',
  parameters: { layout: "centered" },
  render: () => <Demo record={REVIEW} breakpoint="desktop" />,
};

export const ReviewMobile: Story = {
  name: '"Review" Status Mobile',
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo record={REVIEW} breakpoint="mobile" />
    </DeviceFrame>
  ),
};

/**
 * Inactive: read-only. Every pen and the context menu are gone, the warning
 * banner offers Reactivate, and the two copy buttons stay.
 */
export const Inactive: Story = {
  name: '"Inactive" Status',
  parameters: { layout: "centered" },
  render: () => <Demo record={INACTIVE} breakpoint="desktop" />,
};

/**
 * The "General" module on its own, in its three "Created by" cases (node
 * 24-4654): a user with their round photo; "QuickBooks" with the square brand
 * tile — no creator plus a QuickBooks key, which is how every imported item
 * arrives; and the placeholder-colored "Unknown" with no avatar, for an item
 * loaded during onboarding or minted by the system. The last two also show the
 * "No Subtype" placeholder, since neither path carries one.
 */
export const General: Story = {
  name: '"General" Module',
  parameters: { layout: "centered" },
  render: () => (
    <ModuleColumn
      items={[
        ["Created by a user", ACTIVE],
        ["Imported from QuickBooks", IMPORTED],
        ["Unknown creator", UNKNOWN_CREATOR],
      ]}
      render={(record) => <GeneralModule rate={record} onEdit={noop} />}
    />
  ),
};

/**
 * The "Pricing" module on its own (node 3015-4365). The markup row appears
 * only under its own strategy, and the Rate is then derived from Cost — the
 * same sum production's database trigger runs. An hourly item carries the
 * "/hr" suffix on both money rows; a flat-rate one carries none.
 */
export const Pricing: Story = {
  name: '"Pricing" Module',
  parameters: { layout: "centered" },
  render: () => (
    <ModuleColumn
      items={[
        ["Manual price strategy", ACTIVE],
        ["Fixed markup", FIXED_MARKUP],
        ["Percent markup", PERCENT_MARKUP],
        ["Flat rate — no suffix", FLAT_RATE],
      ]}
      render={(record) => <PricingModule rate={record} onEdit={noop} />}
    />
  ),
};

/**
 * The "Accounting" module on its own (node 25-5031). Its last two rows are
 * conditional: "Last sync" needs a value, and both are dropped in Review —
 * production never pushes an unconfirmed item, so the status could only read
 * "Not synced". A Review item has no revenue account either.
 */
export const Accounting: Story = {
  name: '"Accounting" Module',
  parameters: { layout: "centered" },
  render: () => (
    <ModuleColumn
      items={[
        ["Synced", ACTIVE],
        ["Edited since the last sync", NOT_SYNCED],
        ["Never synced — no Last sync row", UNKNOWN_CREATOR],
        ["Review — no account, neither sync row", REVIEW],
      ]}
      render={(record) => (
        <AccountingModule rate={record} onEdit={noop} hideSyncStatus={laborRateStatusOf(record) === "review"} />
      )}
    />
  ),
};

/**
 * A company on the GENERIC line-item scheme (or with no QuickBooks Desktop at
 * all): the whole "Accounting" module is gone, because the revenue account
 * then lives in the company's settings instead of on the item.
 */
export const NoAccounting: Story = {
  name: "No QuickBooks Accounting",
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" accounting={false} />,
};

/**
 * A user with none of the three pricebook permissions: every pen, the context
 * menu and both Review actions disappear. Production HIDES these rather than
 * disabling them.
 */
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

/** Every save and action reports failure — the designed "Could not …" toasts. */
export const ActionsFail: Story = {
  name: "Actions Fail",
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" fails />,
};

// The error / offline states are SidePanel's own behavior, documented and
// demonstrated on that component's page — the panel only forwards `state` and
// `onRetry`. No story here, so the two cannot drift (Daniel, 2026-09-29).
