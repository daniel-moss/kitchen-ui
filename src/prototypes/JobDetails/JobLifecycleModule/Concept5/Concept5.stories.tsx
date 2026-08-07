import type { Meta, StoryObj } from "@storybook/react";

import Concept5 from "./Concept5";
import { conceptMeta, conceptStates } from "../conceptStories";
import { FULL_CHRONO_ROWS } from "../lifecycleData";

// CONCEPT 5 — the CHRONOLOGICAL break-down — the one concept that does not aggregate. Every stretch in the order the job moved through them, so a status entered twice appears twice. Truncated behind "Show N more".
const meta: Meta = {
  title: 'Prototypes/Job Details/"Job Lifecycle" Module/Concept 5',
  ...conceptMeta,
};

export default meta;
type Story = StoryObj;

const s = conceptStates(Concept5, FULL_CHRONO_ROWS);

export const FreshJob: Story = s.FreshJob;
export const InProgress: Story = s.InProgress;
export const FullHistory: Story = s.FullHistory;
export const Truncated: Story = { ...s.Collapsed, name: "Truncated" };
export const Mobile: Story = s.Mobile;
