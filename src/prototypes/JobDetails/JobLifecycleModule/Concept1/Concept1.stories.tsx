import type { Meta, StoryObj } from "@storybook/react";

import Concept1 from "./Concept1";
import { conceptMeta, conceptStates } from "../conceptStories";
import { FULL_ROWS } from "../lifecycleData";

// CONCEPT 1 — the built one: an ActivityLog timeline, one accordion row per status, each opening into its separate stretches. This is what the Job Details Activity tab renders.
const meta: Meta = {
  title: 'Prototypes/Job Details/"Job Lifecycle" Module/Concept 1',
  ...conceptMeta,
};

export default meta;
type Story = StoryObj;

const s = conceptStates(Concept1, FULL_ROWS);

export const FreshJob: Story = s.FreshJob;
export const InProgress: Story = s.InProgress;
export const FullHistory: Story = s.FullHistory;
export const Collapsed: Story = s.Collapsed;
export const Mobile: Story = s.Mobile;
