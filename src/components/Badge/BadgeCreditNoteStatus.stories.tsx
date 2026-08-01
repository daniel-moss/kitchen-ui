import type { Meta, StoryObj } from "@storybook/react";

import BadgeCreditNoteStatus, { STATUS } from "./BadgeCreditNoteStatus";
import { StatusMatrix } from "./statusBadge";

const meta: Meta<typeof BadgeCreditNoteStatus> = {
  title: "Components/Badge/BadgeCreditNoteStatus",
  component: BadgeCreditNoteStatus,
  parameters: { layout: "centered" },
  args: { size: "md" },
  argTypes: {
    size: { options: ["sm", "md"], control: { type: "inline-radio" } },
    status: { options: Object.keys(STATUS), control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof BadgeCreditNoteStatus>;

export const Playground: Story = {};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StatusMatrix Component={BadgeCreditNoteStatus} statuses={STATUS} />,
};
