import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame } from "../../stories/helpers";
import Checkbox from "./Checkbox";

// Figma's two axes: `active` (the value) and `state` (the interaction state).
type ActiveOption = "unchecked" | "checked" | "indeterminate";
type StateOption = "default" | "focused" | "hovered" | "pressed" | "error" | "disabled" | "loading";

type StoryArgs = {
  active: ActiveOption;
  state: StateOption;
};

// Figma's value order: false, intermediate, true.
const ACTIVE_OPTIONS: ActiveOption[] = ["unchecked", "indeterminate", "checked"];
const STATE_OPTIONS: StateOption[] = ["default", "focused", "hovered", "pressed", "error", "disabled", "loading"];

// Ancestor classes the pseudo-states addon rewrites CSS against — the checkbox is
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

const activeProps = (active: ActiveOption) => ({
  checked: active === "checked",
  indeterminate: active === "indeterminate",
});
const stateProps = (state: StateOption) => ({
  error: state === "error",
  disabled: state === "disabled",
  loading: state === "loading",
});

/**
 * Checkbox — a 16px box with a check (checked) or hyphen (indeterminate)
 * glyph. The bare box only — a labeled row is CheckboxItem. Used inside
 * CheckboxItem and checkbox-like local components.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Checkbox/Checkbox",
  component: Checkbox,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<StoryArgs>;

// One forced value + state combination (readOnly suppresses the controlled-
// input warning; the pseudo classes force hover/press/focus).
const Forced = ({ active, state }: StoryArgs) => (
  <div className={PSEUDO[state]}>
    <Checkbox {...activeProps(active)} {...stateProps(state)} readOnly />
  </div>
);

// Docs frames — content is CENTERED, like the Figma previews (Daniel,
// 2026-07-30): a stacked column at --size-20 (80px), and a caption block.
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
  // the docs-page ArgTypes table stays pure docgen from Checkbox.types.ts.
  parameters: { layout: "centered" },
  args: {
    active: "unchecked",
    state: "default",
  },
  argTypes: {
    active: { options: ACTIVE_OPTIONS, control: { type: "inline-radio" } },
    state: { options: STATE_OPTIONS, control: { type: "select" } },
  },
  render: ({ active, state }) => <Forced active={active} state={state} />,
};

/** Live — click to toggle and see the check scale in and out. */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", justifyContent: "center" }}>
      <Checkbox aria-label="Checkbox" defaultChecked />
    </div>
  ),
};

/** The three values: empty square, hyphen icon, check icon. */
export const Values: Story = {
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

/** Unchecked across all 7 states. */
export const Unchecked: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Ladder active="unchecked" />,
};

/** Indeterminate across all 7 states — hover/press do not change the filled box. */
export const Indeterminate: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Ladder active="indeterminate" />,
};

/** Checked across all 7 states — hover/press do not change the filled box. */
export const Checked: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Ladder active="checked" />,
};
