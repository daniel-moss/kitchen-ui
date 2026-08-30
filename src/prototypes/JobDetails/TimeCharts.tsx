import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import AvatarDay from "../../components/Avatar/AvatarDay";
import AvatarLive from "../../components/Avatar/AvatarLive";
import { Divider } from "../../components/Divider/Divider";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import HintTrigger from "../../components/Hint/HintTrigger";
import HoverHint from "../../components/Hint/HoverHint";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import ListItem from "../../components/ListItem/ListItem";
import ListItemTextRight from "../../components/ListItem/ListItemTextRight";
import ProgressBar from "../../components/Progress/ProgressBar";
import Tooltip from "../../components/Tooltip/Tooltip";

import { ChartColor, colorAt, DAY_COLORS, liveVar, TECH_COLORS } from "./chartColors";

import styles from "./TimeCharts.module.scss";

// The Timesheet tab's two chart modules — "Time distribution" (Figma
// 24616-81424) and "Work timeline" (Figma 24616-81593). They replaced the old
// "Summary" module on 2026-08-11; the previous version is archived under
// `SummaryModule/` so it can still be opened in Storybook.
//
// Both modules have the same shape: a proportional segment chart (36px avatar,
// a 4px colored bar, the time below), an inset divider, then an ItemGroup with
// one row per segment (avatar, name, full-format time + percentage).

// ---- formatting -------------------------------------------------------------

// The chart bar's label: decimal hours, at most 2 decimals, trailing zeros
// dropped ("0.25 hr", "0.5 hr", "4.5 hr", "1 hr"). Figma 24620-83439:
// "Shown in decimal number to save space. Max 2 digits after the dot."
export const formatHours = (sec: number) => `${parseFloat((sec / 3600).toFixed(2))} hr`;

// The legend rows and every tooltip: minutes only under an hour ("15 min"),
// otherwise "H hr M min" — the minutes stay even at zero ("3 hr 0 min").
export const formatDuration = (sec: number) => {
  const totalMin = Math.round(sec / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h === 0 ? `${m} min` : `${h} hr ${m} min`;
};

// ---- tooltips ---------------------------------------------------------------

// A tooltip is a hover affordance — on touch devices it does not exist.
const canHover = () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

// The floating body, 8px above `y`. `x` is the anchor point the body centers on.
const TipBody = ({ text, x, y }: { text: string; x: number; y: number }) =>
  createPortal(
    <span className={styles.tipOverlay} style={{ left: x, top: y }}>
      <Tooltip placement="top" text={text} />
    </span>,
    document.body,
  );

// The rounded-time tooltip on a legend row's value. The DS `HoverTooltip`
// anchors to the trigger's CENTER, but this one has to "align with the cursor"
// (Figma 24620-83390), so it reproduces the ValueDisplay / TruncatingText
// behavior instead: a body portal at the cursor's x, above the trigger's top.
function CursorTooltip({ text, children }: { text: string; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  if (!canHover()) return <>{children}</>;

  const track = (clientX: number) => {
    const el = ref.current;
    if (el) setPos({ x: clientX, y: el.getBoundingClientRect().top });
  };

  return (
    <span
      ref={ref}
      className={styles.cursorWrap}
      onMouseEnter={(e) => track(e.clientX)}
      onMouseMove={(e) => track(e.clientX)}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos != null && <TipBody text={text} x={pos.x} y={pos.y} />}
    </span>
  );
}

// ---- the chart --------------------------------------------------------------

/** One tech / one day in a chart — a segment plus its legend row. */
export interface ChartEntry {
  /** Stable react key. */
  key: string;
  /** The time the segment is sized and labelled by — already rounded when the
   *  company rounds time up. */
  sec: number;
  /** The exact logged time — what the tooltips show. */
  exactSec: number;
  /** The 36px avatar: AvatarLive for a tech, AvatarDay for a day. */
  avatar: ReactNode;
  /** The segment's color, from the module's rotation. */
  color: ChartColor;
  /** Legend row title — the tech's name / the weekday date. */
  name: string;
}

/**
 * One chart segment. Two behaviors live here:
 *
 * 1. Hovering it shows the EXACT tracked time (Figma 24620-83404) — the bar's
 *    own label is a rounded decimal, so the tooltip is the only place the real
 *    number appears. The tooltip is centered over the segment, like the node.
 * 2. The label is DROPPED when it does not fit the segment's width (Figma
 *    24620-83443: "If assignee's segment is so short that the time does not fit
 *    the width, we do not show the time. We still show the tooltip, though.").
 *    The measurement runs against a hidden sizer, never against the visible
 *    label — measuring the label itself would oscillate, because hiding it
 *    takes its width out of the comparison and makes it "fit" again.
 */
function Segment({ entry }: { entry: ChartEntry }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLSpanElement>(null);
  const [fits, setFits] = useState(true);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const label = formatHours(entry.sec);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const sizer = sizerRef.current;
    if (wrap == null || sizer == null) return undefined;
    // Sub-pixel widths: `offsetWidth` rounds to whole pixels, which lets a label
    // ~1px too wide pass the test and render clipped. The rects do not round.
    const measure = () => setFits(sizer.getBoundingClientRect().width <= wrap.getBoundingClientRect().width);
    measure();
    // BOTH boxes are observed. The segment changes width when the module
    // resizes — and the sizer changes width when Inter finishes loading, which
    // is the case a wrap-only observer misses: the first measurement runs in
    // the fallback font, which is narrower, so a label that does NOT fit is
    // shown anyway and then clipped. `document.fonts.ready` covers the browsers
    // that swap without a layout change on the sizer.
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    observer.observe(sizer);
    let live = true;
    void document.fonts?.ready.then(() => {
      if (live) measure();
    });
    return () => {
      live = false;
      observer.disconnect();
    };
  }, [label]);

  const show = () => {
    const el = wrapRef.current;
    if (el == null) return;
    const r = el.getBoundingClientRect();
    setTip({ x: r.left + r.width / 2, y: r.top });
  };

  const hoverable = canHover();

  return (
    <div
      ref={wrapRef}
      className={styles.segment}
      style={{ flexGrow: entry.sec }}
      onMouseEnter={hoverable ? show : undefined}
      onMouseLeave={hoverable ? () => setTip(null) : undefined}
    >
      {entry.avatar}
      <ProgressBar value={100} color={liveVar(entry.color)} isDecorative className={styles.bar} />
      {fits && <span className={styles.segmentValue}>{label}</span>}
      <span ref={sizerRef} aria-hidden className={styles.segmentSizer}>
        {label}
      </span>
      {tip != null && <TipBody text={formatDuration(entry.exactSec)} x={tip.x} y={tip.y} />}
    </div>
  );
}

// ---- the module -------------------------------------------------------------

function ChartModule({
  title,
  hint,
  entries,
  rounded,
  mobile,
}: {
  title: string;
  hint: string;
  entries: ChartEntry[];
  /** The company rounds time up — the legend rows get the exact-time tooltip. */
  rounded: boolean;
  mobile: boolean;
}) {
  const total = entries.reduce((acc, e) => acc + e.sec, 0);

  return (
    <DisplayModule
      title={title}
      titleSlotRight={
        <HoverHint caption={hint} width={375} breakpoint={mobile ? "mobile" : "desktop"}>
          <HintTrigger />
        </HoverHint>
      }
      // The chart brings its own 16px padding and the ItemGroup its own 4px.
      bodyPadded={false}
      content={
        entries.length === 0 ? (
          <EmptyState caption="No time logged" />
        ) : (
          <>
            {/* Every segment keeps a 36px minimum so the avatars can never
                overlap (Daniel, 2026-08-11); past that the row scrolls
                sideways. Figma does not draw the overflowing case. */}
            <div className={styles.chart}>
              {entries.map((entry) => (
                <Segment key={entry.key} entry={entry} />
              ))}
            </div>
            {/* Inset 16px on both sides (Figma), unlike the module's own
                full-bleed header divider. */}
            <Divider padding="0 var(--size-4)" />
            <ItemGroup>
              {entries.map((entry) => {
                const value = (
                  <ListItemTextRight
                    variant="titleCaption"
                    title={formatDuration(entry.sec)}
                    caption={`${Math.round((entry.sec / total) * 100)}%`}
                  />
                );
                return (
                  <ListItem
                    key={entry.key}
                    avatar={entry.avatar}
                    title={entry.name}
                    // Only a rounded time hides something, so only then is
                    // there an exact value worth revealing (Figma 24620-83390).
                    right={
                      rounded ? <CursorTooltip text={formatDuration(entry.exactSec)}>{value}</CursorTooltip> : value
                    }
                  />
                );
              })}
            </ItemGroup>
          </>
        )
      }
    />
  );
}

// ---- the two modules --------------------------------------------------------

/** One tech's share of the job's logged time. */
export interface TechTime {
  id: number;
  name: string;
  avatar: string;
  /** Displayed seconds (rounded when the company rounds time up). */
  sec: number;
  /** Exact logged seconds. */
  exactSec: number;
}

/** One day's share of the job's logged time. */
export interface DayTime {
  key: string;
  /** Weekday date, e.g. "Monday, January 1" — the legend row's title. */
  label: string;
  month: string;
  day: string;
  /** Displayed seconds (rounded when the company rounds time up). */
  sec: number;
  /** Exact logged seconds. */
  exactSec: number;
}

const TIME_DIST_HINT =
  "Shows how much of the job’s logged time each technician contributed. Time is counted after the tech checks out, so a running session is not included yet.";
const WORK_TIMELINE_HINT =
  "Shows which days the work happened on and how much time went into each. Time is counted after the tech checks out, so a running session is not included yet.";

/**
 * "Time distribution" (Figma 24616-81424) — one segment per tech who logged
 * time. The caller passes the techs already sorted alphabetically; the color
 * rotation follows that order.
 */
export function TimeDistributionModule({
  techs,
  rounded = false,
  mobile = false,
}: {
  techs: TechTime[];
  rounded?: boolean;
  mobile?: boolean;
}) {
  const entries: ChartEntry[] = techs.map((tech, i) => {
    const color = colorAt(TECH_COLORS, i);
    return {
      key: String(tech.id),
      sec: tech.sec,
      exactSec: tech.exactSec,
      color,
      name: tech.name,
      avatar: <AvatarLive size="xl" content="image" imageSrc={tech.avatar} color={color} />,
    };
  });

  return (
    <ChartModule title="Time distribution" hint={TIME_DIST_HINT} entries={entries} rounded={rounded} mobile={mobile} />
  );
}

/**
 * "Work timeline" (Figma 24616-81593) — one segment per day work happened on,
 * in chronological order (Daniel, 2026-08-11).
 */
export function WorkTimelineModule({
  days,
  rounded = false,
  mobile = false,
}: {
  days: DayTime[];
  rounded?: boolean;
  mobile?: boolean;
}) {
  const entries: ChartEntry[] = days.map((d, i) => {
    const color = colorAt(DAY_COLORS, i);
    return {
      key: d.key,
      sec: d.sec,
      exactSec: d.exactSec,
      color,
      name: d.label,
      // The day's chart color is a live-collaboration name, which is also an
      // AvatarDay color scheme — the tile and its bar always match.
      avatar: <AvatarDay colorScheme={color} month={d.month} day={d.day} ariaLabel={d.label} />,
    };
  });

  return (
    <ChartModule title="Work timeline" hint={WORK_TIMELINE_HINT} entries={entries} rounded={rounded} mobile={mobile} />
  );
}
