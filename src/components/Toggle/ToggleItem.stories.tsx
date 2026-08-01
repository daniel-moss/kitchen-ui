import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame, noop } from "../../stories/helpers";
import ToggleItem from "./ToggleItem";

// Figma's two axes: `active` (on/off) and `state` (the interaction state).
type ActiveOption = "off" | "on";
type StateOption = "default" | "focused" | "hovered" | "pressed" | "error" | "disabled" | "readOnly";

type StoryArgs = {
  active: ActiveOption;
  state: StateOption | "loading";
  label: string;
  caption: string;
};

const ACTIVE_OPTIONS: ActiveOption[] = ["off", "on"];
// Figma's ladder order; loading is shown on its own, below the ladders.
const STATE_OPTIONS: StateOption[] = ["default", "focused", "hovered", "pressed", "error", "disabled", "readOnly"];
const PLAYGROUND_STATES = [...STATE_OPTIONS, "loading"];

// The whole row is the `.control`; marking every descendant forces its state.
const PSEUDO: Record<string, string> = {
  hovered: "pseudo-hover-all",
  pressed: "pseudo-active-all",
  focused: "pseudo-focus-visible-all",
};

// Each ladder row labels itself with the state name (Figma's convention).
const LADDER_LABELS: Record<StateOption, string> = {
  default: "Default",
  focused: "Focused",
  hovered: "Hovered",
  pressed: "Pressed",
  error: "Error",
  disabled: "Disabled",
  readOnly: "Read only",
};

const stateProps = (state: string) => ({
  error: state === "error",
  disabled: state === "disabled",
  readOnly: state === "readOnly",
  loading: state === "loading",
});

/**
 * ToggleItem — a toggle on the left with a Label (and optional caption) on the
 * right. The whole row is one control; clicking anywhere flips it.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Toggle/ToggleItem",
  component: ToggleItem,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<StoryArgs>;

// One forced value + state combination (noop onChange suppresses the controlled-
// input warning without dimming the toggle; the pseudo classes force states).
const Forced = ({ active, state, label, caption }: { active: ActiveOption; state: string; label: string; caption?: string }) => (
  <div className={PSEUDO[state]}>
    <ToggleItem checked={active === "on"} onChange={noop} {...stateProps(state)} label={label} caption={caption} />
  </div>
);

// Docs frame — a stacked column at --size-20 (80px), centered like the Figma
// previews.
const centeredColumn: React.CSSProperties = {
  ...docsFrame,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "var(--size-20)",
};

// The docs ladder: all 7 states of one value, each labelled with its name.
const Ladder = ({ active }: { active: ActiveOption }) => (
  <div style={{ ...centeredColumn, alignItems: "center" }}>
    {STATE_OPTIONS.map((state) => (
      <Forced key={state} active={active} state={state} label={LADDER_LABELS[state]} />
    ))}
  </div>
);

/** Use the controls to preview any value + state combination. */
export const Playground: Story = {
  // The synthetic playground args/argTypes live on THIS story (not the meta) so
  // the docs-page ArgTypes table stays pure docgen from ToggleItem.types.ts.
  parameters: { layout: "centered" },
  args: {
    active: "off",
    state: "default",
    label: "Label",
    caption: "",
  },
  argTypes: {
    active: { options: ACTIVE_OPTIONS, control: { type: "inline-radio" } },
    state: { options: PLAYGROUND_STATES, control: { type: "select" } },
    label: { control: { type: "text" } },
    caption: { control: { type: "text" } },
  },
  render: ({ active, state, label, caption }) => (
    <div style={{ width: 260 }}>
      <Forced active={active} state={state} label={label} caption={caption || undefined} />
    </div>
  ),
};

/** Live — click anywhere on the row to flip it. */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", justifyContent: "center" }}>
      <ToggleItem defaultChecked label="Label" />
    </div>
  ),
};

/** With a caption — 2px below the label, no gap. */
export const AnatomyCaption: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", justifyContent: "center" }}>
      <div style={{ width: 160 }}>
        <ToggleItem defaultChecked label="Label" caption="Caption" />
      </div>
    </div>
  ),
};

/** The label and caption wrap when they do not fit one line. */
export const TextWraps: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", justifyContent: "center" }}>
      <div style={{ width: 240 }}>
        <ToggleItem
          defaultChecked
          label="Very long label which does not fit one line"
          caption="Very long caption which does not fit one line"
        />
      </div>
    </div>
  ),
};

/** Off (inactive) across all 7 states — the entire item is interactive. */
export const Inactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Ladder active="off" />,
};

/** On (active) across all 7 states. */
export const Active: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Ladder active="on" />,
};

/** Loading — one skeleton line without a caption, two with it. */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...centeredColumn, gap: "var(--size-10)" }}>
      <div style={{ width: 240 }}>
        <ToggleItem loading label="Label" />
      </div>
      <div style={{ width: 240 }}>
        <ToggleItem loading label="Label" caption="Caption" />
      </div>
    </div>
  ),
};
