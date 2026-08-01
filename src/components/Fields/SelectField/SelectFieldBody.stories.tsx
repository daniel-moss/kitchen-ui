import type { Meta, StoryObj } from "@storybook/react";

import SelectFieldBody from "./SelectFieldBody";
import { Icon } from "../../Icon/Icon";
import Avatar from "../../Avatar/Avatar";

type LeftSlot = "none" | "icon" | "avatar";

type StoryArgs = {
  value: string;
  leftSlot: LeftSlot;
  suffix: string;
};

const cap: React.CSSProperties = { font: "var(--font-caption-medium-500)", color: "var(--text-subtle)" };
const frame: React.CSSProperties = { width: 309 };

const iconSlot = <Icon icon="diamonds-4" pack="regular" size={14} container="square" />;
const avatarSlot = <Avatar type="user" content="image" size="xs" />;
const leftSlots: Record<LeftSlot, React.ReactNode> = { none: undefined, icon: iconSlot, avatar: avatarSlot };

/**
 * SelectFieldBody — the inner content row of a SelectField: an optional left
 * slot (icon / user avatar), the value (truncates), and an optional suffix.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Fields/SelectField/SelectFieldBody",
  component: SelectFieldBody,
  parameters: { layout: "centered" },
  args: { value: "Value", leftSlot: "none", suffix: "" },
  argTypes: {
    value: { control: { type: "text" } },
    leftSlot: { options: ["none", "icon", "avatar"], control: { type: "inline-radio" } },
    suffix: { control: { type: "text" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: ({ value, leftSlot, suffix }) => (
    <div style={frame}>
      <SelectFieldBody value={value} slotLeft={leftSlots[leftSlot]} suffix={suffix || undefined} />
    </div>
  ),
};

/** The four slot combinations (Figma's slotLeft × slotRight matrix). */
export const Slots: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-4)", ...frame }}>
      <div>
        <span style={cap}>value only</span>
        <SelectFieldBody value="Value" />
      </div>
      <div>
        <span style={cap}>value + suffix</span>
        <SelectFieldBody value="Value" suffix="Suffix" />
      </div>
      <div>
        <span style={cap}>icon + value</span>
        <SelectFieldBody value="Value" slotLeft={iconSlot} />
      </div>
      <div>
        <span style={cap}>avatar + value + suffix</span>
        <SelectFieldBody value="Value" slotLeft={avatarSlot} suffix="Suffix" />
      </div>
      <div>
        <span style={cap}>long value truncates (slots stay)</span>
        <SelectFieldBody value="A very long selected value that does not fit on one line" slotLeft={avatarSlot} suffix="Suffix" />
      </div>
    </div>
  ),
};
