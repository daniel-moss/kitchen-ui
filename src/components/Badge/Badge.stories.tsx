import { Fragment } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import Badge from "./Badge";
import { BadgeProps, BadgeSize } from "./Badge.types";
import { users } from "../../data/users";

const SIZES: BadgeSize[] = ["sm", "md", "lg"];

// The left slot is presence-based on the component (leftIcon / avatarSrc). In
// Storybook we expose it as a friendlier nested control: a show/hide toggle,
// then a type radio, then (for icon) the icon name.
type StoryArgs = BadgeProps & { _showLeftSlot?: boolean; _slotType?: "icon" | "avatar" };

/**
 * Badge — a small bordered chip for a short label, with an optional left slot
 * (icon or avatar) and an optional dismiss button. Composes Icon, Avatar, and
 * SkeletonTypography. Transparent fill — sits on any surface.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  args: {
    size: "md",
    children: "Badge",
    isDismissable: true,
    isLoading: false,
    _showLeftSlot: true,
    _slotType: "icon",
    leftIcon: "diamonds-4",
  },
  argTypes: {
    size: { options: SIZES, control: { type: "inline-radio" } },
    children: { control: { type: "text" } },
    leftIconColor: { control: { type: "text" } },
    isDismissable: { control: { type: "boolean" } },
    isLoading: { control: { type: "boolean" } },

    // Nested left-slot controls.
    _showLeftSlot: { name: "Left slot", control: { type: "boolean" } },
    _slotType: {
      name: "Slot type",
      options: ["icon", "avatar"],
      control: { type: "inline-radio" },
      if: { arg: "_showLeftSlot", truthy: true },
    },
    leftIcon: {
      name: "Icon name",
      control: { type: "text" },
      if: { arg: "_slotType", eq: "icon" },
    },
    avatarSrc: { table: { disable: true } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

export const Playground: Story = {
  render: ({ _showLeftSlot, _slotType, leftIcon, avatarSrc, ...args }) => (
    <Badge
      {...args}
      leftIcon={_showLeftSlot && _slotType === "icon" ? leftIcon || "diamonds-4" : undefined}
      avatarSrc={_showLeftSlot && _slotType === "avatar" ? avatarSrc || users[0].avatar : undefined}
    />
  ),
};

const COLS: { label: string; props: Parameters<typeof Badge>[0] }[] = [
  { label: "none", props: {} },
  { label: "icon", props: { leftIcon: "diamonds-4" } },
  { label: "avatar", props: { avatarSrc: users[0].avatar } },
  { label: "dismiss", props: { leftIcon: "diamonds-4", isDismissable: true } },
  { label: "loading", props: { leftIcon: "diamonds-4", isLoading: true } },
];

/** Sizes × left slot / dismiss / loading. */
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: "inline-grid",
        gridTemplateColumns: `auto repeat(${COLS.length}, auto)`,
        gap: "var(--size-4)",
        alignItems: "center",
        justifyItems: "start",
      }}
    >
      <span />
      {COLS.map((c) => (
        <span key={c.label} style={labelStyle}>
          {c.label}
        </span>
      ))}
      {SIZES.map((size) => (
        <Fragment key={size}>
          <span style={labelStyle}>{size}</span>
          {COLS.map((c) => (
            <Badge key={c.label} size={size} {...c.props}>
              Badge
            </Badge>
          ))}
        </Fragment>
      ))}
    </div>
  ),
};
