import { createStatusBadge, StatusDef } from "./statusBadge";

// Bill status → scheme · icon · label. (See badge-bill-status.md.)
export const STATUS = {
  draft: { scheme: "gray", icon: "circle-dashed", label: "Draft" },
  outstanding: { scheme: "blue", icon: "circle-half-stroke", rotate: 180, label: "Outstanding" },
  overdue: { scheme: "tomato", icon: "circle-exclamation", label: "Overdue" },
  paid: { scheme: "jade", icon: "circle-check", label: "Paid" },
  voided: { scheme: "gray", icon: "circle-xmark", label: "Voided" },
} satisfies Record<string, StatusDef>;

export type BadgeBillStatusStatus = keyof typeof STATUS;

const BadgeBillStatus = createStatusBadge(STATUS);
export default BadgeBillStatus;
