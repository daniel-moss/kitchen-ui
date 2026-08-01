import type { Meta, StoryObj } from "@storybook/react";

import BadgePOStatus, { STATUS } from "./BadgePOStatus";
import { StatusMatrix } from "./statusBadge";

const meta: Meta<typeof BadgePOStatus> = {
  title: "Components/Badge/BadgePOStatus",
  component: BadgePOStatus,
  parameters: { layout: "centered" },
  args: { size: "md" },
  argTypes: {
    size: { options: ["sm", "md"], control: { type: "inline-radio" } },
    status: { options: Object.keys(STATUS), control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof BadgePOStatus>;

export const Playground: Story = {};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StatusMatrix Component={BadgePOStatus} statuses={STATUS} />,
};
