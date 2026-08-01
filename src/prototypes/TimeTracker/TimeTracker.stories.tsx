import type { Meta, StoryObj } from "@storybook/react";

import TimeTracker from "./TimeTracker";
import { users } from "../../data/users";
import { PhoneViewport } from "../../stories/helpers";

const meta: Meta = {
  title: "Prototypes/Time Tracker",
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

// Mobile-only prototypes — rendered edge-to-edge (PhoneViewport) so the
// iframe links open cleanly on a real phone. Open a story's iframe URL:
//   /iframe.html?id=prototypes-time-tracker--<story>&viewMode=story

/**
 * ① With Check-In. Start the job (dialog has no check-in card) → the action
 * bar becomes `[⋯] [Pause] [Complete]`. Open ⋯ → Check in → the timer bar
 * appears (running clock + Check out). Check in / out is a separate action in
 * the context menu; it is not tied to Start / Pause.
 */
export const Concept3: Story = {
  name: "Concept 3",
  render: () => (
    <PhoneViewport>
      <TimeTracker config={{ hasCheckIn: true, initialStatus: "upcoming", viewerId: users[0].id }} />
    </PhoneViewport>
  ),
};

/**
 * ② Without Check-In. No check-in / out and no timer bar at all. Starting the
 * job just changes the action bar to `[⋯] [Pause] [Complete]`.
 */
export const Concept4: Story = {
  name: "Concept 4",
  render: () => (
    <PhoneViewport>
      <TimeTracker config={{ hasCheckIn: false, initialStatus: "upcoming", viewerId: users[0].id }} />
    </PhoneViewport>
  ),
};

/**
 * ③ Second Assignee (Thiago's perspective). The job is already started (by the
 * first assignee, Lorne); Thiago's timer is not running yet. Open ⋯ → Check in
 * to start their own timer — sessions + the add plus are on Thiago's group.
 */
export const Concept5: Story = {
  name: "Concept 5",
  render: () => (
    <PhoneViewport>
      <TimeTracker config={{ hasCheckIn: true, initialStatus: "active", viewerId: users[1].id }} />
    </PhoneViewport>
  ),
};
