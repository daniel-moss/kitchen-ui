import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame } from "../../stories/helpers";
import Button from "./Button";
import { ButtonProps } from "./Button.types";

// The visual states are mutually exclusive, so in the Playground we expose them
// as a single `state` select instead of six separate boolean toggles (mirrors
// how Figma models `state`). Each option maps to the real boolean prop(s); the
// component API itself is unchanged.
const STATE_PROPS = {
  default: {},
  hovered: { _isHovered: true },
  pressed: { isPressed: true },
  focused: { _isFocused: true },
  processing: { isProcessing: true },
  disabled: { isDisabled: true },
  loading: { isLoading: true },
} satisfies Record<string, Partial<ButtonProps>>;

type ButtonState = keyof typeof STATE_PROPS;
type StoryArgs = ButtonProps & { state?: ButtonState };

// Docs examples: elements centered and stacked vertically, --size-20 (80px) apart.
const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--size-20)",
};
const labeledItem: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "var(--size-2)",
};

const meta: Meta<StoryArgs> = {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "fullscreen" },
  args: {
    size: "lg",
    variant: "solid",
    type: "button",
    children: "Button",
  },
  argTypes: {
    size: { options: ["sm", "md", "lg"], control: { type: "select" } },
    variant: { options: ["solid", "subtle", "danger", "ghost"], control: { type: "select" } },
    // Real props, shown in the docs table but demoed through the `state` select.
    isDisabled: { control: false },
    isProcessing: { control: false },
    isLoading: { control: false },
    // Internal / story-only — hidden from the docs table.
    isPressed: { table: { disable: true } },
    _isHovered: { table: { disable: true } },
    _isFocused: { table: { disable: true } },
    className: { table: { disable: true } },
    leftIconClassName: { table: { disable: true } },
    rightIconClassName: { table: { disable: true } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Interactive button. Use the `state` select to preview each visual state. */
export const Playground: Story = {
  args: { state: "default", leftIcon: "diamonds-4", rightIcon: "diamonds-4" },
  argTypes: {
    state: {
      options: Object.keys(STATE_PROPS),
      control: { type: "select" },
      description: "Visual state — maps to the underlying boolean props.",
    },
  },
  parameters: { layout: "centered" },
  render: ({ state = "default", ...args }) => <Button {...args} {...STATE_PROPS[state]} />,
};

/** A single large solid button. */
export const Hero: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={stack}>
        <Button size="lg" variant="solid">
          Button
        </Button>
      </div>
    </div>
  ),
};

const VARIANTS = ["solid", "subtle", "ghost", "danger"] as const;

/** The four styles, in descending emphasis. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={stack}>
        <Button size="lg" variant="solid">
          Solid
        </Button>
        <Button size="lg" variant="subtle">
          Subtle
        </Button>
        <Button size="lg" variant="ghost">
          Ghost
        </Button>
        <Button size="lg" variant="danger">
          Danger
        </Button>
      </div>
    </div>
  ),
};

/** Three heights: sm 28 · md 32 · lg 36 px. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={stack}>
        <Button size="sm" variant="solid">
          Small
        </Button>
        <Button size="md" variant="solid">
          Medium
        </Button>
        <Button size="lg" variant="solid">
          Large
        </Button>
      </div>
    </div>
  ),
};

/** An icon on the left, the right, or both (14px, same weight as the label). */
export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={stack}>
        <Button size="lg" variant="solid" leftIcon="plus">
          Left icon
        </Button>
        <Button size="lg" variant="solid" rightIcon="angle-right">
          Right icon
        </Button>
        <Button size="lg" variant="solid" leftIcon="plus" rightIcon="angle-right">
          Both icons
        </Button>
      </div>
    </div>
  ),
};

/** `isFullWidth` stretches the button to fill its container. */
export const FullWidth: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={stack}>
        <div style={{ width: 320, maxWidth: "100%" }}>
          <Button size="lg" variant="solid" isFullWidth>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  ),
};

// States — one story per variant, each showing all 7 states (labelled, since
// processing / loading hide the button text).
const STATES: { label: string; props: Partial<ButtonProps> }[] = [
  { label: "Default", props: {} },
  { label: "Hovered", props: { _isHovered: true } },
  { label: "Pressed", props: { isPressed: true } },
  { label: "Focused", props: { _isFocused: true } },
  { label: "Processing", props: { isProcessing: true } },
  { label: "Disabled", props: { isDisabled: true } },
  { label: "Loading", props: { isLoading: true } },
];

const statesStory = (variant: (typeof VARIANTS)[number]): Story => ({
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={stack}>
        {STATES.map((s) => (
          <div key={s.label} style={labeledItem}>
            <span style={cap}>{s.label}</span>
            <Button size="lg" variant={variant} {...s.props}>
              Button
            </Button>
          </div>
        ))}
      </div>
    </div>
  ),
});

/** Solid across all 7 states. */
export const StatesSolid = statesStory("solid");
/** Subtle across all 7 states. */
export const StatesSubtle = statesStory("subtle");
/** Ghost across all 7 states. */
export const StatesGhost = statesStory("ghost");
/** Danger across all 7 states. */
export const StatesDanger = statesStory("danger");
