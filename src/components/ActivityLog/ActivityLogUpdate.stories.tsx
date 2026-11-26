import type { Meta, StoryObj } from "@storybook/react";

import ActivityLogUpdate from "./ActivityLogUpdate";

const meta: Meta<typeof ActivityLogUpdate> = {
  title: "Components/ActivityLog/ActivityLogUpdate",
  component: ActivityLogUpdate,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof ActivityLogUpdate>;

// Edit `changes` to see the case switch: one field → a plain log, one isText
// field → a text change, several → the named list with sub-logs.
export const Playground: Story = {
  args: {
    person: "Lorne Riddle",
    label: "Just now",
    position: "single",
    changes: [
      { label: "Priority", oldValue: "Medium", newValue: "High" },
      { label: "Technician", oldValue: "", newValue: "Ava Chen" },
    ],
  },
  render: (args) => (
    <div style={{ width: 460 }}>
      <ActivityLogUpdate {...args} />
    </div>
  ),
};
