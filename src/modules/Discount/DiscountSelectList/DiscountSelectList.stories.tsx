import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../../components/Button/Button";
import { ChargeItem, DISCOUNT_ITEMS } from "../../../data/db";
import { DeviceFrame } from "../../../stories/helpers";

import DiscountSelectList from "./DiscountSelectList";

// The "Discounts" SelectList (Figma file qhebbfbPHDVnv8IF1EC7Zg, section
// 3149-7787) — the list a discount is picked from. The rows are the demo
// database's confirmed discounts; type a name that is not there to see
// "No discounts match". There is no "New discount" form yet, so "Add discount" only
// closes the list.
const meta: Meta = {
  title: "Modules/Discount/Select List",
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const Demo = ({
  breakpoint,
  discounts = DISCOUNT_ITEMS,
  canAdd = true,
}: {
  breakpoint: "desktop" | "mobile";
  discounts?: ChargeItem[];
  /** The user may add discounts — the footer shows. */
  canAdd?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  const [picked, setPicked] = useState<ChargeItem | null>(null);
  return (
    <>
      <Button size="lg" variant="subtle" onClick={() => setOpen(true)}>
        {picked == null ? "Pick a discount" : picked.name}
      </Button>
      <DiscountSelectList
        open={open}
        onClose={() => setOpen(false)}
        discounts={discounts}
        selectedId={picked?.id}
        onSelect={setPicked}
        onAddDiscount={canAdd ? () => undefined : undefined}
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

/** No confirmed discounts yet — no search, "No discounts", and the footer to add one. */
export const NoDiscounts: Story = {
  name: "No Discounts",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" discounts={[]} />,
};

/** The same on mobile. */
export const NoDiscountsMobile: Story = {
  name: "No Discounts / Mobile",
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo breakpoint="mobile" discounts={[]} />
    </DeviceFrame>
  ),
};

/** A user without the pricebook permission — no "Add discount" footer. */
export const NoPermission: Story = {
  name: "No Permission",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" canAdd={false} />,
};
