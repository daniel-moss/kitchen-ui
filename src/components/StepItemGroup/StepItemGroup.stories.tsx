import type { Meta, StoryObj } from "@storybook/react";

import StepItemGroup from "./StepItemGroup";
import StepItem from "./StepItem";
import { StepItemProgress } from "./StepItem.types";
import { cap, docsFrame, noop } from "../../stories/helpers";

type StoryArgs = {
  count: number;
  current: number;
  interactive: boolean;
};

// Build `count` steps: before current = completed, current = current, after = incompleted.
const makeSteps = (count: number, current: number, interactive = false) =>
  Array.from({ length: count }).map((_, i) => {
    const progress: StepItemProgress = i < current ? "completed" : i === current ? "current" : "incompleted";
    return (
      <StepItem
        key={i}
        progress={progress}
        label={`Step ${i + 1}`}
        onClick={interactive && progress === "completed" ? noop : undefined}
      />
    );
  });

/**
 * StepItemGroup — a row of StepItems laid out as a stepper: a hairline band, a
 * centered stack (max 528px), steps stretching equally into one continuous bar.
 * When steps no longer fit, the stack scrolls horizontally and auto-centers the
 * current step.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/StepItemGroup/StepItemGroup",
  component: StepItemGroup,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Build any count + current step from the controls. */
export const Playground: Story = {
  parameters: { layout: "padded" },
  args: { count: 4, current: 1, interactive: true },
  argTypes: {
    count: { options: [2, 3, 4, 5, 6], control: { type: "inline-radio" } },
    current: { control: { type: "number", min: 0 } },
    interactive: { name: "completed clickable", control: { type: "boolean" } },
  },
  render: ({ count, current, interactive }) => (
    <div style={{ width: 640 }}>
      <StepItemGroup>{makeSteps(count, Math.min(current, count - 1), interactive)}</StepItemGroup>
    </div>
  ),
};

/** A stepper — a hairline band with a centered stack of steps. */
export const Anatomy: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <StepItemGroup>{makeSteps(4, 1)}</StepItemGroup>
    </div>
  ),
};

/** The stack fills the band up to its 528px cap, centered; 2–5 steps. */
export const Quantities: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-6)" }}>
      {[2, 3, 4, 5].map((count) => (
        <div key={count} style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
          <span style={cap}>qty {count}</span>
          <StepItemGroup>{makeSteps(count, 1)}</StepItemGroup>
        </div>
      ))}
    </div>
  ),
};

/**
 * When steps hit their 104px min-width, they go beyond the container and it
 * scrolls horizontally — the current step is auto-centered. Here 7 steps in a
 * narrow container.
 */
export const Overflow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={{ maxWidth: 380, margin: "0 auto" }}>
        <StepItemGroup>{makeSteps(7, 4, true)}</StepItemGroup>
      </div>
    </div>
  ),
};

/** Completed steps are clickable (jump back); the current and later steps are not. */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <StepItemGroup>{makeSteps(4, 2, true)}</StepItemGroup>
    </div>
  ),
};
