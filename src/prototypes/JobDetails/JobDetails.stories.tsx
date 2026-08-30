import type { Meta, StoryObj } from "@storybook/react";

import JobDetails, { JobDetailsProps } from "./JobDetails";
import { PhoneViewport } from "../../stories/helpers";

const meta: Meta<JobDetailsProps> = {
  title: "Prototypes/Job Details",
  argTypes: {
    roundTo5min: {
      name: "Round time up to 5 min",
      control: "boolean",
      description:
        "The company setting that rounds logged time up. It changes every duration the Timesheet tab shows — the widgets, the session rows and both charts — and the exact values move into the charts' tooltips. A running session's live timer is never rounded.",
    },
    breakpoint: { table: { disable: true } },
  },
  args: { roundTo5min: false },
};

export default meta;

type Story = StoryObj<JobDetailsProps>;

/**
 * Desktop shell: SidebarNav + details TopBarNav (static tabs), a max-560px
 * centered content column, and the 400px right sidebar with the ActionBar
 * pinned on top. Content areas are placeholders for now.
 */
export const Desktop: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    // PhoneViewport (not a bare 100vh div) so iPad STANDALONE works: it strips
    // Storybook's body margins (a bare div left the document taller than the
    // viewport — the shell never reached the bottom edge) and publishes the
    // safe-area vars the shell's paddings read. On a desktop browser it is a
    // plain full-viewport block, nothing changes.
    <PhoneViewport>
      <JobDetails {...args} breakpoint="desktop" />
    </PhoneViewport>
  ),
};

/**
 * Mobile shell: the right sidebar becomes the first tab ("Details"), the
 * ActionBar pins to the bottom. No device frame — the shell fills the browser
 * viewport, so this also works on a real phone via the story's iframe URL.
 */
export const Mobile: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <JobDetails {...args} breakpoint="mobile" />
    </PhoneViewport>
  ),
};
