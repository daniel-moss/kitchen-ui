import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../components/Button/Button";
import Toaster from "../../components/Toast/Toaster";
import { PhoneViewport } from "../../stories/helpers";
import { CurrentJobIdProvider } from "./currentJob";
import StartJobForm from "./StartJobForm";

import styles from "./SendSummaryForm.module.scss";

// The "Start job" form on its own — the one place the ACTIVE SUB-STATUS
// feature can be seen.
//
// Sub-statuses are a per-company switch thrown on the backend
// (`CompanySettings.subStatuses`): a status that has them configured REQUIRES
// one, and the names are the company's own. Three statuses can carry them —
// active, quick-paused and on hold. The demo company runs the two PAUSE ones
// on and ACTIVE off, because the tech's check-in status ("Your status", in the
// card below) already says what they are doing. So the page never draws the
// "Active status" select, and these stories are where it lives: the same form,
// handed a company's active sub-statuses.
//
// Figma: the field 24042-18897, its missing-value error 24422-26522, the
// picker 24044-14180.
const meta: Meta = {
  title: 'Modules/Job/Job Details/"Start Job" Form',
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

// A company that has configured active sub-statuses. The names are the
// company's own — these are the examples Daniel gave (2026-10-04).
const ACTIVE_SUB_STATUSES = ["Working", "Travelling", "Preparing"];

const Harness = ({ mobile, activeSubStatuses }: { mobile: boolean; activeSubStatuses?: string[] }) => {
  const [open, setOpen] = useState(true);
  return (
    <CurrentJobIdProvider id="JOB-1203">
      <PhoneViewport>
        <div className={styles.storyPage}>
          <Button size="lg" variant="subtle" leftIcon="circle-play" onClick={() => setOpen(true)}>
            Open the form
          </Button>
        </div>
        <StartJobForm
          open={open}
          onClose={() => setOpen(false)}
          onStart={() => setOpen(false)}
          activeSubStatuses={activeSubStatuses}
          mobile={mobile}
        />
        <Toaster breakpoint={mobile ? "mobile" : "desktop"} />
      </PhoneViewport>
    </CurrentJobIdProvider>
  );
};

/**
 * Active sub-statuses ON — the company configured them, so "Active status"
 * sits above the reason and starting the job requires a choice. Submit with it
 * empty to see the "Choose Active status" error.
 */
export const ActiveSubStatuses: Story = {
  render: () => <Harness mobile={false} activeSubStatuses={ACTIVE_SUB_STATUSES} />,
};

/** The same, as a mobile drawer. */
export const ActiveSubStatusesMobile: Story = {
  render: () => <Harness mobile activeSubStatuses={ACTIVE_SUB_STATUSES} />,
};

/**
 * Active sub-statuses OFF — what the demo company (and the Job Details page)
 * actually shows: no "Active status" field, the check-in card alone.
 */
export const NoSubStatuses: Story = { render: () => <Harness mobile={false} /> };
