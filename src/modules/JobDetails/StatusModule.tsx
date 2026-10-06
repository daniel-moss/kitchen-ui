import { ReactNode } from "react";

import BadgeJobStatus from "../../components/Badge/BadgeJobStatus";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import ValueDisplay from "../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../components/ValueDisplay/ValueDisplayGroup";
import { displayStatus, JobState, STATUS_TS, SUBSTATUS_ROWS } from "./jobState";
import { Scheduling } from "./SchedulingForm";

// The "Status" module — its content depends on the job's lifecycle state:
//   upcoming/pastDue → Status + Scheduled on
//   active           → Status + Started on + Active on (+ Status message)
//   cancelled        → Status + [Started on] + Cancelled on (+ Status message)
//   unscheduled      → Status + Unscheduled on
//   completed        → Status + Started on + Completed on  (Figma 21779-28494)
//   finalized        → Status + Started on + Finalized on  (Figma 21779-28759)
// Neither completed nor finalized shows a Status message row.
export default function StatusModule({ job, scheduling }: { job: JobState; scheduling: Scheduling }) {
  const ds = displayStatus(job, scheduling);

  // A sub-status NAMES the status (Daniel, 2026-10-05: JOB-1099's list badge
  // read "Pulled to another call" while this one still said "Quick-paused").
  // So the badge is always the real `BadgeJobStatus` — its own scheme and icon
  // — with the sub-status passed as the `label` override, exactly as the jobs
  // list does it. It used to hand-build a jade BadgeColor for ACTIVE only,
  // which left the two paused statuses showing the general name.
  const sub = SUBSTATUS_ROWS.includes(job.status) ? job.subStatus : undefined;

  const rows: ReactNode[] = [
    <ValueDisplay key="status" label="Status" kind="badge" badge={<BadgeJobStatus status={ds} label={sub} />} />,
  ];

  if (job.status === "upcoming") {
    // "Scheduled ON" is when the visit was BOOKED — not "Scheduled for", the
    // visit itself. The two rows are different dates and are meant to differ.
    rows.push(<ValueDisplay key="scheduledOn" label="Scheduled on" value={job.scheduledAt ?? STATUS_TS} />);
  } else if (job.status === "active") {
    rows.push(<ValueDisplay key="startedOn" label="Started on" value={job.startedAt ?? STATUS_TS} />);
    rows.push(<ValueDisplay key="activeOn" label="Active on" value={job.activeAt ?? STATUS_TS} />);
  } else if (job.status === "quickPaused") {
    rows.push(<ValueDisplay key="startedOn" label="Started on" value={job.startedAt ?? STATUS_TS} />);
    rows.push(<ValueDisplay key="pausedOn" label="Paused on" value={job.pausedAt ?? STATUS_TS} />);
  } else if (job.status === "onHold") {
    rows.push(<ValueDisplay key="startedOn" label="Started on" value={job.startedAt ?? STATUS_TS} />);
    rows.push(<ValueDisplay key="onHoldOn" label="On hold on" value={job.pausedAt ?? STATUS_TS} />);
  } else if (job.status === "cancelled") {
    if (job.everStarted) rows.push(<ValueDisplay key="startedOn" label="Started on" value={job.startedAt ?? STATUS_TS} />);
    rows.push(<ValueDisplay key="cancelledOn" label="Cancelled on" value={job.cancelledAt ?? STATUS_TS} />);
  } else if (job.status === "unscheduled") {
    rows.push(<ValueDisplay key="unscheduledOn" label="Unscheduled on" value={job.unscheduledAt ?? STATUS_TS} />);
  } else if (job.status === "completed") {
    rows.push(<ValueDisplay key="startedOn" label="Started on" value={job.startedAt ?? STATUS_TS} />);
    rows.push(<ValueDisplay key="completedOn" label="Completed on" value={job.completedAt ?? STATUS_TS} />);
  } else if (job.status === "finalized") {
    rows.push(<ValueDisplay key="startedOn" label="Started on" value={job.startedAt ?? STATUS_TS} />);
    rows.push(<ValueDisplay key="finalizedOn" label="Finalized on" value={job.finalizedAt ?? STATUS_TS} />);
  }

  // The status message (start / cancel / pause reason) — a clamped vertical value.
  if (
    job.statusMessage != null &&
    (job.status === "active" || job.status === "cancelled" || job.status === "quickPaused" || job.status === "onHold")
  ) {
    rows.push(
      <ValueDisplay key="message" label="Status message" orientation="vertical" value={job.statusMessage} lineLimit={4} />,
    );
  }

  return <DisplayModule title="Status" content={<ValueDisplayGroup>{rows}</ValueDisplayGroup>} />;
}
