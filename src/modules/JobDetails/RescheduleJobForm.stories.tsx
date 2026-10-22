import type { Meta, StoryObj } from "@storybook/react";

import FormStoryFrame from "./FormStoryFrame";
import RescheduleJobForm from "./RescheduleJobForm";
import { Scheduling } from "./SchedulingForm";

// The "Reschedule job" form (Figma 27091-45839) in every state: pre-filled
// from the job, with and without a running time session, and pressed empty.
const meta: Meta = {
  title: 'Modules/Job/"Reschedule Job" Form',
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

// The job being rescheduled (JOB-1201's own values): 2 hours, two techs, its
// reason for call and tech instructions. Only the duration pre-fills from the
// slot — the date and time start empty.
const SCHEDULING: Scheduling = { date: new Date(2026, 9, 22, 8), time: "8:00 AM", hours: "2", minutes: "00" };
const ASSIGNEES = [1, 2];
const REASON =
  "Walk-in cooler is not holding temperature. Kitchen staff reported it climbing above 45°F overnight, and product is at risk of spoiling.";
const TECH = "Check in with the kitchen manager at the back entrance before starting. Bring a spare door gasket for a 48-inch walk-in.";

const Demo = ({ mobile = false, running = false, press = false }: { mobile?: boolean; running?: boolean; press?: boolean }) => (
  <FormStoryFrame mobile={mobile} icon="calendar-lines-pen" press={press ? "Reschedule" : undefined}>
    {(open, close) => (
      <RescheduleJobForm
        open={open}
        onClose={close}
        scheduling={SCHEDULING}
        assignees={ASSIGNEES}
        reason={REASON}
        tech={TECH}
        runningSession={running ? "Working: 01:12:45" : null}
        onReschedule={close}
        mobile={mobile}
      />
    )}
  </FormStoryFrame>
);

/** The viewer's clock is not running: no check in / out choice. */
export const Desktop: Story = { render: () => <Demo /> };

/** The same, as a mobile drawer. */
export const Mobile: Story = { render: () => <Demo mobile /> };

/** The viewer's clock IS running: stay checked in, or check out (picked by default). */
export const ClockRunning: Story = { name: "Clock running", render: () => <Demo running /> };

/** The same, as a mobile drawer. */
export const ClockRunningMobile: Story = { name: "Clock running / Mobile", render: () => <Demo running mobile /> };

/** "Reschedule" pressed with the empty fields: "Provide Date & time" and "Provide Reschedule reason". */
export const MissingValues: Story = { name: "Missing values", render: () => <Demo press /> };
