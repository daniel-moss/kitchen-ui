import { createStatusBadge, StatusDef } from "./statusBadge";

// Estimate status → scheme · icon · label. (See badge-estimate-status.md.)
export const STATUS = {
  draft: { scheme: "gray", icon: "circle-dashed", label: "Draft" },
  unsent: { scheme: "violet", icon: "circle-dashed", label: "Unsent" },
  awaitingApproval: { scheme: "blue", icon: "circle-half-stroke", rotate: 180, label: "Awaiting approval" },
  expired: { scheme: "tomato", icon: "circle-exclamation", label: "Expired" },
  unconverted: { scheme: "orange", icon: "circle-check", label: "Unconverted" },
  jobbed: { scheme: "jade", icon: "circle-check", label: "Jobbed" },
  invoiced: { scheme: "jade", icon: "circle-check", label: "Invoiced" },
  lost: { scheme: "gray", icon: "circle-xmark", label: "Lost" },
  cancelled: { scheme: "gray", icon: "circle-xmark", label: "Cancelled" },
} satisfies Record<string, StatusDef>;

export type BadgeEstimateStatusStatus = keyof typeof STATUS;

const BadgeEstimateStatus = createStatusBadge(STATUS);
export default BadgeEstimateStatus;
