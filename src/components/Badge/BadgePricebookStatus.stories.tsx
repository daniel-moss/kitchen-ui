import type { Meta, StoryObj } from "@storybook/react";

import BadgePricebookStatus, { STATUS } from "./BadgePricebookStatus";
import { StatusMatrix } from "./statusBadge";

const meta: Meta<typeof BadgePricebookStatus> = {
  title: "Components/Badge/BadgePricebookStatus",
  component: BadgePricebookStatus,
  parameters: { layout: "centered" },
  args: { size: "md" },
  argTypes: {
    size: { options: ["sm", "md"], control: { type: "inline-radio" } },
    status: { options: Object.keys(STATUS), control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof BadgePricebookStatus>;

export const Playground: Story = {};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StatusMatrix Component={BadgePricebookStatus} statuses={STATUS} />,
};
