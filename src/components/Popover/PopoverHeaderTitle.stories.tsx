import type { Meta, StoryObj } from "@storybook/react";

import PopoverHeaderTitle from "./PopoverHeaderTitle";
import { Icon } from "../Icon/Icon";
import HintTrigger from "../Hint/HintTrigger";

// Storybook-friendly controls for the slots (the component itself takes nodes).
type StoryArgs = {
  title: string;
  _showLeft?: boolean;
  _showRight?: boolean;
  _rightType?: "icon" | "hintTrigger";
};

const placeholderIcon = <Icon icon="diamonds-4" pack="regular" size={14} />;

/**
 * PopoverHeaderTitle — the Title part of a PopoverHeader. A title with optional
 * left slot (Icon) and right slot (Icon or HintTrigger). Everything else in the
 * header comes later.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Popover/PopoverHeader/Title",
  component: PopoverHeaderTitle,
  parameters: { layout: "centered" },
  args: { title: "Title", _showLeft: false, _showRight: false, _rightType: "icon" },
  argTypes: {
    title: { control: { type: "text" } },
    _showLeft: { name: "Left slot (icon)", control: { type: "boolean" } },
    _showRight: { name: "Right slot", control: { type: "boolean" } },
    _rightType: {
      name: "Right slot type",
      options: ["icon", "hintTrigger"],
      control: { type: "inline-radio" },
      if: { arg: "_showRight", truthy: true },
    },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

const rightSlot = (type: "icon" | "hintTrigger") =>
  type === "hintTrigger" ? <HintTrigger /> : placeholderIcon;

export const Playground: Story = {
  render: ({ title, _showLeft, _showRight, _rightType = "icon" }) => (
    <div style={{ width: 260 }}>
      <PopoverHeaderTitle
        title={title}
        leftSlot={_showLeft ? placeholderIcon : undefined}
        rightSlot={_showRight ? rightSlot(_rightType) : undefined}
      />
    </div>
  ),
};

/** The four slot combinations (matches the Figma set), plus a HintTrigger and truncation. */
export const Variations: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const rows: { label: string; left?: boolean; right?: "icon" | "hintTrigger" }[] = [
      { label: "title only" },
      { label: "right: icon", right: "icon" },
      { label: "left: icon", left: true },
      { label: "left + right", left: true, right: "icon" },
      { label: "right: hintTrigger", right: "hintTrigger" },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-4)", width: 240 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
            <span style={labelStyle}>{r.label}</span>
            <PopoverHeaderTitle
              title="Title"
              leftSlot={r.left ? placeholderIcon : undefined}
              rightSlot={r.right ? rightSlot(r.right) : undefined}
            />
          </div>
        ))}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
          <span style={labelStyle}>truncated (ellipsis)</span>
          <PopoverHeaderTitle
            title="A very long title that does not fit and truncates"
            leftSlot={placeholderIcon}
            rightSlot={rightSlot("icon")}
          />
        </div>
      </div>
    );
  },
};
