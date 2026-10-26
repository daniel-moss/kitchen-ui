import type { Meta, StoryObj } from "@storybook/react";

import FormStoryFrame from "./FormStoryFrame";
import PauseJobForm from "./PauseJobForm";

// The "Hold job" form, DEFAULT variant (Figma 24963-43684) — the Pause job
// build with the Hold copy: Hold status (External then Internal, A to Z),
// Hold reason and Check In / Out. The detailed variant (Figma 27210-61490,
// Equipment → Summary → Charges → Status) is not built yet. The three viewers:
// a checked-in assignee ("Check out" by default), a checked-out one ("Stay
// checked out") and someone who is not an assignee (no Check In / Out).
const meta: Meta = {
  title: "Modules/Job/Details/Forms/Hold Job",
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
  <FormStoryFrame mobile={mobile} icon="circle-stop" press={press ? "Hold" : undefined}>
    {(open, close) => (
      <PauseJobForm
        open={open}
        onClose={close}
        onPause={close}
        type="on-hold"
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

/** "Hold" pressed with nothing filled: "Choose Hold status". */
export const MissingValues: Story = { name: "Missing values", render: () => <Demo press /> };
