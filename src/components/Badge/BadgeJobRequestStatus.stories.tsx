import type { Meta, StoryObj } from "@storybook/react";

import BadgeJobRequestStatus, { STATUS } from "./BadgeJobRequestStatus";
import { StatusMatrix } from "./statusBadge";

const meta: Meta<typeof BadgeJobRequestStatus> = {
  title: "Components/Badge/BadgeJobRequestStatus",
  component: BadgeJobRequestStatus,
  parameters: { layout: "centered" },
  args: { size: "md" },
  argTypes: {
    size: { options: ["sm", "md"], control: { type: "inline-radio" } },
    status: { options: Object.keys(STATUS), control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof BadgeJobRequestStatus>;

export const Playground: Story = {};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StatusMatrix Component={BadgeJobRequestStatus} statuses={STATUS} />,
};
