import type { Meta, StoryObj } from "@storybook/react";

import BadgeBillStatus, { STATUS } from "./BadgeBillStatus";
import { StatusMatrix } from "./statusBadge";

const meta: Meta<typeof BadgeBillStatus> = {
  title: "Components/Badge/BadgeBillStatus",
  component: BadgeBillStatus,
  parameters: { layout: "centered" },
  args: { size: "md" },
  argTypes: {
    size: { options: ["sm", "md"], control: { type: "inline-radio" } },
    status: { options: Object.keys(STATUS), control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof BadgeBillStatus>;

export const Playground: Story = {};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StatusMatrix Component={BadgeBillStatus} statuses={STATUS} />,
};
