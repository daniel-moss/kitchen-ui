import { Fragment } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import ActivityLogItem from "./ActivityLogItem";
import ActivityLogSubItem from "./ActivityLogSubItem";
import Em from "./ActivityLogEmphasis";
import { ActivityLogItemPosition } from "./ActivityLogItem.types";
import AvatarUser from "../Avatar/AvatarUser";
import Avatar from "../Avatar/Avatar";
import { Icon } from "../Icon/Icon";
import { cap, PSEUDO_ALL } from "../../stories/helpers";

const ago = (ms: number) => new Date(Date.now() - ms);
const MIN = 60_000;
const HOUR = 60 * MIN;

// Calendar steps back — months and years are not fixed numbers of days.
const monthsAgo = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
};
const yearsAgo = (n: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d;
};

const frame: React.CSSProperties = { width: 504 };
const stack: React.CSSProperties = { display: "flex", flexDirection: "column", width: 504 };
const column: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-20)" };

const editSymbol = <Icon icon="pen" size={14} />;

const editedText = (
  <>
    <Em>Lorne Riddle</Em> edited <Em>Series end date → Jan 1, 2027</Em>
  </>
);

const meta: Meta<typeof ActivityLogItem> = {
  title: "Components/ActivityLog/ActivityLogItem",
  component: ActivityLogItem,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof ActivityLogItem>;

export const Playground: Story = {
  args: {
    symbol: editSymbol,
    text: editedText,
    date: ago(HOUR),
  },
  render: (args) => (
    <div style={frame}>
      <ActivityLogItem {...args}>
        <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" newValue="Jan 1, 2027" />
      </ActivityLogItem>
    </div>
  ),
};

// The four stack positions and the connectors each one draws.
export const Positions: Story = {
  render: () => (
    <div style={column}>
      {(["top", "center", "bottom", "single"] as ActivityLogItemPosition[]).map((position) => (
        <div key={position}>
          <div style={cap}>{position}</div>
          <div style={frame}>
            <ActivityLogItem position={position} symbol={editSymbol} text={editedText} date={ago(HOUR)} />
          </div>
        </div>
      ))}
    </div>
  ),
};

// Without an explicit position the stack decides: first, middle, last.
export const StackDerivesPosition: Story = {
  render: () => (
    <div style={stack}>
      <ActivityLogItem symbol={editSymbol} text={editedText} date={ago(HOUR)} />
      <ActivityLogItem symbol={editSymbol} text={editedText} date={ago(2 * HOUR)} />
      <ActivityLogItem symbol={editSymbol} text={editedText} date={ago(3 * HOUR)} />
    </div>
  ),
};

// The symbol is the event's "who / what" — an avatar or an icon.
export const Symbols: Story = {
  render: () => (
    <div style={column}>
      <div>
        <div style={cap}>user avatar — the person who acted</div>
        <div style={frame}>
          <ActivityLogItem
            position="single"
            symbol={<AvatarUser size="xs" />}
            text={
              <>
                <Em>Lorne Riddle</Em> created the job series
              </>
            }
            date={ago(HOUR)}
          />
        </div>
      </div>
      <div>
        <div style={cap}>object avatar</div>
        <div style={frame}>
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
      </div>
      <div>
        <div style={cap}>icon — a system action</div>
        <div style={frame}>
          <ActivityLogItem position="single" symbol={editSymbol} text={editedText} date={ago(HOUR)} />
        </div>
      </div>
      <div>
        <div style={cap}>default — the generic event icon</div>
        <div style={frame}>
          <ActivityLogItem position="single" text={<>Something happened</>} date={ago(HOUR)} />
        </div>
      </div>
    </div>
  ),
};

// The accordion, closed and open. Open drops the connectors.
export const Accordion: Story = {
  render: () => (
    <div style={column}>
      <div>
        <div style={cap}>closed</div>
        <div style={stack}>
          <ActivityLogItem symbol={editSymbol} text={editedText} date={ago(HOUR)} />
          <ActivityLogItem symbol={editSymbol} text={editedText} date={ago(2 * HOUR)}>
            <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" newValue="Jan 1, 2027" />
          </ActivityLogItem>
        </div>
      </div>
      <div>
        <div style={cap}>open</div>
        <div style={stack}>
          <ActivityLogItem symbol={editSymbol} text={editedText} date={ago(HOUR)} />
          <ActivityLogItem symbol={editSymbol} text={editedText} date={ago(2 * HOUR)} defaultOpen>
            <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" newValue="Jan 1, 2027" />
          </ActivityLogItem>
        </div>
      </div>
    </div>
  ),
};

// Only accordion logs react to the pointer; a plain log is static.
export const States: Story = {
  render: () => (
    <div style={column}>
      {(["default", "hover", "press", "focus"] as const).map((state) => (
        <Fragment key={state}>
          <div>
            <div style={cap}>closed · {state}</div>
            <div style={frame} className={PSEUDO_ALL[state]}>
              <ActivityLogItem position="single" symbol={editSymbol} text={editedText} date={ago(HOUR)}>
                <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" newValue="Jan 1, 2027" />
              </ActivityLogItem>
            </div>
          </div>
          <div>
            <div style={cap}>open · {state}</div>
            <div style={frame} className={PSEUDO_ALL[state]}>
              <ActivityLogItem position="single" symbol={editSymbol} text={editedText} date={ago(HOUR)} defaultOpen>
                <ActivityLogSubItem title="Series end date" oldValue="Jan 4, 2027" newValue="Jan 1, 2027" />
              </ActivityLogItem>
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  ),
};

// Long text wraps; the timestamp stays on the first line.
export const TextWraps: Story = {
  render: () => (
    <div style={{ width: 350 }}>
      <ActivityLogItem
        position="single"
        symbol={editSymbol}
        text={
          <>
            <Em>Lorne Riddle</Em> edited <Em>Series end date → Jan 1, 2027</Em>
          </>
        }
        date={ago(24 * HOUR)}
      />
    </div>
  ),
};

// The documented relative scale. Hovering any of them shows the exact time.
export const Timestamps: Story = {
  render: () => {
    const samples: [string, Date][] = [
      ["0–59 seconds", ago(30_000)],
      ["1–59 minutes", ago(MIN)],
      ["1–23 hours", ago(HOUR)],
      ["1–6 days", ago(24 * HOUR)],
      ["7 days and older — the date takes over", ago(9 * 24 * HOUR)],
      ["months back — still the date", monthsAgo(3)],
      ["years back — the group header carries the year", yearsAgo(2)],
    ];
    return (
      <div style={column}>
        {samples.map(([caption, date]) => (
          <div key={caption}>
            <div style={cap}>{caption}</div>
            <div style={frame}>
              <ActivityLogItem position="single" symbol={editSymbol} text={editedText} date={date} />
            </div>
          </div>
        ))}
      </div>
    );
  },
};
