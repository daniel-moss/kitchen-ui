import type { Meta, StoryObj } from "@storybook/react";

import JobDetails from "../../modules/JobDetails/JobDetails";
import type { ChargesConceptNumber } from "../../modules/JobDetails/ChargesModule/ChargesConcept";
import { jobRowById } from "../../modules/shared/jobRow";
import { PhoneViewport } from "../../stories/helpers";

// USER TESTING (Daniel, 2026-11-05): the real Job Details page four times, the same
// job in each, with only the Charges design different. A page opens on Summary →
// Charges with no lines yet, and follows the device: the same link is the desktop page on a computer
// and the mobile page on a phone. Neutral names, so no version reads as the favorite:
//
//   Version A = Concept 1 · B = Concept 2 · C = Concept 3 · D = Concept 4
//
// Publish: node scripts/publish-prototypes.mjs --only JobDetailsCharges --dir job-details-charges
// RENAMING a story breaks every link already sent: its id comes from the export name.

const meta: Meta = {
  title: "Prototypes/Job Details Charges",
  parameters: { layout: "fullscreen", controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

const Page = ({ concept }: { concept: ChargesConceptNumber }) => (
  <PhoneViewport>
    <JobDetails record={jobRowById("JOB-1201")!} chargesConcept={concept} />
  </PhoneViewport>
);

export const VersionA: Story = { name: "Version A", render: () => <Page concept={1} /> };
export const VersionB: Story = { name: "Version B", render: () => <Page concept={2} /> };
export const VersionC: Story = { name: "Version C", render: () => <Page concept={3} /> };
export const VersionD: Story = { name: "Version D", render: () => <Page concept={4} /> };
