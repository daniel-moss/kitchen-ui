import type { Meta, StoryObj } from "@storybook/react";

import Concept1 from "./Concept1";
import { conceptMeta, Frame, JOB, JOB_CHARGES, JOB_DISCOUNTS } from "../conceptStories";

// CONCEPT 1 — the built one: one "Charges" module with four always-shown
// groups (Labor rates, Products, Other charges, Discounts) and a subtotal
// footer — the live module's layout, built on the SAME lines, lists and edit
// forms as Concept 2 (2026-11-03). The Job Details page keeps the original.
const meta: Meta = {
  title: "Modules/Job/Details/Modules/Charges/Concept 1",
  ...conceptMeta,
};

export default meta;
type Story = StoryObj;

/** The job the Job Details page opens on, with its charges. */
export const Desktop: Story = {
  render: () => (
    <Frame>
      <Concept1 job={JOB} groups={JOB_CHARGES} discounts={JOB_DISCOUNTS} />
    </Frame>
  ),
};

/** The same, at the mobile width. */
export const Mobile: Story = {
  render: () => (
    <Frame mobile>
      <Concept1 job={JOB} groups={JOB_CHARGES} discounts={JOB_DISCOUNTS} mobile />
    </Frame>
  ),
};

/** Nothing charged yet — every group on its empty state. */
export const Empty: Story = {
  render: () => (
    <Frame>
      <Concept1 job={JOB} groups={[]} />
    </Frame>
  ),
};

/** A finalized or cancelled job: no plus, no Delete, no drag — the rows do not open. */
export const ReadOnly: Story = {
  name: "Read-only",
  render: () => (
    <Frame>
      <Concept1 job={JOB} groups={JOB_CHARGES} discounts={JOB_DISCOUNTS} readOnly />
    </Frame>
  ),
};
