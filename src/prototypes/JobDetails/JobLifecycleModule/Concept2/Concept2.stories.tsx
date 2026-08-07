import type { Meta, StoryObj } from "@storybook/react";

import Concept2 from "./Concept2";
import { conceptMeta, conceptStates } from "../conceptStories";
import { FULL_ROWS } from "../lifecycleData";

// CONCEPT 2 — Concept 1 with the rows FLATTENED — the same timeline and the same one row per status, but nothing opens. It answers "how long in each status", never "in which stretches".
const meta: Meta = {
  title: 'Prototypes/Job Details/"Job Lifecycle" Module/Concept 2',
  ...conceptMeta,
};

export default meta;
type Story = StoryObj;

const s = conceptStates(Concept2, FULL_ROWS);

export const FreshJob: Story = s.FreshJob;
export const InProgress: Story = s.InProgress;
export const FullHistory: Story = s.FullHistory;
export const Collapsed: Story = s.Collapsed;
export const Mobile: Story = s.Mobile;
