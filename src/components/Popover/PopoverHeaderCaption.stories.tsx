import type { Meta, StoryObj } from "@storybook/react";

import PopoverHeaderCaption from "./PopoverHeaderCaption";
import { Icon } from "../Icon/Icon";

type StoryArgs = {
  caption: string;
  _showLeft?: boolean;
  _showRight?: boolean;
};

const placeholderIcon = <Icon icon="diamonds-4" pack="regular" size={14} />;

/**
 * PopoverHeaderCaption — the Caption part of a PopoverHeader. A caption with
 * optional left and right Icon slots.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Popover/PopoverHeader/Caption",
  component: PopoverHeaderCaption,
  parameters: { layout: "centered" },
  args: { caption: "Caption", _showLeft: false, _showRight: false },
  argTypes: {
    caption: { control: { type: "text" } },
    _showLeft: { name: "Left slot (icon)", control: { type: "boolean" } },
    _showRight: { name: "Right slot (icon)", control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

export const Playground: Story = {
  render: ({ caption, _showLeft, _showRight }) => (
    <div style={{ width: 260 }}>
      <PopoverHeaderCaption
        caption={caption}
        leftSlot={_showLeft ? placeholderIcon : undefined}
        rightSlot={_showRight ? placeholderIcon : undefined}
      />
    </div>
  ),
};

/** The four slot combinations (matches the Figma set), plus truncation. */
export const Variations: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const rows: { label: string; left?: boolean; right?: boolean }[] = [
      { label: "caption only" },
      { label: "right: icon", right: true },
      { label: "left: icon", left: true },
      { label: "left + right", left: true, right: true },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-4)", width: 240 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
            <span style={labelStyle}>{r.label}</span>
            <PopoverHeaderCaption
              caption="Caption"
              leftSlot={r.left ? placeholderIcon : undefined}
              rightSlot={r.right ? placeholderIcon : undefined}
            />
          </div>
        ))}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
          <span style={labelStyle}>truncated (ellipsis)</span>
          <PopoverHeaderCaption
            caption="A very long caption that does not fit and truncates"
            leftSlot={placeholderIcon}
            rightSlot={placeholderIcon}
          />
        </div>
      </div>
    );
  },
};
