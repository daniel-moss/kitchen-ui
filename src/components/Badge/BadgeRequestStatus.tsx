import { createStatusBadge, StatusDef } from "./statusBadge";

// Request status → scheme · icon · label.
export const STATUS = {
  pending: { scheme: "violet", icon: "circle-dashed", label: "Pending" },
  accepted: { scheme: "orange", icon: "circle-check", label: "Accepted" },
  finalized: { scheme: "jade", icon: "circle-check", label: "Finalized" },
  declined: { scheme: "gray", icon: "circle-xmark", label: "Declined" },
} satisfies Record<string, StatusDef>;

export type BadgeRequestStatusStatus = keyof typeof STATUS;

const BadgeRequestStatus = createStatusBadge(STATUS);
export default BadgeRequestStatus;
