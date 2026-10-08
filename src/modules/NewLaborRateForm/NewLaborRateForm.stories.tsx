import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../components/Button/Button";
import Toaster from "../../components/Toast/Toaster";
import { LABOR_ITEMS, LABOR_LABELS, LABOR_SUBTYPES, QUICKBOOKS_ACCOUNTS } from "../../data/db";
import { DeviceFrame } from "../../stories/helpers";

import NewLaborRateForm from "./NewLaborRateForm";

// The reusable "New labor rate" form (Figma file U2V0ZqWOhV89yql8GKRmjy,
// section 1-7817) — three FormModules in a Dialog, shared by every flow that
// adds a labor rate: the Pricebook's Labor rates list, and the on-the-fly
// create from a job, estimate or invoice line item.
//
// Subtypes, labels and the taken names all come from the demo database, so the
// Subtype list, the Labels picker and the duplicate-name error are all live.
// Type a name the workspace already uses — "Standard labor", say — to see
// "Labor rate with this name already exists".
const meta: Meta = {
  title: 'Modules/Labor Rate/"New Labor Rate" Form',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const LABEL_POOL = LABOR_LABELS.map((label) => label.name);
const TAKEN_NAMES = LABOR_ITEMS.map((item) => item.name);

const Demo = ({
  breakpoint,
  subtypes = LABOR_SUBTYPES,
  fails = false,
  slow = false,
  requireSubtypes = false,
  quickbooks,
}: {
  breakpoint: "desktop" | "mobile";
  /** The company's labor subtypes — none, one, or the whole table. */
  subtypes?: typeof LABOR_SUBTYPES;
  /** Create reports failure — the error toast, with the form left as it was. */
  fails?: boolean;
  /** A slow create, so the in-flight state is visible. */
  slow?: boolean;
  /** The company requires a subtype (`require_subtypes`). */
  requireSubtypes?: boolean;
  /**
   * The QuickBooks Desktop block. undefined = no integration (no module);
   * `{ accounts: [] }` = the integration is on but nothing has synced yet.
   */
  quickbooks?: { accounts: typeof QUICKBOOKS_ACCOUNTS };
}) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="lg" variant="subtle" leftIcon="plus" onClick={() => setOpen(true)}>
        New labor rate
      </Button>
      <NewLaborRateForm
        open={open}
        onClose={() => setOpen(false)}
        subtypes={subtypes}
        requireSubtypes={requireSubtypes}
        quickbooks={quickbooks}
        labelPool={LABEL_POOL}
        existingNames={TAKEN_NAMES}
        onCreated={
          fails
            ? () => false
            : slow
              ? () => new Promise<void>((resolve) => setTimeout(resolve, 2500))
              : undefined
        }
        // Shows the toast's "Preview" link (the side panel is the caller's).
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
 * A company that REQUIRES a subtype and writes exactly one: it is chosen for
 * the user and the field is read-only — the label picks up "(read-only)" by
 * itself. Without the requirement the same company would get an ordinary
 * optional field.
 */
export const OneSubtype: Story = {
  name: "One Required Subtype",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" subtypes={[LABOR_SUBTYPES[0]]} requireSubtypes />,
};

/**
 * The company requires a subtype: the field loses its "(optional)" tag, the
 * list drops its "No subtype" row, and Create blocks until one is picked.
 */
export const RequiredSubtype: Story = {
  name: "Required Subtype",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" requireSubtypes />,
};

/**
 * A company on QuickBooks Desktop with the DETAILED line-item scheme: the
 * Accounting module appears last, with the sync notice and the required
 * revenue account — "4010: Service Revenue", or the name alone for an account
 * QuickBooks gives no number.
 */
export const QuickBooks: Story = {
  name: "QuickBooks",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" quickbooks={{ accounts: QUICKBOOKS_ACCOUNTS }} />,
};

/**
 * The integration is on but the Web Connector has never imported the chart of
 * accounts. The module turns its notice into a warning, the account field
 * stays quiet (there is nothing to choose), and Create blocks and scrolls to
 * the banner instead of reddening a field nobody can satisfy.
 */
export const QuickBooksNoAccounts: Story = {
  name: "QuickBooks — No Synced Accounts",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" quickbooks={{ accounts: [] }} />,
};

/** A company with no subtypes at all — the field is not rendered. */
export const NoSubtypes: Story = {
  name: "No Subtypes",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" subtypes={[]} />,
};

/**
 * A slow create, so the in-flight state can be seen: Create spins and keeps its
 * width, Cancel and the ✕ are disabled, and the dialog ignores the scrim, the
 * Escape key and the mobile swipe until the request answers.
 */
export const Creating: Story = {
  name: "Creating",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" slow />,
};

/** Create fails — the error toast, and the form keeps what was typed. */
export const CreateFails: Story = {
  name: "Create Fails",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" fails />,
};
