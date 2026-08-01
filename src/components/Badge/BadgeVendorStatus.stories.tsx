import type { Meta, StoryObj } from "@storybook/react";

import BadgeVendorStatus, { STATUS } from "./BadgeVendorStatus";
import { StatusMatrix } from "./statusBadge";

const meta: Meta<typeof BadgeVendorStatus> = {
  title: "Components/Badge/BadgeVendorStatus",
  component: BadgeVendorStatus,
  parameters: { layout: "centered" },
  args: { size: "md" },
  argTypes: {
    size: { options: ["sm", "md"], control: { type: "inline-radio" } },
    status: { options: Object.keys(STATUS), control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof BadgeVendorStatus>;

export const Playground: Story = {};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StatusMatrix Component={BadgeVendorStatus} statuses={STATUS} />,
};
