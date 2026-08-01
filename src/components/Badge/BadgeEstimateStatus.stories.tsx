import type { Meta, StoryObj } from "@storybook/react";

import BadgeEstimateStatus, { STATUS } from "./BadgeEstimateStatus";
import { StatusMatrix } from "./statusBadge";

const meta: Meta<typeof BadgeEstimateStatus> = {
  title: "Components/Badge/BadgeEstimateStatus",
  component: BadgeEstimateStatus,
  parameters: { layout: "centered" },
  args: { size: "md" },
  argTypes: {
    size: { options: ["sm", "md"], control: { type: "inline-radio" } },
    status: { options: Object.keys(STATUS), control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof BadgeEstimateStatus>;

export const Playground: Story = {};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StatusMatrix Component={BadgeEstimateStatus} statuses={STATUS} />,
};
