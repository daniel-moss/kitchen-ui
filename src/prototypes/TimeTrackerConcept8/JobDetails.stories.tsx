import type { Meta, StoryObj } from "@storybook/react";

import JobDetails from "./JobDetails";
import { PhoneViewport } from "../../stories/helpers";

// Customer-facing snapshot of the Job Details prototype (copied 2026-07-22).
// No device-frame story here on purpose — every story fills the real browser
// viewport, so the links can be shared and opened on any device.
const meta: Meta = {
  title: "Prototypes/Time Tracker/Concept 8",
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

/**
 * The technician's desktop view. PhoneViewport (not a bare 100vh div) so iPad
 * STANDALONE works: it strips Storybook's body margins and publishes the
 * safe-area vars the shell's paddings read. On a desktop browser it is a
 * plain full-viewport block, nothing changes.
 */
export const TechDesktop: Story = {
  name: "Tech / Desktop",
  parameters: { layout: "fullscreen" },
  render: () => (
    <PhoneViewport>
      <JobDetails breakpoint="desktop" />
    </PhoneViewport>
  ),
};

/**
 * The technician's mobile view — no fake device frame, the shell fills the
 * browser viewport. Open this story's iframe URL on a phone.
 */
export const TechMobile: Story = {
  name: "Tech / Mobile",
  parameters: { layout: "fullscreen" },
  render: () => (
    <PhoneViewport>
      <JobDetails breakpoint="mobile" />
    </PhoneViewport>
  ),
};

/**
 * The office view — the office manages the job but does NOT track time:
 * no Check in card in Start/Resume, no session bar, no pause banner, the
 * Summary tab is a placeholder, and the Timesheet lets the office add/edit
 * time sessions for EVERY assignee.
 */
export const OfficeDesktop: Story = {
  name: "Office / Desktop",
  parameters: { layout: "fullscreen" },
  render: () => (
    <PhoneViewport>
      <JobDetails breakpoint="desktop" office />
    </PhoneViewport>
  ),
};
