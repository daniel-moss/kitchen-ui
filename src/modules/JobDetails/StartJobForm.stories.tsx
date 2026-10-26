import type { Meta, StoryObj } from "@storybook/react";

import { COMPANY, subStatusesFor } from "../../data/db";
import { JobSubStatusRecord } from "../../data/db/types";

import FormStoryFrame from "./FormStoryFrame";
import StartJobForm from "./StartJobForm";

// The "Start job" form (Figma 24048-13283) in every state. The demo company
// has ACTIVE sub-statuses ON and REQUIRED (2026-10-23), so "Desktop" / "Mobile"
// are what the Job Details page shows; the other stories hand the form a
// different company setup or viewer. The same form is "Resume job".
const meta: Meta = {
  title: 'Modules/Job/Details/Forms/Start Job',
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

// The company's own active sub-statuses, from the database.
const ACTIVE = subStatusesFor("active");
const byId = (id: string) => ACTIVE.find((row) => row.id === id) as JobSubStatusRecord;

const Demo = ({
  mobile = false,
  activeSubStatuses = ACTIVE,
  activeStatusRequired = COMPANY.subStatuses.activeRequired,
  showCheckIn = true,
  resume = false,
  banner,
  press,
}: {
  mobile?: boolean;
  activeSubStatuses?: JobSubStatusRecord[];
  activeStatusRequired?: boolean;
  showCheckIn?: boolean;
  resume?: boolean;
  banner?: string;
  press?: boolean;
}) => (
  <FormStoryFrame mobile={mobile} icon="circle-play" press={press ? (resume ? "Resume" : "Start") : undefined}>
    {(open, close) => (
      <StartJobForm
        open={open}
        onClose={close}
        onStart={close}
        activeSubStatuses={activeSubStatuses}
        activeStatusRequired={activeStatusRequired}
        showCheckIn={showCheckIn}
        mobile={mobile}
        {...(resume
          ? { title: "Resume job", submitLabel: "Resume", reasonLabel: "Resume reason", toastTitle: "Job resumed", banner }
          : {})}
      />
    )}
  </FormStoryFrame>
);

/** What the page shows: Active status required (5 to pick from), Start reason, Check in picked. */
export const Desktop: Story = { render: () => <Demo /> };

/** The same, as a mobile drawer. */
export const Mobile: Story = { render: () => <Demo mobile /> };

/**
 * "Start" pressed with nothing filled: "Choose Active status" and "Choose
 * Status". The Start reason stays optional until a sub-status asks for one.
 */
export const MissingValues: Story = { name: "Missing values", render: () => <Demo press /> };

/**
 * Only ONE active sub-status, and the company requires one — the system picks
 * it: read-only, "The only status available". This one ("Return visit")
 * requires a reason, so the Start reason is required and shows the
 * sub-status's help text.
 */
export const SingleSubStatusReasonRequired: Story = {
  name: "Single sub-status, reason required",
  render: () => <Demo activeSubStatuses={[byId("sub-return-visit")]} />,
};

/** The same, pressed empty: "Provide Start reason". */
export const ReasonMissing: Story = {
  name: "Reason missing",
  render: () => <Demo activeSubStatuses={[byId("sub-return-visit")]} press />,
};

/** A single sub-status that does NOT require a reason and has no help text. */
export const SingleSubStatus: Story = {
  name: "Single sub-status",
  render: () => <Demo activeSubStatuses={[byId("sub-diagnosing")]} />,
};

/** The company has active sub-statuses but does not require one — "(optional)". */
export const ActiveStatusOptional: Story = {
  name: "Active status optional",
  render: () => <Demo activeStatusRequired={false} />,
};

/** The company has NO active sub-statuses — no field; the reason is optional. */
export const NoSubStatuses: Story = { name: "No sub-statuses", render: () => <Demo activeSubStatuses={[]} /> };

/** The viewer is not an assignee, or is already checked in — no check in / out choice. */
export const NoCheckIn: Story = { name: "No check in", render: () => <Demo showCheckIn={false} /> };

/** "Resume job" — the same form with the Resume copy. */
export const Resume: Story = { render: () => <Demo resume /> };

/** Resuming a COMPLETED job warns that the signature will be void (Figma 24567-140277). */
export const ResumeCompletedJob: Story = {
  name: "Resume completed job",
  render: () => (
    <Demo
      resume
      banner="Resuming this job will return it to Active status. A new signature will need to be collected to complete this job."
    />
  ),
};
