import type { Meta, StoryObj } from "@storybook/react";

import { PhoneViewport } from "../../stories/helpers";
import { jobRowById } from "../shared/jobRow";
import JobDetails from "./JobDetails";

// The Job Details page's PUBLIC view (Figma 26990-56723) — what a client sees
// when they open the job's link. It is the SAME page in its public mode (the
// `isPublicView` prop), not a copy, so it can never drift from the internal one.
//
// A story of its own for now: the action that opens it is not designed yet
// (Daniel, 2026-10-20).
//
// No single demo job carries everything the node draws, so the job is a
// control: a finalized job (the default — its Summary tab shows the public
// completed forms and the tech's work summary), a completed job (the node's
// status), a recall (the Service module's
// "Recall to" link and the Related row), a job created from an estimate (the
// Related "Created from" row), a job on hold (the Status module's sub-status
// and reason), and the closed statuses.

const JOBS: Record<string, string> = {
  "JOB-1209": "Finalized",
  "JOB-1204": "Completed",
  "JOB-1211": "Recall",
  "JOB-1206": "Created from an estimate",
  "JOB-1208": "On hold",
  "JOB-1201": "Active",
  "JOB-1210": "Cancelled",
};

interface PublicViewArgs {
  /** The demo job to open. */
  jobId: string;
  /** The service company has a logo. Off → the first letter of its name. */
  companyHasLogo: boolean;
}

const meta: Meta<PublicViewArgs> = {
  title: "Modules/Job/Job Details/Public View",
  parameters: { layout: "fullscreen" },
  args: { jobId: "JOB-1209", companyHasLogo: true },
  argTypes: {
    jobId: {
      name: "Job",
      control: { type: "select", labels: JOBS },
      options: Object.keys(JOBS),
    },
    companyHasLogo: { name: "Company has a logo", control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<PublicViewArgs>;

const Page = ({ jobId, companyHasLogo, mobile }: PublicViewArgs & { mobile: boolean }) => {
  const record = jobRowById(jobId);
  if (record == null) return null;
  return (
    <JobDetails
      // A remount per control change, so every module re-seeds from the job.
      key={`${jobId}-${companyHasLogo}`}
      record={record}
      breakpoint={mobile ? "mobile" : "desktop"}
      isPublicView
      companyHasLogo={companyHasLogo}
    />
  );
};

// PhoneViewport, like the App story: on a desktop browser it is a plain
// full-viewport block, and on a phone it publishes the safe-area vars the
// shell reads — so the iframe URL also works on a real device.

/** The desktop page: Service / Summary in the main column, the details sidebar on the right. */
export const Desktop: Story = {
  render: (args) => (
    <PhoneViewport>
      <Page {...args} mobile={false} />
    </PhoneViewport>
  ),
};

/**
 * The mobile page — the same layout as the internal one (Daniel, 2026-10-20):
 * "Details" is the first tab, and Copy URL / Download PDF pin to the bottom.
 */
export const Mobile: Story = {
  render: (args) => (
    <PhoneViewport>
      <Page {...args} mobile />
    </PhoneViewport>
  ),
};

