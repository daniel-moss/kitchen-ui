import { CSSProperties, ReactNode } from "react";

import clsx from "clsx";

import AvatarGroup from "../../../components/Avatar/AvatarGroup";
import AvatarLive from "../../../components/Avatar/AvatarLive";
import { AvatarLiveColor } from "../../../components/Avatar/AvatarLive.types";
import { Divider } from "../../../components/Divider/Divider";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import EmptyState from "../../../components/EmptyState/EmptyState";
import HintTrigger from "../../../components/Hint/HintTrigger";
import HoverHint from "../../../components/Hint/HoverHint";
import { User } from "../../../data/users";

import styles from "./SummaryModule.module.scss";

/**
 * ARCHIVE — the Job Details "Summary" module as it was before 2026-08-11.
 *
 * On that day the Timesheet tab replaced it with the separate "Time
 * distribution" and "Work timeline" modules (Figma 24616-81424 / 24616-81593).
 * Daniel asked to keep this version openable in Storybook while he redesigns,
 * so it is a FROZEN COPY: it no longer shares any code with the live panel and
 * must not be changed to follow it. The live version lives in `../TimeCharts`.
 *
 * It was one module: three cards (Time / Days / Techs), then two chart
 * sections, each a proportional segmented bar over a colored-dot legend.
 */

// ---- the data it was derived from -------------------------------------------

/** A logged time session, cut down to what the summary read from it. */
export interface SummarySession {
  id: number;
  /** A running session — counted by the cards, left out of the charts. */
  active?: boolean;
  durationSec: number;
  /** Full start date, e.g. "January 1, 2026" — the day key and legend label. */
  dateLabel: string;
  /** Start month / day for the calendar glyph, e.g. "JAN" / "1". */
  month: string;
  day: string;
}

// ---- formatting -------------------------------------------------------------

// Decimal hours for a chart bar — up to 2 decimals, trailing zero dropped.
const formatHours = (sec: number) => `${parseFloat((sec / 3600).toFixed(2))} hr`;

// Chart legends + the "Time" card: minutes only under an hour ("15 min"),
// otherwise "H hr M min" (minutes stay even at zero, e.g. "3 hr 0 min").
const formatDuration = (sec: number) => {
  const totalMin = Math.round(sec / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h === 0 ? `${m} min` : `${h} hr ${m} min`;
};

// "1 day" / "3 days" — count with a pluralized unit.
const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

// ---- pieces -----------------------------------------------------------------

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

// Live-collaboration colors assigned in order to techs / days in the charts
// (first tech = crimson, first day = plum — matching the Figma demo).
const TECH_COLORS: AvatarLiveColor[] = ["crimson", "teal", "amber", "plum", "violet", "blue", "orange", "cyan"];
const DAY_COLORS = ["plum", "orange", "blue", "crimson", "teal", "amber", "violet", "cyan"];
const liveVar = (name: string) => `var(--live-collaboration-${name})`;

const liveAvatar = (u: User, ring: AvatarLiveColor) => (
  <AvatarLive content="image" imageSrc={u.avatar} color={ring} size="md" />
);

// The work-timeline label: a calendar glyph with the start month + day
// (Figma "Calendar Glyph").
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

// A proportional segmented bar: top labels, the colored bar, then the values.
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

// The two chart hints (Figma 24537-92783 / 24537-92844): info indicator,
// caption only, bubble above the trigger and 375 wide.
const TIME_DIST_HINT =
  "Shows how much of the job’s logged time each technician contributed. Time is counted after the tech checks out, so a running session is not included yet.";
const WORK_TIMELINE_HINT =
  "Shows which days the work happened on and how much time went into each. Time is counted after the tech checks out, so a running session is not included yet.";

// A chart subsection: title + its hint, then the chart or "No time logged".
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

// ---- deriving ---------------------------------------------------------------

// Everything the module showed, derived from every tech's sessions. The CARDS
// counted a running session too; the CHARTS only counted logged (ended) ones.
function deriveSummary(perTech: { user: User; sessions: SummarySession[] }[]) {
  const techTotals = perTech
    .map((t) => ({ user: t.user, sec: t.sessions.filter((s) => !s.active).reduce((acc, s) => acc + s.durationSec, 0) }))
    .filter((t) => t.sec > 0);
  const logged = perTech.flatMap((t) => t.sessions.filter((s) => !s.active));
  const totalSec = logged.reduce((acc, s) => acc + s.durationSec, 0);
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

// ---- the module -------------------------------------------------------------

export default function SummaryModule({
  assignees,
  sessionsByUser = {},
  mobile = false,
}: {
  /** The job's assignees — the "Techs" card's avatar stack. */
  assignees: User[];
  /** Logged sessions per assignee (userId → their sessions). */
  sessionsByUser?: Record<number, SummarySession[]>;
  mobile?: boolean;
}) {
  const m = deriveSummary(assignees.map((u) => ({ user: u, sessions: sessionsByUser[u.id] ?? [] })));

  return (
    <DisplayModule
      title="Summary"
      content={
        <div className={styles.summary}>
          <div className={clsx(styles.summaryCards, mobile && styles.summaryCardsMobile)}>
            <div className={styles.card}>
              <span className={styles.cardLabel}>Time</span>
              <span className={clsx(styles.cardValue, m.count === 0 && styles.cardValueEmpty)}>
                {m.count === 0 ? "0 hr" : formatDuration(m.totalSec)}
              </span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardLabel}>Days</span>
              <span className={clsx(styles.cardValue, m.dayCount === 0 && styles.cardValueEmpty)}>
                {plural(m.dayCount, "day")}
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
        </div>
      }
    />
  );
}
