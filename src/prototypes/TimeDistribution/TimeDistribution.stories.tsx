import type { Meta, StoryObj } from "@storybook/react";

import JobDetails from "./JobDetails";
import { DeviceFrame, PhoneViewport } from "../../stories/helpers";

const meta: Meta = {
  title: "Prototypes/Time Tracker/Concept 7",
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

/**
 * Desktop shell: SidebarNav + details TopBarNav (static tabs), a max-560px
 * centered content column, and the 400px right sidebar with the ActionBar
 * pinned on top. Content areas are placeholders for now.
 */
export const Desktop: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ height: "100vh" }}>
      <JobDetails breakpoint="desktop" />
    </div>
  ),
};

/**
 * Mobile shell: the right sidebar becomes the first tab ("Details"), the
 * ActionBar pins to the bottom. Mock iOS chrome (status bar / home indicator)
 * shows how the shell reserves the safe areas. The placeholder is taller than
 * the screen on purpose — scroll down/up to see the top bar hide and return.
 */
export const Mobile: Story = {
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame pageText="" statusBar homeIndicator>
      <div style={{ position: "absolute", inset: 0, borderRadius: 24, overflow: "hidden" }}>
        <JobDetails breakpoint="mobile" />
      </div>
    </DeviceFrame>
  ),
};

/**
 * For testing on a REAL phone — no fake device frame, the shell fills the
 * browser viewport. Open this story's iframe URL on the phone.
 */
export const MobileFullscreen: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <PhoneViewport>
      <JobDetails breakpoint="mobile" />
    </PhoneViewport>
  ),
};
