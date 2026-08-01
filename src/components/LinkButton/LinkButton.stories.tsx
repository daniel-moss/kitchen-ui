import type { Meta, StoryObj } from "@storybook/react";

import LinkButton from "./LinkButton";
import { LinkButtonColorScheme, LinkButtonSize } from "./LinkButton.types";

type StoryArgs = {
  label: string;
  size: LinkButtonSize;
  colorScheme: LinkButtonColorScheme;
  showLeftIcon: boolean;
  showRightIcon: boolean;
  asLink: boolean;
  isDisabled: boolean;
  isLoading: boolean;
};

const SCHEMES: LinkButtonColorScheme[] = ["black", "gray", "blue", "jade", "amber", "tomato"];

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: "var(--size-6)", flexWrap: "wrap" };
const col: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-4)" };

/**
 * LinkButton — an inline, underlined text link styled as a button. Renders a
 * real <a> when given an `href` (navigation), otherwise a <button> (action).
 * The label is always underlined; the underline disappears while interacting.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/LinkButton",
  component: LinkButton,
  parameters: { layout: "centered" },
  args: {
    label: "Button",
    size: "md",
    colorScheme: "black",
    showLeftIcon: false,
    showRightIcon: false,
    asLink: false,
    isDisabled: false,
    isLoading: false,
  },
  argTypes: {
    label: { control: { type: "text" } },
    size: { options: ["sm", "md"], control: { type: "inline-radio" } },
    colorScheme: { options: SCHEMES, control: { type: "inline-radio" } },
    showLeftIcon: { name: "left icon", control: { type: "boolean" } },
    showRightIcon: { name: "right icon", control: { type: "boolean" } },
    asLink: { name: "render as <a>", control: { type: "boolean" } },
    isDisabled: { control: { type: "boolean" } },
    isLoading: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: ({ label, size, colorScheme, showLeftIcon, showRightIcon, asLink, isDisabled, isLoading }) => (
    <LinkButton
      size={size}
      colorScheme={colorScheme}
      leftIcon={showLeftIcon ? "plus" : undefined}
      rightIcon={showRightIcon ? "arrow-up-right" : undefined}
      href={asLink ? "#" : undefined}
      isDisabled={isDisabled}
      isLoading={isLoading}
    >
      {label}
    </LinkButton>
  ),
};

/** md (14/20) and sm (13/20). */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={row}>
      <LinkButton size="md">Button md</LinkButton>
      <LinkButton size="sm">Button sm</LinkButton>
    </div>
  ),
};

/** The six color schemes (text + icon color). */
export const ColorSchemes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={col}>
      {SCHEMES.map((scheme) => (
        <div key={scheme} style={row}>
          <span style={{ ...labelStyle, width: 64 }}>{scheme}</span>
          <LinkButton colorScheme={scheme} rightIcon="arrow-up-right">
            Button
          </LinkButton>
        </div>
      ))}
    </div>
  ),
};

/** Optional left and/or right icons (14px, inherit the link color). */
export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={row}>
      <LinkButton leftIcon="plus">Left icon</LinkButton>
      <LinkButton rightIcon="arrow-up-right">Right icon</LinkButton>
      <LinkButton leftIcon="plus" rightIcon="arrow-up-right">
        Both
      </LinkButton>
    </div>
  ),
};

/** Interaction states (forced here so they show without real interaction). */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={col}>
      {(
        [
          ["default", {}],
          ["hover (75%)", { _isHovered: true }],
          ["press (60%)", { isPressed: true }],
          ["focus (ring + 75%)", { _isFocused: true }],
          ["disabled (30%)", { isDisabled: true }],
        ] as const
      ).map(([label, stateProps]) => (
        <div key={label} style={row}>
          <span style={{ ...labelStyle, width: 140 }}>{label}</span>
          <LinkButton colorScheme="blue" rightIcon="arrow-up-right" {...stateProps}>
            Button
          </LinkButton>
        </div>
      ))}
    </div>
  ),
};

/** Loading — label becomes a skeleton bar, icons fade to pulsing circles. */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={col}>
      <div style={row}>
        <span style={{ ...labelStyle, width: 64 }}>md</span>
        <LinkButton isLoading>Button</LinkButton>
        <LinkButton isLoading leftIcon="plus" rightIcon="arrow-up-right">
          Button
        </LinkButton>
      </div>
      <div style={row}>
        <span style={{ ...labelStyle, width: 64 }}>sm</span>
        <LinkButton size="sm" isLoading>
          Button
        </LinkButton>
        <LinkButton size="sm" isLoading leftIcon="plus" rightIcon="arrow-up-right">
          Button
        </LinkButton>
      </div>
    </div>
  ),
};
