import type { Meta, StoryObj } from "@storybook/react";

import { COMPANY, subStatusesFor } from "../../data/db";

import ChangeActiveStatusForm from "./ChangeActiveStatusForm";
import FormStoryFrame from "./FormStoryFrame";

// "Change job active status" (Figma 24101-15203) for the three viewers: not an
// assignee (no Check In / Out), a checked-out assignee and a checked-in one.
const meta: Meta = {
  title: 'Modules/Job/Details/Forms/Change Active Status',
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const ACTIVE = subStatusesFor("active");

const Demo = ({
  mobile = false,
  viewer = "notAssignee",
}: {
  mobile?: boolean;
  viewer?: "notAssignee" | "checkedOut" | "checkedIn";
}) => (
  <FormStoryFrame mobile={mobile} icon="circle-play">
    {(open, close) => (
      <ChangeActiveStatusForm
        open={open}
        onClose={close}
        onSubmit={close}
        activeSubStatuses={ACTIVE}
        activeStatusRequired={COMPANY.subStatuses.activeRequired}
        showCheckIn={viewer !== "notAssignee"}
        runningSession={viewer === "checkedIn" ? "Working: 01:30:05" : null}
        mobile={mobile}
      />
    )}
  </FormStoryFrame>
);

/** The viewer is not an assignee: no Check In / Out. */
export const Desktop: Story = { render: () => <Demo /> };

/** The same, as a mobile drawer. */
export const Mobile: Story = { render: () => <Demo mobile /> };

/** A checked-out assignee: "Check in" by default, then "Your status". */
export const CheckedOut: Story = { name: "Checked out assignee", render: () => <Demo viewer="checkedOut" /> };

/** The same, as a mobile drawer. */
export const CheckedOutMobile: Story = { name: "Checked out assignee / Mobile", render: () => <Demo viewer="checkedOut" mobile /> };

/** A checked-in assignee: "Stay checked in" by default, side by side. */
export const CheckedIn: Story = { name: "Checked in assignee", render: () => <Demo viewer="checkedIn" /> };

/** The same, as a mobile drawer — the two options stack. */
export const CheckedInMobile: Story = { name: "Checked in assignee / Mobile", render: () => <Demo viewer="checkedIn" mobile /> };
