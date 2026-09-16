import { createStatusBadge, StatusDef } from "./statusBadge";

// Series status → scheme · dot · label. Uses a status dot, not an icon.

export const STATUS = {
  open: { scheme: "jade", dot: true, label: "Open" },
  closed: { scheme: "gray", dot: true, label: "Closed" },
} satisfies Record<string, StatusDef>;

export type BadgeSeriesStatusStatus = keyof typeof STATUS;

const BadgeSeriesStatus = createStatusBadge(STATUS);
export default BadgeSeriesStatus;
