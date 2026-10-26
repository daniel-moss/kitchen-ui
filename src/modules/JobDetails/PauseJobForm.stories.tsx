import type { Meta, StoryObj } from "@storybook/react";

import FormStoryFrame from "./FormStoryFrame";
import PauseJobForm from "./PauseJobForm";

// The "Pause job" form (Figma 24058-15840) for the three viewers: a checked-in
// assignee (what the page shows most — "Check out" by default), a checked-out
// one ("Stay checked out" by default) and someone who is not an assignee (no
// Check In / Out). The demo company requires a Pause status, so it is
// required here.
const meta: Meta = {
  title: "Modules/Job/Details/Forms/Pause Job",
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const Demo = ({
  mobile = false,
  viewer = "checkedIn",
  press = false,
}: {
  mobile?: boolean;
  viewer?: "checkedIn" | "checkedOut" | "notAssignee";
  press?: boolean;
}) => (
  <FormStoryFrame mobile={mobile} icon="circle-pause" press={press ? "Pause" : undefined}>
    {(open, close) => (
      <PauseJobForm
        open={open}
        onClose={close}
        onPause={close}
        showCheckIn={viewer !== "notAssignee"}
        runningSession={viewer === "checkedIn" ? "Working: 01:30:05" : null}
        mobile={mobile}
      />
    )}
  </FormStoryFrame>
);

/** A checked-in assignee: "Check out" picked, side by side. */
export const Desktop: Story = { render: () => <Demo /> };

/** The same, as a mobile drawer — the two options stack. */
export const Mobile: Story = { render: () => <Demo mobile /> };

/** A checked-out assignee: "Stay checked out" picked. */
export const CheckedOut: Story = { name: "Checked out", render: () => <Demo viewer="checkedOut" /> };

/** The viewer is not an assignee — no Check In / Out. */
export const NotAssignee: Story = { name: "Not an assignee", render: () => <Demo viewer="notAssignee" /> };

/** "Pause" pressed with nothing filled: "Choose Pause status". */
export const MissingValues: Story = { name: "Missing values", render: () => <Demo press /> };
