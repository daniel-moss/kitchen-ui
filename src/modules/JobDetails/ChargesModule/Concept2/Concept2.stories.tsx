import type { Meta, StoryObj } from "@storybook/react";

import Concept2 from "./Concept2";
import type { ChargeGroup } from "../../../../data/db";
import { conceptMeta, Frame, JOB, JOB_CHARGES, JOB_DISCOUNTS } from "../conceptStories";

// CONCEPT 2 — DRAFT (Figma 27402-31061): one accordion module per charge type,
// each line an accordion with its details. Every plus and pen is inert.
const meta: Meta = {
  title: "Modules/Job/Details/Modules/Charges/Concept 2",
  ...conceptMeta,
};

export default meta;
type Story = StoryObj;

/** The job the Job Details page opens on, every line collapsed (the module docs). */
export const Desktop: Story = {
  render: () => (
    <Frame>
      <Concept2 job={JOB} groups={JOB_CHARGES} discounts={JOB_DISCOUNTS} />
    </Frame>
  ),
};

/** The same, at the mobile width. */
export const Mobile: Story = {
  render: () => (
    <Frame mobile>
      <Concept2 job={JOB} groups={JOB_CHARGES} discounts={JOB_DISCOUNTS} mobile />
    </Frame>
  ),
};

/** Every line open — the module docs keep them collapsed by default. */
export const LinesOpen: Story = {
  name: "Lines open",
  render: () => (
    <Frame>
      <Concept2 job={JOB} groups={JOB_CHARGES} discounts={JOB_DISCOUNTS} linesOpen />
    </Frame>
  ),
};

// The same job after its work line was edited to a Flat rate that took two
// days — the doc's "Flat" + "Service dates" case (the edit form can change
// both on any line).
const FLAT_TWO_DAYS: ChargeGroup[] = JOB_CHARGES.map((group) =>
  group.key !== "labor"
    ? group
    : {
        ...group,
        items: group.items.map((charge, index) => {
          if (index !== 1 || charge.labor == null) return charge;
          const start = charge.labor.serviceStart!;
          const end = new Date(new Date(start).getTime() + 86400000).toISOString();
          return { ...charge, labor: { ...charge.labor, type: "flat" as const, price: 450, cost: 220, hours: undefined, serviceEnd: end } };
        }),
      },
);

/** A Flat line over two days: Price as the total, no Hours/Amount, date range. */
export const FlatTwoDays: Story = {
  name: "Flat, two days",
  render: () => (
    <Frame>
      <Concept2 job={JOB} groups={FLAT_TWO_DAYS} discounts={JOB_DISCOUNTS} linesOpen />
    </Frame>
  ),
};

/** Nothing charged yet — every module on its empty state. */
export const Empty: Story = {
  render: () => (
    <Frame>
      <Concept2 job={JOB} groups={[]} />
    </Frame>
  ),
};
