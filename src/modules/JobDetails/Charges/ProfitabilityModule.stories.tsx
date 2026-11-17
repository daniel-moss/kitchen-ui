import type { Meta, StoryObj } from "@storybook/react";

import type { JobChargeLines } from "../../../app/store/AppStore";
import { chargesOf, discountsOf } from "../../../data/db";
import type { Charge } from "../../../data/db";
import { conceptMeta, Frame, JOB } from "../ChargesModule/conceptStories";

import { laborAmount, otherAmount, productAmount, round3 } from "./lineDisplay";
import ProfitabilityModule from "./ProfitabilityModule";

// The "Profitability" module under the Subtotal in the Job Details Charges
// segment (Figma 21823-86710). One story per Figma state. Every state is the
// demo job's real lines (JOB-1201) with only the costs changed, so the
// numbers stay believable. Hover (desktop) or tap (mobile) the info icons for
// the three hints.
const meta: Meta = {
  title: "Modules/Job/Details/Modules/Profitability",
  ...conceptMeta,
};

export default meta;
type Story = StoryObj;

const groups = chargesOf(JOB);
const itemsOf = (key: string) => groups.find((group) => group.key === key)?.items ?? [];

/** The demo job's lines, as the Charges segment seeds them. */
const LINES: JobChargeLines = {
  labor: itemsOf("labor").filter((charge) => charge.labor != null),
  products: itemsOf("products").filter((charge) => charge.product != null),
  other: itemsOf("other").filter((charge) => charge.other != null),
  discounts: discountsOf(JOB).filter((charge) => charge.discount != null),
};

/** The same lines with every cost set to `factor` × the line's price. */
function costAt(factor: number, { keepDiscounts = true } = {}): JobChargeLines {
  const cost = (price: number) => round3(price * factor);
  return {
    labor: LINES.labor.map((c): Charge => ({ ...c, labor: { ...c.labor!, cost: cost(c.labor!.price) } })),
    products: LINES.products.map((c): Charge => ({ ...c, product: { ...c.product!, cost: cost(c.product!.price) } })),
    other: LINES.other.map((c): Charge => ({ ...c, other: { ...c.other!, cost: cost(c.other!.price) } })),
    discounts: keepDiscounts ? LINES.discounts : [],
  };
}

const EMPTY: JobChargeLines = { labor: [], products: [], other: [], discounts: [] };

/** The demo job: it makes a profit — arrow up, green. */
export const Desktop: Story = {
  render: () => (
    <Frame>
      <ProfitabilityModule lines={LINES} />
    </Frame>
  ),
};

/** The same at the mobile width: the three boxes stacked; the hints open in a drawer. */
export const Mobile: Story = {
  render: () => (
    <Frame mobile>
      <ProfitabilityModule lines={LINES} mobile />
    </Frame>
  ),
};

/** Cost is above the Subtotal: arrow down, red. The percent has no minus — the amount does. */
export const Loss: Story = {
  render: () => (
    <Frame>
      <ProfitabilityModule lines={costAt(1.5)} />
    </Frame>
  ),
};

/** Cost equals the Subtotal (no discounts): "0%" and "$0.00", no arrow. */
export const Zero: Story = {
  render: () => (
    <Frame>
      <ProfitabilityModule lines={costAt(1, { keepDiscounts: false })} />
    </Frame>
  ),
};

/** No line has a cost: everything charged is profit — a 100% margin. */
export const NoCost: Story = {
  name: "No cost",
  render: () => (
    <Frame>
      <ProfitabilityModule lines={costAt(0, { keepDiscounts: false })} />
    </Frame>
  ),
};

/** The same lines with ONE discount that takes off the whole charge. */
function fullyDiscounted(): JobChargeLines {
  const charged = round3(
    LINES.labor.reduce((acc, c) => acc + laborAmount(c.labor!), 0) +
      LINES.products.reduce((acc, c) => acc + productAmount(c.product!), 0) +
      LINES.other.reduce((acc, c) => acc + otherAmount(c.other!), 0),
  );
  const first = LINES.discounts[0];
  return { ...LINES, discounts: [{ ...first, discount: { ...first.discount!, discount: charged, quantity: 1 } }] };
}

/** The Subtotal is $0: there is nothing to divide by, so the margin is "N/A". */
export const NoSubtotal: Story = {
  name: "No subtotal",
  render: () => (
    <Frame>
      <ProfitabilityModule lines={fullyDiscounted()} />
    </Frame>
  ),
};

/** Nothing charged yet: every value is a placeholder. */
export const NoLineItems: Story = {
  name: "No line items",
  render: () => (
    <Frame>
      <ProfitabilityModule lines={EMPTY} />
    </Frame>
  ),
};
