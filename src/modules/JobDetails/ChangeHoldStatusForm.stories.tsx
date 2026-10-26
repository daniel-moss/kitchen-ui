import type { Meta, StoryObj } from "@storybook/react";

import { subStatusesFor } from "../../data/db";

import ChangePauseStatusForm from "./ChangePauseStatusForm";
import FormStoryFrame from "./FormStoryFrame";

// "Change hold status" (Figma 24970-48572) — the Change pause status build for
// a HELD job: its current Hold status comes pre-filled, the Hold reason starts
// empty. The three viewers: a checked-in assignee ("Check out" by default), a
// checked-out one ("Stay checked out") and someone who is not an assignee.
const meta: Meta = {
  title: "Modules/Job/Details/Forms/Change Hold Status",
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

// The job's current hold status — the first External one the company has.
const CURRENT = subStatusesFor("onHoldExternal")[0]?.name ?? "";

const Demo = ({
  mobile = false,
  viewer = "checkedIn",
}: {
  mobile?: boolean;
  viewer?: "checkedIn" | "checkedOut" | "notAssignee";
}) => (
  <FormStoryFrame mobile={mobile} icon="circle-stop">
    {(open, close) => (
      <ChangePauseStatusForm
        open={open}
        onClose={close}
        onSubmit={close}
        initialType="on-hold"
        initialSubStatus={CURRENT}
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
