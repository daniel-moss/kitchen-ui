import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../components/Button/Button";
import Toaster from "../../components/Toast/Toaster";
import { COMPANY, LABOR_ITEMS, LABOR_SUBTYPES, LaborItem, QUICKBOOKS_ACCOUNTS } from "../../data/db";
import { DeviceFrame } from "../../stories/helpers";
import NewLaborRateForm from "../NewLaborRateForm/NewLaborRateForm";
import { useOpenCreatedPanel } from "../NewLaborRateForm/useOpenCreatedPanel";

import LaborRateSelectList from "./LaborRateSelectList";

// The "Labor rates" SelectList (Figma file qhebbfbPHDVnv8IF1EC7Zg, section
// 3114-4910) — the list a labor rate is picked from. The rows are the demo
// database's confirmed labor rates; type a name that is not there to see
// "No labor rates match". "Add labor rate" opens the "New labor rate" form,
// and its Create opens the "Labor rate" side panel on the new rate — which
// then shows in the list too.
const meta: Meta = {
  title: "Modules/Labor Rate/Select List",
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const Demo = ({
  breakpoint,
  rates = LABOR_ITEMS,
  canAdd = true,
}: {
  breakpoint: "desktop" | "mobile";
  rates?: LaborItem[];
  /** The user may add labor rates — the footer shows. */
  canAdd?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  const [picked, setPicked] = useState<LaborItem | null>(null);
  const [list, setList] = useState<LaborItem[]>(rates);
  const [formOpen, setFormOpen] = useState(false);
  const names = list.map((rate) => rate.name);
  const created = useOpenCreatedPanel({
    breakpoint,
    existingNames: names,
    requireSubtypes: COMPANY.requireSubtypes,
    onCreated: (rate) => setList((prev) => [...prev, rate]),
  });
  return (
    <>
      <Button size="lg" variant="subtle" onClick={() => setOpen(true)}>
        {picked == null ? "Pick a labor rate" : picked.name}
      </Button>
      <LaborRateSelectList
        open={open}
        onClose={() => setOpen(false)}
        rates={list}
        selectedId={picked?.id}
        onSelect={setPicked}
        onAddLaborRate={canAdd ? () => setFormOpen(true) : undefined}
        breakpoint={breakpoint}
      />
      <NewLaborRateForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        subtypes={LABOR_SUBTYPES}
        requireSubtypes={COMPANY.requireSubtypes}
        useTaxes={COMPANY.useTaxes}
        defaultTaxable={COMPANY.pricebookDefaultTaxableLabor}
        quickbooks={{ accounts: QUICKBOOKS_ACCOUNTS }}
        existingNames={names}
        onOpenCreated={created.onOpenCreated}
        breakpoint={breakpoint}
      />
      {created.panel}
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

/** No confirmed labor rates yet — no search, "No labor rates", and the footer to add one. */
export const NoLaborRates: Story = {
  name: "No Labor Rates",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" rates={[]} />,
};

/** The same on mobile. */
export const NoLaborRatesMobile: Story = {
  name: "No Labor Rates / Mobile",
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo breakpoint="mobile" rates={[]} />
    </DeviceFrame>
  ),
};

/** A user without the pricebook permission — no "Add labor rate" footer. */
export const NoPermission: Story = {
  name: "No Permission",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" canAdd={false} />,
};
