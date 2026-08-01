import { createStatusBadge, StatusDef } from "./statusBadge";

// Job Series status → scheme · dot · label. Uses a status dot, not an icon.
// (See badge-job-series-status.md.)
export const STATUS = {
  open: { scheme: "jade", dot: true, label: "Open" },
  closed: { scheme: "gray", dot: true, label: "Closed" },
} satisfies Record<string, StatusDef>;

export type BadgeJobSeriesStatusStatus = keyof typeof STATUS;

const BadgeJobSeriesStatus = createStatusBadge(STATUS);
export default BadgeJobSeriesStatus;
