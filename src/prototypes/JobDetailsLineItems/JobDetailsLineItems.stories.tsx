import type { Meta, StoryObj } from "@storybook/react";

import JobDetails from "../../modules/JobDetails/JobDetails";
import { jobRowById } from "../../modules/shared/jobRow";
import { PhoneViewport } from "../../stories/helpers";

import ChargesOnlyGuard from "./ChargesOnlyGuard";
import { LINE_ITEMS_TEST, TEST_JOB_ID } from "./testLines";

// USER TESTING — LINE ITEMS (Daniel, 2026-11-16): the live Job Details page of a
// COMPLETED job, opened on Summary → Charges with its charges already added
// (1 labor rate, 2 inventory products, 2 other charges, 1 discount; the
// Profitability module below the Subtotal). One product is being edited by
// another user. ONE link: the same page is desktop on a computer and mobile on
// a phone.
//
// Allowed: everything in the Charges modules — add, edit, delete, re-order a
// line, and "View pricebook item" on a labor rate (its side panel). Everything
// else on the page is inert (ChargesOnlyGuard), and no other tab or segment
// can be opened (no tab swipe on mobile either).
//
// Like Job Details Charges, this is NOT a frozen copy: the published build is
// what is frozen.
// Publish: node scripts/publish-prototypes.mjs --only JobDetailsLineItems --dir job-details-line-items
// RENAMING the story breaks the link already sent: its id comes from the title + export name.

const meta: Meta = {
  title: "Prototypes/Job Details Line Items",
  parameters: { layout: "fullscreen", controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Test: Story = {
  render: () => (
    <PhoneViewport>
      <ChargesOnlyGuard>
        <JobDetails record={jobRowById(TEST_JOB_ID)!} chargesTest={LINE_ITEMS_TEST} />
      </ChargesOnlyGuard>
    </PhoneViewport>
  ),
};
