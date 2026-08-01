import { createStatusBadge, StatusDef } from "./statusBadge";

// Job status → scheme · icon · label. (See badge-job-status.md.)
export const STATUS = {
  draft: { scheme: "gray", icon: "circle-dashed", label: "Draft" },
  unscheduled: { scheme: "violet", icon: "circle-dashed", label: "Unscheduled" },
  upcoming: { scheme: "blue", icon: "circle-half-stroke", rotate: 180, label: "Upcoming" },
  pastDue: { scheme: "tomato", icon: "circle-exclamation", label: "Past due" },
  active: { scheme: "jade", icon: "circle-play", label: "Active" },
  quickPaused: { scheme: "amber", icon: "circle-pause", label: "Quick-paused" },
  onHoldExternal: { scheme: "crimson", icon: "circle-stop", label: "On hold" },
  onHoldInternal: { scheme: "brown", icon: "circle-stop", label: "On hold" },
  uninvoiced: { scheme: "orange", icon: "circle-check", label: "Uninvoiced" },
  unestimated: { scheme: "orange", icon: "circle-check", label: "Unestimated" },
  finalized: { scheme: "jade", icon: "circle-check", label: "Finalized" },
  cancelled: { scheme: "gray", icon: "circle-xmark", label: "Cancelled" },
} satisfies Record<string, StatusDef>;

export type BadgeJobStatusStatus = keyof typeof STATUS;

const BadgeJobStatus = createStatusBadge(STATUS);
export default BadgeJobStatus;
