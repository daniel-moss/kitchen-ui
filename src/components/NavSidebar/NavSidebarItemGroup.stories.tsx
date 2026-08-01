import type { Meta, StoryObj } from "@storybook/react";

import NavSidebarItem from "./NavSidebarItem";
import NavSidebarItemGroup from "./NavSidebarItemGroup";

const meta: Meta<typeof NavSidebarItemGroup> = {
  title: "Components/NavSidebar/NavSidebarItemGroup",
  component: NavSidebarItemGroup,
  parameters: { layout: "padded" },
  argTypes: {
    breakpoint: { control: "inline-radio", options: ["auto", "desktop", "mobile"] },
  },
};
export default meta;

type Story = StoryObj<typeof NavSidebarItemGroup>;

const jobsItems = (
  <>
    <NavSidebarItem type="stackItem">Job requests</NavSidebarItem>
    <NavSidebarItem type="stackItem">Jobs</NavSidebarItem>
    <NavSidebarItem type="stackItem">Job series</NavSidebarItem>
  </>
);

/** The doc's example — click the header to open and close the stack. */
export const Playground: Story = {
  args: {
    icon: "wrench-simple",
    label: "Jobs",
    defaultOpen: true,
    breakpoint: "desktop",
  },
  render: (args) => (
    <div style={{ width: 280 }}>
      <NavSidebarItemGroup {...args}>{jobsItems}</NavSidebarItemGroup>
    </div>
  ),
};

/** Closed and open, like the documentation's Overview. */
export const ClosedAndOpen: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 48 }}>
      <div style={{ width: 280 }}>
        <NavSidebarItemGroup icon="wrench-simple" label="Jobs" breakpoint="desktop">
          {jobsItems}
        </NavSidebarItemGroup>
      </div>
      <div style={{ width: 280 }}>
        <NavSidebarItemGroup icon="wrench-simple" label="Jobs" defaultOpen breakpoint="desktop">
          {jobsItems}
        </NavSidebarItemGroup>
      </div>
    </div>
  ),
};

/** An active page inside the stack (and the header carrying the active look). */
export const WithActiveItem: Story = {
  render: () => (
    <div style={{ width: 280 }}>
      <NavSidebarItemGroup icon="wrench-simple" label="Jobs" defaultOpen headerActive breakpoint="desktop">
        <NavSidebarItem type="stackItem">Job requests</NavSidebarItem>
        <NavSidebarItem type="stackItem" active>
          Jobs
        </NavSidebarItem>
        <NavSidebarItem type="stackItem">Job series</NavSidebarItem>
      </NavSidebarItemGroup>
    </div>
  ),
};

/** Mobile rows (36px) — the group forwards its breakpoint to the items. */
export const Mobile: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <NavSidebarItemGroup icon="wrench-simple" label="Jobs" defaultOpen breakpoint="mobile">
        {jobsItems}
      </NavSidebarItemGroup>
    </div>
  ),
};
