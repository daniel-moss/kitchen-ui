import { MouseEvent, PointerEvent as ReactPointerEvent, ReactNode, useEffect, useRef, useState } from "react";

import clsx from "clsx";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import { Icon } from "../../components/Icon/Icon";
import SelectField from "../../components/Fields/SelectField/SelectField";
import ListItem from "../../components/ListItem/ListItem";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import { Divider } from "../../components/Divider/Divider";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { TIME_OPTIONS } from "./SchedulingForm";
import { SelectPopoverList, useSelectPopover } from "./selectPopover";
import { CalendarGlyph, fmtClockMin, formatHrMin, parseClockMin } from "./TimesheetPanel";

import styles from "./TimeReviewForm.module.scss";

// The check-out "Time review" form (Figma desktop 24184-61522 / mobile
// 24184-62305): the tracked total + editable start/end time selects, the two
// split sessions (Travelling / Working), and a drag slider that distributes
// the tracked time between them in 15-minute steps. All the way LEFT = all
// time to Working (24184-62508); all the way RIGHT = all to Travelling.
// The rows update live while dragging (24184-63073); before the first drag
// they show "Unknown" ends and "No time" (24184-61522).

const STEP_MIN = 15;

export interface TimeReviewResult {
  startMin: number;
  endMin: number;
  /** Minutes assigned to Travelling; null = the knob was never dragged. */
  travelMin: number | null;
}

interface TimeReviewFormProps {
  open: boolean;
  /** X / scrim dismiss — keeps the single logged session unchanged. */
  onClose: () => void;
  /** Rounded session start/end, minutes since midnight. */
  startMin: number;
  endMin: number;
  /** Calendar-glyph month/day for the session rows (e.g. "JAN" / "1"). */
  month: string;
  day: string;
  /** "Save" — commit the distribution. */
  onSave: (result: TimeReviewResult) => void;
  /** "Don't save my time" — discard the tracked session entirely. */
  onDiscard: () => void;
  mobile?: boolean;
}

// Total tracked minutes for a start/end pair (wraps past midnight).
const totalOf = (start: number, end: number) => (((end - start) % 1440) + 1440) % 1440;

export default function TimeReviewForm({
  open,
  onClose,
  startMin: initialStart,
  endMin: initialEnd,
  month,
  day,
  onSave,
  onDiscard,
  mobile = false,
}: TimeReviewFormProps) {
  const [startMin, setStartMin] = useState(initialStart);
  const [endMin, setEndMin] = useState(initialEnd);
  // Minutes assigned to Travelling. null until the first drag — the rows show
  // "Unknown" / "No time" and the knob sits in the middle (Figma default).
  const [travelMin, setTravelMin] = useState<number | null>(null);
  const startPop = useSelectPopover(mobile);
  const endPop = useSelectPopover(mobile);
  const trackRef = useRef<HTMLDivElement>(null);

  // A fresh open reloads the session's rounded times and resets the knob.
  useEffect(() => {
    if (!open) {
      startPop.close();
      endPop.close();
      return;
    }
    setStartMin(initialStart);
    setEndMin(initialEnd);
    setTravelMin(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const total = totalOf(startMin, endMin);
  const workMin = travelMin == null ? null : total - travelMin;

  // ---- the distribution slider ---------------------------------------------
  // The 36px knob moves inside the 44px track (4px inset each side). Its
  // position maps to Travelling's share, snapped to 15-minute steps.
  const applyPointer = (clientX: number) => {
    const track = trackRef.current;
    if (track == null || total === 0) return;
    const rect = track.getBoundingClientRect();
    const inset = 22; // half knob (18) + 4px edge inset
    const usable = rect.width - inset * 2;
    const frac = Math.min(1, Math.max(0, (clientX - rect.left - inset) / usable));
    const snapped = Math.min(total, Math.max(0, Math.round((frac * total) / STEP_MIN) * STEP_MIN));
    setTravelMin(snapped);
  };
  const onTrackPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    applyPointer(e.clientX);
    const move = (ev: PointerEvent) => {
      ev.preventDefault();
      applyPointer(ev.clientX);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };
  // Knob position: fraction of the usable range (CSS uses it via calc()).
  const knobFrac = travelMin == null || total === 0 ? 0.5 : travelMin / total;

  // ---- the two session rows -------------------------------------------------
  const splitMin = travelMin == null ? null : (startMin + travelMin) % 1440;
  const unknown = <span className={styles.placeholderText}>Unknown</span>;
  const noTime = <span className={styles.placeholderText}>No time</span>;

  let travelTitle: ReactNode;
  let travelValue: ReactNode;
  let workTitle: ReactNode;
  let workValue: ReactNode;
  if (splitMin == null) {
    // Untouched: each row knows only its outer edge (Figma 24184-61522).
    travelTitle = <>{fmtClockMin(startMin)} -&gt; {unknown}</>;
    workTitle = <>{unknown} -&gt; {fmtClockMin(endMin)}</>;
    travelValue = noTime;
    workValue = noTime;
  } else {
    // Zero-share sides collapse to "Not tracked" / "No time" (Figma 24184-62508).
    travelTitle = travelMin === 0 ? <span className={styles.placeholderText}>Not tracked</span> : <>{fmtClockMin(startMin)} -&gt; {fmtClockMin(splitMin)}</>;
    travelValue = travelMin === 0 ? noTime : <span>{formatHrMin(travelMin! * 60)}</span>;
    workTitle = workMin === 0 ? <span className={styles.placeholderText}>Not tracked</span> : <>{fmtClockMin(splitMin)} -&gt; {fmtClockMin(endMin)}</>;
    workValue = workMin === 0 ? noTime : <span>{formatHrMin(workMin! * 60)}</span>;
  }

  const sessionRow = (title: ReactNode, category: string, value: ReactNode) => (
    <ListItem
      variant="titleCaption"
      title={<span className={styles.rowTitle}>{title}</span>}
      caption={category}
      avatar={<CalendarGlyph month={month} day={day} />}
      slotRight={<span className={styles.rowValue}>{value}</span>}
    />
  );

  // Picking a new start/end keeps the knob's share valid for the new total.
  const pickTime = (which: "start" | "end", label: string) => {
    const min = parseClockMin(label);
    if (min == null) return;
    const nextStart = which === "start" ? min : startMin;
    const nextEnd = which === "end" ? min : endMin;
    if (which === "start") setStartMin(min);
    else setEndMin(min);
    setTravelMin((t) => (t == null ? null : Math.min(t, totalOf(nextStart, nextEnd))));
  };

  return (
    <Dialog
      bodyPadded={false}
      open={open}
      onClose={onClose}
      title="Time review"
      breakpoint={mobile ? "mobile" : "desktop"}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onDiscard}>
              Don&apos;t save my time
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={() => onSave({ startMin, endMin, travelMin })}>
            Save
          </Button>
        </PopoverFooter>
      }
    >
      {/* Tracked total + the editable start -> end range. */}
      <div className={styles.top}>
        <div className={styles.totalBlock}>
          <span className={styles.totalLabel}>Time tracked</span>
          <span className={styles.totalValue}>{formatHrMin(total * 60)}</span>
        </div>
        <div className={styles.rangeRow}>
          <SelectField
            value={fmtClockMin(startMin)}
            open={startPop.open}
            onClick={(e: MouseEvent<HTMLDivElement>) => startPop.toggle(e.currentTarget)}
          />
          <span className={styles.rangeArrow}>-&gt;</span>
          <SelectField
            value={fmtClockMin(endMin)}
            open={endPop.open}
            onClick={(e: MouseEvent<HTMLDivElement>) => endPop.toggle(e.currentTarget)}
          />
        </div>
      </div>

      <Divider padding="var(--size-2) var(--size-4)" />

      {/* The two split sessions — data updates live while dragging. */}
      <ItemGroup>
        {sessionRow(travelTitle, "Travelling", travelValue)}
        {sessionRow(workTitle, "Working", workValue)}
      </ItemGroup>

      <Divider padding="var(--size-2) var(--size-4)" />

      {/* The distribution slider (prototype-local; no DS slider yet). */}
      <div className={styles.sliderBlock}>
        <div ref={trackRef} className={styles.track} onPointerDown={onTrackPointerDown}>
          <span className={styles.trackLabelLeft}>Travelling</span>
          <span className={styles.trackLabelRight}>Working</span>
          <div className={styles.knob} style={{ left: `calc(22px + (100% - 44px) * ${knobFrac})` }}>
            <Icon icon="arrows-left-right" pack="solid" />
          </div>
        </div>
        <span className={styles.sliderCaption}>Drag to distribute time</span>
      </div>

      {/* Start / end time pickers — the same 15-min list as Scheduling "Time". */}
      {(["start", "end"] as const).map((which) => (
        <SelectPopoverList
          key={which}
          pop={which === "start" ? startPop : endPop}
          mobile={mobile}
          title="Time"
          searchable
          searchPlaceholder="Search time..."
        >
          <SelectListItemGroup>
            {TIME_OPTIONS.map((t) => (
              <SelectListItem
                key={t}
                label={t}
                selected={t === fmtClockMin(which === "start" ? startMin : endMin)}
                onClick={() => {
                  pickTime(which, t);
                  (which === "start" ? startPop : endPop).close();
                }}
              />
            ))}
          </SelectListItemGroup>
        </SelectPopoverList>
      ))}
    </Dialog>
  );
}
