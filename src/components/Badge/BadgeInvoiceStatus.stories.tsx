import type { Meta, StoryObj } from "@storybook/react";

import BadgeInvoiceStatus, { STATUS } from "./BadgeInvoiceStatus";
import { StatusMatrix } from "./statusBadge";

const meta: Meta<typeof BadgeInvoiceStatus> = {
  title: "Components/Badge/BadgeInvoiceStatus",
  component: BadgeInvoiceStatus,
  parameters: { layout: "centered" },
  args: { size: "md" },
  argTypes: {
    size: { options: ["sm", "md"], control: { type: "inline-radio" } },
    status: { options: Object.keys(STATUS), control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof BadgeInvoiceStatus>;

export const Playground: Story = {};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StatusMatrix Component={BadgeInvoiceStatus} statuses={STATUS} />,
};
