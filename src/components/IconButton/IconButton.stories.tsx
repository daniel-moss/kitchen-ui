import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame } from "../../stories/helpers";
import IconButton from "./IconButton";
import { IconButtonProps, IconButtonSize, IconButtonVariant } from "./IconButton.types";

// The visual states are mutually exclusive, so in the Playground we expose them
// as a single `state` select instead of separate boolean toggles (mirrors how
// Figma models `state`). Each option maps to the real boolean prop(s).
const STATE_PROPS = {
  default: {},
  hovered: { _isHovered: true },
  pressed: { isPressed: true },
  focused: { _isFocused: true },
  processing: { isProcessing: true },
  disabled: { isDisabled: true },
  loading: { isLoading: true },
} satisfies Record<string, Partial<IconButtonProps>>;

type IconButtonState = keyof typeof STATE_PROPS;
type StoryArgs = IconButtonProps & { state?: IconButtonState };

const SIZES: IconButtonSize[] = ["xxxs", "xxs", "xs", "sm", "md", "lg"];
const VARIANTS: IconButtonVariant[] = ["solid", "subtle", "ghost", "muted"];

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
  title: "Components/IconButton",
  component: IconButton,
  parameters: { layout: "fullscreen" },
  args: {
    size: "lg",
    variant: "solid",
    icon: "diamonds-4",
    "aria-label": "Placeholder",
  },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
    variant: { options: VARIANTS, control: { type: "select" } },
    // Real props, shown in the docs table but demoed through the `state` select.
    isDisabled: { control: false },
    isProcessing: { control: false },
    isLoading: { control: false },
    // Internal / story-only — hidden from the docs table.
    isPressed: { table: { disable: true } },
    _isHovered: { table: { disable: true } },
    _isFocused: { table: { disable: true } },
    className: { table: { disable: true } },
    iconClassName: { table: { disable: true } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Interactive icon button. Use the `state` select to preview each visual state. */
export const Playground: Story = {
  args: { state: "default" },
  argTypes: {
    state: {
      options: Object.keys(STATE_PROPS),
      control: { type: "select" },
      description: "Visual state — maps to the underlying boolean props.",
    },
  },
  parameters: { layout: "centered" },
  render: ({ state = "default", ...args }) => <IconButton {...args} {...STATE_PROPS[state]} />,
};

/** A single large ghost icon button. */
export const Hero: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={stack}>
        <IconButton size="lg" variant="ghost" icon="ellipsis" aria-label="More" />
      </div>
    </div>
  ),
};

/** The four styles. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={stack}>
        {VARIANTS.map((v) => (
          <div key={v} style={labeledItem}>
            <span style={cap}>{v}</span>
            <IconButton size="lg" variant={v} icon="diamonds-4" aria-label={v} />
          </div>
        ))}
      </div>
    </div>
  ),
};

/** The full square scale: 20, 22, 24, 28, 32, 36 px. The icon stays 14px throughout. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={stack}>
        {SIZES.map((s) => (
          <div key={s} style={labeledItem}>
            <span style={cap}>{s}</span>
            <IconButton size={s} variant="solid" icon="diamonds-4" aria-label={s} />
          </div>
        ))}
      </div>
    </div>
  ),
};

// States — one story per variant, each showing all 7 states.
const STATES: { label: string; props: Partial<IconButtonProps> }[] = [
  { label: "Default", props: {} },
  { label: "Hovered", props: { _isHovered: true } },
  { label: "Pressed", props: { isPressed: true } },
  { label: "Focused", props: { _isFocused: true } },
  { label: "Processing", props: { isProcessing: true } },
  { label: "Disabled", props: { isDisabled: true } },
  { label: "Loading", props: { isLoading: true } },
];

const statesStory = (variant: IconButtonVariant): Story => ({
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={stack}>
        {STATES.map((s) => (
          <div key={s.label} style={labeledItem}>
            <span style={cap}>{s.label}</span>
            <IconButton size="lg" variant={variant} icon="diamonds-4" aria-label={`${variant} ${s.label}`} {...s.props} />
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
/** Muted across all 7 states. */
export const StatesMuted = statesStory("muted");
