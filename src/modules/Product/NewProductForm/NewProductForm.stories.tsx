import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../../components/Button/Button";
import Toaster from "../../../components/Toast/Toaster";
import { PRODUCT_ITEMS, PRODUCT_LABELS, PRODUCT_SUBTYPES, VENDORS } from "../../../data/db";
import { DeviceFrame } from "../../../stories/helpers";

import NewProductForm from "./NewProductForm";
import ScanCodeDialog, { ScanFailure } from "./ScanCodeDialog";

// The reusable "New product" form (Figma file n4FkA98uVyhbOJeLY0AXZV —
// Desktop 2003-1517 / Mobile 1-7826): four FormModules in a Dialog, shared by
// every flow that adds a part — the Pricebook's Products list, and the
// on-the-fly create from a job, estimate, invoice or purchase order line.
//
// Subtypes, labels, vendors, the taken names and the registered barcodes all
// come from the demo database, so every check is live:
//
//   · type "Defrost timer" into Name to see the duplicate error;
//   · type "RP-PART-7741" into Barcode and leave the field — it belongs to the
//     evaporator fan motor;
//   · add a vendor cost, and the three vendor cost strategies wake up with
//     their resolved values in the captions.
//
// THE SCANNER IS FAKE. Tapping the camera preview reads the next demo code,
// over a still picture: a free one, then one over the 255-character limit, then
// one already registered, then one whose check can not reach the server. Every
// camera failure has its own story below.
//
// Inventory is not built yet — the fifth module is being designed.
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
const ACTIVE_VENDORS = VENDORS.filter((vendor) => vendor.isActive);

const Demo = ({
  breakpoint,
  subtypes = PRODUCT_SUBTYPES,
  requireSubtypes = false,
  useTaxes = true,
  fails = false,
}: {
  breakpoint: "desktop" | "mobile";
  subtypes?: typeof PRODUCT_SUBTYPES;
  requireSubtypes?: boolean;
  useTaxes?: boolean;
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
        useTaxes={useTaxes}
        vendors={ACTIVE_VENDORS}
        labelPool={LABEL_POOL}
        existingNames={TAKEN_NAMES}
        existingBarcodes={TAKEN_BARCODES}
        canCreateVendor
        onCreateVendor={() => undefined}
        onCreated={() => (fails ? false : undefined)}
        onPreview={() => undefined}
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

/** Create reports failure: the error toast, and the form keeps every value. */
export const CreateFails: Story = {
  name: "Create Fails",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" fails />,
};

// ---- the scanner, state by state ----

const ScanDemo = ({ state, breakpoint }: { state?: ScanFailure; breakpoint: "desktop" | "mobile" }) => {
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
