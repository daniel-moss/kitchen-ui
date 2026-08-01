import type { Meta, StoryObj } from "@storybook/react";

import ViewMenu from "./ViewMenu";
import { DeviceFrame, PhoneViewport } from "../../stories/helpers";

const meta: Meta = {
  title: "Prototypes/View Menu",
  parameters: { layout: "centered", controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

/**
 * Desktop — the "View" button opens the menu (4px gap, right-aligned).
 * Try: switch Table/Cards; change the sort column (search works) and flip the
 * sort order; toggle column visibility (the last visible one is protected);
 * pin up to 3 columns (the 4th shows the hint); drag rows to reorder within
 * their group. Click outside to close.
 */
export const Desktop: Story = {
  render: () => <ViewMenu />,
};

/**
 * Mobile — the same menu as a drawer. No pinning on mobile; the sort column
 * opens a second drawer with search; the min-one-column warning opens as a
 * Hint drawer.
 */
export const Mobile: Story = {
  render: () => (
    <DeviceFrame>
      <ViewMenu mobile />
    </DeviceFrame>
  ),
};

/**
 * For testing on a REAL phone — no fake device frame, the prototype fills
 * the browser viewport. Open this story's iframe URL on the phone.
 */
export const MobileFullscreen: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <PhoneViewport>
      <ViewMenu mobile />
    </PhoneViewport>
  ),
};
