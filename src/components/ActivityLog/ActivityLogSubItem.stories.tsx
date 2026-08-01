import type { Meta, StoryObj } from "@storybook/react";

import ActivityLogSubItem from "./ActivityLogSubItem";
import { cap } from "../../stories/helpers";

const frame: React.CSSProperties = { width: 460 };
const column: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-20)", width: 460 };

const meta: Meta<typeof ActivityLogSubItem> = {
  title: "Components/ActivityLog/ActivityLogSubItem",
  component: ActivityLogSubItem,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof ActivityLogSubItem>;

export const Playground: Story = {
  args: { title: "Series end date", oldValue: "Jan 4, 2027", newValue: "Jan 1, 2027" },
  render: (args) => (
    <div style={frame}>
      <ActivityLogSubItem {...args} />
    </div>
  ),
};

// The three value cases, plus a free-form caption.
export const ValueCases: Story = {
  render: () => (
    <div style={column}>
      <div>
        <div style={cap}>changed — old value struck through</div>
        <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" newValue="Jan 1, 2027" />
      </div>
      <div>
        <div style={cap}>filled in — the field had no value before</div>
        <ActivityLogSubItem title="Series end date" newValue="Jan 1, 2027" />
      </div>
      <div>
        <div style={cap}>cleared — no new value, so nothing is emphasised</div>
        <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" />
      </div>
      <div>
        <div style={cap}>free caption — details that are not a value change</div>
        <ActivityLogSubItem title="Attachment" caption="invoice-2026-07.pdf" />
      </div>
    </div>
  ),
};
