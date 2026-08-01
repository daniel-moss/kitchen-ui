import type { Meta, StoryObj } from "@storybook/react";

import { DeviceFrame } from "../../stories/helpers";
import { Icon } from "../Icon/Icon";
import MenuItem from "../Menu/MenuItem";
import MenuItemGroup from "../Menu/MenuItemGroup";
import NavSidebarProfileButton from "./NavSidebarProfileButton";

const meta: Meta<typeof NavSidebarProfileButton> = {
  title: "Components/NavSidebar/NavSidebarProfileButton",
  component: NavSidebarProfileButton,
  parameters: { layout: "padded" },
  argTypes: {
    breakpoint: { control: "inline-radio", options: ["auto", "desktop", "mobile"] },
  },
};
export default meta;

type Story = StoryObj<typeof NavSidebarProfileButton>;

// The doc's profile menu content.
const profileGroups = (
  <>
    <MenuItemGroup>
      <MenuItem label="Settings" slotLeft={<Icon icon="gear" container="square" />} />
    </MenuItemGroup>
    <MenuItemGroup>
      <MenuItem label="Help center" slotLeft={<Icon icon="circle-question" container="square" />} />
      <MenuItem label="Contact support" slotLeft={<Icon icon="headset" container="square" />} />
      <MenuItem label="Request feature" slotLeft={<Icon icon="circle-info" container="square" />} />
      <MenuItem label="What's new" slotLeft={<Icon icon="bullhorn" container="square" />} />
    </MenuItemGroup>
    <MenuItemGroup>
      <MenuItem label="Log out" slotLeft={<Icon icon="arrow-right-from-bracket" container="square" />} danger />
    </MenuItemGroup>
  </>
);

/** Click the avatar — the profile menu opens 4px below, the button stays pressed. */
export const Playground: Story = {
  args: {
    name: "Lorne Riddle",
    email: "email@address.com",
    breakpoint: "desktop",
  },
  render: (args) => (
    <div style={{ minHeight: 420 }}>
      <NavSidebarProfileButton {...args}>{profileGroups}</NavSidebarProfileButton>
    </div>
  ),
};

/** Long name and e-mail truncate when the card reaches its max width (384). */
export const Truncation: Story = {
  render: () => (
    <div style={{ minHeight: 460 }}>
      <NavSidebarProfileButton
        name="Very long user name which does not fit 1 line of text"
        email="verylongemailaddresswhichdoesnotfitonelineoftext@address.com"
        defaultOpen
        breakpoint="desktop"
      >
        {profileGroups}
      </NavSidebarProfileButton>
    </div>
  ),
};

/** Button states (the open state doubles as pressed). */
export const States: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <NavSidebarProfileButton name="Default" breakpoint="desktop">
        {profileGroups}
      </NavSidebarProfileButton>
      <NavSidebarProfileButton name="Disabled" isDisabled breakpoint="desktop">
        {profileGroups}
      </NavSidebarProfileButton>
    </div>
  ),
};

/** Mobile: the menu is a drawer; avatar + name + e-mail sit in its header. */
export const Mobile: Story = {
  render: () => (
    <DeviceFrame>
      <div style={{ padding: 16 }}>
        <NavSidebarProfileButton name="Lorne Riddle" email="email@address.com" breakpoint="mobile">
          {profileGroups}
        </NavSidebarProfileButton>
      </div>
    </DeviceFrame>
  ),
};
