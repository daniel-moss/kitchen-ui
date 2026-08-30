import type { Meta, StoryObj } from "@storybook/react";

import { DocsFrame } from "../../stories/helpers";
import SidebarNavItem from "./SidebarNavItem";
import SidebarNavItemGroup from "./SidebarNavItemGroup";

const meta: Meta<typeof SidebarNavItemGroup> = {
  title: "Components/SidebarNav/SidebarNavItemGroup",
  component: SidebarNavItemGroup,
  // fullscreen — `DocsFrame` provides the (only) padding in docs stories.
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof SidebarNavItemGroup>;

const jobsItems = (
  <>
    <SidebarNavItem type="stackItem">Requests</SidebarNavItem>
    <SidebarNavItem type="stackItem">Jobs</SidebarNavItem>
    <SidebarNavItem type="stackItem">Series</SidebarNavItem>
  </>
);

export const Playground: Story = {
  args: {
    icon: "wrench-simple",
    label: "Jobs",
    defaultOpen: true,
  },
  render: (args) => (
    <DocsFrame>
      <SidebarNavItemGroup {...args}>{jobsItems}</SidebarNavItemGroup>
    </DocsFrame>
  ),
};

/** The hero example — an expanded group. Click the header to toggle it. */
export const Hero: Story = {
  render: () => (
    <DocsFrame>
      <SidebarNavItemGroup icon="wrench-simple" label="Jobs" defaultOpen>
        {jobsItems}
      </SidebarNavItemGroup>
    </DocsFrame>
  ),
};

/** Collapsed — only the header shows. */
export const Collapsed: Story = {
  render: () => (
    <DocsFrame>
      <SidebarNavItemGroup icon="wrench-simple" label="Jobs">
        {jobsItems}
      </SidebarNavItemGroup>
    </DocsFrame>
  ),
};

/** Expanded — header emphasized, items 1px apart. */
export const Expanded: Story = {
  render: () => (
    <DocsFrame>
      <SidebarNavItemGroup icon="wrench-simple" label="Jobs" defaultOpen>
        {jobsItems}
      </SidebarNavItemGroup>
    </DocsFrame>
  ),
};

/** An active page inside the stack (and the header carrying the active look). */
export const WithActiveItem: Story = {
  render: () => (
    <DocsFrame>
      <SidebarNavItemGroup icon="wrench-simple" label="Jobs" defaultOpen headerActive>
        <SidebarNavItem type="stackItem">Requests</SidebarNavItem>
        <SidebarNavItem type="stackItem" active>
          Jobs
        </SidebarNavItem>
        <SidebarNavItem type="stackItem">Series</SidebarNavItem>
      </SidebarNavItemGroup>
    </DocsFrame>
  ),
};
