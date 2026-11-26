import type { Meta, StoryObj } from "@storybook/react";
import { CSSProperties, ReactNode } from "react";

import ActivityLog from "./ActivityLog";
import ActivityLogGroup from "./ActivityLogGroup";
import ActivityLogItem from "./ActivityLogItem";
import ActivityLogSubItem from "./ActivityLogSubItem";
import ActivityLogTextChange from "./ActivityLogTextChange";
import ActivityLogUpdate from "./ActivityLogUpdate";
import ActivityLogValue from "./ActivityLogValue";
import Subtle from "./ActivityLogSubtle";
import Removed from "./ActivityLogRemoved";
import { shortTimestamp } from "./timestamp";
import AvatarUser from "../Avatar/AvatarUser";
import Avatar from "../Avatar/Avatar";
import { Icon } from "../Icon/Icon";
import Tooltip from "../Tooltip/Tooltip";
import { docsFrame, PSEUDO_ALL } from "../../stories/helpers";

// The previews copy the Figma Documentation page (24130-5398) preview by
// preview: placeholder content ("Text", "N ago", diamonds-4, "Title") where
// the page shows the structure, real sentences where it shows a case.

// Offsets from the real clock — relative labels read correctly and render the
// same on every screenshot run.
const ago = (ms: number) => new Date(Date.now() - ms);
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const thisMonth = () => MONTH_LABEL.format(new Date());
const lastMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return MONTH_LABEL.format(d);
};

const generic = <Icon icon="diamonds-4" size={14} />;
const pen = <Icon icon="pen" size={14} />;
const stopwatch = <Icon icon="stopwatch" size={14} />;
const person = <AvatarUser size="xs" />;

// The priority values the Figma previews use, with their real icons.
const priorityMedium = <Icon icon="duotone-solid-priority-medium" pack="custom-duotone" size={14} container="fixedHeight" />;
const priorityHigh = <Icon icon="solid-priority-high" pack="custom" size={14} container="fixedHeight" />;

const createdJob = (
  <>
    Lorne Riddle<Subtle> created the job</Subtle>
  </>
);

// The Anatomy / Cases sentence, written out by hand so each run can be seen.
const prioritySentence = (
  <>
    Lorne Riddle<Subtle> updated </Subtle>Priority:
    <Removed>
      <ActivityLogValue icon={priorityMedium}>Medium</ActivityLogValue>
    </Removed>
    {" →"}
    <ActivityLogValue icon={priorityHigh}>High</ActivityLogValue>
  </>
);

const TEXT_BEFORE =
  "Walk-in cooler is not holding temperature. Kitchen staff reported it climbing above 45°F overnight, and product is at risk. Please check the compressor first.";
const TEXT_AFTER =
  "Walk-in cooler is not holding temperature. Kitchen staff reported it climbing above 50°F overnight, and product is at risk. Please check the compressor and the door seal first.";

/** A column of examples, 80px apart unless the Figma preview packs them. */
const Stack = ({ children, gap = 0, style }: { children: ReactNode; gap?: number; style?: CSSProperties }) => (
  <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>{children}</div>
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
          <ActivityLogUpdate
            person="Lorne Riddle"
            changes={[{ label: "Service", oldValue: "Standard repair", newValue: "Cooler maintenance" }]}
            date={ago(10_000)}
          />
          <ActivityLogUpdate
            person="Lorne Riddle"
            changes={[
              {
                label: "Scheduled for",
                oldValue: "Monday, January 1, 2026 at 12:00 PM",
                newValue: "Tuesday, January 2, 2026 at 12:00 PM",
              },
              { label: "Est. duration", oldValue: "1 hr 30 min", newValue: "2 hr" },
            ]}
            label="3d ago"
            defaultOpen
          />
          <ActivityLogItem
            symbol={stopwatch}
            text={
              <>
                Lorne Riddle<Subtle> updated time session </Subtle>
                Working: Mon, Jan 1 at 11:30 AM → Mon, Jan 1 at 2:30 PM
              </>
            }
            label="3d ago"
          />
          <ActivityLogItem symbol={person} text={createdJob} label="4d ago" />
        </ActivityLogGroup>
      </ActivityLog>
    </div>
  ),
};

export const Playground: Story = { ...Hero, parameters: { layout: "centered" } };

// ---- anatomy ------------------------------------------------------------

export const AnatomyGroup: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogGroup label={thisMonth()}>
        <ActivityLogItem symbol={generic} text="Text" label="N ago" />
        <ActivityLogItem symbol={generic} text="Text" label="N ago" />
        <ActivityLogItem symbol={generic} text="Text" label="N ago" />
      </ActivityLogGroup>
    </div>
  ),
};

export const AnatomyLog: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogItem position="single" symbol={pen} text={prioritySentence} label="4d ago" />
    </div>
  ),
};

export const AnatomySymbol: Story = {
  render: () => (
    <div style={docsFrame}>
      <Stack gap={80}>
        <ActivityLogItem position="center" symbol={<Avatar size="xs" />} text="Text" label="N ago" />
        <ActivityLogItem position="center" symbol={generic} text="Text" label="N ago" />
      </Stack>
    </div>
  ),
};

export const AnatomySpacer: Story = {
  render: () => (
    <div style={docsFrame}>
      <Stack>
        <ActivityLogItem position="center" symbol={generic} text="Text" label="N ago" />
        <ActivityLogItem position="bottom" symbol={generic} text="Text" label="N ago" />
      </Stack>
    </div>
  ),
};

export const AnatomyAccordion: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogUpdate
        person="Lorne Riddle"
        changes={[
          {
            label: "Scheduled for",
            oldValue: "Monday, January 1, 2026 at 12:00 PM",
            newValue: "Tuesday, January 2, 2026 at 12:00 PM",
          },
          { label: "Est. duration", oldValue: "1 hr 30 min", newValue: "2 hr" },
        ]}
        position="center"
        label="3d ago"
        defaultOpen
      />
    </div>
  ),
};

export const AnatomySubLog: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogSubItem title="Service" oldValue="Standard labor" newValue="Cooler maintenance" />
    </div>
  ),
};

// ---- groups -------------------------------------------------------------

const twoGroups = (open: boolean) => (
  <div style={docsFrame}>
    <ActivityLog>
      <ActivityLogGroup label={thisMonth()} open={open}>
        <ActivityLogItem symbol={generic} text="Text" label="N ago" />
        <ActivityLogItem symbol={generic} text="Text" label="N ago" />
        <ActivityLogItem symbol={generic} text="Text" label="N ago" />
      </ActivityLogGroup>
      <ActivityLogGroup label={lastMonth()} open={open}>
        <ActivityLogItem symbol={generic} text="Text" label="N ago" />
        <ActivityLogItem symbol={generic} text="Text" label="N ago" />
      </ActivityLogGroup>
    </ActivityLog>
  </div>
);

export const GroupsOpen: Story = { render: () => twoGroups(true) };
export const GroupsClosed: Story = { render: () => twoGroups(false) };

// ---- timeline -----------------------------------------------------------

export const TimelinePositions: Story = {
  render: () => (
    <div style={docsFrame}>
      <Stack>
        <ActivityLogItem position="top" symbol={generic} text="Top" label="N ago" />
        <ActivityLogItem position="center" symbol={generic} text="Center" label="N ago" />
        <ActivityLogItem position="bottom" symbol={generic} text="Bottom" label="N ago" />
      </Stack>
    </div>
  ),
};

export const TimelineSingle: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogItem position="single" symbol={generic} text="Single" label="N ago" />
    </div>
  ),
};

// ---- log ----------------------------------------------------------------

const sessionStatus = (
  <>
    Lorne Riddle<Subtle> updated time session </Subtle>Status: <Removed>Working</Removed> → Travelling
  </>
);

export const LogSymbols: Story = {
  render: () => (
    <div style={docsFrame}>
      <Stack gap={80}>
        <ActivityLogItem position="single" symbol={person} text={createdJob} label="N ago" />
        <ActivityLogItem position="single" symbol={stopwatch} text={sessionStatus} label="N ago" />
      </Stack>
    </div>
  ),
};

export const LogWraps: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={{ width: 320, margin: "0 auto" }}>
        <ActivityLogItem position="single" symbol={stopwatch} text={sessionStatus} label="N ago" />
      </div>
    </div>
  ),
};

export const LogValueIcons: Story = {
  render: () => (
    <div style={docsFrame} data-hug>
      <Stack gap={80} style={{ alignItems: "center" }}>
        <div style={{ width: 500 }}>
          <ActivityLogItem position="single" symbol={pen} text={prioritySentence} label="4d ago" />
        </div>
        {/* Narrow on purpose: "[icon] High" wraps and starts the line flush. */}
        <div style={{ width: 340 }}>
          <ActivityLogItem position="single" symbol={pen} text={prioritySentence} label="4d ago" />
        </div>
      </Stack>
    </div>
  ),
};

// The log's own timestamp style: body-400-compact, --text-subtle.
const stampStyle: CSSProperties = { color: "var(--text-subtle)", font: "var(--font-body-400-compact)" };

export const Timestamps: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
        {[ago(10_000), ago(MIN), ago(HOUR), ago(DAY), ago(30 * DAY)].map((d, i) => (
          <span key={i} style={stampStyle}>
            {shortTimestamp(d)}
          </span>
        ))}
      </div>
    </div>
  ),
};

export const TimestampTooltip: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        {/* Above the time, so placement "top" — the tongue points down at it. */}
        <Tooltip placement="top" text="Mon, Jan 1, 2026 at 12:00 PM" />
        <span style={stampStyle}>1d ago</span>
      </div>
    </div>
  ),
};

export const AccordionClosed: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogItem position="center" symbol={generic} text="Text" label="N ago">
        <ActivityLogSubItem title="Title" oldValue="[old_value]" newValue="[new_value]" />
      </ActivityLogItem>
    </div>
  ),
};

export const AccordionOpen: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogItem position="center" symbol={generic} text="Text" label="N ago" defaultOpen>
        <ActivityLogSubItem title="Title" oldValue="[old_value]" newValue="[new_value]" />
        <ActivityLogSubItem title="Title" oldValue="[old_value]" newValue="[new_value]" />
      </ActivityLogItem>
    </div>
  ),
};

// ---- cases --------------------------------------------------------------

export const CaseOneField: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogUpdate
        person="Lorne Riddle"
        changes={[
          { label: "Priority", oldValue: "Medium", oldIcon: priorityMedium, newValue: "High", newIcon: priorityHigh },
        ]}
        position="single"
        label="4d ago"
      />
    </div>
  ),
};

export const CaseValueAdded: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogUpdate
        person="Lorne Riddle"
        changes={[{ label: "PO number", oldValue: "", newValue: "4471" }]}
        position="single"
        label="Just now"
      />
    </div>
  ),
};

export const CaseValueCleared: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogUpdate
        person="Lorne Riddle"
        changes={[{ label: "PO number", oldValue: "4471", newValue: "" }]}
        position="single"
        label="Just now"
      />
    </div>
  ),
};

export const CaseTextField: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogUpdate
        person="Lorne Riddle"
        changes={[{ label: "Description", oldValue: TEXT_BEFORE, newValue: TEXT_AFTER, isText: true }]}
        position="single"
        label="Just now"
        defaultOpen
      />
    </div>
  ),
};

const sourceChanges = [
  { label: "Source", oldValue: "Direct {Phone, email, etc.}", newValue: "ServiceChannel (SC)" },
  { label: "Source ID", oldValue: "3454876", newValue: "298734" },
  { label: "Branch", oldValue: "Headquarters", newValue: "San Francisco" },
  { label: "Received by", oldValue: "Lorne Riddle", newValue: "Ava Chen" },
];

export const CaseSeveralFields: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogUpdate
        person="Lorne Riddle"
        changes={sourceChanges.slice(0, 3)}
        position="single"
        label="Just now"
        defaultOpen
      />
    </div>
  ),
};

export const CaseMoreThanThree: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogUpdate person="Lorne Riddle" changes={sourceChanges} position="single" label="Just now" />
    </div>
  ),
};

// ---- sub-logs -----------------------------------------------------------

export const SubLogTitle: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogUpdate
        person="Lorne Riddle"
        changes={sourceChanges.slice(0, 2)}
        position="single"
        label="Just now"
        defaultOpen
      />
    </div>
  ),
};

export const SubLogNoTitle: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogItem
        position="single"
        symbol={pen}
        text={
          <>
            Lorne Riddle<Subtle> updated </Subtle>Description
          </>
        }
        label="Just now"
        defaultOpen
      >
        <ActivityLogSubItem caption={TEXT_BEFORE} />
      </ActivityLogItem>
    </div>
  ),
};

export const SubLogTextChange: Story = {
  render: () => (
    <div style={docsFrame}>
      <ActivityLogItem
        position="single"
        symbol={pen}
        text={
          <>
            Lorne Riddle<Subtle> updated </Subtle>Description
          </>
        }
        label="Just now"
        defaultOpen
      >
        <ActivityLogSubItem caption={<ActivityLogTextChange oldText={TEXT_BEFORE} newText={TEXT_AFTER} />} />
      </ActivityLogItem>
    </div>
  ),
};

// ---- states -------------------------------------------------------------

const STATES = ["default", "hover", "press", "focus"] as const;

const stateLogs = (open: boolean) => (
  <div style={docsFrame}>
    <Stack gap={24}>
      {STATES.map((state) => (
        <div key={state} className={state === "default" ? undefined : PSEUDO_ALL[state]}>
          <ActivityLogItem position="center" symbol={generic} text="Text" label="N ago" open={open}>
            <ActivityLogSubItem title="Title" oldValue="[old_value]" newValue="[new_value]" />
          </ActivityLogItem>
        </div>
      ))}
    </Stack>
  </div>
);

export const StatesClosed: Story = { render: () => stateLogs(false) };
export const StatesOpen: Story = { render: () => stateLogs(true) };
