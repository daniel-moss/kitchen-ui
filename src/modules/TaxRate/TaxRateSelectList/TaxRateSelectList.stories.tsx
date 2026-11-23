import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../../components/Button/Button";
import Toaster from "../../../components/Toast/Toaster";
import { QUICKBOOKS_VENDORS, TAX_RATE_ITEMS, TaxRateItem } from "../../../data/db";
import { DeviceFrame } from "../../../stories/helpers";
import NewTaxRateForm from "../NewTaxRateForm/NewTaxRateForm";

import TaxRateSelectList from "./TaxRateSelectList";

// The "Tax rates" SelectList (Figma file XBFKW2ThcuVxPbQQHw1XY2, page
// "↳ Tax Rates" 12996-6395) — the list a tax rate is picked from. The rows are
// the demo database's confirmed tax rates; type a name that is not there to
// see "No tax rates match". "Add tax rate" opens the real "New tax rate" form.
const meta: Meta = {
  title: "Modules/Pricebook Items/Tax Rate/Select List",
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const Demo = ({
  breakpoint,
  rates = TAX_RATE_ITEMS,
  canAdd = true,
}: {
  breakpoint: "desktop" | "mobile";
  rates?: TaxRateItem[];
  /** The user may create tax rates — the footer shows. */
  canAdd?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<TaxRateItem | null>(null);
  return (
    <>
      <Button size="lg" variant="subtle" onClick={() => setOpen(true)}>
        {picked == null ? "Pick a tax rate" : picked.name}
      </Button>
      <TaxRateSelectList
        open={open}
        onClose={() => setOpen(false)}
        rates={rates}
        selectedId={picked?.id}
        onSelect={setPicked}
        onAddTaxRate={canAdd ? () => setAdding(true) : undefined}
        breakpoint={breakpoint}
      />
      <NewTaxRateForm
        open={adding}
        onClose={() => setAdding(false)}
        quickbooks={{ vendors: QUICKBOOKS_VENDORS }}
        existingNames={TAX_RATE_ITEMS.map((row) => row.name)}
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

/** No confirmed tax rates yet — no search, "No tax rates", and the footer to add one. */
export const NoTaxRates: Story = {
  name: "No Tax Rates",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" rates={[]} />,
};

/** The same on mobile. */
export const NoTaxRatesMobile: Story = {
  name: "No Tax Rates / Mobile",
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo breakpoint="mobile" rates={[]} />
    </DeviceFrame>
  ),
};

/** A user who may not create tax rates — no "Add tax rate" footer. */
export const NoPermission: Story = {
  name: "No Permission",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" canAdd={false} />,
};
