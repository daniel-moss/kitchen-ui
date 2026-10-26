import type { Meta, StoryObj } from "@storybook/react";

import { COMPANY, subStatusesFor } from "../../data/db";

import FormStoryFrame from "./FormStoryFrame";
import StartJobForm from "./StartJobForm";

// The "Resume job" form (Figma 24096-19684) — the Start job build with the
// Resume copy, a form of its own (Daniel, 2026-10-26). The Active status and
// Check In / Out rules are Start job's; their states live in its stories.
const meta: Meta = {
  title: "Modules/Job/Details/Forms/Resume Job",
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const COMPLETED_BANNER =
  "Resuming this job will return it to Active status. A new signature will need to be collected to complete this job.";

const Demo = ({
  mobile = false,
  runningSession = null,
  banner,
}: {
  mobile?: boolean;
  runningSession?: string | null;
  banner?: string;
}) => (
  <FormStoryFrame mobile={mobile} icon="circle-play">
    {(open, close) => (
      <StartJobForm
        open={open}
        onClose={close}
        onStart={close}
        activeSubStatuses={subStatusesFor("active")}
        activeStatusRequired={COMPANY.subStatuses.activeRequired}
        runningSession={runningSession}
        mobile={mobile}
        title="Resume job"
        submitLabel="Resume"
        reasonLabel="Resume reason"
        toastTitle="Job resumed"
        banner={banner}
      />
    )}
  </FormStoryFrame>
);

/** Resuming a PAUSED job, checked-out assignee. */
export const Desktop: Story = { render: () => <Demo /> };

/** The same, as a mobile drawer. */
export const Mobile: Story = { render: () => <Demo mobile /> };

/** A checked-in assignee (they stayed checked in when pausing). */
export const CheckedIn: Story = { name: "Checked in", render: () => <Demo runningSession="Working: 01:30:05" /> };

/** Resuming a COMPLETED job warns that the signature will be void (Figma 24567-140277). */
export const CompletedJob: Story = { name: "Completed job", render: () => <Demo banner={COMPLETED_BANNER} /> };
