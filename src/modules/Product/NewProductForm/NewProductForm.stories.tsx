import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../../components/Button/Button";
import Toaster from "../../../components/Toast/Toaster";
import {
  COMPANY,
  INVENTORY_LOCATIONS,
  PRODUCT_ITEMS,
  PRODUCT_LABELS,
  PRODUCT_SUBTYPES,
  QUICKBOOKS_ACCOUNTS,
  QUICKBOOKS_ASSET_ACCOUNTS,
  QUICKBOOKS_COGS_ACCOUNTS,
  VENDORS,
} from "../../../data/db";
import { DeviceFrame } from "../../../stories/helpers";

import NewProductForm from "./NewProductForm";
import { NewProductFormProps } from "./NewProductForm.types";
import ScanCodeDialog, { ScanFailure } from "./ScanCodeDialog";

// The reusable "New product" form (Figma file n4FkA98uVyhbOJeLY0AXZV —
// Desktop 2003-1517 / Mobile 1-7826): six FormModules in a Dialog, shared by
// every flow that adds a part — the Pricebook's Products list, and the
// on-the-fly create from a job, estimate, invoice or purchase order line.
//
// Subtypes, labels, vendors, the taken names and the registered barcodes all
// come from the demo database, so every check is live:
//
//   · type "Defrost timer" into Name to see the duplicate error;
//   · type "RP-PART-7741" into Barcode — it belongs to the evaporator fan
//     motor;
//   · add a vendor cost, and the three vendor cost strategies wake up with
//     their resolved values in the captions;
//   · pick "Inventory" as the Stock type, add a location, and the Accounting
//     module grows its two inventory accounts.
//
// THE SCANNER IS REAL — pressing the scan button opens the camera and reads a
// code with a WebAssembly decoder. It needs a secure context, so it works on
// the published Storybook (https) and on localhost, but not over a LAN IP.
//
// The scan stories below use the FAKE scanner instead: tapping the preview
// reads the next demo code over a still picture — a free one, then one over
// the 255-character limit, then one already registered, then one whose check
// can not reach the server. A real camera can not be asked for those on
// demand, nor for the nine camera failures. "Real Camera" is the exception.
const meta: Meta = {
  title: 'Modules/Product/"New Product" Form',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const LABEL_POOL = PRODUCT_LABELS.map((label) => label.name);
const TAKEN_NAMES = PRODUCT_ITEMS.map((item) => item.name);
/** The codes already registered, by code → the product that holds it. */
const TAKEN_BARCODES = Object.fromEntries(
  PRODUCT_ITEMS.filter((item) => item.barcode).map((item) => [item.barcode as string, item.name]),
);
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
  vendors = VENDORS,
  canCreateVendor = true,
  inventory = INVENTORY,
  quickbooks = QUICKBOOKS,
  fails = false,
}: {
  breakpoint: "desktop" | "mobile";
  subtypes?: typeof PRODUCT_SUBTYPES;
  requireSubtypes?: boolean;
  cannotClassifySubtypes?: boolean;
  useTaxes?: boolean;
  vendors?: typeof VENDORS;
  canCreateVendor?: boolean;
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
        vendors={vendors}
        inventory={inventory ?? undefined}
        quickbooks={quickbooks ?? undefined}
        labelPool={LABEL_POOL}
        existingNames={TAKEN_NAMES}
        existingBarcodes={TAKEN_BARCODES}
        canCreateVendor={canCreateVendor}
        onCreateVendor={() => undefined}
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

/** The company requires a subtype, and writes exactly one — it is chosen and locked. */
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

/** A company that writes no subtypes at all — the field disappears. */
export const NoSubtypes: Story = {
  name: "No Subtypes",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" subtypes={[]} />,
};

/** A company that charges no tax — Taxability disappears with it. */
export const NoTaxes: Story = {
  name: "No Taxes",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" useTaxes={false} />,
};

/** Inventory pre-selected (a company whose default is "Inventory"). */
export const InventoryDefault: Story = {
  name: "Inventory Stock Type",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" inventory={{ locations: INVENTORY_LOCATIONS, defaultTrackInventory: true }} />,
};

/** No ACTIVE inventory location exists: Stock type is locked on Non-inventory. */
export const NoActiveLocations: Story = {
  name: "No Active Inventory Locations",
  parameters: { layout: "centered" },
  render: () => (
    <Demo
      breakpoint="desktop"
      inventory={{ locations: INVENTORY_LOCATIONS.filter((location) => !location.isActive), defaultTrackInventory: true }}
    />
  ),
};

/** A company without the inventory feature and without QuickBooks — two modules fewer. */
export const NoInventoryNoAccounting: Story = {
  name: "No Inventory, No Accounting",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" inventory={null} quickbooks={null} />,
};

/** The Vendors list with no active vendor: the inactive ones, disabled. */
export const NoActiveVendors: Story = {
  name: "No Active Vendors",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" vendors={VENDORS.map((vendor) => ({ ...vendor, isActive: false }))} />,
};

/** The Vendors list for a user who can not create vendors, with no vendors at all. */
export const NoVendorsNoPermission: Story = {
  name: "No Vendors, No Permission",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" vendors={[]} canCreateVendor={false} />,
};

/** QuickBooks Desktop on Detailed Split, but no income account synced yet. */
export const NoSyncedAccounts: Story = {
  name: '"No Synced Accounts" Prompt',
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" quickbooks={{ ...QUICKBOOKS!, revenueAccounts: [] }} />,
};

/** A user who can not classify subtypes, in a company that requires one (2+ subtypes). */
export const CantClassifySubtypes: Story = {
  name: '"Can\'t Classify Subtypes" Prompt',
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" requireSubtypes cannotClassifySubtypes />,
};

/** Create reports failure: the error toast, and the form keeps every value. */
export const CreateFails: Story = {
  name: "Create Fails",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" fails />,
};

// ---- the scanner, state by state ----

const ScanDemo = ({
  state,
  breakpoint,
  simulated = true,
}: {
  state?: ScanFailure;
  breakpoint: "desktop" | "mobile";
  /** False opens the real camera. */
  simulated?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="lg" variant="subtle" leftIcon="qrcode-read" onClick={() => setOpen(true)}>
        Scan
      </Button>
      <ScanCodeDialog
        open={open}
        onClose={() => setOpen(false)}
        onRegister={() => setOpen(false)}
        registered={TAKEN_BARCODES}
        simulated={simulated}
        state={state}
        breakpoint={breakpoint}
      />
    </>
  );
};

/**
 * Tap the preview to read a code. Four reads walk every result: free, too long,
 * already registered, and one whose check could not run. The dialog opens on
 * "Preparing the scanner…" and each read shows "Scanning…" before it lands.
 */
export const Scanner: Story = {
  name: '"Scan" Form',
  parameters: { layout: "centered" },
  render: () => <ScanDemo breakpoint="desktop" />,
};

/**
 * The REAL camera: it asks for permission, lists the device's cameras, offers
 * the flashlight when there is one, and reads QR codes and barcodes. Needs
 * https or localhost — over a LAN IP it shows "No secure connection".
 */
export const ScannerReal: Story = {
  name: '"Scan" Form — Real Camera',
  parameters: { layout: "centered" },
  render: () => <ScanDemo breakpoint="desktop" simulated={false} />,
};

/** The real camera on a phone — the one to open from the published Storybook. */
export const ScannerRealMobile: Story = {
  name: '"Scan" Form — Real Camera Mobile',
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <ScanDemo breakpoint="mobile" simulated={false} />
    </DeviceFrame>
  ),
};

export const ScannerMobile: Story = {
  name: '"Scan" Form Mobile',
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <ScanDemo breakpoint="mobile" />
    </DeviceFrame>
  ),
};

export const ScannerNoAccess: Story = {
  name: "Scan — No Camera Access",
  parameters: { layout: "centered" },
  render: () => <ScanDemo breakpoint="desktop" state="noCameraAccess" />,
};

export const ScannerNoCamera: Story = {
  name: "Scan — No Camera Found",
  parameters: { layout: "centered" },
  render: () => <ScanDemo breakpoint="desktop" state="noCameraFound" />,
};

export const ScannerBusy: Story = {
  name: "Scan — Camera Is Busy",
  parameters: { layout: "centered" },
  render: () => <ScanDemo breakpoint="desktop" state="cameraIsBusy" />,
};

export const ScannerInsecure: Story = {
  name: "Scan — No Secure Connection",
  parameters: { layout: "centered" },
  render: () => <ScanDemo breakpoint="desktop" state="noSecureConnection" />,
};

export const ScannerUnsupported: Story = {
  name: "Scan — This Browser Can't Scan",
  parameters: { layout: "centered" },
  render: () => <ScanDemo breakpoint="desktop" state="cannotScan" />,
};

export const ScannerDidNotStart: Story = {
  name: "Scan — The Camera Didn't Start",
  parameters: { layout: "centered" },
  render: () => <ScanDemo breakpoint="desktop" state="didNotStart" />,
};

export const ScannerStopped: Story = {
  name: "Scan — The Camera Stopped",
  parameters: { layout: "centered" },
  render: () => <ScanDemo breakpoint="desktop" state="stopped" />,
};

export const ScannerNotWorking: Story = {
  name: "Scan — Camera Isn't Working",
  parameters: { layout: "centered" },
  render: () => <ScanDemo breakpoint="desktop" state="notWorking" />,
};

export const ScannerCouldNotLoad: Story = {
  name: "Scan — Scanner Couldn't Load",
  parameters: { layout: "centered" },
  render: () => <ScanDemo breakpoint="desktop" state="scannerCouldNotLoad" />,
};
