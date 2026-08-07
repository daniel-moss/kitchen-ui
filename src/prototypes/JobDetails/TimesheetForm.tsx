import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import EmptyState from "../../components/EmptyState/EmptyState";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import IconButton from "../../components/IconButton/IconButton";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";

import { overlapFlags, Session, SessionRow } from "./TimesheetPanel";

// The "Timesheet" review form (Figma 24598-41150 desktop / 24598-41148 mobile).
// It opens on EVERY check-out and asks the tech to confirm what was logged.
//
// Same rows as the Timesheet tab, but grouped by DAY instead of by tech: this
// is one person's own sheet, so the day is what separates the entries. Each
// day header carries a plus that adds a session to THAT day; the footer's
// "Add session" adds one with no day pre-picked.
//
// Nothing here is destructive — "It's correct" just closes it, and so does
// Cancel / the ✕. The check-out itself already happened.

/** A day's label ("January 2") from a session's start date. */
const DAY_LABEL = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" });
const dayLabelOf = (session: Session) => {
  const d = new Date(session.dateLabel);
  return Number.isNaN(d.getTime()) ? session.dateLabel : DAY_LABEL.format(d);
};

/**
 * The tech's sessions split into day groups, MOST RECENT DAY FIRST — the order
 * the Figma mock draws (January 2 above January 1). Sessions inside a day keep
 * the order they are given.
 *
 * NOTE: the frame's own annotation says "The earliest day is on top", which is
 * the opposite of what the same frame draws. Built to the mock and flagged to
 * Daniel (2026-08-07) — one line to flip if the annotation is the intent.
 */
const groupByDay = (sessions: Session[]) => {
  const groups = new Map<string, { label: string; day: number; sessions: Session[] }>();
  for (const s of sessions) {
    const label = dayLabelOf(s);
    const day = new Date(s.dateLabel).getTime();
    const group = groups.get(label) ?? { label, day: Number.isNaN(day) ? 0 : day, sessions: [] };
    group.sessions.push(s);
    groups.set(label, group);
  }
  return [...groups.values()].sort((a, b) => b.day - a.day);
};

export interface TimesheetFormProps {
  open: boolean;
  onClose: () => void;
  /** The checked-out tech's own sessions on this job. */
  sessions: Session[];
  /** The plus on a day header — the caller pre-fills that day's date. */
  onAddSession: (dayLabel?: string) => void;
  onEditSession: (session: Session) => void;
  onDeleteSession: (session: Session) => void;
  mobile?: boolean;
}

export default function TimesheetForm({
  open,
  onClose,
  sessions,
  onAddSession,
  onEditSession,
  onDeleteSession,
  mobile = false,
}: TimesheetFormProps) {
  const days = groupByDay(sessions);
  // Overlaps are flagged across the WHOLE sheet, not per day — a session that
  // runs past midnight overlaps one on the next day.
  const overlaps = overlapFlags(sessions);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Timesheet"
      caption="Review your timesheet"
      breakpoint={mobile ? "mobile" : "desktop"}
      bodyPadded={false}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="ghost" leftIcon="plus" onClick={() => onAddSession()}>
            Add session
          </Button>
          <Button size="lg" variant="solid" onClick={onClose}>
            It&apos;s correct
          </Button>
        </PopoverFooter>
      }
    >
      {days.length === 0 ? (
        <EmptyState caption="No time logged" />
      ) : (
        days.map((day, i) => (
          <ItemGroup
            key={day.label}
            accordion={false}
            divider={i < days.length - 1}
            label={
              <GroupLabel
                variant="primary"
                label={day.label}
                slotRight={
                  <HoverTooltip text="Add time session">
                    <IconButton
                      icon="plus"
                      variant="ghost"
                      size="md"
                      aria-label={`Add time session on ${day.label}`}
                      onClick={() => onAddSession(day.sessions[0].dateLabel)}
                    />
                  </HoverTooltip>
                }
              />
            }
          >
            {day.sessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                mobile={mobile}
                editable
                overlap={overlaps.get(s.id)}
                onStop={() => undefined}
                onEdit={() => onEditSession(s)}
                onDelete={() => onDeleteSession(s)}
              />
            ))}
          </ItemGroup>
        ))
      )}
    </Dialog>
  );
}
