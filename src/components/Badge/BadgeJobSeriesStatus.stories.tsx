import type { Meta, StoryObj } from "@storybook/react";

import BadgeJobSeriesStatus, { STATUS } from "./BadgeJobSeriesStatus";
import { StatusMatrix } from "./statusBadge";

const meta: Meta<typeof BadgeJobSeriesStatus> = {
  title: "Components/Badge/BadgeJobSeriesStatus",
  component: BadgeJobSeriesStatus,
  parameters: { layout: "centered" },
  args: { size: "md" },
  argTypes: {
    size: { options: ["sm", "md"], control: { type: "inline-radio" } },
    status: { options: Object.keys(STATUS), control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof BadgeJobSeriesStatus>;

export const Playground: Story = {};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StatusMatrix Component={BadgeJobSeriesStatus} statuses={STATUS} />,
};
