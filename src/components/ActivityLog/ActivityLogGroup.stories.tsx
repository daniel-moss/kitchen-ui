import type { Meta, StoryObj } from "@storybook/react";

import ActivityLogGroup from "./ActivityLogGroup";
import ActivityLogItem from "./ActivityLogItem";
import ActivityLogSubItem from "./ActivityLogSubItem";
import Em from "./ActivityLogEmphasis";
import AvatarUser from "../Avatar/AvatarUser";
import { Icon } from "../Icon/Icon";
import { cap } from "../../stories/helpers";

const ago = (ms: number) => new Date(Date.now() - ms);
const MIN = 60_000;
const HOUR = 60 * MIN;

// The header names the month its logs are in, so it is derived, not typed —
// logs older than a week show their date and would contradict a fixed label.
const MONTH_LABEL = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const thisMonth = () => MONTH_LABEL.format(new Date());

const frame: React.CSSProperties = { width: 504 };
const column: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-20)", width: 504 };

const editSymbol = <Icon icon="pen" size={14} />;

// Newest first — the group's own convention.
const logs = (
  <>
    <ActivityLogItem
      symbol={editSymbol}
      text={
        <>
          <Em>Ava Chen</Em> edited 3 fields
        </>
      }
      date={ago(20 * MIN)}
    >
      <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" newValue="Jan 1, 2027" />
      <ActivityLogSubItem title="Repeat every" oldValue="2 weeks" newValue="1 week" />
      <ActivityLogSubItem title="Repeat on" oldValue="Mon, Wed" newValue="Tue, Wed" />
    </ActivityLogItem>
    <ActivityLogItem
      symbol={editSymbol}
      text={
        <>
          <Em>Lorne Riddle</Em> edited <Em>Series end date → Jan 1, 2027</Em>
        </>
      }
      date={ago(3 * HOUR)}
    >
      <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" newValue="Jan 1, 2027" />
    </ActivityLogItem>
    <ActivityLogItem
      symbol={<AvatarUser size="xs" />}
      text={
        <>
          <Em>Lorne Riddle</Em> created the job series
        </>
      }
      date={ago(6 * HOUR)}
    />
  </>
);

const meta: Meta<typeof ActivityLogGroup> = {
  title: "Components/ActivityLog/ActivityLogGroup",
  component: ActivityLogGroup,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof ActivityLogGroup>;

export const Playground: Story = {
  args: { label: thisMonth() },
  render: (args) => (
    <div style={frame}>
      <ActivityLogGroup {...args}>{logs}</ActivityLogGroup>
    </div>
  ),
};

// Groups start open; clicking the header collapses them.
export const OpenAndClosed: Story = {
  render: () => (
    <div style={column}>
      <div>
        <div style={cap}>open (default)</div>
        <ActivityLogGroup label={thisMonth()}>{logs}</ActivityLogGroup>
      </div>
      <div>
        <div style={cap}>collapsed</div>
        <ActivityLogGroup label={thisMonth()} defaultOpen={false}>
          {logs}
        </ActivityLogGroup>
      </div>
    </div>
  ),
};
