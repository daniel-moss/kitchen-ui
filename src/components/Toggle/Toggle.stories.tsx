import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame } from "../../stories/helpers";
import Toggle from "./Toggle";

// Figma's two axes: `active` (on/off) and `state` (the interaction state).
type ActiveOption = "off" | "on";
type StateOption = "default" | "focused" | "hovered" | "pressed" | "error" | "disabled";

type StoryArgs = {
  active: ActiveOption;
  state: StateOption | "loading";
};

const ACTIVE_OPTIONS: ActiveOption[] = ["off", "on"];
// Figma's ladder order; loading is shown on its own, below the ladders.
const STATE_OPTIONS: StateOption[] = ["default", "focused", "hovered", "pressed", "error", "disabled"];
const PLAYGROUND_STATES = [...STATE_OPTIONS, "loading"];

// Ancestor classes the pseudo-states addon rewrites CSS against — the toggle is
// the only interactive element, so the cascade forces exactly its state.
const PSEUDO: Record<string, string> = {
  hovered: "pseudo-hover-all",
  pressed: "pseudo-active-all",
  focused: "pseudo-focus-visible-all",
};

const STATE_CAPTIONS: Record<string, string> = {
  default: "default",
  focused: "focused (keyboard only)",
  hovered: "hovered",
  pressed: "pressed",
  error: "error",
  disabled: "disabled",
  loading: "loading",
};

const stateProps = (state: string) => ({
  error: state === "error",
  disabled: state === "disabled",
  loading: state === "loading",
});

/**
 * Toggle — a 34×22 switch (on/off). The bare switch only; a labelled row is
 * ToggleItem. Used inside ToggleItem and toggle-like local components.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Toggle/Toggle",
  component: Toggle,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<StoryArgs>;

// One forced value + state combination (readOnly suppresses the controlled-
// input warning; the pseudo classes force hover/press/focus).
const Forced = ({ active, state }: { active: ActiveOption; state: string }) => (
  <div className={PSEUDO[state]}>
    <Toggle checked={active === "on"} {...stateProps(state)} readOnly aria-label={`${active} ${state}`} />
  </div>
);

// Docs frames — content is CENTERED, like the Figma previews: a stacked column
// at --size-20 (80px), and a caption block.
const centeredColumn: React.CSSProperties = {
  ...docsFrame,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "var(--size-20)",
};
const captionBlock: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "var(--size-2)",
};

// The docs ladder: all 6 states of one value.
const Ladder = ({ active }: { active: ActiveOption }) => (
  <div style={centeredColumn}>
    {STATE_OPTIONS.map((state) => (
      <div key={state} style={captionBlock}>
        <span style={cap}>{STATE_CAPTIONS[state]}</span>
        <Forced active={active} state={state} />
      </div>
    ))}
  </div>
);

/** Use the controls to preview any value + state combination. */
export const Playground: Story = {
  // The synthetic playground args/argTypes live on THIS story (not the meta) so
  // the docs-page ArgTypes table stays pure docgen from Toggle.types.ts.
  parameters: { layout: "centered" },
  args: {
    active: "off",
    state: "default",
  },
  argTypes: {
    active: { options: ACTIVE_OPTIONS, control: { type: "inline-radio" } },
    state: { options: PLAYGROUND_STATES, control: { type: "select" } },
  },
  render: ({ active, state }) => <Forced active={active} state={state} />,
};

/** Live — click to slide the knob across. */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", justifyContent: "center" }}>
      <Toggle aria-label="Toggle" defaultChecked />
    </div>
  ),
};

/** The track and the sliding knob (shown on). */
export const Anatomy: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", justifyContent: "center" }}>
      <Toggle checked readOnly aria-label="Toggle" />
    </div>
  ),
};

/** Off (inactive) across all 6 states. */
export const Inactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Ladder active="off" />,
};

/** On (active) across all 6 states — hover/press do not change the on track. */
export const Active: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Ladder active="on" />,
};

/** Loading — a plain --gray-a3 track with no knob and the busy cursor. */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", justifyContent: "center" }}>
      <Toggle loading aria-label="Loading" />
    </div>
  ),
};
