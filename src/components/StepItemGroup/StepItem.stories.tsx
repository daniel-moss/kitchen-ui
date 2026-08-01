import type { Meta, StoryObj } from "@storybook/react";

import StepItem from "./StepItem";
import { StepItemProgress } from "./StepItem.types";
import { cap, docsFrame, noop } from "../../stories/helpers";

type StoryArgs = {
  progress: StepItemProgress;
  label: string;
  interactive: boolean;
  isDisabled: boolean;
  isLoading: boolean;
};

const PROGRESSES: StepItemProgress[] = ["incompleted", "current", "completed", "warning", "error"];

// Figma labels each status by name; the type value "incompleted" reads "Incomplete".
const STATUS_LABEL: Record<StepItemProgress, string> = {
  incompleted: "Incomplete",
  current: "Current",
  completed: "Completed",
  warning: "Warning",
  error: "Error",
};

// One step at a fixed width, centered in the docs frame.
const One = ({ width = 160, children }: { width?: number; children: React.ReactNode }) => (
  <div style={{ ...docsFrame, display: "flex", justifyContent: "center" }}>
    <div style={{ width }}>{children}</div>
  </div>
);

/**
 * StepItem — a single step in a StepItemGroup. A 2px status line on top, then a
 * status icon + truncated label. Interactive (a button with hover/focus/press)
 * when given an onClick — in a stepper the completed and error steps get one.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/StepItemGroup/StepItem",
  component: StepItem,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Build any progress + state from the controls. */
export const Playground: Story = {
  parameters: { layout: "centered" },
  args: { progress: "current", label: "Step", interactive: false, isDisabled: false, isLoading: false },
  argTypes: {
    progress: { options: PROGRESSES, control: { type: "inline-radio" } },
    label: { control: { type: "text" } },
    interactive: { name: "interactive (onClick)", control: { type: "boolean" } },
    isDisabled: { control: { type: "boolean" } },
    isLoading: { control: { type: "boolean" } },
  },
  render: ({ progress, label, interactive, isDisabled, isLoading }) => (
    <div style={{ width: 160 }}>
      <StepItem progress={progress} label={label} onClick={interactive ? noop : undefined} isDisabled={isDisabled} isLoading={isLoading} />
    </div>
  ),
};

/** A single step — status icon, label, and the 2px status line on top. */
export const Anatomy: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <One>
      <StepItem progress="current" label="Step" />
    </One>
  ),
};

/** A step fills its container until it reaches its 104px min-width. */
export const Responsiveness: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-6)", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)", alignItems: "center" }}>
        <span style={cap}>fills its container</span>
        <div style={{ width: 280 }}>
          <StepItem progress="current" label="Step" />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)", alignItems: "center" }}>
        <span style={cap}>min width (104px)</span>
        <div style={{ width: 104 }}>
          <StepItem progress="current" label="Step" />
        </div>
      </div>
    </div>
  ),
};

/** The five statuses, one under another (as in Figma). */
export const Statuses: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-10)", alignItems: "center" }}>
      {PROGRESSES.map((progress) => (
        <div key={progress} style={{ width: 240 }}>
          <StepItem progress={progress} label={STATUS_LABEL[progress]} />
        </div>
      ))}
    </div>
  ),
};

/** A long label truncates; hover it to see the full text in a tooltip. */
export const Text: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <One width={130}>
      <StepItem progress="current" label="Configuration and review" />
    </One>
  ),
};

/** Interactive states (a completed step) — forced here to show without interaction. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-4)" }}>
      {(
        [
          ["default", {}],
          ["hover", { _isHovered: true }],
          ["focus", { _isFocused: true }],
          ["pressed", { isPressed: true }],
          ["disabled", { isDisabled: true }],
        ] as const
      ).map(([name, stateProps]) => (
        <div key={name} style={{ display: "flex", alignItems: "center", gap: "var(--size-4)" }}>
          <span style={{ ...cap, width: 72 }}>{name}</span>
          <div style={{ width: 160 }}>
            <StepItem progress="completed" label="Step" onClick={noop} {...stateProps} />
          </div>
        </div>
      ))}
    </div>
  ),
};

/** Loading looks the same across every status. */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <One>
      <StepItem progress="completed" label="Step" isLoading />
    </One>
  ),
};
