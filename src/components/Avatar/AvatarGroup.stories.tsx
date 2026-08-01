import { Fragment } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import AvatarGroup from "./AvatarGroup";
import { AvatarGroupItem, AvatarGroupProps, AvatarGroupSize } from "./AvatarGroup.types";
import { users } from "../../data/users";

const SIZES: AvatarGroupSize[] = ["xs", "sm", "md", "lg", "xl"];

const userItems = (n: number): AvatarGroupItem[] =>
  users.slice(0, n).map((u) => ({ kind: "user", content: "image", imageSrc: u.avatar, name: u.name }));

const liveItems = (n: number): AvatarGroupItem[] =>
  users.slice(0, n).map((u) => ({ kind: "live", content: "image", imageSrc: u.avatar, name: u.name }));

type StoryArgs = Omit<AvatarGroupProps, "items"> & { count?: number; useLive?: boolean };

/**
 * AvatarGroup — groups AvatarUser and live avatars. Two variations: inline
 * (overlapping cluster; every avatar but the last is masked) and stack (rows of
 * avatar + name). No addOns inside a group. Live avatars need md/lg/xl.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/AvatarGroup",
  component: AvatarGroup,
  parameters: { layout: "centered" },
  args: { variation: "inline", size: "md", count: 4, max: 0, useLive: false, isLoading: false },
  argTypes: {
    variation: { options: ["inline", "stack"], control: { type: "inline-radio" } },
    size: { options: SIZES, control: { type: "select" } },
    count: { control: { type: "number" }, description: "How many avatars (from the demo users)." },
    max: { control: { type: "number" }, description: "Max visible slots incl. counter (0 = no truncation)." },
    useLive: { control: { type: "boolean" }, description: "Use live avatars (needs md/lg/xl)." },
    isLoading: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

export const Playground: Story = {
  render: ({ count = 4, useLive, max, ...args }) => (
    <AvatarGroup {...args} items={(useLive ? liveItems : userItems)(count)} max={max || undefined} />
  ),
};

/** inline and stack across all sizes (2 avatars each), matching the Figma set. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: "inline-grid",
        gridTemplateColumns: "auto auto auto",
        gap: "var(--size-6) var(--size-8)",
        alignItems: "center",
        justifyItems: "start",
      }}
    >
      <span />
      <span style={labelStyle}>inline</span>
      <span style={labelStyle}>stack</span>
      {SIZES.map((size) => (
        <Fragment key={size}>
          <span style={labelStyle}>{size}</span>
          <AvatarGroup variation="inline" size={size} items={userItems(2)} />
          <AvatarGroup variation="stack" size={size} items={userItems(2)} />
        </Fragment>
      ))}
    </div>
  ),
};

/** Truncation: 8 users, max 5 slots → 4 avatars + a `+4` counter. */
export const Truncated: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)", alignItems: "flex-start" }}>
      <AvatarGroup variation="inline" size="md" items={userItems(8)} max={5} />
      <AvatarGroup variation="stack" size="md" items={userItems(8)} max={5} />
    </div>
  ),
};

/** Loading — avatars pulse; in stack, names become skeletons. */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)", alignItems: "flex-start" }}>
      <AvatarGroup variation="inline" size="md" items={userItems(4)} isLoading />
      <AvatarGroup variation="stack" size="md" items={userItems(3)} isLoading />
    </div>
  ),
};

/** Live avatars (md/lg/xl) — each gets a distinct collaboration ring color. */
export const Live: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)", alignItems: "flex-start" }}>
      <AvatarGroup variation="inline" size="lg" items={liveItems(4)} />
      <AvatarGroup variation="stack" size="lg" items={liveItems(3)} />
    </div>
  ),
};
