import { ReactNode } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame } from "../../stories/helpers";

import ProgressBar from "./ProgressBar";

// The docs preview frame. The bar takes the full width it is given, so the
// examples stack with room to breathe.
const frame = (node: ReactNode, gap = "var(--size-8)") => (
  <div style={docsFrame}>
    <div style={{ display: "flex", flexDirection: "column", gap }}>{node}</div>
  </div>
);

/**
 * ProgressBar — a horizontal line that fills from left to right. Fixed 4px
 * height, width from the container.
 */
const meta: Meta<typeof ProgressBar> = {
  title: "Components/Progress/ProgressBar",
  component: ProgressBar,
  // fullscreen — the docs stories' own `docsFrame` provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: { value: 75, isLoading: false, isDecorative: false },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    color: { control: { type: "text" } },
  },
};
export default meta;

type Story = StoryObj<typeof ProgressBar>;

export const Playground: Story = {
  render: (args) => frame(<ProgressBar {...args} />),
};

/** The two layers: the track and the progress line inside it. */
export const Anatomy: Story = {
  parameters: { controls: { disable: true } },
  render: () => frame(<ProgressBar value={75} />),
};

/** The line grows from left to right until it fills the bar, which equals 100%. */
export const Behavior: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    frame(
      <>
        {[0, 50, 100].map((v) => (
          <div key={v} style={{ display: "flex", flexDirection: "column", gap: "var(--size-2)" }}>
            <span style={cap}>{v}%</span>
            <ProgressBar value={v} />
          </div>
        ))}
      </>,
    ),
};

/** The progress line takes any color. The track stays the same. */
export const Colors: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    frame(
      <>
        {[
          ["var(--violet-9)", "violet-9"],
          ["var(--jade-9)", "jade-9"],
        ].map(([token, label]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: "var(--size-2)" }}>
            <span style={cap}>{label}</span>
            <ProgressBar value={75} color={token} />
          </div>
        ))}
      </>,
    ),
};

/** Loading — the empty bar with the standard pulsing animation. */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => frame(<ProgressBar isLoading />),
};
