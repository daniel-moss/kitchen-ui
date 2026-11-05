import type { Meta, StoryObj } from "@storybook/react";

import Concept3 from "./Concept3";
import { conceptMeta, Frame, JOB, JOB_CHARGES, JOB_DISCOUNTS } from "../conceptStories";

// CONCEPT 3 (Figma 27942-67997): one module per charge type; rows drag within
// their type and open the line's side panel. The plus buttons open the SelectLists.
const meta: Meta = {
  title: "Modules/Job/Details/Modules/Charges/Concept 3",
  ...conceptMeta,
};

export default meta;
type Story = StoryObj;

/** The job the Job Details page opens on. */
export const Desktop: Story = {
  render: () => (
    <Frame>
      <Concept3 job={JOB} groups={JOB_CHARGES} discounts={JOB_DISCOUNTS} />
    </Frame>
  ),
};

/** The same, at the mobile width. */
export const Mobile: Story = {
  render: () => (
    <Frame mobile>
      <Concept3 job={JOB} groups={JOB_CHARGES} discounts={JOB_DISCOUNTS} mobile />
    </Frame>
  ),
};

/** Nothing charged yet — every module on its empty state. */
export const Empty: Story = {
  render: () => (
    <Frame>
      <Concept3 job={JOB} groups={[]} />
    </Frame>
  ),
};
