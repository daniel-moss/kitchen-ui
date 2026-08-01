import { CSSProperties, ReactNode } from "react";

import clsx from "clsx";

import Avatar from "../../components/Avatar/Avatar";
import AvatarGroup from "../../components/Avatar/AvatarGroup";
import AvatarUser from "../../components/Avatar/AvatarUser";
import { AvatarRingColor } from "../../components/Avatar/Avatar.types";
import Button from "../../components/Button/Button";
import { Divider } from "../../components/Divider/Divider";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import HintTrigger from "../../components/Hint/HintTrigger";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import ListItem from "../../components/ListItem/ListItem";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import Menu from "../../components/Menu/Menu";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import { users } from "../../data/users";
import { noop, slot, useAnchoredMenu } from "./shared";

import styles from "./TimesheetPanel.module.scss";

type User = (typeof users)[number];
/** A user record (for consumers building a SessionGroup, e.g. the Complete dialog). */
export type TimesheetUser = User;

// ---- filled-state demo data (used only once a job has time logs) ------------

const lorne = users[0];
const seb = users[6];
const thiago = users[1];

interface Log {
  month: string;
  day: string;
  range: string;
  date: string;
  duration: string;
}
const FILLED_LOGS: { user: User; total: string; logs: Log[] }[] = [
  {
    user: lorne,
    total: "6 hr 30 min",
    logs: [
      { month: "JAN", day: "1", range: "11:30 AM → 2:30 PM", date: "January 1, 2026", duration: "3 hr" },
      { month: "JAN", day: "1", range: "10:30 AM → 11:30 AM", date: "January 1, 2026", duration: "2 hr" },
      { month: "JAN", day: "1", range: "9:00 AM → 10:30 AM", date: "January 1, 2026", duration: "1 hr 30 min" },
    ],
  },
  {
    user: thiago,
    total: "4 hr",
    logs: [
      { month: "JAN", day: "1", range: "6:00 PM → 8:00 PM", date: "January 1, 2026", duration: "2 hr" },
      { month: "JAN", day: "1", range: "4:00 PM → 5:30 PM", date: "January 1, 2026", duration: "1 hr 30 min" },
      { month: "JAN", day: "1", range: "2:30 PM → 3:00 PM", date: "January 1, 2026", duration: "30 min" },
    ],
  },
];

interface Segment {
  weight: number;
  color: string;
  top: ReactNode;
  value: string;
}
interface LegendItem {
  color: string;
  name: string;
  value: string;
  pct: string;
}

const liveAvatar = (u: User, ring: AvatarRingColor) => (
  <Avatar type="live" content="image" imageSrc={u.avatar} ringColor={ring} size="md" />
);

const TIME_DIST_SEGMENTS: Segment[] = [
  { weight: 10.75, color: "var(--live-collaboration-crimson)", top: liveAvatar(lorne, "crimson"), value: "10.75 hr" },
  { weight: 20.5, color: "var(--live-collaboration-teal)", top: liveAvatar(seb, "teal"), value: "20.50 hr" },
  { weight: 20.5, color: "var(--live-collaboration-amber)", top: liveAvatar(thiago, "amber"), value: "20.50 hr" },
];
const TIME_DIST_LEGEND: LegendItem[] = [
  { color: "var(--live-collaboration-crimson)", name: "Lorne Riddle", value: "10 hr 45 min", pct: "20%" },
  { color: "var(--live-collaboration-teal)", name: "Seb Phillips", value: "20 hr 30 min", pct: "40%" },
  { color: "var(--live-collaboration-amber)", name: "Thiago Cummings", value: "20 hr 30 min", pct: "40%" },
];
const WORK_TIMELINE_SEGMENTS: Segment[] = [
  { weight: 18.25, color: "var(--live-collaboration-plum)", top: <CalendarGlyph month="JAN" day="18" />, value: "18.25 hr" },
  { weight: 16.5, color: "var(--live-collaboration-orange)", top: <CalendarGlyph month="JAN" day="22" />, value: "16.50 hr" },
  { weight: 16.5, color: "var(--live-collaboration-blue)", top: <CalendarGlyph month="JAN" day="27" />, value: "16.50 hr" },
];
const WORK_TIMELINE_LEGEND: LegendItem[] = [
  { color: "var(--live-collaboration-plum)", name: "January 18, 2026", value: "18 hr 15 min", pct: "36%" },
  { color: "var(--live-collaboration-orange)", name: "January 22, 2026", value: "16 hr 30 min", pct: "32%" },
  { color: "var(--live-collaboration-blue)", name: "January 27, 2026", value: "16 hr 30 min", pct: "32%" },
];

// ---- small building blocks --------------------------------------------------

// A stat widget = a bodyOnly DisplayModule (Figma names it "DisplayModule"):
// label (Regular 14/20 subtle) + value (Medium 32/40) + sub (Regular 13/20).
// Empty → value + sub read placeholder.
const StatWidget = ({ label, value, sub, empty = false }: { label: string; value: string; sub: string; empty?: boolean }) => (
  <DisplayModule
    variant="bodyOnly"
    className={styles.widget}
    content={
      <div className={styles.widgetBody}>
        <span className={styles.widgetLabel}>{label}</span>
        <div className={clsx(styles.widgetValueBlock, empty && styles.widgetValueBlockEmpty)}>
          <span className={styles.widgetValue}>{value}</span>
          <span className={styles.widgetSub}>{sub}</span>
        </div>
      </div>
    }
  />
);

function DateChip({ month, day }: { month: string; day: string }) {
  return (
    <div className={styles.dateChip}>
      <span className={styles.dateChipMonth}>{month}</span>
      <span className={styles.dateChipDay}>{day}</span>
    </div>
  );
}

const LogRow = ({ log }: { log: Log }) => (
  <ListItem
    variant="titleCaption"
    title={log.range}
    caption={log.date}
    avatar={<DateChip month={log.month} day={log.day} />}
    slotRight={
      <div className={styles.logRight}>
        <span className={styles.logDuration}>{log.duration}</span>
        <HoverTooltip text="Edit">
          <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit time entry" onClick={noop} />
        </HoverTooltip>
      </div>
    }
  />
);

// ---- time sessions (check-in → check-out) ----------------------------------
// A logged time session: "active" (checked in, still running) or "ended".
// Figma nodes 21803-49328 (active) / 21803-49132 (ended).
export interface Session {
  id: number;
  /** Session start, e.g. "11:30 AM". */
  startLabel: string;
  /** Start-date month / day for the calendar-glyph avatar. */
  month: string;
  day: string;
  /** Full start date, e.g. "January 1, 2026". */
  dateLabel: string;
  /** True while the session is running (checked in). */
  active: boolean;
  /** Session end, e.g. "2:30 PM" (ended only). */
  endLabel?: string;
  /** Full end date (ended only) — differs from `dateLabel` for a cross-day session. */
  endDateLabel?: string;
  /** Logged seconds — active = live elapsed, ended = final. Drives the group total. */
  durationSec: number;
  /** Right-side value: active = live "MM:SS" (red); ended = "3 hr". */
  timerLabel: string;
}

// A session ≥ this long shows the warning state (amber avatar + amber duration).
// 10 hours (matches the Figma annotation on node 21803-49361).
const LONG_SESSION_SEC = 10 * 3600;

// Seconds → "3 hr" / "1 hr 30 min" / "30 min" / "0 hr".
export const formatHrMin = (sec: number) => {
  const totalMin = Math.round(sec / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0 && m === 0) return "0 hr";
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
};

// Item 9 — logged time is billed in 15-minute increments, always rounded UP
// (12 min → 15, 17 min → 30). Totals use these rounded values; the row shows the
// rounded value with the ACTUAL value on hover; editing/adding uses precise values.
const QUARTER_MIN = 15;
const QUARTER_SEC = QUARTER_MIN * 60;
export const roundDurationSec = (sec: number) => Math.ceil(sec / QUARTER_SEC) * QUARTER_SEC;
const ceil15Min = (min: number) => Math.ceil(min / QUARTER_MIN) * QUARTER_MIN;
// "8:05 AM" → minutes since midnight (null if unparseable).
const parseClockMin = (label: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label.trim());
  if (!m) return null;
  const h = (parseInt(m[1], 10) % 12) + (/pm/i.test(m[3]) ? 12 : 0);
  return h * 60 + parseInt(m[2], 10);
};
// minutes since midnight → "8:15 AM" (wraps within a day).
const fmtClockMin = (min: number): string => {
  const mm = ((min % 1440) + 1440) % 1440;
  const h24 = Math.floor(mm / 60);
  const mer = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mm % 60).padStart(2, "0")} ${mer}`;
};

// Decimal-hours label for a chart bar — up to 2 decimals, trailing zero dropped
// ("0.25 hr", "0.5 hr" not "0.50 hr", "4.5 hr", "1 hr"). Item 6.
const formatHours = (sec: number) => `${parseFloat((sec / 3600).toFixed(2))} hr`;

// Summary duration (chart legends + the Summary "Time" card): minutes only
// when under an hour ("15 min" / "3 min"), otherwise "H hr M min" (the minutes
// are shown even when zero, e.g. "3 hr 0 min").
const formatDuration = (sec: number) => {
  const totalMin = Math.round(sec / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h === 0 ? `${m} min` : `${h} hr ${m} min`;
};

// Live-collaboration colors assigned in order to techs / days in the charts
// (first tech = crimson, first day = plum — matching the Figma demo).
const TECH_COLORS: AvatarRingColor[] = ["crimson", "teal", "amber", "plum", "violet", "blue", "orange", "cyan"];
const DAY_COLORS = ["plum", "orange", "blue", "crimson", "teal", "amber", "violet", "cyan"];
const liveVar = (name: string) => `var(--live-collaboration-${name})`;

// The widgets + Summary derived from every tech's logged (ended) sessions.
// Active (running) sessions are excluded — their time is not logged until
// check-out. Time distribution fans out one segment per tech who logged time.
function deriveSummary(perTech: { user: User; sessions: Session[] }[]) {
  const techTotals = perTech
    .map((t) => ({ user: t.user, sec: t.sessions.filter((s) => !s.active).reduce((acc, s) => acc + roundDurationSec(s.durationSec), 0) }))
    .filter((t) => t.sec > 0);
  const logged = perTech.flatMap((t) => t.sessions.filter((s) => !s.active));
  const totalSec = logged.reduce((acc, s) => acc + roundDurationSec(s.durationSec), 0);
  const count = logged.length;
  const hasTime = count > 0 && totalSec > 0;

  // Time distribution — one segment per tech who logged time.
  const distSegments: Segment[] = hasTime
    ? techTotals.map((t, i) => ({ weight: t.sec, color: liveVar(TECH_COLORS[i % TECH_COLORS.length]), top: liveAvatar(t.user, TECH_COLORS[i % TECH_COLORS.length]), value: formatHours(t.sec) }))
    : [];
  const distLegend: LegendItem[] = hasTime
    ? techTotals.map((t, i) => ({ color: liveVar(TECH_COLORS[i % TECH_COLORS.length]), name: t.user.name, value: formatDuration(t.sec), pct: `${Math.round((t.sec / totalSec) * 100)}%` }))
    : [];

  // Work timeline — one segment per distinct day any tech logged.
  const days: { key: string; month: string; day: string; sec: number }[] = [];
  for (const s of logged) {
    const found = days.find((d) => d.key === s.dateLabel);
    if (found) found.sec += s.durationSec;
    else days.push({ key: s.dateLabel, month: s.month, day: s.day, sec: s.durationSec });
  }
  const timeSegments: Segment[] = hasTime
    ? days.map((d, i) => ({ weight: d.sec, color: liveVar(DAY_COLORS[i % DAY_COLORS.length]), top: <CalendarGlyph month={d.month} day={d.day} />, value: formatHours(d.sec) }))
    : [];
  const timeLegend: LegendItem[] = hasTime
    ? days.map((d, i) => ({ color: liveVar(DAY_COLORS[i % DAY_COLORS.length]), name: d.key, value: formatDuration(d.sec), pct: `${Math.round((d.sec / totalSec) * 100)}%` }))
    : [];

  return { totalSec, count, dayCount: days.length, distSegments, distLegend, timeSegments, timeLegend };
}

// "1 entry" / "3 entries" / "0 days" — count with a pluralized unit.
const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

// The custom session avatar for an ENDED session: a calendar glyph showing the
// start month + day (Figma "Calendar Glyph").
function CalendarGlyph({ month, day }: { month: string; day: string }) {
  return (
    <div className={styles.calGlyph}>
      <span className={styles.calGlyphMonth}>{month}</span>
      <div className={styles.calGlyphDateWrap}>
        <span className={styles.calGlyphDate}>{day}</span>
      </div>
    </div>
  );
}

// The session avatar for an ACTIVE (running) session: a red "recording" dot.
function ActiveDot() {
  return (
    <span className={styles.activeDot}>
      <Icon icon="circle-small" pack="solid" size={16} />
    </span>
  );
}

// The ENDED-session avatar when the session is in a warning state (≥ 8 hours, or
// spread across two days): an amber box with a warning triangle (Figma
// 21803-49361 / 49414).
function WarningGlyph() {
  return (
    <span className={styles.warnGlyph}>
      <Icon icon="triangle-exclamation" pack="solid" size={16} />
    </span>
  );
}

// Active session (Figma 21803-49328): the live timer IS the title, then a single
// "Stop" button (red circle-stop icon) — no separate right-side value.
const ActiveSessionRow = ({ session, onStop }: { session: Session; onStop: () => void }) => (
  <ListItem
    variant="titleCaption"
    title={session.timerLabel}
    titleClassName={styles.sessionTimerTitle}
    caption={session.dateLabel}
    avatar={<ActiveDot />}
    slotRight={
      <Button size="lg" variant="ghost" leftIcon="circle-stop" leftIconPack="solid" leftIconClassName={styles.stopIcon} onClick={onStop}>
        Stop
      </Button>
    }
  />
);

// Ended session (Figma 21803-49132): start → end, calendar avatar, total logged,
// and a context-menu button (Edit / Delete) — desktop card / mobile drawer.
const EndedSessionRow = ({ session, mobile, editable, onEdit, onDelete }: { session: Session; mobile: boolean; editable: boolean; onEdit: () => void; onDelete: () => void }) => {
  const menu = useAnchoredMenu(!mobile, "end");
  // Item 9 — DISPLAY the 15-min-rounded range + duration, with the ACTUAL value
  // on hover. Rounded range: ceil the start to the next 15 and add the rounded
  // duration, so the range and the duration stay consistent.
  const actualRange = `${session.startLabel} → ${session.endLabel}`;
  // The hover tooltip shows the EXACT recorded time as "H hr M min" (minutes only
  // under an hour, e.g. "15 min" / "0 min" — never "0 hr"). Item 5.
  const actualDurLabel = formatDuration(session.durationSec);
  const roundedDurSec = roundDurationSec(session.durationSec);
  const startMin = parseClockMin(session.startLabel);
  const roundedRange =
    startMin != null ? `${fmtClockMin(ceil15Min(startMin))} → ${fmtClockMin(ceil15Min(startMin) + roundedDurSec / 60)}` : actualRange;
  const roundedDurLabel = formatHrMin(roundedDurSec);
  // Warning states (Figma 21803-49361 / 49414): a long session (≥ 10 h) turns the
  // DURATION amber; a cross-day session shows both dates in the caption, amber.
  // Either one swaps the calendar avatar for the warning glyph.
  const longSession = session.durationSec >= LONG_SESSION_SEC;
  const crossDay = session.endDateLabel != null && session.endDateLabel !== session.dateLabel;
  const caption = crossDay ? `${session.dateLabel} → ${session.endDateLabel}` : session.dateLabel;
  const menuBody = (
    <>
      <MenuItemGroup>
        <MenuItem
          label="Edit"
          slotLeft={slot("pen")}
          onClick={() => {
            menu.close();
            onEdit();
          }}
        />
      </MenuItemGroup>
      <MenuItemGroup>
        <MenuItem
          label="Delete"
          slotLeft={slot("trash")}
          danger
          onClick={() => {
            menu.close();
            onDelete();
          }}
        />
      </MenuItemGroup>
    </>
  );
  return (
    <>
      <ListItem
        variant="titleCaption"
        title={<HoverTooltip text={actualRange}>{roundedRange}</HoverTooltip>}
        caption={caption}
        captionClassName={crossDay ? styles.warnText : undefined}
        avatar={longSession || crossDay ? <WarningGlyph /> : <CalendarGlyph month={session.month} day={session.day} />}
        slotRight={
          <div className={styles.sessionRight}>
            <HoverTooltip text={actualDurLabel}>
              <span className={clsx(styles.sessionValue, longSession && styles.warnText)}>{roundedDurLabel}</span>
            </HoverTooltip>
            {editable && (
              <IconButton
                icon="ellipsis"
                variant="ghost"
                size="md"
                aria-label="Session actions"
                isPressed={menu.open}
                noDebounce
                onClick={menu.onActions}
              />
            )}
          </div>
        }
      />
      {editable &&
        (mobile ? (
        <Menu open={menu.open} onClose={menu.close} title={roundedRange} breakpoint="mobile">
          {menuBody}
        </Menu>
      ) : (
        menu.pos != null && (
          <div ref={menu.cardRef} className={styles.sessionMenu} style={{ top: menu.pos.top, left: menu.pos.left, right: menu.pos.right }}>
            <Menu open={menu.open} onClose={menu.close} breakpoint="desktop">
              {menuBody}
            </Menu>
          </div>
        )
        ))}
    </>
  );
};

const SessionRow = ({
  session,
  mobile,
  editable,
  onStop,
  onEdit,
  onDelete,
}: {
  session: Session;
  mobile: boolean;
  editable: boolean;
  onStop: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) =>
  session.active ? (
    <ActiveSessionRow session={session} onStop={onStop} />
  ) : (
    <EndedSessionRow session={session} mobile={mobile} editable={editable} onEdit={onEdit} onDelete={onDelete} />
  );

// A tech's timesheet group: header (avatar + name + total + add), then either
// the rows (log / session) or the "No time logged" empty state.
const TechGroup = ({ user, total, rows, divider, canAdd, onAdd, accordion = true }: { user: User; total: string; rows: ReactNode[]; divider: boolean; canAdd: boolean; onAdd: () => void; accordion?: boolean }) => {
  // accordion / defaultOpen are a `true`-literal variant in ItemGroup — a
  // static group simply omits them.
  const groupProps = accordion ? ({ accordion: true, defaultOpen: true } as const) : ({ accordion: false } as const);
  return (
  <ItemGroup
    {...groupProps}
    divider={divider}
    label={
      <GroupLabel
        variant="primary"
        slotLeft={<AvatarUser size="md" imageSrc={user.avatar} />}
        label={user.name}
        caption={total}
        // Only the viewing tech can add/edit their own time sessions.
        slotRight={
          canAdd ? (
            <HoverTooltip text="Add time session">
              <IconButton icon="plus" variant="ghost" size="md" aria-label={`Add time session for ${user.name}`} onClick={onAdd} />
            </HoverTooltip>
          ) : undefined
        }
      />
    }
  >
    {rows.length > 0 ? rows : <EmptyState caption="No time logged" />}
  </ItemGroup>
  );
};

// One tech's session group, built from their sessions — the Timesheet group +
// the "Time logged" (Complete) dialog share this. Empty → "No time logged".
export function SessionGroup({
  user,
  sessions,
  mobile,
  canAdd,
  editable = true,
  accordion = true,
  onStop,
  onEdit,
  onDelete,
  onAdd,
}: {
  user: TimesheetUser;
  sessions: Session[];
  mobile: boolean;
  canAdd: boolean;
  /** Shows each row's edit/delete menu — only the viewer can edit their own time. */
  editable?: boolean;
  /** Collapsible header (Timesheet). Set false for a static group (Complete dialog). */
  accordion?: boolean;
  onStop: () => void;
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
  onAdd: () => void;
}) {
  const totalSec = sessions.reduce((acc, s) => acc + (s.active ? s.durationSec : roundDurationSec(s.durationSec)), 0);
  const rows = sessions.map((s) => (
    <SessionRow key={s.id} session={s} mobile={mobile} editable={editable} onStop={onStop} onEdit={() => onEdit(s)} onDelete={() => onDelete(s)} />
  ));
  return <TechGroup user={user} total={formatHrMin(totalSec)} rows={rows} divider={false} canAdd={canAdd} onAdd={onAdd} accordion={accordion} />;
}

// A proportional segmented bar: top labels, the coloured bar, then the values.
const DistributionChart = ({ segments }: { segments: Segment[] }) => {
  const cell = (grow: number): CSSProperties => ({ flexGrow: grow, flexBasis: 0, minWidth: 0 });
  return (
    <div className={styles.chart}>
      <div className={styles.chartRow}>
        {segments.map((s, i) => (
          <div key={i} className={styles.chartCell} style={cell(s.weight)}>
            {s.top}
          </div>
        ))}
      </div>
      <div className={styles.chartRow}>
        {segments.map((s, i) => (
          <div key={i} className={styles.chartSeg} style={{ ...cell(s.weight), background: s.color }} />
        ))}
      </div>
      <div className={styles.chartRow}>
        {segments.map((s, i) => (
          <div key={i} className={styles.chartCell} style={cell(s.weight)}>
            <span className={styles.chartValue}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Legend = ({ items }: { items: LegendItem[] }) => (
  <div className={styles.legend}>
    {items.map((it) => (
      <div key={it.name} className={styles.legendRow}>
        <span className={styles.legendDot} style={{ background: it.color }} />
        <span className={styles.legendName}>{it.name}</span>
        <span className={styles.legendValue}>
          {it.value} <span className={styles.legendPct}>({it.pct})</span>
        </span>
      </div>
    ))}
  </div>
);

// A summary chart subsection: title + info, then either the chart or the empty
// "No time logged" state.
const ChartSection = ({ title, segments, legend }: { title: string; segments?: Segment[]; legend?: LegendItem[] }) => (
  <div className={styles.chartSection}>
    <div className={styles.chartTitle}>
      {title}
      <HintTrigger />
    </div>
    {segments != null && legend != null ? (
      <>
        <DistributionChart segments={segments} />
        <Legend items={legend} />
      </>
    ) : (
      <EmptyState caption="No time logged" />
    )}
  </div>
);

// ---- the panel --------------------------------------------------------------

interface TimesheetPanelProps {
  /** The job's assignees — each gets a Timesheet group (empty until they log time). */
  assignees: User[];
  /** The viewing tech — only their group gets the "add time session" plus + the
   *  row edit/delete menus. Unset = all groups editable. */
  viewerId?: number;
  /** Logged sessions per assignee (userId → their sessions). Used by Time Tracker. */
  sessionsByUser?: Record<number, Session[]>;
  /** Ends the running session (the active session's "Stop session" button). */
  onStopSession?: () => void;
  /** Opens the session form to edit an ended session. */
  onEditSession?: (session: Session) => void;
  /** Deletes an ended session (opens the delete prompt). */
  onDeleteSession?: (session: Session) => void;
  /** Opens the session form to add a new session (the group's plus button). */
  onAddSession?: () => void;
  /** Gates the group's "add time session" plus — a tech can only log time once
   *  the job is started. Default true (the JobDetails demo). */
  canAddSessions?: boolean;
  /** True once the job has been started (has time logs). Not started → empty state. */
  started?: boolean;
  mobile?: boolean;
}

// The "Timesheet" tab (Figma node 23823-24630). Until the job is started there
// are no time logs, so the widgets, per-tech groups and summary all show their
// empty states (Figma nodes 21803-47467 / 48357 / 50077).
export default function TimesheetPanel({
  assignees,
  viewerId,
  sessionsByUser,
  onStopSession,
  onEditSession,
  onDeleteSession,
  onAddSession,
  canAddSessions = true,
  started = false,
  mobile = false,
}: TimesheetPanelProps) {
  const groups = started
    ? FILLED_LOGS.map((g) => ({ user: g.user, total: g.total, rows: g.logs.map((log, i) => <LogRow key={i} log={log} />) }))
    : assignees.map((user) => {
        const s = sessionsByUser?.[user.id] ?? [];
        // Only the viewing tech can edit their own logged time.
        const editable = viewerId == null || user.id === viewerId;
        const totalSec = s.reduce((acc, x) => acc + (x.active ? x.durationSec : roundDurationSec(x.durationSec)), 0);
        return {
          user,
          total: formatHrMin(totalSec),
          rows: s.map((sess) => (
            <SessionRow
              key={sess.id}
              session={sess}
              mobile={mobile}
              editable={editable}
              onStop={onStopSession ?? noop}
              onEdit={() => onEditSession?.(sess)}
              onDelete={() => onDeleteSession?.(sess)}
            />
          )),
        };
      });

  // Widgets + Summary derived from EVERY tech's logged sessions (Time Tracker
  // path). The `started` path keeps its hardcoded demo values.
  const m = deriveSummary(assignees.map((u) => ({ user: u, sessions: sessionsByUser?.[u.id] ?? [] })));
  const totalEntries = m.count === 0 ? "No entries" : `Across ${m.count === 1 ? "1 entry" : `${m.count} entries`}`;

  return (
    <div className={styles.panel}>
      {/* Widgets */}
      <div className={clsx(styles.widgets, mobile && styles.widgetsMobile)}>
        {started ? (
          <>
            <StatWidget label="Total time logged" value="48.5 hr" sub="Across 2 entries" />
            <StatWidget label="Average session" value="2.5 hr" sub="Per session" />
          </>
        ) : (
          <>
            <StatWidget label="Total time logged" value={formatHrMin(m.totalSec)} sub={totalEntries} empty={m.count === 0} />
            <StatWidget
              label="Average session"
              value={m.count === 0 ? "0 hr" : formatHrMin(m.totalSec / m.count)}
              sub="Per session"
              empty={m.count === 0}
            />
          </>
        )}
      </div>

      {/* Timesheet — a group per assignee */}
      <DisplayModule
        title="Timesheet"
        content={
          <div className={styles.listBody}>
            {groups.map((g, gi) => (
              <TechGroup
                key={g.user.id}
                user={g.user}
                total={g.total}
                rows={g.rows}
                divider={gi < groups.length - 1}
                canAdd={canAddSessions && (viewerId == null || g.user.id === viewerId)}
                onAdd={onAddSession ?? noop}
              />
            ))}
          </div>
        }
      />

      {/* Summary — three cards then the two distribution charts */}
      <DisplayModule
        title="Summary"
        content={
          <div className={styles.summary}>
            <div className={clsx(styles.summaryCards, mobile && styles.summaryCardsMobile)}>
              <div className={styles.card}>
                <span className={styles.cardLabel}>Time</span>
                <span className={clsx(styles.cardValue, !started && m.count === 0 && styles.cardValueEmpty)}>
                  {started ? "50 hr" : m.count === 0 ? "0 hr" : formatDuration(m.totalSec)}
                </span>
              </div>
              <div className={styles.card}>
                <span className={styles.cardLabel}>Days</span>
                <span className={clsx(styles.cardValue, !started && m.dayCount === 0 && styles.cardValueEmpty)}>
                  {started ? "3 days" : plural(m.dayCount, "day")}
                </span>
              </div>
              <div className={styles.card}>
                <span className={styles.cardLabel}>Techs</span>
                <AvatarGroup
                  variation="inline"
                  size="sm"
                  items={assignees.map((u) => ({ content: "image", imageSrc: u.avatar, name: u.name }))}
                />
              </div>
            </div>

            <Divider />

            {started ? (
              <>
                <ChartSection title="Time distribution" segments={TIME_DIST_SEGMENTS} legend={TIME_DIST_LEGEND} />
                <Divider />
                <ChartSection title="Work timeline" segments={WORK_TIMELINE_SEGMENTS} legend={WORK_TIMELINE_LEGEND} />
              </>
            ) : (
              <>
                <ChartSection
                  title="Time distribution"
                  segments={m.distSegments.length > 0 ? m.distSegments : undefined}
                  legend={m.distLegend.length > 0 ? m.distLegend : undefined}
                />
                <Divider />
                <ChartSection
                  title="Work timeline"
                  segments={m.timeSegments.length > 0 ? m.timeSegments : undefined}
                  legend={m.timeLegend.length > 0 ? m.timeLegend : undefined}
                />
              </>
            )}
          </div>
        }
      />
    </div>
  );
}
