import type { Meta, StoryObj } from "@storybook/react";

import { users } from "../../../data/users";
import { PhoneViewport } from "../../../stories/helpers";
import SummaryModule, { SummarySession } from "./SummaryModule";

import styles from "./SummaryModule.stories.module.scss";

// ARCHIVE — the Job Details "Summary" module as it was before 2026-08-11,
// kept so the version can still be looked at after the redesign. The live
// Timesheet tab now shows the separate "Time distribution" and "Work timeline"
// modules instead (Figma 24616-81424 / 24616-81593).
const meta: Meta = {
  title: 'Prototypes/Job Details/"Summary" Module',
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

// ---- demo data --------------------------------------------------------------

const HOUR = 3600;
const session = (id: number, day: 1 | 2 | 3, hours: number): SummarySession => ({
  id,
  durationSec: Math.round(hours * HOUR),
  dateLabel: `January ${day}, 2026`,
  month: "JAN",
  day: String(day),
});

const [lorne, thiago, amy, kate] = [users[0], users[1], users[2], users[3]];
const seb = users[6];

const ONE_ASSIGNEE = [lorne];
const ONE_ASSIGNEE_SESSIONS: Record<number, SummarySession[]> = {
  [lorne.id]: [session(1, 1, 3), session(2, 1, 2), session(3, 1, 1.5)],
};

const FIVE_ASSIGNEES = [lorne, thiago, amy, kate, seb];
const FIVE_ASSIGNEE_SESSIONS: Record<number, SummarySession[]> = {
  [lorne.id]: [session(1, 1, 3), session(2, 2, 4.25)],
  [thiago.id]: [session(3, 1, 2.5), session(4, 3, 5)],
  [amy.id]: [session(5, 2, 6)],
  [kate.id]: [session(6, 1, 1.75), session(7, 3, 3.5)],
  [seb.id]: [session(8, 3, 2)],
};

// The page behind the module: the app surface, with the module at the width it
// has in the Job Details content column (608 desktop / 343 mobile).
const Harness = ({
  mobile,
  assignees,
  sessionsByUser,
}: {
  mobile: boolean;
  assignees: typeof users;
  sessionsByUser?: Record<number, SummarySession[]>;
}) => (
  <PhoneViewport>
    <div className={mobile ? styles.pageMobile : styles.page}>
      <SummaryModule assignees={assignees} sessionsByUser={sessionsByUser} mobile={mobile} />
    </div>
  </PhoneViewport>
);

// ---- states -----------------------------------------------------------------

/** No time logged yet — zeroed cards and both charts on their empty state. */
export const EmptyDesktop: Story = {
  name: "Empty / Desktop",
  render: () => <Harness mobile={false} assignees={FIVE_ASSIGNEES.slice(0, 3)} />,
};

/** The same, with the cards stacked. */
export const EmptyMobile: Story = {
  name: "Empty / Mobile",
  render: () => <Harness mobile assignees={FIVE_ASSIGNEES.slice(0, 3)} />,
};

/** One assignee, three sessions on one day — a single-segment chart. */
export const OneAssigneeDesktop: Story = {
  name: "1 Assignee / Desktop",
  render: () => <Harness mobile={false} assignees={ONE_ASSIGNEE} sessionsByUser={ONE_ASSIGNEE_SESSIONS} />,
};

/** The same, with the cards stacked. */
export const OneAssigneeMobile: Story = {
  name: "1 Assignee / Mobile",
  render: () => <Harness mobile assignees={ONE_ASSIGNEE} sessionsByUser={ONE_ASSIGNEE_SESSIONS} />,
};

/** Five assignees over three days — the widest the charts got. */
export const FiveAssigneesDesktop: Story = {
  name: "5 Assignees / Desktop",
  render: () => <Harness mobile={false} assignees={FIVE_ASSIGNEES} sessionsByUser={FIVE_ASSIGNEE_SESSIONS} />,
};

/** The same, with the cards stacked. */
export const FiveAssigneesMobile: Story = {
  name: "5 Assignees / Mobile",
  render: () => <Harness mobile assignees={FIVE_ASSIGNEES} sessionsByUser={FIVE_ASSIGNEE_SESSIONS} />,
};
