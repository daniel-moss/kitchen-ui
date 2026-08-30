import type { Meta, StoryObj } from "@storybook/react";

import PopoverHeaderBody from "./PopoverHeaderBody";
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

// Body is not the final component — no card border/radius here, just a width.
const surface: React.CSSProperties = { width: 380 };

/**
 * PopoverHeaderBody — the Body row: an optional back button, the Content, and an
 * optional close button. Hovering the close button always shows a "Close"
 * tooltip (top, above everything).
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Popover/PopoverHeader/Body",
  component: PopoverHeaderBody,
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

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

export const Playground: Story = {
  render: ({ back, close, variant, title, caption, avatar, actionCount }) => (
    <div style={surface}>
      <PopoverHeaderBody back={back} close={close}>
        <PopoverHeaderContent avatar={avatarEl(avatar)} actions={actionsEl(actionCount)}>
          <PopoverHeaderText variant={variant} title={title} caption={caption} />
        </PopoverHeaderContent>
      </PopoverHeaderBody>
    </div>
  ),
};

/** back × close (matches the Figma set). Hover the close button for its tooltip. */
export const Variations: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const rows: { label: string; back: boolean; close: boolean }[] = [
      { label: "back + close", back: true, close: true },
      { label: "close only", back: false, close: true },
      { label: "back only", back: true, close: false },
      { label: "neither", back: false, close: false },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)" }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
            <span style={labelStyle}>{r.label}</span>
            <div style={surface}>
              <PopoverHeaderBody back={r.back} close={r.close}>
                <PopoverHeaderContent avatar={avatarEl("generic")}>
                  <PopoverHeaderText variant="titleCaption" title="Title" caption="Caption" />
                </PopoverHeaderContent>
              </PopoverHeaderBody>
            </div>
          </div>
        ))}
      </div>
    );
  },
};
