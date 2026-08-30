import { ReactNode } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame } from "../../stories/helpers";
import { users, initials } from "../../data/users";

import { AvatarSize } from "./Avatar.types";
import AvatarUser from "./AvatarUser";

const SIZES: AvatarSize[] = ["xxs", "xs", "sm", "md", "lg", "xl"];
// The icon addOn (the crown) is not used on xxs.
const ADDON_SIZES: AvatarSize[] = ["xs", "sm", "md", "lg", "xl"];

// The docs preview frame: examples sit centered inside it, bottom-aligned so a
// size row reads as one baseline (mirrors the Figma Documentation previews).
const frame = (node: ReactNode) => (
  <div style={docsFrame}>
    <div
      style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "var(--size-6)" }}
    >
      {node}
    </div>
  </div>
);

/**
 * AvatarUser — an Avatar template: a circle avatar with user-based content
 * (image, letters, user icon, placeholder, counter), a loading state and the
 * primary-contact crown.
 */
const meta: Meta<typeof AvatarUser> = {
  title: "Components/Avatar/AvatarUser",
  component: AvatarUser,
  // fullscreen — the docs stories' own `docsFrame` provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: { size: "md", content: "image", characters: "AB", count: 2, isPrimary: false, isLoading: false },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
    content: {
      options: ["image", "letters", "icon", "placeholder", "counter"],
      control: { type: "select" },
    },
    characters: { if: { arg: "content", eq: "letters" } },
    imageSrc: { if: { arg: "content", eq: "image" } },
    count: { control: { type: "number" }, if: { arg: "content", eq: "counter" } },
  },
};
export default meta;

type Story = StoryObj<typeof AvatarUser>;

export const Playground: Story = {
  render: (args) => frame(<AvatarUser {...args} />),
};

/** The image variant at every size — an upload or a Gravatar picture. */
export const Image: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    frame(
      <>
        {SIZES.map((size, i) => (
          <AvatarUser key={size} size={size} imageSrc={users[i].avatar} />
        ))}
      </>,
    ),
};

/** Initials — one letter up to xs, two from sm up. "Lorne Riddle" → LR. */
export const Letters: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    frame(
      <>
        {SIZES.map((size) => (
          <AvatarUser key={size} size={size} content="letters" characters={initials(users[0])} />
        ))}
      </>,
    ),
};

/** The locked user icon — the fallback when there is no image and no name. */
export const UserIcon: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    frame(
      <>
        {SIZES.map((size) => (
          <AvatarUser key={size} size={size} content="icon" />
        ))}
      </>,
    ),
};

/** The empty slot — a dashed ring around the user icon. */
export const Placeholder: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    frame(
      <>
        {SIZES.map((size) => (
          <AvatarUser key={size} size={size} content="placeholder" />
        ))}
      </>,
    ),
};

/** The `+N` overflow slot of a truncated group. Not used on xxs. */
export const Counter: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    frame(
      <>
        {ADDON_SIZES.map((size) => (
          <AvatarUser key={size} size={size} content="counter" count={3} />
        ))}
      </>,
    ),
};

/** Loading — the user-icon variant, pulsing. */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    frame(
      <>
        {SIZES.map((size) => (
          <AvatarUser key={size} size={size} isLoading />
        ))}
      </>,
    ),
};

/** A primary contact gets the crown addOn. Not used on xxs. */
export const Primary: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    frame(
      <>
        {ADDON_SIZES.map((size, i) => (
          <AvatarUser key={size} size={size} imageSrc={users[i].avatar} isPrimary />
        ))}
      </>,
    ),
};
