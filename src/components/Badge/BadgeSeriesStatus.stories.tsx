import type { Meta, StoryObj } from "@storybook/react";

import BadgeSeriesStatus, { STATUS } from "./BadgeSeriesStatus";
import { StatusMatrix } from "./statusBadge";

const meta: Meta<typeof BadgeSeriesStatus> = {
  title: "Components/Badge/BadgeSeriesStatus",
  component: BadgeSeriesStatus,
  parameters: { layout: "centered" },
  args: { size: "md" },
  argTypes: {
    size: { options: ["sm", "md"], control: { type: "inline-radio" } },
    status: { options: Object.keys(STATUS), control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof BadgeSeriesStatus>;

export const Playground: Story = {};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StatusMatrix Component={BadgeSeriesStatus} statuses={STATUS} />,
};
