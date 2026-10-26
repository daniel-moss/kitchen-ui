import type { Meta, StoryObj } from "@storybook/react";

import FormStoryFrame from "./FormStoryFrame";
import UnscheduleJobForm from "./UnscheduleJobForm";

// The "Unschedule job" form (Figma 27154-49578) in every state: one required
// "Unschedule reason", the reason missing, and the warning banner for
// assignees who are still checked in (Figma 27245-62594).
const meta: Meta = {
  title: 'Modules/Job/Details/Forms/Unschedule Job',
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const Demo = ({ mobile = false, press = false, checkedIn }: { mobile?: boolean; press?: boolean; checkedIn?: string[] }) => (
  <FormStoryFrame mobile={mobile} icon="calendar-xmark" press={press ? "Unschedule" : undefined}>
    {(open, close) => (
      <UnscheduleJobForm open={open} onClose={close} onUnschedule={close} checkedIn={checkedIn} mobile={mobile} />
    )}
  </FormStoryFrame>
);

/** One required "Unschedule reason". */
export const Desktop: Story = { render: () => <Demo /> };

/** The same, as a mobile drawer with a drag handle — the field keeps its default size. */
export const Mobile: Story = { render: () => <Demo mobile /> };

/** "Unschedule" pressed empty: "Provide Unschedule reason". */
export const ReasonMissing: Story = { name: "Reason missing", render: () => <Demo press /> };

/** One assignee is checked in — the warning banner names them. */
export const OneCheckedIn: Story = {
  name: "One assignee checked in",
  render: () => <Demo checkedIn={["Lorne Riddle"]} />,
};

/** Several assignees are checked in. */
export const SeveralCheckedIn: Story = {
  name: "Several assignees checked in",
  render: () => <Demo checkedIn={["Lorne Riddle", "Amy Lowery", "Thiago Cummings"]} />,
};

/** The banner in the mobile drawer — it sits under the field. */
export const MobileCheckedIn: Story = {
  name: "Mobile, assignee checked in",
  render: () => <Demo mobile checkedIn={["Lorne Riddle"]} />,
};
