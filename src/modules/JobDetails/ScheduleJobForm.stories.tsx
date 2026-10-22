import type { Meta, StoryObj } from "@storybook/react";

import FormStoryFrame from "./FormStoryFrame";
import RescheduleJobForm from "./RescheduleJobForm";
import { Scheduling } from "./SchedulingForm";

// The "Schedule job" form (Figma 27163-54879) in every state — the
// "Reschedule job" form in its "schedule" mode: no Reschedule reason, no clock
// choice, a "Schedule" button and the "Job scheduled" toast.
const meta: Meta = {
  title: 'Modules/Job/"Schedule Job" Form',
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

// An Unscheduled job: no slot yet, its duration, one tech, its details.
const SCHEDULING: Scheduling = { date: null, time: "", hours: "1", minutes: "30" };
const ASSIGNEES = [3];
const REASON = "Ice machine is producing small, cloudy cubes and the bin fills slowly.";
const TECH = "";

const Demo = ({ mobile = false, press = false }: { mobile?: boolean; press?: boolean }) => (
  <FormStoryFrame mobile={mobile} icon="calendar-lines-pen" press={press ? "Schedule" : undefined}>
    {(open, close) => (
      <RescheduleJobForm
        mode="schedule"
        open={open}
        onClose={close}
        scheduling={SCHEDULING}
        assignees={ASSIGNEES}
        reason={REASON}
        tech={TECH}
        onReschedule={close}
        mobile={mobile}
      />
    )}
  </FormStoryFrame>
);

/** Date & time empty; duration, assignees and the job's details pre-filled. */
export const Desktop: Story = { render: () => <Demo /> };

/** The same, as a mobile drawer. */
export const Mobile: Story = { render: () => <Demo mobile /> };

/** "Schedule" pressed with no slot: "Provide Date & time". */
export const MissingValues: Story = { name: "Missing values", render: () => <Demo press /> };
