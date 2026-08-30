import type { Meta, StoryObj } from "@storybook/react";

import SelectListItemContent from "./SelectListItemContent";
import { SelectListItemContentProps } from "./SelectListItemContent.types";
import { Icon } from "../Icon/Icon";
import Avatar from "../Avatar/Avatar";

type LeftSlot = "none" | "icon" | "avatar";
type Extra = "none" | "caption" | "tag";

type StoryArgs = {
  label: string;
  extra: Extra;
  extraText: string;
  leftSlot: LeftSlot;
};

const cap: React.CSSProperties = { font: "var(--font-caption-medium-500)", color: "var(--text-subtle)" };
const frame: React.CSSProperties = { width: 249 };

const iconSlot = <Icon icon="diamonds-4" pack="regular" size={14} container="square" />;
const avatarSlot = <Avatar shape="circle" content="image" size="xs" />;
const leftSlots: Record<LeftSlot, React.ReactNode> = { none: undefined, icon: iconSlot, avatar: avatarSlot };

// caption / tag are mutually exclusive.
const extraProps = (extra: Extra, text: string): SelectListItemContentProps => (extra === "caption" ? { caption: text } : extra === "tag" ? { tag: text } : {});

/**
 * SelectListItemContent — an optional left slot (icon / xs avatar) plus the copy
 * (label + a caption below OR a tag on the right). Top-aligned.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/SelectList/SelectListItemContent",
  component: SelectListItemContent,
  parameters: { layout: "centered" },
  args: { label: "Option", extra: "none", extraText: "Caption", leftSlot: "none" },
  argTypes: {
    label: { type: "string", control: { type: "text" } },
    extra: { options: ["none", "caption", "tag"], control: { type: "inline-radio" } },
    extraText: { name: "caption / tag text", control: { type: "text" }, if: { arg: "extra", neq: "none" } },
    leftSlot: { name: "left slot", options: ["none", "icon", "avatar"], control: { type: "inline-radio" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: ({ label, extra, extraText, leftSlot }) => (
    <div style={frame}>
      <SelectListItemContent label={label} {...extraProps(extra, extraText)} slotLeft={leftSlots[leftSlot]} />
    </div>
  ),
};

/** Left slot (icon / avatar) across the copy combinations. */
export const Slots: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-4)", ...frame }}>
      <div>
        <span style={cap}>no slot</span>
        <SelectListItemContent label="Option" />
      </div>
      <div>
        <span style={cap}>icon</span>
        <SelectListItemContent slotLeft={iconSlot} label="Option" />
      </div>
      <div>
        <span style={cap}>avatar</span>
        <SelectListItemContent slotLeft={avatarSlot} label="Option" />
      </div>
      <div>
        <span style={cap}>icon + caption</span>
        <SelectListItemContent slotLeft={iconSlot} label="Option" caption="Caption" />
      </div>
      <div>
        <span style={cap}>avatar + tag</span>
        <SelectListItemContent slotLeft={avatarSlot} label="Option" tag="Tag" />
      </div>
      <div>
        <span style={cap}>icon + long label truncates</span>
        <SelectListItemContent slotLeft={iconSlot} label="A very long option name that does not fit one line" tag="Tag" />
      </div>
    </div>
  ),
};
