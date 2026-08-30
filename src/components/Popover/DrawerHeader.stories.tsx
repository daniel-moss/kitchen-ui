import type { Meta, StoryObj } from "@storybook/react";

import DrawerHeader from "./DrawerHeader";
import { DrawerHeaderVariant } from "./DrawerHeader.types";
import PopoverHeaderContent from "./PopoverHeaderContent";
import PopoverHeaderText from "./PopoverHeaderText";
import { PopoverHeaderTextVariant } from "./PopoverHeaderText.types";
import Avatar from "../Avatar/Avatar";
import AvatarUser from "../Avatar/AvatarUser";
import AvatarBill from "../Avatar/AvatarBill";
import IconButton from "../IconButton/IconButton";

type AvatarChoice = "none" | "generic" | "user" | "bill";

type StoryArgs = {
  variant: DrawerHeaderVariant;
  back: boolean;
  close: boolean;
  textVariant: PopoverHeaderTextVariant;
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

const surface: React.CSSProperties = { width: 400 };

/**
 * DrawerHeader — header for drawers on mobile. A drag handle above a
 * PopoverHeader. The close button is only allowed in the bodyOnly variant (the
 * handle is the dismissal affordance otherwise).
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Popover/DrawerHeader",
  component: DrawerHeader,
  parameters: { layout: "centered" },
  args: {
    variant: "default",
    back: false,
    close: true,
    textVariant: "titleCaption",
    title: "Title",
    caption: "Caption",
    avatar: "generic",
    actionCount: 0,
  },
  argTypes: {
    variant: {
      options: ["default", "dragHandle", "bodyOnly"],
      control: { type: "inline-radio" },
    },
    back: { control: { type: "boolean" }, if: { arg: "variant", neq: "dragHandle" } },
    close: { control: { type: "boolean" }, if: { arg: "variant", eq: "bodyOnly" } },
    textVariant: {
      name: "text variant",
      options: ["title", "titleCaption", "titleCaptionReversed"],
      control: { type: "inline-radio" },
      if: { arg: "variant", neq: "dragHandle" },
    },
    title: { control: { type: "text" }, if: { arg: "variant", neq: "dragHandle" } },
    caption: { control: { type: "text" }, if: { arg: "variant", neq: "dragHandle" } },
    avatar: {
      options: ["none", "generic", "user", "bill"],
      control: { type: "inline-radio" },
      if: { arg: "variant", neq: "dragHandle" },
    },
    actionCount: {
      options: [0, 1, 2],
      control: { type: "inline-radio" },
      if: { arg: "variant", neq: "dragHandle" },
    },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

export const Playground: Story = {
  render: ({ variant, back, close, textVariant, title, caption, avatar, actionCount }) => (
    <div style={surface}>
      <DrawerHeader variant={variant} back={back} close={close}>
        {variant !== "dragHandle" && (
          <PopoverHeaderContent avatar={avatarEl(avatar)} actions={actionsEl(actionCount)}>
            <PopoverHeaderText variant={textVariant} title={title} caption={caption} />
          </PopoverHeaderContent>
        )}
      </DrawerHeader>
    </div>
  ),
};

/** The three variants. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const content = (
      <PopoverHeaderContent avatar={avatarEl("generic")}>
        <PopoverHeaderText variant="titleCaption" title="Title" caption="Caption" />
      </PopoverHeaderContent>
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
          <span style={labelStyle}>default (handle + body)</span>
          <div style={surface}>
            <DrawerHeader variant="default">{content}</DrawerHeader>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
          <span style={labelStyle}>dragHandle (handle only)</span>
          <div style={surface}>
            <DrawerHeader variant="dragHandle" />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
          <span style={labelStyle}>bodyOnly (close allowed)</span>
          <div style={surface}>
            <DrawerHeader variant="bodyOnly" close>
              {content}
            </DrawerHeader>
          </div>
        </div>
      </div>
    );
  },
};
