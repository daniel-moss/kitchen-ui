import type { Meta, StoryObj } from "@storybook/react";

import { cap, DeviceFrame, DocsFrame, PSEUDO_ALL } from "../../stories/helpers";
import { Icon } from "../Icon/Icon";
import MenuItem from "../Menu/MenuItem";
import MenuItemGroup from "../Menu/MenuItemGroup";
import SidebarNavProfileButton from "./SidebarNavProfileButton";

const meta: Meta<typeof SidebarNavProfileButton> = {
  title: "Components/SidebarNav/SidebarNavProfileButton",
  component: SidebarNavProfileButton,
  // fullscreen — `DocsFrame` provides the (only) padding in docs stories.
  parameters: { layout: "fullscreen" },
  argTypes: {
    breakpoint: { control: "inline-radio", options: ["auto", "desktop", "mobile"] },
  },
};
export default meta;

type Story = StoryObj<typeof SidebarNavProfileButton>;

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
    <DocsFrame>
      <div style={{ minHeight: 420 }}>
        <SidebarNavProfileButton {...args}>{profileGroups}</SidebarNavProfileButton>
      </div>
    </DocsFrame>
  ),
};

/** The hero example — the closed button. */
export const Hero: Story = {
  render: () => (
    <DocsFrame>
      <SidebarNavProfileButton name="Lorne Riddle" email="email@address.com" breakpoint="desktop">
        {profileGroups}
      </SidebarNavProfileButton>
    </DocsFrame>
  ),
};

/** Every button state (pseudo classes; the open state doubles as pressed). */
export const States: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[
          { label: "Default", cls: undefined as string | undefined, disabled: false },
          { label: "Focused", cls: PSEUDO_ALL.focus, disabled: false },
          { label: "Hovered", cls: PSEUDO_ALL.hover, disabled: false },
          { label: "Pressed", cls: PSEUDO_ALL.press, disabled: false },
          { label: "Disabled", cls: undefined, disabled: true },
        ].map((st) => (
          <div key={st.label} style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div className={st.cls}>
              <SidebarNavProfileButton name="Lorne Riddle" isDisabled={st.disabled} breakpoint="desktop">
                {profileGroups}
              </SidebarNavProfileButton>
            </div>
            <span style={cap}>{st.label}</span>
          </div>
        ))}
      </div>
    </DocsFrame>
  ),
};

/** Desktop: the menu card 4px below; the button stays pressed while it is open. */
export const MenuDesktop: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ minHeight: 420 }}>
        <SidebarNavProfileButton name="Lorne Riddle" email="email@address.com" defaultOpen breakpoint="desktop">
          {profileGroups}
        </SidebarNavProfileButton>
      </div>
    </DocsFrame>
  ),
};

/** Mobile: the menu is a drawer; avatar + name + e-mail sit in its header. */
export const MenuMobile: Story = {
  render: () => (
    <DocsFrame>
      <DeviceFrame>
        <div style={{ padding: 16 }}>
          <SidebarNavProfileButton name="Lorne Riddle" email="email@address.com" breakpoint="mobile">
            {profileGroups}
          </SidebarNavProfileButton>
        </div>
      </DeviceFrame>
    </DocsFrame>
  ),
};

/** Long name and e-mail truncate when the card reaches its max width (384). */
export const Truncation: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ minHeight: 460 }}>
        <SidebarNavProfileButton
          name="Very long user name which does not fit 1 line of text"
          email="verylongemailaddresswhichdoesnotfitonelineoftext@address.com"
          defaultOpen
          breakpoint="desktop"
        >
          {profileGroups}
        </SidebarNavProfileButton>
      </div>
    </DocsFrame>
  ),
};
