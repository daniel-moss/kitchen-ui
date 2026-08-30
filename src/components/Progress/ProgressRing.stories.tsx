import { ReactNode } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame } from "../../stories/helpers";

import ProgressRing from "./ProgressRing";

// The docs preview frame: the rings sit centered in a row.
const frame = (node: ReactNode) => (
  <div style={docsFrame}>
    <div
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--size-20)" }}
    >
      {node}
    </div>
  </div>
);

const column = (label: string, node: ReactNode) => (
  <div
    key={label}
    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-3)" }}
  >
    {node}
    <span style={cap}>{label}</span>
  </div>
);

/**
 * ProgressRing — a ring that fills clockwise. One fixed 16×16 size, for tight
 * places where a full-width bar does not fit.
 */
const meta: Meta<typeof ProgressRing> = {
  title: "Components/Progress/ProgressRing",
  component: ProgressRing,
  // fullscreen — the docs stories' own `docsFrame` provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: { value: 75, isLoading: false },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    color: { control: { type: "text" } },
  },
};
export default meta;

type Story = StoryObj<typeof ProgressRing>;

export const Playground: Story = {
  render: (args) => frame(<ProgressRing {...args} />),
};

/** The two layers: the background ring and the progress ring over it. */
export const Anatomy: Story = {
  parameters: { controls: { disable: true } },
  render: () => frame(<ProgressRing value={75} />),
};

/** The ring grows clockwise until it closes the full circle, which equals 100%. */
export const Behavior: Story = {
  parameters: { controls: { disable: true } },
  render: () => frame(<>{[0, 50, 100].map((v) => column(`${v}%`, <ProgressRing value={v} />))}</>),
};

/** The progress ring takes any color. The background ring stays the same. */
export const Colors: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    frame(
      <>
        {column("tomato-9", <ProgressRing value={25} color="var(--tomato-9)" />)}
        {column("amber-9", <ProgressRing value={50} color="var(--amber-9)" />)}
        {column("jade-9", <ProgressRing value={100} color="var(--jade-9)" />)}
      </>,
    ),
};

/** Loading — the empty ring with the standard pulsing animation. */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => frame(<ProgressRing isLoading />),
};
