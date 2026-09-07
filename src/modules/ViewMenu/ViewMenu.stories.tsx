import type { Meta, StoryObj } from "@storybook/react";
import { ReactNode } from "react";

import ViewMenuDemo from "./ViewMenuDemo";
import { DeviceFrame, DocsFrame } from "../../stories/helpers";

/**
 * The shared View Menu module (src/modules/ViewMenu) — a clean showcase of
 * the menu alone, permanently open. The real consumer wiring (trigger,
 * positioning, closing, per-view state) is in the Filters prototype.
 *
 * The DEFAULT is the version every object type gets — Table / Cards, Sort by
 * and Columns. The "Schedule horizon" row and the "Timeline" view are JOBS
 * ONLY (other objects have no schedule): the Jobs story opts them in through
 * the `scheduled` and `timeline` props, exactly as a jobs consumer would.
 */
const meta: Meta = {
  title: 'Modules/"View" Menu',
  // Fullscreen + DocsFrame per the docs convention: the frame owns the ONLY
  // padding — the default --size-20 (80px) all round (Daniel, 2026-09-04).
  parameters: { layout: "fullscreen", controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

// The card and the device frame are fixed-width blocks — centered in the
// DocsFrame's column (Daniel, 2026-09-04).
const Centered = ({ children }: { children: ReactNode }) => (
  <div style={{ width: "fit-content", margin: "0 auto" }}>{children}</div>
);

/**
 * Desktop, the DEFAULT version (any object type) — no jobs-only sections.
 * Try: switch Table/Cards; change the sort column (search works) and flip the
 * sort order; toggle column visibility (the last visible one is protected);
 * pin up to 3 columns (the 4th shows the hint); drag rows to reorder within
 * their group.
 */
export const Desktop: Story = {
  render: () => (
    <DocsFrame>
      <Centered>
        <ViewMenuDemo />
      </Centered>
    </DocsFrame>
  ),
};

/**
 * Mobile, the DEFAULT version — the same menu as a drawer. No pinning on
 * mobile; the sort column opens a second drawer with search; the
 * min-one-column warning opens as a Hint drawer.
 */
export const Mobile: Story = {
  render: () => (
    <DocsFrame>
      <Centered>
        <DeviceFrame>
          <ViewMenuDemo mobile />
        </DeviceFrame>
      </Centered>
    </DocsFrame>
  ),
};

/**
 * The JOBS version — the default menu plus the two jobs-only pieces: the
 * "Schedule horizon" row and the "Timeline" view with its settings.
 */
export const Jobs: Story = {
  render: () => (
    <DocsFrame>
      <Centered>
        <ViewMenuDemo jobs />
      </Centered>
    </DocsFrame>
  ),
};
