import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../../components/Button/Button";
import { ChargeItem, OTHER_ITEMS } from "../../../data/db";
import { DeviceFrame } from "../../../stories/helpers";

import OtherChargeSelectList from "./OtherChargeSelectList";

// The "Other charges" SelectList (Figma file qhebbfbPHDVnv8IF1EC7Zg, section
// 3147-7140) — the list an other charge is picked from. The rows are the demo
// database's confirmed other charges; type a name that is not there to see
// "No charges match". There is no "New charge" form yet, so "Add charge" only
// closes the list.
const meta: Meta = {
  title: "Modules/Other Charge/Select List",
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const Demo = ({
  breakpoint,
  charges = OTHER_ITEMS,
  canAdd = true,
}: {
  breakpoint: "desktop" | "mobile";
  charges?: ChargeItem[];
  /** The user may add other charges — the footer shows. */
  canAdd?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  const [picked, setPicked] = useState<ChargeItem | null>(null);
  return (
    <>
      <Button size="lg" variant="subtle" onClick={() => setOpen(true)}>
        {picked == null ? "Pick an other charge" : picked.name}
      </Button>
      <OtherChargeSelectList
        open={open}
        onClose={() => setOpen(false)}
        charges={charges}
        selectedId={picked?.id}
        onSelect={setPicked}
        onAddCharge={canAdd ? () => undefined : undefined}
        breakpoint={breakpoint}
      />
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

/** No confirmed other charges yet — no search, "No charges", and the footer to add one. */
export const NoCharges: Story = {
  name: "No Charges",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" charges={[]} />,
};

/** The same on mobile. */
export const NoChargesMobile: Story = {
  name: "No Charges / Mobile",
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo breakpoint="mobile" charges={[]} />
    </DeviceFrame>
  ),
};

/** A user without the pricebook permission — no "Add charge" footer. */
export const NoPermission: Story = {
  name: "No Permission",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" canAdd={false} />,
};
