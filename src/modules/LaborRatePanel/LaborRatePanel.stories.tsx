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

// The "Labor rate" side panel (Figma file qhebbfbPHDVnv8IF1EC7Zg, page "Labor
// Rate" → Side Panel). One module every labor rate uses: the caller hands over
// the record, the panel renders the six display modules — General · Pricing ·
// Labels · Description · Internal notes · Accounting.
//
// Demo rates out of the database, each one a case the panel draws:
//   after-hours-labor     ACTIVE and synced, every module filled.
//   rev-walk-in-call      REVIEW — system-minted from a free-text line item,
//                         so no creator, no subtype and no account: the
//                         modules warn, and Confirm waits for them.
//   boiler-descale        INACTIVE — read-only, with the Reactivate banner.
//   standard-labor        imported from QuickBooks Desktop: no creator.
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
const IMPORTED = laborItemById("standard-labor")!;
const UNKNOWN_CREATOR = laborItemById("helper-labor")!;
const NOT_SYNCED = laborItemById("fryer-service")!;
/** Billed on every visit's first hour — the rate with the longest History. */
const DIAGNOSTIC = laborItemById("diagnostic-labor")!;
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
  requireSubtypes = false,
  permissions,
  fails = false,
}: {
  record: LaborItem;
  breakpoint: "desktop" | "mobile";
  isLoading?: boolean;
  state?: "content" | "error" | "offline";
  accounting?: boolean;
  /** The company requires a subtype — a rate without one then warns. */
  requireSubtypes?: boolean;
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
        requireSubtypes={requireSubtypes}
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
 * An unvetted item: the amber Review status, no context menu, a footer with
 * Delete + Confirm — and every module editable, so the user can add what the
 * item lacks. The system minted it from a line item, so it has no creator, no
 * subtype and no revenue account: General and Accounting show their "Warning"
 * state, and Confirm "stays disabled until all required values provided". Add
 * both through the pens and Confirm turns on. (Accounting drops its sync rows
 * here, and General its "Last modified".)
 */
export const Review: Story = {
  name: '"Review" Status',
  parameters: { layout: "centered" },
  render: () => <Demo record={REVIEW} breakpoint="desktop" requireSubtypes />,
};

export const ReviewMobile: Story = {
  name: '"Review" Status Mobile',
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo record={REVIEW} breakpoint="mobile" requireSubtypes />
    </DeviceFrame>
  ),
};

/**
 * A rate billed on many jobs — open the "History" tab: completed jobs not yet
 * invoiced, and every non-draft invoice, newest first, filterable to one kind.
 */
export const History: Story = {
  name: '"History" Tab',
  parameters: { layout: "centered" },
  render: () => <Demo record={DIAGNOSTIC} breakpoint="desktop" />,
};

/**
 * Inactive: read-only. Every pen and the context menu are gone, the footer
 * offers Reactivate on every tab, and the two copy buttons stay.
 */
export const Inactive: Story = {
  name: '"Inactive" Status',
  parameters: { layout: "centered" },
  render: () => <Demo record={INACTIVE} breakpoint="desktop" />,
};

/**
 * The "General" module on its own, in its three "Created by" cases (node
 * 24-4654): a user with their round photo; "QuickBooks Desktop" with the square brand
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
        ["Imported from QuickBooks Desktop", IMPORTED],
        ["Unknown creator", UNKNOWN_CREATOR],
        ["Warning — the company requires a subtype", REVIEW],
      ]}
      render={(record) => <GeneralModule rate={record} onEdit={noop} missingSubtype={record === REVIEW} />}
    />
  ),
};

/**
 * The "Pricing" module on its own (node 3015-4365). An hourly item carries the
 * "/hr" suffix on both money rows; a flat one carries none.
 */
export const Pricing: Story = {
  name: '"Pricing" Module',
  parameters: { layout: "centered" },
  render: () => (
    <ModuleColumn
      items={[
        ["Hourly", ACTIVE],
        ["Flat — no suffix", FLAT_RATE],
      ]}
      render={(record) => <PricingModule rate={record} onEdit={noop} />}
    />
  ),
};

/**
 * The "Accounting" module on its own (node 25-5031). Its last two rows are
 * conditional: "Last sync" needs a value, and both are dropped in Review —
 * production never pushes an unconfirmed item. No revenue account is the
 * module's "Warning" state, in any status.
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
        ["Review — no account: Warning, no sync rows", REVIEW],
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

/** Every save and action reports failure — the designed "Couldn't …" toasts. */
export const ActionsFail: Story = {
  name: "Actions Fail",
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" fails />,
};

// The error / offline states are SidePanel's own behavior, documented and
// demonstrated on that component's page — the panel only forwards `state` and
// `onRetry`. No story here, so the two cannot drift (Daniel, 2026-09-29).
