import type { Meta, StoryObj } from "@storybook/react";

import ListItemSlotIcon from "./ListItemSlotIcon";
import { cap } from "../../stories/helpers";

type StoryArgs = {
  icon: string;
};

const meta: Meta<StoryArgs> = {
  title: "Components/ListItem/ListItemSlotIcon",
  component: ListItemSlotIcon,
  parameters: { layout: "centered" },
  args: { icon: "angle-right" },
  argTypes: {
    icon: { type: "string", control: { type: "text" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: (args) => <ListItemSlotIcon {...args} />,
};

/** The two Figma instances: open, and open in a separate tab. */
export const Instances: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", gap: "var(--size-6)", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-1)" }}>
        <ListItemSlotIcon icon="angle-right" />
        <span style={cap}>iconOpen</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-1)" }}>
        <ListItemSlotIcon icon="arrow-up-right" />
        <span style={cap}>iconOpenInSeparateTab</span>
      </div>
    </div>
  ),
};
