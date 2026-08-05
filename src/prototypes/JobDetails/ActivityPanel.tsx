import ActivityLog from "../../components/ActivityLog/ActivityLog";
import ActivityLogGroup from "../../components/ActivityLog/ActivityLogGroup";
import ActivityLogItem from "../../components/ActivityLog/ActivityLogItem";
import Em from "../../components/ActivityLog/ActivityLogEmphasis";
import AvatarUser from "../../components/Avatar/AvatarUser";
import { Icon } from "../../components/Icon/Icon";

import { ActivityEvent, ValueIcon } from "./activityEvents";
import ActivityUpdateLog, { Muted, PeopleValue, PersonValue, ReasonSubLog, ValueGlyph } from "./ActivityUpdateLog";
import { StatWidget, StatWidgetRow } from "./StatWidget";
import { categoryIcon, formatHrMin } from "./TimesheetPanel";

import styles from "./ActivityPanel.module.scss";

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

// "1 day" / "2 days"
const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

// An equipment change reads as one sentence (Figma 24450-60498): "added
// equipment A, B", "removed equipment ~~C~~", or both joined by "and". Only the
// verbs are muted; the added names are emphasised and the REMOVED ones are
// struck through, like every other value that is gone. "equipment" never turns
// plural — the node writes it the same way for one piece and for several.
const EquipmentText = ({ event }: { event: ActivityEvent }) => {
  const added = event.added ?? [];
  const removed = event.removed ?? [];
  return (
    <>
      <Em>{event.user.name}</Em>{" "}
      {added.length > 0 && (
        <>
          added equipment <Em>{added.join(", ")}</Em>
        </>
      )}
      {added.length > 0 && removed.length > 0 && " "}
      {removed.length > 0 && (
        <>
          {added.length > 0 ? "and removed" : "removed"} equipment <Muted>{removed.join(", ")}</Muted>
        </>
      )}
    </>
  );
};

// A job-contact change (Figma 24487-43383). Three shapes from one event:
// the slot was FILLED, REPLACED, or EMPTIED. The replaced name renders struck
// through in gray-a8 like every other old value, and each contact carries its
// xxs avatar (Daniel, 2026-08-04). The removed shape names no contact, so it
// has no avatar. The avatars bring their own 6px gaps — that is why the
// sentence has no plain space before them.
// "added" is my verb — Figma documents only the updated and removed logs
// (Daniel picked it over reusing "updated … No value →", 2026-08-03).
const ContactText = ({ event }: { event: ActivityEvent }) => {
  const before = event.contactBefore;
  const after = event.contactAfter;
  if (after == null) {
    // The removed log NAMES the contact that left, struck through (Figma
    // 24487-43423) — the role alone did not say who was taken off.
    return (
      <>
        <Em>{event.user.name}</Em> removed <Em>{event.role}:</Em>
        <Muted>
          <PersonValue name={before ?? ""} avatar={event.contactBeforeAvatar ?? ""} />
        </Muted>
      </>
    );
  }
  if (before == null) {
    return (
      <>
        <Em>{event.user.name}</Em> added{" "}
        <Em>
          {event.role}:
          <PersonValue name={after} avatar={event.contactAfterAvatar ?? ""} />
        </Em>
      </>
    );
  }
  return (
    <>
      <Em>{event.user.name}</Em> updated <Em>{event.role}:</Em>
      <Muted>
        <PersonValue name={before} avatar={event.contactBeforeAvatar ?? ""} />
      </Muted>
      <Em>
        {" →"}
        <PersonValue name={after} avatar={event.contactAfterAvatar ?? ""} />
      </Em>
    </>
  );
};

// A label change (Figma 24492-52521). One log per save, naming everything it
// touched: "added label X", "added labels X, Y", "removed label ~~X~~", or both
// joined by "and". The verb agrees with the count, and REMOVED names are struck
// through like every other value that is gone.
const LabelsText = ({ event }: { event: ActivityEvent }) => {
  const added = event.added ?? [];
  const removed = event.removed ?? [];
  const noun = (list: string[]) => (list.length === 1 ? "label" : "labels");
  return (
    <>
      <Em>{event.user.name}</Em>{" "}
      {added.length > 0 && (
        <>
          added {noun(added)} <Em>{added.join(", ")}</Em>
        </>
      )}
      {added.length > 0 && removed.length > 0 && " "}
      {removed.length > 0 && (
        <>
          {added.length > 0 ? "and removed" : "removed"} {noun(removed)}{" "}
          <Muted>{removed.join(", ")}</Muted>
        </>
      )}
    </>
  );
};

/** A tech status as a log VALUE: its icon in REGULAR weight (Daniel, 2026-08-05). */
export const statusIcon = (status?: string): ValueIcon => ({ icon: categoryIcon(status), pack: "regular" });

// The time-tracking logs (Figma 24453-26325). Check-in / check-out / status
// switches carry their own glyph — a status change shows the STATUS's icon, so
// the timeline reads at a glance — and every time-session log the stopwatch.
const TIME_SYMBOLS: Partial<Record<ActivityEvent["kind"], string>> = {
  checkin: "arrow-right-to-arc",
  checkout: "arrow-left-from-arc",
  sessionAdded: "stopwatch",
  sessionUpdated: "stopwatch",
  sessionDeleted: "stopwatch",
};

// Check-in / check-out / status switch — one line each, the status emphasised.
// The check-in status carries its icon (its symbol is the check-in arrow); the
// status SWITCH does not, because that icon is already its symbol.
const TimeStatusText = ({ event }: { event: ActivityEvent }) => (
  <>
    <Em>{event.user.name}</Em>
    {event.kind === "checkout" ? (
      " checked out"
    ) : event.kind === "checkin" ? (
      <>
        {" "}
        checked in with status
        <Em>
          <ValueGlyph icon={statusIcon(event.status)} />
          {event.status}
        </Em>
      </>
    ) : (
      <>
        {" "}
        changed status to <Em>{event.status}</Em>
      </>
    )}
  </>
);

// A time session as a VALUE: its status with the status's own icon, then the
// range. The icon goes in front of the status only in the SESSION logs (Daniel,
// 2026-08-05) — their timeline glyph is the stopwatch, so nothing repeats; the
// check-in / status logs already carry that icon as their symbol.
export const SessionValue = ({ status, range, muted = false }: { status?: string; range?: string; muted?: boolean }) => (
  <>
    <ValueGlyph icon={statusIcon(status)} muted={muted} />
    {status}: {range}
  </>
);

// A session added or deleted: the whole session is the value, so the added one
// is emphasised and the deleted one is struck through.
const SessionText = ({ event }: { event: ActivityEvent }) => {
  const deleted = event.kind === "sessionDeleted";
  const value = <SessionValue status={event.status} range={event.sessionRange} muted={deleted} />;
  return (
    <>
      <Em>{event.user.name}</Em> {deleted ? "deleted" : "added"} time session{deleted ? <Muted>{value}</Muted> : <Em>{value}</Em>}
    </>
  );
};

// The job's own lifecycle (Figma 24512-62842) — the sentence alternates muted
// narration and emphasised values, and the status glyph is the timeline symbol.
const JobStatusText = ({ event }: { event: ActivityEvent }) => {
  const log = event.jobStatus;
  if (log == null) return null;
  return (
    <>
      <Em>{event.user.name}</Em>
      {log.text}
      {log.label != null && <Em>{log.label}: </Em>}
      {log.strikeValue != null && <Muted>{log.strikeValue}</Muted>}
      {log.people != null ? (
        <Em>
          <PeopleValue people={log.people} />
        </Em>
      ) : (
        log.value != null && <Em>{log.strikeValue != null ? ` → ${log.value}` : log.value}</Em>
      )}
      {log.tailText}
      {log.tailPeople != null ? (
        <Muted>
          <PeopleValue people={log.tailPeople} />
        </Muted>
      ) : (
        log.tailValue != null && (log.tailStrike ? <Muted>{log.tailValue}</Muted> : <Em>{log.tailValue}</Em>)
      )}
    </>
  );
};

export interface ActivityPanelProps {
  mobile?: boolean;
  /** Seconds the job has spent in the "Active" status (live while active). */
  activeSec: number;
  /** The calendar days any active stretch touched, e.g. ["Jan 1", "Jan 3"]. */
  activeDays: string[];
  /** The job's events, OLDEST first — the log shows them newest first. */
  events: ActivityEvent[];
}

// The "Activity" tab. Two stat widgets measuring the JOB's own active time,
// then the activity log. Events so far: the job's creation + Service-module
// updates (the update-log rules Daniel is testing).
export default function ActivityPanel({ mobile = false, activeSec, activeDays, events }: ActivityPanelProps) {
  // Nothing active yet → both widgets read as placeholders.
  const empty = activeDays.length === 0;

  // Newest first, grouped by month — the group header names the month.
  const groups: { label: string; items: ActivityEvent[] }[] = [];
  for (const event of [...events].reverse()) {
    const label = MONTH_LABEL.format(event.date);
    const group = groups.find((g) => g.label === label);
    if (group) group.items.push(event);
    else groups.push({ label, items: [event] });
  }

  return (
    <div className={styles.panel}>
      {/* Widgets — live: the total ticks while the job is active. */}
      <StatWidgetRow mobile={mobile}>
        <StatWidget label="Total time logged" value={formatHrMin(activeSec)} sub='with "Active" status' empty={empty} />
        <StatWidget
          label="Across"
          value={plural(activeDays.length, "day")}
          // NOTE: the empty caption is my copy — the Figma "Widgets"
          // documentation frame still holds placeholder text for this state.
          sub={empty ? "No active days" : activeDays.join(", ")}
          empty={empty}
        />
      </StatWidgetRow>

      <ActivityLog>
        {groups.map((group) => (
          <ActivityLogGroup key={group.label} label={group.label}>
            {group.items.map((event) =>
              event.kind === "updated" ? (
                <ActivityUpdateLog
                  key={event.id}
                  userName={event.user.name}
                  module={event.module ?? ""}
                  changes={event.changes ?? []}
                  date={event.date}
                />
              ) : event.kind === "sessionUpdated" ? (
                // A session edit follows the SAME update-log rules as a module
                // (Figma 24453-26459 one field / 24511-62572 several): one
                // changed field reads inline, more than one becomes the
                // accordion — naming the session itself instead of a module.
                <ActivityUpdateLog
                  key={event.id}
                  userName={event.user.name}
                  module=""
                  changes={event.changes ?? []}
                  date={event.date}
                  symbol={<Icon icon="stopwatch" size={14} />}
                  verb="updated time session"
                  subject={<SessionValue status={event.status} range={event.sessionRange} />}
                />
              ) : event.kind === "checkin" || event.kind === "checkout" || event.kind === "status" ? (
                <ActivityLogItem
                  key={event.id}
                  // A status switch is named by its own status icon.
                  symbol={<Icon icon={TIME_SYMBOLS[event.kind] ?? categoryIcon(event.status)} size={14} />}
                  text={<TimeStatusText event={event} />}
                  date={event.date}
                />
              ) : event.kind === "sessionAdded" || event.kind === "sessionDeleted" ? (
                <ActivityLogItem
                  key={event.id}
                  symbol={<Icon icon="stopwatch" size={14} />}
                  text={<SessionText event={event} />}
                  date={event.date}
                />
              ) : event.kind === "jobStatus" || event.kind === "scheduling" || event.kind === "assignees" ? (
                // The job's lifecycle (Figma 24512-62842) — the status glyph is
                // the symbol, SOLID and in the status's own colour, so the
                // sentence names the status without one. A typed reason turns
                // the log into an accordion holding it.
                <ActivityLogItem
                  key={event.id}
                  symbol={
                    <Icon
                      icon={event.jobStatus?.icon ?? "circle-dashed"}
                      // A module log (no colour) keeps the regular gray glyph;
                      // a job status is solid in its own colour.
                      pack={event.jobStatus?.color ? "solid" : "regular"}
                      size={14}
                      style={event.jobStatus?.color ? { color: event.jobStatus.color } : undefined}
                    />
                  }
                  text={<JobStatusText event={event} />}
                  date={event.date}
                >
                  {/* undefined, not false — `false` would still read as a child
                      and open an empty accordion. */}
                  {event.jobStatus?.reason ? (
                    <ReasonSubLog title={event.jobStatus.reasonTitle ?? "Reason"} value={event.jobStatus.reason} />
                  ) : undefined}
                </ActivityLogItem>
              ) : event.kind === "labels" ? (
                // Figma 24492-52521 — a `tag` symbol, not the update-log pen.
                <ActivityLogItem
                  key={event.id}
                  symbol={<Icon icon="tag" size={14} />}
                  text={<LabelsText event={event} />}
                  date={event.date}
                />
              ) : event.kind === "contact" ? (
                // Figma 24487-43383 (2026-08-05): the PEN symbol — `user` now
                // belongs to the Assignees module logs.
                <ActivityLogItem
                  key={event.id}
                  symbol={<Icon icon="pen" size={14} />}
                  text={<ContactText event={event} />}
                  date={event.date}
                />
              ) : event.kind === "equipment" ? (
                // Figma 24450-60498 — ONE log per change, naming every piece it
                // touched: "added A, B", "removed C", or both joined by "and".
                <ActivityLogItem
                  key={event.id}
                  symbol={<Icon icon="cube" size={14} />}
                  text={<EquipmentText event={event} />}
                  date={event.date}
                />
              ) : (
                <ActivityLogItem
                  key={event.id}
                  symbol={<AvatarUser size="xs" imageSrc={event.user.avatar} />}
                  text={
                    <>
                      <Em>{event.user.name}</Em> created the job
                    </>
                  }
                  date={event.date}
                />
              ),
            )}
          </ActivityLogGroup>
        ))}
      </ActivityLog>
    </div>
  );
}
