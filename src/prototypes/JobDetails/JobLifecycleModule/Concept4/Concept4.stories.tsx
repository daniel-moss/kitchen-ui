import type { Meta, StoryObj } from "@storybook/react";

import Concept4 from "./Concept4";
import { conceptMeta, conceptStates } from "../conceptStories";
import { FULL_ROWS } from "../lifecycleData";

// CONCEPT 4 — one ItemGroup of ACCORDION ListItems: a caret, the status glyph on a tinted 36px avatar, the name, and the total on the right. Seven statuses read as one list.
const meta: Meta = {
  title: 'Prototypes/Job Details/"Job Lifecycle" Module/Concept 4',
  ...conceptMeta,
};

export default meta;
type Story = StoryObj;

const s = conceptStates(Concept4, FULL_ROWS);

export const FreshJob: Story = s.FreshJob;
export const InProgress: Story = s.InProgress;
export const FullHistory: Story = s.FullHistory;
export const Collapsed: Story = s.Collapsed;
export const Mobile: Story = s.Mobile;
