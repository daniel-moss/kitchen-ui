import type { Meta, StoryObj } from "@storybook/react";

import { cap, DeviceFrame, DocsFrame, PSEUDO_ALL } from "../../stories/helpers";
import SidebarNavWorkspaceButton from "./SidebarNavWorkspaceButton";

const WORKSPACES = [
  { id: "1", name: "Workspace 1" },
  { id: "2", name: "Workspace 2" },
];

const meta: Meta<typeof SidebarNavWorkspaceButton> = {
  title: "Components/SidebarNav/SidebarNavWorkspaceButton",
  component: SidebarNavWorkspaceButton,
  // fullscreen — `DocsFrame` provides the (only) padding in docs stories.
  parameters: { layout: "fullscreen" },
  argTypes: {
    breakpoint: { control: "inline-radio", options: ["auto", "desktop", "mobile"] },
  },
};
export default meta;

type Story = StoryObj<typeof SidebarNavWorkspaceButton>;

/** Click the button — the workspace list opens 4px below; picking one closes it. */
export const Playground: Story = {
  args: {
    workspaces: WORKSPACES,
    breakpoint: "desktop",
  },
  render: (args) => (
    <DocsFrame>
      <div style={{ minHeight: 220 }}>
        <SidebarNavWorkspaceButton {...args} />
      </div>
    </DocsFrame>
  ),
};

/** The hero example — the closed button. */
export const Hero: Story = {
  render: () => (
    <DocsFrame>
      <SidebarNavWorkspaceButton workspaces={WORKSPACES} breakpoint="desktop" />
    </DocsFrame>
  ),
};

/** Every button state (pseudo classes; the open state doubles as pressed). */
export const States: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
        {[
          { label: "Default", cls: undefined as string | undefined, disabled: false },
          { label: "Focused", cls: PSEUDO_ALL.focus, disabled: false },
          { label: "Hovered", cls: PSEUDO_ALL.hover, disabled: false },
          { label: "Pressed", cls: PSEUDO_ALL.press, disabled: false },
          { label: "Disabled", cls: undefined, disabled: true },
        ].map((st) => (
          <div key={st.label} style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div className={st.cls}>
              <SidebarNavWorkspaceButton
                workspaces={[{ id: "1", name: st.label }, { id: "2", name: "Workspace 2" }]}
                isDisabled={st.disabled}
                breakpoint="desktop"
              />
            </div>
          </div>
        ))}
      </div>
    </DocsFrame>
  ),
};

/** A long name truncates; hovering it shows the full name in a tooltip. */
export const LongName: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ width: 180, minHeight: 220 }}>
        <SidebarNavWorkspaceButton
          workspaces={[
            { id: "1", name: "Roopairs Technologies Inc." },
            { id: "2", name: "Workspace 2" },
          ]}
          breakpoint="desktop"
        />
      </div>
    </DocsFrame>
  ),
};

/** One workspace only: non-interactive, no angles icon, no states. */
export const SingleWorkspace: Story = {
  render: () => (
    <DocsFrame>
      <SidebarNavWorkspaceButton workspaces={[{ id: "1", name: "Workspace" }]} breakpoint="desktop" />
    </DocsFrame>
  ),
};

/** No image: the workspace avatar shows the name's first character. */
export const AvatarFallback: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <SidebarNavWorkspaceButton workspaces={[{ id: "1", name: "Acme" }, { id: "2", name: "Other" }]} breakpoint="desktop" />
        <span style={cap}>No image — first character</span>
      </div>
    </DocsFrame>
  ),
};

/** Desktop: the list opens 4px below; the button stays pressed while it is open. */
export const ListDesktop: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ minHeight: 220 }}>
        <SidebarNavWorkspaceButton workspaces={WORKSPACES} defaultOpen breakpoint="desktop" />
      </div>
    </DocsFrame>
  ),
};

/** Mobile: the list is a drawer. */
export const ListMobile: Story = {
  render: () => (
    <DocsFrame>
      <DeviceFrame>
        <div style={{ padding: 16 }}>
          <SidebarNavWorkspaceButton workspaces={WORKSPACES} breakpoint="mobile" />
        </div>
      </DeviceFrame>
    </DocsFrame>
  ),
};
