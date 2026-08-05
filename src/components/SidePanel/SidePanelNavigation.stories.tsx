import { ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame } from "../../stories/helpers";
import TabItem from "../Tabs/TabItem";
import SidePanelNavigation from "./SidePanelNavigation";

const meta: Meta<typeof SidePanelNavigation> = {
  title: "Components/SidePanel/SidePanelNavigation",
  component: SidePanelNavigation,
  parameters: { layout: "fullscreen" },
  argTypes: {
    children: { control: false },
    topLevel: { control: false },
  },
};
export default meta;

type Story = StoryObj<typeof SidePanelNavigation>;

// The navigation is panel chrome — show it at the panel's own 400px width.
const frame = (children: ReactNode) => (
  <div style={docsFrame}>
    <div
      style={{
        width: 400,
        background: "var(--surface-level-first)",
        borderRadius: "var(--border-radius-2_5)",
        border: "1px solid var(--gray-a6)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  </div>
);

export const Playground: Story = {
  render: (args) => frame(<SidePanelNavigation {...args} />),
  args: {
    defaultValue: "one",
    children: (
      <>
        <TabItem value="one">Sub-section 1</TabItem>
        <TabItem value="two">Sub-section 2</TabItem>
        <TabItem value="three">Sub-section 3</TabItem>
      </>
    ),
  },
};

/** One level: the object tabs only. */
export const SingleLevel: Story = {
  render: () =>
    frame(
      <SidePanelNavigation defaultValue="details">
        <TabItem value="details">Details</TabItem>
        <TabItem value="equipment">Equipment</TabItem>
        <TabItem value="jobs">Jobs</TabItem>
      </SidePanelNavigation>,
    ),
};

/** Two levels: the top sections swap the set of sub-sections below them. */
export const MultiLevel: Story = {
  render: function MultiLevelStory() {
    const [section, setSection] = useState("location");
    return frame(
      <SidePanelNavigation
        key={section}
        defaultValue="details"
        topLevelValue={section}
        onTopLevelChange={setSection}
        topLevel={
          <>
            <TabItem value="location">Location</TabItem>
            <TabItem value="client">Client</TabItem>
          </>
        }
      >
        {section === "location" ? (
          <>
            <TabItem value="details">Details</TabItem>
            <TabItem value="equipment">Equipment</TabItem>
            <TabItem value="jobs">Jobs</TabItem>
          </>
        ) : (
          <>
            <TabItem value="details">Details</TabItem>
            <TabItem value="contacts">Contacts</TabItem>
          </>
        )}
      </SidePanelNavigation>,
    );
  },
};

/** Too many object tabs: the row scrolls sideways, with no edge fade. */
export const Overflow: Story = {
  render: () =>
    frame(
      <SidePanelNavigation defaultValue="details">
        <TabItem value="details">Details</TabItem>
        <TabItem value="equipment">Equipment</TabItem>
        <TabItem value="jobs">Jobs</TabItem>
        <TabItem value="estimates">Estimates</TabItem>
        <TabItem value="invoices">Invoices</TabItem>
        <TabItem value="files">Files</TabItem>
      </SidePanelNavigation>,
    ),
};
