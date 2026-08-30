import type { Meta, StoryObj } from "@storybook/react";

import PopoverHeaderContent from "./PopoverHeaderContent";
import PopoverHeaderText from "./PopoverHeaderText";
import { PopoverHeaderTextVariant } from "./PopoverHeaderText.types";
import Avatar from "../Avatar/Avatar";
import AvatarUser from "../Avatar/AvatarUser";
import AvatarBill from "../Avatar/AvatarBill";
import IconButton from "../IconButton/IconButton";

type AvatarChoice = "none" | "generic" | "user" | "bill";

type StoryArgs = {
  variant: PopoverHeaderTextVariant;
  title: string;
  caption: string;
  avatar: AvatarChoice;
  actionCount: number;
};

const avatarEl = (choice: AvatarChoice) => {
  if (choice === "generic") return <Avatar shape="square" content="icon" size="xl" />;
  if (choice === "user") return <AvatarUser size="xl" content="image" />;
  if (choice === "bill") return <AvatarBill size="xl" status="paid" />;
  return undefined;
};

const actionsEl = (count: number) =>
  count > 0
    ? Array.from({ length: count }).map((_, i) => (
        <IconButton key={i} variant="ghost" size="md" aria-label={`Action ${i + 1}`} />
      ))
    : undefined;

/**
 * PopoverHeaderContent — the Content of a PopoverHeader: an optional xl Avatar
 * (left), the Text block, and up to 2 md ghost IconButtons (right).
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Popover/PopoverHeader/Content",
  component: PopoverHeaderContent,
  parameters: { layout: "centered" },
  args: {
    variant: "titleCaption",
    title: "Title",
    caption: "Caption",
    avatar: "generic",
    actionCount: 1,
  },
  argTypes: {
    variant: {
      options: ["title", "titleCaption", "titleCaptionReversed"],
      control: { type: "inline-radio" },
    },
    title: { control: { type: "text" } },
    caption: { control: { type: "text" }, if: { arg: "variant", neq: "title" } },
    avatar: { options: ["none", "generic", "user", "bill"], control: { type: "inline-radio" } },
    actionCount: { options: [0, 1, 2], control: { type: "inline-radio" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

export const Playground: Story = {
  render: ({ variant, title, caption, avatar, actionCount }) => (
    <div style={{ width: 340 }}>
      <PopoverHeaderContent avatar={avatarEl(avatar)} actions={actionsEl(actionCount)}>
        <PopoverHeaderText variant={variant} title={title} caption={caption} />
      </PopoverHeaderContent>
    </div>
  ),
};

/** avatar × actions (matches the Figma set). */
export const Variations: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const rows: { label: string; avatar: AvatarChoice; actions: number }[] = [
      { label: "text only", avatar: "none", actions: 0 },
      { label: "+ actions", avatar: "none", actions: 2 },
      { label: "+ avatar", avatar: "generic", actions: 0 },
      { label: "avatar + actions", avatar: "generic", actions: 2 },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)", width: 340 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
            <span style={labelStyle}>{r.label}</span>
            <PopoverHeaderContent avatar={avatarEl(r.avatar)} actions={actionsEl(r.actions)}>
              <PopoverHeaderText variant="titleCaption" title="Title" caption="Caption" />
            </PopoverHeaderContent>
          </div>
        ))}
      </div>
    );
  },
};
