import { createStatusBadge, StatusDef } from "./statusBadge";

// Job Request status → scheme · icon · label. (See badge-job-request-status.md.)
export const STATUS = {
  pending: { scheme: "violet", icon: "circle-dashed", label: "Pending" },
  accepted: { scheme: "orange", icon: "circle-check", label: "Accepted" },
  finalized: { scheme: "jade", icon: "circle-check", label: "Finalized" },
  declined: { scheme: "gray", icon: "circle-xmark", label: "Declined" },
} satisfies Record<string, StatusDef>;

export type BadgeJobRequestStatusStatus = keyof typeof STATUS;

const BadgeJobRequestStatus = createStatusBadge(STATUS);
export default BadgeJobRequestStatus;
