import ActivityLog from "../../components/ActivityLog/ActivityLog";
import ActivityLogGroup from "../../components/ActivityLog/ActivityLogGroup";
import ActivityLogItem from "../../components/ActivityLog/ActivityLogItem";
import Muted from "../../components/ActivityLog/ActivityLogRemoved";
import ActivityLogSubtle from "../../components/ActivityLog/ActivityLogSubtle";
import ActivityLogSubItem from "../../components/ActivityLog/ActivityLogSubItem";
import ActivityLogValue from "../../components/ActivityLog/ActivityLogValue";
import { joinWithAnd } from "../../components/ActivityLog/fieldList";
import Avatar from "../../components/Avatar/Avatar";
import AvatarUser from "../../components/Avatar/AvatarUser";
import { Icon } from "../../components/Icon/Icon";

import roopairsAvatar from "../../assets/roopairs-avatar.jpg";

import { ActivityEvent, ValueIcon } from "./activityEvents";
import ActivityUpdateLog, { FieldSubLog, glyph, PeopleValue } from "./ActivityUpdateLog";
// The Activity tab renders CONCEPT 1 of the Job lifecycle module; the other
// four live beside it in ./JobLifecycleModule/ and take the same props, so
// any of them can be swapped in here to try it (Daniel, 2026-08-07).
import Concept1 from "./JobLifecycleModule/Concept1/Concept1";
import { LifecycleRow } from "./jobState";
import { categoryIcon } from "./TimesheetPanel";

import styles from "./ActivityPanel.module.scss";

// The connecting words of a log sentence — the sentence itself is strong.
const S = ActivityLogSubtle;

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

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
      {event.user.name}
      {added.length > 0 && (
        <>
          <S> added equipment </S>
          {removed.length > 0 ? added.join(", ") : joinWithAnd(added)}
        </>
      )}
      {removed.length > 0 && (
        <>
          <S> {added.length > 0 ? "and removed" : "removed"} equipment </S>
          <Muted>{added.length > 0 ? removed.join(", ") : joinWithAnd(removed)}</Muted>
        </>
      )}
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
      {event.user.name}
      {added.length > 0 && (
        <>
          <S> added {noun(added)} </S>
          {removed.length > 0 ? added.join(", ") : joinWithAnd(added)}
        </>
      )}
      {removed.length > 0 && (
        <>
          <S>
            {" "}
            {added.length > 0 ? "and removed" : "removed"} {noun(removed)}{" "}
          </S>
          <Muted>{added.length > 0 ? removed.join(", ") : joinWithAnd(removed)}</Muted>
        </>
      )}
    </>
  );
};

// The system's user id — "Roopairs" acts when nobody did (seedActivity).
const SYSTEM_ID = -1;

// The job's creation (Figma 24433-52739): "created the job", plus the object
// it came from. The id is emphasised like every other value — the node draws
// it Medium and NOT underlined, unlike the "created a related invoice" logs.
const CREATED_VIA_TEXT = {
  series: " created the job via job series ",
  estimate: " created the job from estimate ",
  recall: " created the job as a recall of ",
};

const CreatedText = ({ event }: { event: ActivityEvent }) => {
  const via = event.createdVia;
  return (
    <>
      {event.user.name}
      {via == null ? (
        <S> created the job</S>
      ) : (
        <>
          <S>{CREATED_VIA_TEXT[via.kind]}</S>
          {via.id}
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
    {event.user.name}
    {event.kind === "checkout" ? (
      <S> checked out</S>
    ) : event.kind === "checkin" && !event.status ? (
      // Checked in with no status — the company has the tech statuses off.
      <S> checked in</S>
    ) : event.kind === "checkin" ? (
      <>
        <S> checked in with status</S>
        <ActivityLogValue icon={glyph(statusIcon(event.status))}>{event.status ?? ""}</ActivityLogValue>
      </>
    ) : (
      <>
        <S> changed status to </S>
        {event.status}
      </>
    )}
  </>
);

// A time session as a VALUE: its status with the status's own icon, then the
// range. The icon goes in front of the status only in the SESSION logs (Daniel,
// 2026-08-05) — their timeline glyph is the stopwatch, so nothing repeats; the
// check-in / status logs already carry that icon as their symbol.
// Inside ActivityLogRemoved (a deleted session) the icon turns gray-a8 by
// itself. `isLeading` when a plain space already sits before it.
export const SessionValue = ({ status, range, isLeading = false }: { status?: string; range?: string; isLeading?: boolean }) => (
  <ActivityLogValue icon={glyph(statusIcon(status))} isLeading={isLeading}>
    {/* No status (the company has the tech statuses off) → the range alone. */}
    {`${status ? `${status}: ` : ""}${range ?? ""}`}
  </ActivityLogValue>
);

// A session added or deleted: the whole session is the value, so the added one
// is emphasised and the deleted one is struck through.
const SessionText = ({ event }: { event: ActivityEvent }) => {
  const deleted = event.kind === "sessionDeleted";
  const value = <SessionValue status={event.status} range={event.sessionRange} />;
  return (
    <>
      {event.user.name}
      <S> {deleted ? "deleted" : "added"} time session</S>
      {deleted ? <Muted>{value}</Muted> : value}
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
      {event.user.name}
      <S>{log.text}</S>
      {log.label != null && `${log.label}: `}
      {log.strikeValue != null && <Muted>{log.strikeValue}</Muted>}
      {log.people != null ? (
        // One group reads "A, B and C"; with a second group, commas only.
        <PeopleValue people={log.people} hasAnd={log.tailPeople == null} />
      ) : (
        log.value != null &&
        (log.valueLink ? (
          <span className={styles.link}>{log.value}</span>
        ) : log.strikeValue != null ? (
          ` → ${log.value}`
        ) : (
          log.value
        ))
      )}
      {log.tailText != null && <S>{log.tailText}</S>}
      {log.tailPeople != null ? (
        <Muted>
          <PeopleValue people={log.tailPeople} hasAnd={log.people == null} />
        </Muted>
      ) : (
        log.tailValue != null && (log.tailStrike ? <Muted>{log.tailValue}</Muted> : log.tailValue)
      )}
    </>
  );
};

export interface ActivityPanelProps {
  mobile?: boolean;
  /** Seconds the job has spent in the "Active" status (live while active). */
  billableSec: number;
  /** Seconds from the job's creation until it ended (or now). */
  lifecycleSec: number;
  /** Every status the job entered, in the designed order. */
  breakdown: LifecycleRow[];
  /** The job's events, OLDEST first — the log shows them newest first. */
  events: ActivityEvent[];
}

// The "Activity" tab. The Job lifecycle module (which REPLACED the two stat
// widgets, Figma 24560-134494), then the activity log. Events so far: the
// job's creation + module updates (the update-log rules Daniel is testing).
export default function ActivityPanel({ mobile = false, billableSec, lifecycleSec, breakdown, events }: ActivityPanelProps) {
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
      {/* Job lifecycle — live: the open stretch and both highlights tick. */}
      <Concept1 billableSec={billableSec} lifecycleSec={lifecycleSec} breakdown={breakdown} mobile={mobile} />

      <ActivityLog>
        {groups.map((group) => (
          <ActivityLogGroup key={group.label} label={group.label}>
            {group.items.map((event) =>
              event.kind === "updated" ? (
                <ActivityUpdateLog
                  key={event.id}
                  userName={event.user.name}
                  changes={event.changes ?? []}
                  date={event.date}
                />
              ) : event.kind === "sessionUpdated" ? (
                // A session edit follows the SAME update-log rules as a module
                // (Figma 24453-26459 one field / 24511-62572 several): one
                // changed field reads inline, more than one becomes the
                // accordion — naming the session itself (`subject`) instead of
                // the changed properties.
                <ActivityUpdateLog
                  key={event.id}
                  userName={event.user.name}
                  changes={event.changes ?? []}
                  date={event.date}
                  symbol={<Icon icon="stopwatch" size={14} />}
                  verb="updated time session"
                  subject={<SessionValue status={event.status} range={event.sessionRange} isLeading />}
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
              ) : event.kind === "scheduling" && event.changes != null && event.jobStatus == null ? (
                // A Scheduling module EDIT (Figma 24522-89331) — the DS update
                // log: one field inline, both fields as the accordion.
                <ActivityUpdateLog
                  key={event.id}
                  userName={event.user.name}
                  changes={event.changes}
                  date={event.date}
                  symbol={<Icon icon={event.symbolIcon ?? "calendar-lines-pen"} size={14} />}
                />
              ) : event.kind === "jobStatus" ||
                event.kind === "scheduling" ||
                event.kind === "assignees" ||
                event.kind === "createdFrom" ||
                event.kind === "forms" ? (
                // The job's lifecycle (Figma 24512-62842) — the status glyph is
                // the symbol, SOLID and in the status's own color, so the
                // sentence names the status without one. A typed reason turns
                // the log into an accordion holding it.
                <ActivityLogItem
                  key={event.id}
                  symbol={
                    <Icon
                      icon={event.jobStatus?.icon ?? "circle-dashed"}
                      // A module log (no color) keeps the regular gray glyph;
                      // a job status is solid in its own color.
                      pack={event.jobStatus?.color ? "solid" : "regular"}
                      size={14}
                      rotate={event.jobStatus?.rotate}
                      style={event.jobStatus?.color ? { color: event.jobStatus.color } : undefined}
                    />
                  }
                  text={<JobStatusText event={event} />}
                  date={event.date}
                >
                  {/* A Schedule / Reschedule / Unschedule status log lists every
                      field of its form first — unchanged ones show their value
                      only (DS doc "Sub-logs") — and the reason last.
                      undefined, not false — `false` would still read as a child
                      and open an empty accordion. */}
                  {event.changes != null || event.jobStatus?.reason ? (
                    <>
                      {event.changes?.map((change) => (
                        <FieldSubLog key={change.label} change={change} />
                      ))}
                      {event.jobStatus?.reason ? (
                        <ActivityLogSubItem title={event.jobStatus.reasonTitle ?? "Reason"} caption={event.jobStatus.reason} />
                      ) : null}
                    </>
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
                // The standard DS update log (Daniel, 2026-11-27 — it had its
                // own "added" / "removed" verbs): a filled slot is "Value
                // added" (~~No value~~ → name), an emptied one "Value cleared"
                // (~~name~~ → No value). Each contact keeps its avatar.
                <ActivityUpdateLog
                  key={event.id}
                  userName={event.user.name}
                  date={event.date}
                  changes={[
                    {
                      label: event.role ?? "",
                      oldValue: event.contactBefore ?? "",
                      newValue: event.contactAfter ?? "",
                      oldPeople: event.contactBefore == null ? undefined : [{ name: event.contactBefore, avatar: event.contactBeforeAvatar ?? "" }],
                      newPeople: event.contactAfter == null ? undefined : [{ name: event.contactAfter, avatar: event.contactAfterAvatar ?? "" }],
                    },
                  ]}
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
                // The job's creation (Figma 24433-52739). A person gets their
                // avatar; the system ("Roopairs", a rolling series making its
                // next job) gets the square logo avatar.
                <ActivityLogItem
                  key={event.id}
                  symbol={
                    event.user.id === SYSTEM_ID ? (
                      <Avatar size="xs" shape="square" content="image" imageSrc={roopairsAvatar} />
                    ) : (
                      <AvatarUser size="xs" imageSrc={event.user.avatar} />
                    )
                  }
                  text={<CreatedText event={event} />}
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
