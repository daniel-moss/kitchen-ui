import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame } from "../../stories/helpers";
import Radio from "./Radio";

// Figma's two axes: `active` (the value) and `state` (the interaction state).
type ActiveOption = "unselected" | "selected";
type StateOption = "default" | "focused" | "hovered" | "pressed" | "error" | "disabled" | "loading";

type StoryArgs = {
  active: ActiveOption;
  state: StateOption;
};

const ACTIVE_OPTIONS: ActiveOption[] = ["unselected", "selected"];
const STATE_OPTIONS: StateOption[] = ["default", "focused", "hovered", "pressed", "error", "disabled", "loading"];

// Ancestor classes the pseudo-states addon rewrites CSS against — the radio is
// the only interactive element, so the cascade forces exactly its state.
const PSEUDO: Partial<Record<StateOption, string>> = {
  hovered: "pseudo-hover-all",
  pressed: "pseudo-active-all",
  focused: "pseudo-focus-visible-all",
};

const STATE_CAPTIONS: Record<StateOption, string> = {
  default: "default",
  focused: "focused (keyboard only)",
  hovered: "hovered",
  pressed: "pressed",
  error: "error",
  disabled: "disabled",
  loading: "loading",
};

const activeProps = (active: ActiveOption) => ({ checked: active === "selected" });
const stateProps = (state: StateOption) => ({
  error: state === "error",
  disabled: state === "disabled",
  loading: state === "loading",
});

/**
 * Radio — a 16px circle with a center dot on selected states. The bare circle
 * only — a labeled row is RadioItem. Used inside RadioItem and radio-like local
 * components. Single-select (no indeterminate).
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Radio/Radio",
  component: Radio,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<StoryArgs>;

// One forced value + state combination (readOnly suppresses the controlled-
// input warning; the pseudo classes force hover/press/focus).
const Forced = ({ active, state }: StoryArgs) => (
  <div className={PSEUDO[state]}>
    <Radio {...activeProps(active)} {...stateProps(state)} readOnly />
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

// The docs ladder: all 7 states of one value.
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
  // the docs-page ArgTypes table stays pure docgen from Radio.types.ts.
  parameters: { layout: "centered" },
  args: {
    active: "unselected",
    state: "default",
  },
  argTypes: {
    active: { options: ACTIVE_OPTIONS, control: { type: "inline-radio" } },
    state: { options: STATE_OPTIONS, control: { type: "select" } },
  },
  render: ({ active, state }) => <Forced active={active} state={state} />,
};

/** Live — a single-select group; click to move the selection and see the dot scale in. */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", justifyContent: "center", gap: "var(--size-4)" }}>
      <Radio name="radio-hero" aria-label="One" defaultChecked />
      <Radio name="radio-hero" aria-label="Two" />
      <Radio name="radio-hero" aria-label="Three" />
    </div>
  ),
};

/** The two values: an empty circle, and the dark circle with a center dot. */
export const Anatomy: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={centeredColumn}>
      {ACTIVE_OPTIONS.map((active) => (
        <div key={active} style={captionBlock}>
          <span style={cap}>{active}</span>
          <Forced active={active} state="default" />
        </div>
      ))}
    </div>
  ),
};

/** Unselected across all 7 states. */
export const Unselected: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Ladder active="unselected" />,
};

/** Selected across all 7 states — hover/press do not change the filled circle, only focus adds the ring. */
export const Selected: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Ladder active="selected" />,
};
