import type { Meta, StoryObj } from "@storybook/react";

import ActivityLog from "./ActivityLog";
import ActivityLogGroup from "./ActivityLogGroup";
import ActivityLogItem from "./ActivityLogItem";
import ActivityLogSubItem from "./ActivityLogSubItem";
import Em from "./ActivityLogEmphasis";
import AvatarUser from "../Avatar/AvatarUser";
import Avatar from "../Avatar/Avatar";
import { Icon } from "../Icon/Icon";
import { cap, docsFrame } from "../../stories/helpers";

// Offsets from the real clock — the relative labels then read correctly and
// still render identically on every screenshot run.
const ago = (ms: number) => new Date(Date.now() - ms);
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const monthsAgo = (n: number) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  return d;
};
const yearsAgo = (n: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d;
};

// A given day of last month. Past a week a log shows its DATE, so the examples
// have to sit in the month their group header names — set the day BEFORE the
// month or a 31st would overflow into the wrong one.
const lastMonthDay = (day: number, hour = 9) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  d.setDate(day);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const monthLabel = (d: Date) => MONTH_LABEL.format(d);
const thisMonth = () => monthLabel(new Date());
const lastMonth = () => monthLabel(lastMonthDay(1));

const userSymbol = <AvatarUser size="xs" />;
const editSymbol = <Icon icon="pen" size={14} />;

const created = (
  <>
    <Em>Lorne Riddle</Em> created the job series
  </>
);
const edited = (
  <>
    <Em>Lorne Riddle</Em> edited <Em>Series end date → Jan 1, 2027</Em>
  </>
);

const meta: Meta<typeof ActivityLog> = {
  title: "Components/ActivityLog",
  component: ActivityLog,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof ActivityLog>;

// ---- hero ---------------------------------------------------------------

export const Hero: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLog>
        <ActivityLogGroup label={thisMonth()}>
          <ActivityLogItem
            symbol={userSymbol}
            text={
              <>
                <Em>Ava Chen</Em> created the visit
              </>
            }
            date={ago(20 * MIN)}
          />
          <ActivityLogItem
            symbol={editSymbol}
            text={
              <>
                <Em>Lorne Riddle</Em> edited 3 fields
              </>
            }
            date={ago(5 * HOUR)}
          >
            <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" newValue="Jan 1, 2027" />
            <ActivityLogSubItem title="Repeat every" oldValue="2 weeks" newValue="1 week" />
            <ActivityLogSubItem title="Repeat on" oldValue="Mon, Wed" newValue="Tue, Wed" />
          </ActivityLogItem>
        </ActivityLogGroup>

        <ActivityLogGroup label={lastMonth()}>
          <ActivityLogItem
            symbol={editSymbol}
            text={
              <>
                <Em>Ava Chen</Em> cleared <Em>Purchase order</Em>
              </>
            }
            date={lastMonthDay(20, 11)}
          >
            <ActivityLogSubItem title="Purchase order" oldValue="PO-10241" />
          </ActivityLogItem>
          <ActivityLogItem symbol={editSymbol} text={edited} date={lastMonthDay(12, 14)}>
            <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" newValue="Jan 1, 2027" />
          </ActivityLogItem>
          <ActivityLogItem symbol={userSymbol} text={created} date={lastMonthDay(8)} />
        </ActivityLogGroup>
      </ActivityLog>
    </div>
  ),
};

export const Playground: Story = { ...Hero };

// ---- log group ----------------------------------------------------------

export const GroupAccordion: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLog>
        <ActivityLogGroup label={thisMonth()}>
          <ActivityLogItem symbol={userSymbol} text={created} date={ago(20 * MIN)} />
          <ActivityLogItem symbol={editSymbol} text={edited} date={ago(3 * HOUR)}>
            <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" newValue="Jan 1, 2027" />
          </ActivityLogItem>
        </ActivityLogGroup>
        <ActivityLogGroup label={lastMonth()} defaultOpen={false}>
          <ActivityLogItem symbol={userSymbol} text={created} date={lastMonthDay(8)} />
        </ActivityLogGroup>
      </ActivityLog>
    </div>
  ),
};

// ---- log stack ----------------------------------------------------------

export const LogStack: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogGroup label={thisMonth()}>
        <ActivityLogItem symbol={editSymbol} text={edited} date={ago(HOUR)} />
        <ActivityLogItem symbol={editSymbol} text={edited} date={ago(3 * HOUR)} />
        <ActivityLogItem symbol={editSymbol} text={edited} date={ago(5 * HOUR)} />
      </ActivityLogGroup>
    </div>
  ),
};

export const StackOfTwo: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogGroup label={thisMonth()}>
        <ActivityLogItem symbol={editSymbol} text={edited} date={ago(HOUR)} />
        <ActivityLogItem symbol={editSymbol} text={edited} date={ago(3 * HOUR)} />
      </ActivityLogGroup>
    </div>
  ),
};

export const SingleLog: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogGroup label={thisMonth()}>
        <ActivityLogItem symbol={userSymbol} text={created} date={ago(45 * MIN)} />
      </ActivityLogGroup>
    </div>
  ),
};

// ---- log ----------------------------------------------------------------

export const Symbols: Story = {
  render: () => (
    <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
      <div>
        <div style={cap}>user avatar — the person who acted</div>
        <ActivityLogItem position="single" symbol={userSymbol} text={created} date={ago(HOUR)} />
      </div>
      <div>
        <div style={cap}>object avatar — the object the event is about</div>
        <ActivityLogItem
          position="single"
          symbol={<Avatar shape="square" content="image" size="xs" />}
          text={
            <>
              <Em>Cold storage unit</Em> was attached to the job
            </>
          }
          date={ago(HOUR)}
        />
      </div>
      <div>
        <div style={cap}>icon — a change to the object</div>
        <ActivityLogItem position="single" symbol={editSymbol} text={edited} date={ago(HOUR)} />
      </div>
    </div>
  ),
};

export const TextWraps: Story = {
  render: () => (
    <div style={{ ...docsFrame, maxWidth: 460 }}>
      <ActivityLogItem
        position="single"
        symbol={editSymbol}
        text={
          <>
            <Em>Lorne Riddle</Em> edited <Em>Series end date → Jan 1, 2027</Em>
          </>
        }
        date={ago(DAY)}
      />
    </div>
  ),
};

export const TimestampScale: Story = {
  render: () => {
    const samples: [string, Date][] = [
      ["0–59 seconds", ago(30_000)],
      ["1–59 minutes", ago(MIN)],
      ["1–23 hours", ago(HOUR)],
      ["1–6 days", ago(DAY)],
      ["7 days and older — the date takes over", ago(9 * DAY)],
      ["months back — still the date", monthsAgo(3)],
      ["years back — the group header carries the year", yearsAgo(2)],
    ];
    return (
      <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
        {samples.map(([caption, date]) => (
          <div key={caption}>
            <div style={cap}>{caption}</div>
            <ActivityLogItem position="single" symbol={editSymbol} text={edited} date={date} />
          </div>
        ))}
      </div>
    );
  },
};

// ---- accordion ----------------------------------------------------------

export const AccordionClosedAndOpen: Story = {
  render: () => (
    <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
      <div>
        <div style={cap}>closed</div>
        <ActivityLogItem position="single" symbol={editSymbol} text={edited} date={ago(HOUR)}>
          <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" newValue="Jan 1, 2027" />
        </ActivityLogItem>
      </div>
      <div>
        <div style={cap}>open — the connectors drop away</div>
        <ActivityLogItem position="single" symbol={editSymbol} text={edited} date={ago(HOUR)} defaultOpen>
          <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" newValue="Jan 1, 2027" />
        </ActivityLogItem>
      </div>
    </div>
  ),
};

// ---- event types --------------------------------------------------------

export const EventObjectCreated: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogItem position="single" symbol={userSymbol} text={created} date={ago(HOUR)} />
    </div>
  ),
};

export const EventSingleFieldModified: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogItem position="single" symbol={editSymbol} text={edited} date={ago(HOUR)} defaultOpen>
        <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" newValue="Jan 1, 2027" />
      </ActivityLogItem>
    </div>
  ),
};

export const EventFieldFilledIn: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogItem position="single" symbol={editSymbol} text={edited} date={ago(HOUR)} defaultOpen>
        <ActivityLogSubItem title="Series end date" newValue="Jan 1, 2027" />
      </ActivityLogItem>
    </div>
  ),
};

export const EventSingleFieldCleared: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogItem
        position="single"
        symbol={editSymbol}
        text={
          <>
            <Em>Lorne Riddle</Em> cleared <Em>Series end date</Em>
          </>
        }
        date={ago(HOUR)}
        defaultOpen
      >
        <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" />
      </ActivityLogItem>
    </div>
  ),
};

export const EventBatchModified: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogItem
        position="single"
        symbol={editSymbol}
        text={
          <>
            <Em>Lorne Riddle</Em> edited 3 fields
          </>
        }
        date={ago(HOUR)}
        defaultOpen
      >
        <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" newValue="Jan 1, 2027" />
        <ActivityLogSubItem title="Repeat every" oldValue="2 weeks" newValue="1 week" />
        <ActivityLogSubItem title="Repeat on" oldValue="Mon, Wed" newValue="Tue, Wed" />
      </ActivityLogItem>
    </div>
  ),
};
