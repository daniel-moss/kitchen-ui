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
import HoverHint from "../../components/Hint/HoverHint";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import ListItem from "../../components/ListItem/ListItem";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import Menu from "../../components/Menu/Menu";
import DrawerHeader from "../../components/Popover/DrawerHeader";
import PopoverHeaderContent from "../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../components/Popover/PopoverHeaderText";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import { users } from "../../data/users";
import { noop, slot, useAnchoredMenu } from "./shared";
import { StatWidget, StatWidgetRow } from "./StatWidget";

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
  /** Weekday end date for the cross-day caption, e.g. "Tuesday, January 2". */
  endWeekdayLabel?: string;
  /** Logged seconds — active = live elapsed, ended = final. Drives the group total. */
  durationSec: number;
  /** Right-side value: active = live "MM:SS" (red); ended = "3 hr". */
  timerLabel: string;
  /**
   * Session category from the check-in status / Time review split
   * ("Travelling" / "Working"). Active rows show it as the right caption;
   * ended rows show it as the row caption instead of the date.
   */
  category?: string;
  /** Weekday start date for the ACTIVE row caption, e.g. "Monday, January 1". */
  weekdayLabel?: string;
}

// A session ≥ this long shows the warning state (amber avatar + amber duration).
// 10 hours (matches the Figma annotation on node 21803-49361).
const LONG_SESSION_SEC = 10 * 3600;

/** Which end of a session's range is drawn in the overlap warning color. */
export interface SessionOverlap {
  start: boolean;
  end: boolean;
}

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

// Concept 7 shows ACTUAL times everywhere — the 15-minute rounding of the
// other prototypes was removed here (Daniel, 2026-07-21).
// "8:05 AM" → minutes since midnight (null if unparseable).
export const parseClockMin = (label: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label.trim());
  if (!m) return null;
  const h = (parseInt(m[1], 10) % 12) + (/pm/i.test(m[3]) ? 12 : 0);
  return h * 60 + parseInt(m[2], 10);
};
// minutes since midnight → "8:15 AM" (wraps within a day).
export const fmtClockMin = (min: number): string => {
  const mm = ((min % 1440) + 1440) % 1440;
  const h24 = Math.floor(mm / 60);
  const mer = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mm % 60).padStart(2, "0")} ${mer}`;
};

// ---- overlap warning (Figma 24508-61972) -----------------------------------
// A tech cannot be in two sessions at the same time, so two of their ENDED
// sessions that intersect get the warning state: the warning avatar on both
// rows, plus the amber time — the EARLIER session's END and the LATER
// session's START (Daniel's rule, 2026-08-05). Touching edges (one session
// ends exactly when the next begins) are NOT an overlap, active (running)
// sessions are not checked, and the overlap never blocks saving.

// A session's absolute start/end in ms. The start date label carries the day,
// so a cross-day session (end = start + duration) compares correctly too.
const sessionSpan = (s: Session): { start: number; end: number } | null => {
  const startMin = parseClockMin(s.startLabel);
  const day = new Date(s.dateLabel).getTime();
  if (startMin == null || Number.isNaN(day)) return null;
  const start = day + startMin * 60_000;
  return { start, end: start + s.durationSec * 1000 };
};

// One tech's sessions → the overlap flags per session id (absent = no warning).
export const overlapFlags = (sessions: Session[]): Map<number, SessionOverlap> => {
  const flags = new Map<number, SessionOverlap>();
  const spans = sessions
    .filter((s) => !s.active)
    .map((s) => ({ id: s.id, span: sessionSpan(s) }))
    .filter((x): x is { id: number; span: { start: number; end: number } } => x.span != null)
    .sort((a, b) => a.span.start - b.span.start || a.span.end - b.span.end);
  const mark = (id: number, edge: keyof SessionOverlap) => {
    const f = flags.get(id) ?? { start: false, end: false };
    f[edge] = true;
    flags.set(id, f);
  };
  for (let i = 0; i < spans.length; i++) {
    for (let j = i + 1; j < spans.length; j++) {
      // Sorted by start: once one session begins at or after `a` ends, every
      // later one does too — nothing else can overlap `a`.
      if (spans[j].span.start >= spans[i].span.end) break;
      mark(spans[i].id, "end");
      mark(spans[j].id, "start");
    }
  }
  return flags;
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
    .map((t) => ({ user: t.user, sec: t.sessions.filter((s) => !s.active).reduce((acc, s) => acc + s.durationSec, 0) }))
    .filter((t) => t.sec > 0);
  const logged = perTech.flatMap((t) => t.sessions.filter((s) => !s.active));
  const totalSec = logged.reduce((acc, s) => acc + s.durationSec, 0);
  const count = logged.length;
  const hasTime = count > 0 && totalSec > 0;

  // The WIDGETS count the running session too, so their numbers tick in real
  // time (Daniel, 2026-08-01) — a running session's `durationSec` is already
  // the live elapsed value. The charts below stay on ended sessions: a running
  // session has no final duration to distribute.
  const all = perTech.flatMap((t) => t.sessions);
  const liveTotalSec = all.reduce((acc, s) => acc + s.durationSec, 0);
  const liveCount = all.length;

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

  return { totalSec, count, liveTotalSec, liveCount, dayCount: days.length, distSegments, distLegend, timeSegments, timeLegend };
}

// "1 entry" / "3 entries" / "0 days" — count with a pluralized unit.
const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

// The custom session avatar for an ENDED session: a calendar glyph showing the
// start month + day (Figma "Calendar Glyph").
export function CalendarGlyph({ month, day }: { month: string; day: string }) {
  return (
    <div className={styles.calGlyph}>
      <span className={styles.calGlyphMonth}>{month}</span>
      <div className={styles.calGlyphDateWrap}>
        <span className={styles.calGlyphDate}>{day}</span>
      </div>
    </div>
  );
}

// The tech self-statuses (Figma 24353-26471 — the 2026-07-27 four-status set).
// One vocabulary for every session surface: the Time-session / Check-in /
// Start / Resume selects, the pill, the bar, the rows and the My-status menus.
export const TECH_STATUSES = [
  { value: "Prepping for work", icon: "clipboard-list-check" },
  { value: "Travelling", icon: "van" },
  { value: "Working", icon: "wrench-simple" },
  { value: "Gathering parts", icon: "cart-flatbed-boxes" },
];

// Check-in status → its icon (stopwatch = unknown/legacy value).
export const categoryIcon = (category?: string) => TECH_STATUSES.find((s) => s.value === category)?.icon ?? "stopwatch";

// The My-status sub-menu body (Figma 24358-37641 desktop card / 24196-76038
// mobile sub-drawer): SelectList rows — status icon left, the CURRENT status
// carries the solid check-circle. Shared by the session bar and the active row.
export const StatusItems = ({ current, onPick }: { current?: string; onPick: (status: string) => void }) => (
  <SelectListItemGroup>
    {TECH_STATUSES.map((s) => (
      <SelectListItem
        key={s.value}
        label={s.value}
        slotLeft={<Icon icon={s.icon} size={14} container="square" />}
        selected={s.value === current}
        onClick={() => onPick(s.value)}
      />
    ))}
  </SelectListItemGroup>
);

// The session avatar for an ACTIVE (running) session: a tomato box with the
// status icon (Figma 24196-75349 / 75378).
function ActiveAvatar({ category }: { category?: string }) {
  return (
    <span className={styles.activeDot}>
      <Icon icon={categoryIcon(category)} pack="solid" size={16} />
    </span>
  );
}

// The ENDED-session avatar: a gray box holding the session's STATUS icon
// (Daniel, 2026-08-04 — a logged session shows what the time was spent on).
// The finished-session menu header uses the very same box (Figma 24107-17050).
// It REPLACED the CalendarGlyph date tile, which is now unused by the sessions
// (the Complete-job review still renders its own DateChip).
export function StatusGlyph({ category }: { category?: string }) {
  return (
    <span className={styles.statusGlyph}>
      <Icon icon={categoryIcon(category)} pack="solid" size={16} />
    </span>
  );
}

// The ENDED-session avatar when the session is in a warning state (≥ 10 hours,
// spread across two days, or overlapping another session): an amber box with a
// warning triangle (Figma 21803-49361 / 49414, 24508-61972).
function WarningGlyph() {
  return (
    <span className={styles.warnGlyph}>
      <Icon icon="triangle-exclamation" pack="solid" size={16} />
    </span>
  );
}

// Active session (Figma 24196-75349 Travelling / 75378 Working): status avatar,
// open-ended rounded range + weekday caption on the left, the live red timer +
// status caption on the right, and an ellipsis context menu (Your status /
// Check out — the Time Session Context Menu, like the desktop session bar).
const ActiveSessionRow = ({
  session,
  mobile,
  onStop,
  onSwitchStatus,
}: {
  session: Session;
  mobile: boolean;
  onStop: () => void;
  onSwitchStatus?: (status: string) => void;
}) => {
  const menu = useAnchoredMenu(!mobile, "end");
  const startLabel = session.startLabel;
  const menuBody = (
    <>
      {onSwitchStatus != null && (
        <MenuItemGroup>
          <MenuItem
            label="Your status"
            slotLeft={slot(categoryIcon(session.category))}
            tag={session.category}
            // The sub-menu is SelectList rows (Figma 24358-37641 / 24196-76038)
            // — all four statuses, check-circle on the current one.
            subMenu={
              <StatusItems
                current={session.category}
                onPick={(status) => {
                  menu.close();
                  onSwitchStatus?.(status);
                }}
              />
            }
            subMenuTitle="Your status"
          />
        </MenuItemGroup>
      )}
      <MenuItemGroup>
        <MenuItem
          label="Check out"
          slotLeft={slot("arrow-left-from-arc")}
          onClick={() => {
            menu.close();
            onStop();
          }}
        />
      </MenuItemGroup>
    </>
  );
  return (
    <>
      <ListItem
        variant="titleCaption"
        title={`${startLabel} → `}
        caption={session.weekdayLabel ?? session.dateLabel}
        avatar={<ActiveAvatar category={session.category} />}
        right={
          <span className={styles.activeRight}>
            <span className={styles.activeTimer}>{session.timerLabel}</span>
            {session.category != null && <span className={styles.activeRightCaption}>{session.category}</span>}
          </span>
        }
        slotRight={
          <IconButton
            icon="ellipsis"
            variant="ghost"
            size="md"
            aria-label="Session actions"
            isPressed={menu.open}
            noDebounce
            onClick={menu.onActions}
          />
        }
      />
      {mobile ? (
        <Menu
          open={menu.open}
          onClose={menu.close}
          header={
            <DrawerHeader>
              <PopoverHeaderContent avatar={<ActiveAvatar category={session.category} />}>
                <PopoverHeaderText
                  variant="titleCaption"
                  title={session.timerLabel}
                  titleClassName={styles.headerTimer}
                  caption={session.category}
                />
              </PopoverHeaderContent>
            </DrawerHeader>
          }
          breakpoint="mobile"
        >
          {menuBody}
        </Menu>
      ) : (
        menu.pos != null && (
          <div ref={menu.cardRef} className={styles.sessionMenu} style={{ top: menu.pos.top, left: menu.pos.left, right: menu.pos.right }}>
            <Menu open={menu.open} onClose={menu.close} breakpoint="desktop" className={styles.sessionMenuCard}>
              {menuBody}
            </Menu>
          </div>
        )
      )}
    </>
  );
};

// Ended session (Figma 21803-49132): start → end, calendar avatar, total logged,
// and a context-menu button (Edit / Delete) — desktop card / mobile drawer.
const EndedSessionRow = ({ session, mobile, editable, overlap, onEdit, onDelete }: { session: Session; mobile: boolean; editable: boolean; overlap?: SessionOverlap; onEdit: () => void; onDelete: () => void }) => {
  const menu = useAnchoredMenu(!mobile, "end");
  // Concept 7: NO 15-min rounding — the row shows the ACTUAL recorded range
  // and duration (Daniel removed the rounding for this prototype).
  const rangeText = `${session.startLabel} → ${session.endLabel}`;
  const durLabel = formatHrMin(session.durationSec);
  // Warning states (Figma 21803-49361 / 49414): a long session (≥ 10 h) turns the
  // DURATION amber; a cross-day session shows both dates in the caption, amber.
  // Either one swaps the calendar avatar for the warning glyph.
  const longSession = session.durationSec >= LONG_SESSION_SEC;
  const crossDay = session.endDateLabel != null && session.endDateLabel !== session.dateLabel;
  // Overlap warning (Figma 24508-61972): only the overlapping END of the range
  // turns amber — everything else in the row (arrow, caption, duration) keeps
  // its normal color. A styled range is a ReactNode, so it carries the one-line
  // ellipsis itself (ListItem only truncates a plain string title).
  const overlapping = overlap != null && (overlap.start || overlap.end);
  const range = overlapping ? (
    <>
      <span className={clsx(overlap.start && styles.warnText)}>{session.startLabel}</span>
      {" → "}
      <span className={clsx(overlap.end && styles.warnText)}>{session.endLabel}</span>
    </>
  ) : (
    rangeText
  );
  const warned = longSession || crossDay || overlapping;
  // Caption = the WEEKDAY start date (node 21803-49132: "Monday, January 1");
  // a cross-day session shows both WEEKDAY dates in amber instead (node
  // 21803-49414: "Monday, January 1 → Tuesday, January 2" — year only when
  // not the current one; the labels arrive pre-formatted that way).
  const caption = crossDay
    ? `${session.weekdayLabel ?? session.dateLabel} → ${session.endWeekdayLabel ?? session.endDateLabel}`
    : session.weekdayLabel ?? session.dateLabel;
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
          slotLeft={slot("trash-can")}
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
        title={range}
        titleClassName={overlapping ? styles.rangeLine : undefined}
        caption={caption}
        captionClassName={crossDay ? styles.warnText : undefined}
        avatar={warned ? <WarningGlyph /> : <StatusGlyph category={session.category} />}
        right={
          <span className={styles.activeRight}>
            <span className={clsx(styles.sessionValue, longSession && styles.warnText)}>{durLabel}</span>
            {session.category != null && <span className={styles.activeRightCaption}>{session.category}</span>}
          </span>
        }
        slotRight={
          <div className={styles.sessionRight}>
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
        <Menu
          open={menu.open}
          onClose={menu.close}
          header={
            <DrawerHeader>
              <PopoverHeaderContent avatar={warned ? <WarningGlyph /> : <StatusGlyph category={session.category} />}>
                {/* The amber overlap highlight is for the LIST ROWS only
                    (Daniel) — the menu header keeps the plain range. */}
                <PopoverHeaderText variant="titleCaption" title={rangeText} caption={caption} />
              </PopoverHeaderContent>
            </DrawerHeader>
          }
          breakpoint="mobile"
        >
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
  overlap,
  onStop,
  onSwitchStatus,
  onEdit,
  onDelete,
}: {
  session: Session;
  mobile: boolean;
  editable: boolean;
  /** This session's overlap flags, from `overlapFlags` over the tech's sessions. */
  overlap?: SessionOverlap;
  onStop: () => void;
  onSwitchStatus?: (status: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) =>
  session.active ? (
    <ActiveSessionRow session={session} mobile={mobile} onStop={onStop} onSwitchStatus={onSwitchStatus} />
  ) : (
    <EndedSessionRow session={session} mobile={mobile} editable={editable} overlap={overlap} onEdit={onEdit} onDelete={onDelete} />
  );

// A tech's timesheet group: header (avatar + name + total + add), then either
// the rows (log / session) or the "No time logged" empty state. STATIC — the
// accordion was removed (Daniel 2026-07-27).
const TechGroup = ({ user, total, rows, divider, canAdd, onAdd }: { user: User; total?: string; rows: ReactNode[]; divider: boolean; canAdd: boolean; onAdd: () => void }) => {
  return (
  <ItemGroup
    accordion={false}
    divider={divider}
    label={
      <GroupLabel
        variant="primary"
        slotLeft={<AvatarUser size="md" imageSrc={user.avatar} />}
        label={user.name}
        // No sessions → no "• 0 hr" — just the name (Figma 21803-48357).
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
  onStop,
  onSwitchStatus,
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
  onStop: () => void;
  /** Status switch from the active row's Your-status submenu. */
  onSwitchStatus?: (status: string) => void;
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
  onAdd: () => void;
}) {
  const totalSec = sessions.reduce((acc, s) => acc + s.durationSec, 0);
  // Overlaps are checked inside ONE tech's sessions — two techs working at the
  // same time is normal.
  const overlaps = overlapFlags(sessions);
  const rows = sessions.map((s) => (
    <SessionRow key={s.id} session={s} mobile={mobile} editable={editable} overlap={overlaps.get(s.id)} onStop={onStop} onSwitchStatus={onSwitchStatus} onEdit={() => onEdit(s)} onDelete={() => onDelete(s)} />
  ));
  return <TechGroup user={user} total={sessions.length > 0 ? formatHrMin(totalSec) : undefined} rows={rows} divider={false} canAdd={canAdd} onAdd={onAdd} />;
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

// The two Summary charts' hints (Figma 24537-92783 / 24537-92844): info
// indicator, caption only (no title), bubble above the trigger and 375 wide.
// Both close with the same sentence on purpose — each hint has to stand on its
// own, and the caveat matters in both: the STAT WIDGETS above count a running
// session, these charts do not.
const TIME_DIST_HINT =
  "Shows how much of the job’s logged time each technician contributed. Time is counted after the tech checks out, so a running session is not included yet.";
const WORK_TIMELINE_HINT =
  "Shows which days the work happened on and how much time went into each. Time is counted after the tech checks out, so a running session is not included yet.";

// A summary chart subsection: title + its hint, then either the chart or the
// empty "No time logged" state.
const ChartSection = ({
  title,
  hint,
  mobile = false,
  segments,
  legend,
}: {
  title: string;
  hint: string;
  mobile?: boolean;
  segments?: Segment[];
  legend?: LegendItem[];
}) => (
  <div className={styles.chartSection}>
    <div className={styles.chartTitle}>
      {title}
      <HoverHint caption={hint} width={375} breakpoint={mobile ? "mobile" : "desktop"}>
        <HintTrigger />
      </HoverHint>
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
  /** Status switch for the active session row's Your-status submenu. */
  onSwitchStatus?: (status: string) => void;
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
  onSwitchStatus,
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
        const totalSec = s.reduce((acc, x) => acc + x.durationSec, 0);
        // Overlaps are checked inside ONE tech's sessions (Figma 24508-61972).
        const overlaps = overlapFlags(s);
        return {
          user,
          // No logged sessions → no time caption next to the name (item 6).
          total: s.length > 0 ? formatHrMin(totalSec) : undefined,
          rows: s.map((sess) => (
            <SessionRow
              key={sess.id}
              session={sess}
              mobile={mobile}
              editable={editable}
              overlap={overlaps.get(sess.id)}
              onStop={onStopSession ?? noop}
              onSwitchStatus={onSwitchStatus}
              onEdit={() => onEditSession?.(sess)}
              onDelete={() => onDeleteSession?.(sess)}
            />
          )),
        };
      });

  // Widgets + Summary derived from EVERY tech's logged sessions (Time Tracker
  // path). The `started` path keeps its hardcoded demo values.
  const m = deriveSummary(assignees.map((u) => ({ user: u, sessions: sessionsByUser?.[u.id] ?? [] })));
  const totalEntries = m.liveCount === 0 ? "No entries" : `Across ${m.liveCount === 1 ? "1 entry" : `${m.liveCount} entries`}`;

  return (
    <div className={styles.panel}>
      {/* Widgets — live: a running session counts while it runs. */}
      <StatWidgetRow mobile={mobile}>
        {started ? (
          <>
            <StatWidget label="Total time logged" value="48.5 hr" sub="Across 2 entries" />
            <StatWidget label="Average session" value="2.5 hr" sub="Per session" />
          </>
        ) : (
          <>
            <StatWidget label="Total time logged" value={formatHrMin(m.liveTotalSec)} sub={totalEntries} empty={m.liveCount === 0} />
            <StatWidget
              label="Average session"
              value={m.liveCount === 0 ? "0 hr" : formatHrMin(m.liveTotalSec / m.liveCount)}
              sub="Per session"
              empty={m.liveCount === 0}
            />
          </>
        )}
      </StatWidgetRow>

      {/* Timesheet — a group per assignee, or the empty state on an unassigned
          job (Figma 24522-84253). The header + divider stay; only the body is
          replaced. `.listBody`'s negative margin cancels the module's own 16px
          padding, so the EmptyState's 32px sits against the module edge. */}
      <DisplayModule
        title="Timesheet"
        content={
          <div className={styles.listBody}>
            {groups.length === 0 ? (
              <EmptyState caption="No assignees here yet" />
            ) : (
              groups.map((g, gi) => (
                <TechGroup
                  key={g.user.id}
                  user={g.user}
                  total={g.total}
                  rows={g.rows}
                  divider={gi < groups.length - 1}
                  canAdd={canAddSessions && (viewerId == null || g.user.id === viewerId)}
                  onAdd={onAddSession ?? noop}
                />
              ))
            )}
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
                <ChartSection title="Time distribution" hint={TIME_DIST_HINT} mobile={mobile} segments={TIME_DIST_SEGMENTS} legend={TIME_DIST_LEGEND} />
                <Divider />
                <ChartSection title="Work timeline" hint={WORK_TIMELINE_HINT} mobile={mobile} segments={WORK_TIMELINE_SEGMENTS} legend={WORK_TIMELINE_LEGEND} />
              </>
            ) : (
              <>
                <ChartSection
                  title="Time distribution"
                  hint={TIME_DIST_HINT}
                  mobile={mobile}
                  segments={m.distSegments.length > 0 ? m.distSegments : undefined}
                  legend={m.distLegend.length > 0 ? m.distLegend : undefined}
                />
                <Divider />
                <ChartSection
                  title="Work timeline"
                  hint={WORK_TIMELINE_HINT}
                  mobile={mobile}
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
