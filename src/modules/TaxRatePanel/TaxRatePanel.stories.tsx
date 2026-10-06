import { ReactNode, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../components/Button/Button";
import Toaster from "../../components/Toast/Toaster";
import { TAX_RATE_LABELS, TaxRateItem, taxRateItemById } from "../../data/db";
import { cap, DeviceFrame, noop } from "../../stories/helpers";

import AccountingModule from "./modules/AccountingModule";
import GeneralDetailsModule from "./modules/GeneralDetailsModule";
import { taxRateStatusOf } from "./taxRateData";
import TaxRatePanel from "./TaxRatePanel";
import { TaxRatePermissions } from "./TaxRatePanel.types";

// The "Tax rate" side panel (Figma "Tax Rate Side Panel — Next Update", page
// "👍 Validated"). One module every tax rate uses: the caller hands over the
// record, the panel renders the five display modules — General details ·
// Accounting · Labels · Summary template · Internal notes.
//
// Five demo rates out of the database, each one a state the panel draws:
//   sf-sales          ACTIVE and synced, every module filled.
//   tax-rev-sales     REVIEW — imported from QuickBooks, so no creator, no
//                     labels, no summary and no notes (three empty states).
//   tax-sf-old        INACTIVE — read-only, with the Reactivate banner.
//   tax-labor-exempt  "Unknown" creator (an onboarding load) and never synced.
//   tax-marin         Edited since its last sync — the other "Not synced" case.
const meta: Meta = {
  title: 'Modules/Tax Rate/"Tax Rate" Side Panel',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const ACTIVE = taxRateItemById("sf-sales")!;
const REVIEW = taxRateItemById("tax-rev-sales")!;
const INACTIVE = taxRateItemById("tax-sf-old")!;
const UNKNOWN_CREATOR = taxRateItemById("tax-labor-exempt")!;
const NOT_SYNCED = taxRateItemById("tax-marin")!;

const LABEL_POOL = TAX_RATE_LABELS.map((label) => label.name);

/**
 * A module shown on its own, at the width it has inside the panel (400px minus
 * the body's 16px sides), with a caption per variation.
 */
const ModuleColumn = ({
  items,
  render,
}: {
  items: [string, TaxRateItem][];
  render: (record: TaxRateItem) => ReactNode;
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
const labelIdsOf = (names: string[]): string[] => TAX_RATE_LABELS.filter((label) => names.includes(label.name)).map((label) => label.id);

const Demo = ({
  record,
  breakpoint,
  isLoading,
  state,
  accounting = true,
  permissions,
  fails = false,
}: {
  record: TaxRateItem;
  breakpoint: "desktop" | "mobile";
  isLoading?: boolean;
  state?: "content" | "error" | "offline";
  accounting?: boolean;
  permissions?: TaxRatePermissions;
  /** Every action reports failure — the designed error toasts. */
  fails?: boolean;
}) => {
  // The panel holds no record of its own — the caller is the source of truth,
  // so every save lands here.
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
        hasAccountingIntegration={accounting}
        permissions={permissions}
        isLoading={isLoading}
        state={state}
        breakpoint={breakpoint}
        onSaveDetails={(edits) => edit(edits)}
        onSaveAccounting={(quickbooksVendorId) => edit({ quickbooksVendorId })}
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
 * An unvetted rate: the amber Review status, no context menu, and a footer with
 * Delete + Confirm. The Accounting module drops its sync row — an unconfirmed
 * rate is never pushed, so it could only read "Not synced".
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
 * The "General details" module on its own, in its three "Created by" cases
 * (node 24-4654): a user with their round photo; "QuickBooks" with the square
 * brand tile — no creator plus a QuickBooks key, which is how every imported
 * rate arrives; and the placeholder-colored "Unknown" with no avatar, for a
 * rate loaded during onboarding.
 */
export const GeneralDetails: Story = {
  name: '"General Details" Module',
  parameters: { layout: "centered" },
  render: () => (
    <ModuleColumn
      items={[
        ["Created by a user", ACTIVE],
        ["Imported from QuickBooks", REVIEW],
        ["Unknown creator", UNKNOWN_CREATOR],
      ]}
      render={(record) => <GeneralDetailsModule rate={record} onEdit={noop} />}
    />
  ),
};

/**
 * The "Accounting" module on its own (node 25-5031). Its last two rows are
 * conditional: "Last sync" needs a value, and both are dropped in Review —
 * production never pushes an unconfirmed rate, so the status could only read
 * "Not synced".
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
        ["Review — neither row", REVIEW],
      ]}
      render={(record) => (
        <AccountingModule rate={record} onEdit={noop} hideSyncStatus={taxRateStatusOf(record) === "review"} />
      )}
    />
  ),
};

/** A company with no accounting integration: the whole module is gone. */
export const NoAccounting: Story = {
  name: "No Accounting Integration",
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
