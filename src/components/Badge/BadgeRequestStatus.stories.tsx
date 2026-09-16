import type { Meta, StoryObj } from "@storybook/react";

import BadgeRequestStatus, { STATUS } from "./BadgeRequestStatus";
import { StatusMatrix } from "./statusBadge";

const meta: Meta<typeof BadgeRequestStatus> = {
  title: "Components/Badge/BadgeRequestStatus",
  component: BadgeRequestStatus,
  parameters: { layout: "centered" },
  args: { size: "md" },
  argTypes: {
    size: { options: ["sm", "md"], control: { type: "inline-radio" } },
    status: { options: Object.keys(STATUS), control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof BadgeRequestStatus>;

export const Playground: Story = {};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StatusMatrix Component={BadgeRequestStatus} statuses={STATUS} />,
};
