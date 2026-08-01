import type { Meta, StoryObj } from "@storybook/react";

import PopoverHeaderText from "./PopoverHeaderText";
import { PopoverHeaderTextVariant } from "./PopoverHeaderText.types";
import { Icon } from "../Icon/Icon";
import HintTrigger from "../Hint/HintTrigger";

const VARIANTS: PopoverHeaderTextVariant[] = ["title", "titleCaption", "titleCaptionReversed"];

const icon = <Icon icon="diamonds-4" pack="regular" size={14} />;

type StoryArgs = {
  variant: PopoverHeaderTextVariant;
  title: string;
  caption: string;
  _titleLeft?: boolean;
  _titleRight?: "none" | "icon" | "hintTrigger";
  _captionLeft?: boolean;
  _captionRight?: boolean;
};

/**
 * PopoverHeaderText — the Text block of a PopoverHeader: Title with an optional
 * Caption below (or above). Composes the Title and Caption parts.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Popover/PopoverHeader/Text",
  component: PopoverHeaderText,
  parameters: { layout: "centered" },
  args: {
    variant: "titleCaption",
    title: "Title",
    caption: "Caption",
    _titleLeft: false,
    _titleRight: "none",
    _captionLeft: false,
    _captionRight: false,
  },
  argTypes: {
    variant: { options: VARIANTS, control: { type: "inline-radio" } },
    title: { control: { type: "text" } },
    caption: { control: { type: "text" }, if: { arg: "variant", neq: "title" } },
    _titleLeft: { name: "Title left (icon)", control: { type: "boolean" } },
    _titleRight: {
      name: "Title right",
      options: ["none", "icon", "hintTrigger"],
      control: { type: "inline-radio" },
    },
    _captionLeft: { name: "Caption left (icon)", control: { type: "boolean" }, if: { arg: "variant", neq: "title" } },
    _captionRight: { name: "Caption right (icon)", control: { type: "boolean" }, if: { arg: "variant", neq: "title" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

const titleRight = (t: "none" | "icon" | "hintTrigger") =>
  t === "hintTrigger" ? <HintTrigger /> : t === "icon" ? icon : undefined;

export const Playground: Story = {
  render: ({ variant, title, caption, _titleLeft, _titleRight = "none", _captionLeft, _captionRight }) => (
    <div style={{ width: 260 }}>
      <PopoverHeaderText
        variant={variant}
        title={title}
        caption={caption}
        titleLeftSlot={_titleLeft ? icon : undefined}
        titleRightSlot={titleRight(_titleRight)}
        captionLeftSlot={_captionLeft ? icon : undefined}
        captionRightSlot={_captionRight ? icon : undefined}
      />
    </div>
  ),
};

/** The three variants. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)", width: 240 }}>
      {VARIANTS.map((variant) => (
        <div key={variant} style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
          <span style={labelStyle}>{variant}</span>
          <PopoverHeaderText variant={variant} title="Title" caption="Caption" />
        </div>
      ))}
    </div>
  ),
};
