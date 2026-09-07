import type { Meta, StoryObj } from "@storybook/react";

import PopoverFooterText from "./PopoverFooterText";

type StoryArgs = {
  children: string;
  icon: string;
  color: string;
  iconColor: string;
};

/**
 * PopoverFooterText — the display-only text for PopoverFooter's left slot:
 * an optional 14px regular icon plus a body-500-compact label that truncates
 * with an ellipsis. Never interactive. The label and the icon are colored
 * independently; both default to --text-strong.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Popover/PopoverFooter/Text",
  component: PopoverFooterText,
  parameters: { layout: "centered" },
  args: { children: "May, 2027", icon: "calendar", color: "", iconColor: "" },
  argTypes: {
    children: { control: { type: "text" } },
    icon: { control: { type: "text" } },
    color: { control: { type: "text" } },
    iconColor: { control: { type: "text" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: ({ children, icon, color, iconColor }) => (
    // A capped container so long labels show the ellipsis behavior.
    <div style={{ maxWidth: 240 }}>
      <PopoverFooterText icon={icon || undefined} color={color || undefined} iconColor={iconColor || undefined}>
        {children}
      </PopoverFooterText>
    </div>
  ),
};
