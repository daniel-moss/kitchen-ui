import type { Meta, StoryObj } from "@storybook/react";

import BadgeJobStatus, { STATUS } from "./BadgeJobStatus";
import { StatusMatrix } from "./statusBadge";

const meta: Meta<typeof BadgeJobStatus> = {
  title: "Components/Badge/BadgeJobStatus",
  component: BadgeJobStatus,
  parameters: { layout: "centered" },
  args: { size: "md" },
  argTypes: {
    size: { options: ["sm", "md"], control: { type: "inline-radio" } },
    status: { options: Object.keys(STATUS), control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof BadgeJobStatus>;

export const Playground: Story = {};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StatusMatrix Component={BadgeJobStatus} statuses={STATUS} />,
};
