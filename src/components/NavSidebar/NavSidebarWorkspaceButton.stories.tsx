import type { Meta, StoryObj } from "@storybook/react";

import { DeviceFrame } from "../../stories/helpers";
import NavSidebarWorkspaceButton from "./NavSidebarWorkspaceButton";

const WORKSPACES = [
  { id: "1", name: "Workspace 1" },
  { id: "2", name: "Workspace 2" },
];

const meta: Meta<typeof NavSidebarWorkspaceButton> = {
  title: "Components/NavSidebar/NavSidebarWorkspaceButton",
  component: NavSidebarWorkspaceButton,
  parameters: { layout: "padded" },
  argTypes: {
    breakpoint: { control: "inline-radio", options: ["auto", "desktop", "mobile"] },
  },
};
export default meta;

type Story = StoryObj<typeof NavSidebarWorkspaceButton>;

/** Click the button — the workspace list opens 4px below; picking one closes it. */
export const Playground: Story = {
  args: {
    workspaces: WORKSPACES,
    breakpoint: "desktop",
  },
  render: (args) => (
    <div style={{ minHeight: 220 }}>
      <NavSidebarWorkspaceButton {...args} />
    </div>
  ),
};

/** One workspace only: non-interactive, no angles icon, no states. */
export const SingleWorkspace: Story = {
  render: () => (
    <NavSidebarWorkspaceButton workspaces={[{ id: "1", name: "Workspace" }]} breakpoint="desktop" />
  ),
};

/** A long name truncates (full name in a tooltip on hover). */
export const LongName: Story = {
  render: () => (
    <div style={{ width: 180, minHeight: 220 }}>
      <NavSidebarWorkspaceButton
        workspaces={[
          { id: "1", name: "Roopairs Technologies Inc." },
          { id: "2", name: "Workspace 2" },
        ]}
        breakpoint="desktop"
      />
    </div>
  ),
};

/** Disabled. */
export const Disabled: Story = {
  render: () => <NavSidebarWorkspaceButton workspaces={WORKSPACES} isDisabled breakpoint="desktop" />,
};

/** Mobile: the list is a drawer. */
export const Mobile: Story = {
  render: () => (
    <DeviceFrame>
      <div style={{ padding: 16 }}>
        <NavSidebarWorkspaceButton workspaces={WORKSPACES} breakpoint="mobile" />
      </div>
    </DeviceFrame>
  ),
};
