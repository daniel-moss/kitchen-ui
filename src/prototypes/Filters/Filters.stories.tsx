import type { Meta, StoryObj } from "@storybook/react";

import Filters, { FiltersProps } from "./Filters";
import { PhoneViewport } from "../../stories/helpers";

const meta: Meta<FiltersProps> = {
  title: "Prototypes/Filters",
  argTypes: {
    breakpoint: { table: { disable: true } },
  },
};

export default meta;

type Story = StoryObj<FiltersProps>;

/**
 * Desktop shell (Figma node 13889-19457). Concept 2 with no job counts: the tabs
 * are labels only. They stay the DS TabGroup's `default` kind — 36px pills, 2px
 * apart, the selected one on a soft `--gray-a3` fill. [Open · Closed] sits in
 * the TOP BAR, 16px after the "Jobs" title; the view bar below holds the status
 * tabs — [All · Pending · Scheduled · In progress · On hold · Completed] — plus
 * Search, Filters and View on the right.
 *
 * Every status tab applies a LOCKED Status filter, which shows as the first chip
 * in the filter bar. Its value can be opened to see which statuses are on, but
 * every option in that list is disabled: the tab owns the filter.
 */
export const Desktop: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    // PhoneViewport (not a bare 100vh div) so iPad standalone works: it strips
    // Storybook's body margins and publishes the safe-area vars the shell reads.
    // On a desktop browser it is a plain full-viewport block.
    <PhoneViewport>
      <Filters {...args} breakpoint="desktop" />
    </PhoneViewport>
  ),
};

/**
 * Mobile shell (Figma nodes 13889-19548 and 13897-21009). The top bar carries
 * the title, the [Open · Closed] pill tabs and the DS's own mobile create button
 * (a solid plus IconButton). The view bar below has the status picker on the
 * left — just the tab's name and a chevron, no icon and no count — which opens
 * the tabs as one flat `SelectList` of labels (node 13897-21030).
 *
 * The one count left is the Filters button's `Counter`: how many filters are
 * applied, counting the tab's own Status filter. With none applied it is the
 * plain square IconButton. Tapping it opens the Filters `Menu` as a drawer
 * (Figma node 13857-25343).
 */
export const Mobile: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="mobile" />
    </PhoneViewport>
  ),
};
