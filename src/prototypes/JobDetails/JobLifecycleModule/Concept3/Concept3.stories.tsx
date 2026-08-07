import type { Meta, StoryObj } from "@storybook/react";

import Concept3 from "./Concept3";
import { conceptMeta, conceptStates } from "../conceptStories";
import { FULL_ROWS } from "../lifecycleData";

// CONCEPT 3 — one ItemGroup ACCORDION per status: a primary GroupLabel header with the status glyph, the name and the total after a bullet dot, and a Divider between groups.
const meta: Meta = {
  title: 'Prototypes/Job Details/"Job Lifecycle" Module/Concept 3',
  ...conceptMeta,
};

export default meta;
type Story = StoryObj;

const s = conceptStates(Concept3, FULL_ROWS);

export const FreshJob: Story = s.FreshJob;
export const InProgress: Story = s.InProgress;
export const FullHistory: Story = s.FullHistory;
export const Collapsed: Story = s.Collapsed;
export const Mobile: Story = s.Mobile;
