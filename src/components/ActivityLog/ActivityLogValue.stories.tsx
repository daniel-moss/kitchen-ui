import type { Meta, StoryObj } from "@storybook/react";

import Subtle from "./ActivityLogSubtle";
import ActivityLogItem from "./ActivityLogItem";
import ActivityLogValue from "./ActivityLogValue";
import { Icon } from "../Icon/Icon";

const meta: Meta<typeof ActivityLogValue> = {
  title: "Components/ActivityLog/ActivityLogValue",
  component: ActivityLogValue,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof ActivityLogValue>;

// Narrow the frame to watch the pair wrap: the icon starts the new line flush.
export const Playground: Story = {
  args: {
    children: "Urgent",
    icon: <Icon icon="fire" pack="solid" size={14} container="fixedHeight" />,
    iconColor: "var(--orange-9)",
  },
  render: (args) => (
    <div style={{ width: 460, resize: "horizontal", overflow: "hidden" }}>
      <ActivityLogItem
        position="single"
        text={
          <>
            Lorne Riddle<Subtle> updated </Subtle>Priority:
            <ActivityLogValue {...args} />
          </>
        }
        label="Just now"
      />
    </div>
  ),
};
