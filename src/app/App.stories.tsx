import type { Meta, StoryObj } from "@storybook/react";

import App, { AppProps } from "./App";
import { PhoneViewport } from "../stories/helpers";

// The DEMO APP — one link that contains everything designed so far. Unlike the
// prototypes, it is NOT split into Desktop and Mobile stories: the shell
// follows the viewport (`breakpoint` defaults to "auto", and `useIsDesktop`
// listens to the media query), so the same link transforms on a phone, a
// tablet and a monitor. A new page never adds a story here.
//
// It began (2026-09-26) as a copy of the Filters prototype, so that prototype
// can stay frozen while user testing runs — see MODULES.md. From here the app
// grows: the shell and routing come out, object-details pages arrive, and the
// database becomes a writable store.
const meta: Meta<AppProps> = {
  title: "App",
  argTypes: {
    breakpoint: { table: { disable: true } },
    initialPage: { table: { disable: true } },
  },
};

export default meta;

type Story = StoryObj<AppProps>;

/**
 * The whole app. Opens on the Jobs list; the sidebar (desktop) and the Menu
 * page (mobile) reach everything else.
 *
 * Demo only — there is no backend. Every row comes from the demo database in
 * `src/data/db`.
 */
export const Demo: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    // PhoneViewport (not a bare 100vh div) so iPad standalone works: it strips
    // Storybook's body margins and publishes the safe-area vars the shell
    // reads. On a desktop browser it is a plain full-viewport block.
    <PhoneViewport>
      <App {...args} />
    </PhoneViewport>
  ),
};
