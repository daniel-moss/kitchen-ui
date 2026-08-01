import type { Meta, StoryObj } from "@storybook/react";

import BadgeClientStatus, { STATUS } from "./BadgeClientStatus";
import { StatusMatrix } from "./statusBadge";

const meta: Meta<typeof BadgeClientStatus> = {
  title: "Components/Badge/BadgeClientStatus",
  component: BadgeClientStatus,
  parameters: { layout: "centered" },
  args: { size: "md" },
  argTypes: {
    size: { options: ["sm", "md"], control: { type: "inline-radio" } },
    status: { options: Object.keys(STATUS), control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof BadgeClientStatus>;

export const Playground: Story = {};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StatusMatrix Component={BadgeClientStatus} statuses={STATUS} />,
};
