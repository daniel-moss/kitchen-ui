import type { Meta, StoryObj } from "@storybook/react";

import PopoverHeader from "./PopoverHeader";
import PopoverHeaderContent from "./PopoverHeaderContent";
import PopoverHeaderText from "./PopoverHeaderText";
import { PopoverHeaderTextVariant } from "./PopoverHeaderText.types";
import Avatar from "../Avatar/Avatar";
import AvatarUser from "../Avatar/AvatarUser";
import AvatarBill from "../Avatar/AvatarBill";
import IconButton from "../IconButton/IconButton";

type AvatarChoice = "none" | "generic" | "user" | "bill";

type StoryArgs = {
  back: boolean;
  close: boolean;
  variant: PopoverHeaderTextVariant;
  title: string;
  caption: string;
  avatar: AvatarChoice;
  actionCount: number;
};

const avatarEl = (choice: AvatarChoice) => {
  if (choice === "generic") return <Avatar type="object" content="icon" size="xl" />;
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

// The pure header — no surface. Just a width so it has room to lay out.
const surface: React.CSSProperties = { width: 400 };

/**
 * PopoverHeader — the full header: the Body row (back · content · close) plus a
 * bottom Divider. Sits on a popover surface (Dialog, SidePanel, etc.).
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Popover/PopoverHeader",
  component: PopoverHeader,
  parameters: { layout: "centered" },
  args: {
    back: false,
    close: true,
    variant: "titleCaption",
    title: "Title",
    caption: "Caption",
    avatar: "generic",
    actionCount: 0,
  },
  argTypes: {
    back: { control: { type: "boolean" } },
    close: { control: { type: "boolean" } },
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

export const Playground: Story = {
  render: ({ back, close, variant, title, caption, avatar, actionCount }) => (
    <div style={surface}>
      <PopoverHeader back={back} close={close}>
        <PopoverHeaderContent avatar={avatarEl(avatar)} actions={actionsEl(actionCount)}>
          <PopoverHeaderText variant={variant} title={title} caption={caption} />
        </PopoverHeaderContent>
      </PopoverHeader>
    </div>
  ),
};

/** A few representative headers. */
export const Examples: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)" }}>
      <div style={surface}>
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverHeaderText variant="title" title="Plan details" />
          </PopoverHeaderContent>
        </PopoverHeader>
      </div>

      <div style={surface}>
        <PopoverHeader back close>
          <PopoverHeaderContent avatar={avatarEl("user")} actions={actionsEl(1)}>
            <PopoverHeaderText variant="titleCaption" title="Lorne Riddle" caption="Owner" />
          </PopoverHeaderContent>
        </PopoverHeader>
      </div>

      <div style={surface}>
        <PopoverHeader close>
          <PopoverHeaderContent avatar={avatarEl("bill")}>
            <PopoverHeaderText
              variant="titleCaption"
              title="A very long invoice title that truncates"
              caption="Outstanding"
            />
          </PopoverHeaderContent>
        </PopoverHeader>
      </div>
    </div>
  ),
};
