import { createStatusBadge, StatusDef } from "./statusBadge";

// Invoice status → scheme · icon · label. (See badge-invoice-status.md.)
export const STATUS = {
  draft: { scheme: "gray", icon: "circle-dashed", label: "Draft" },
  unsent: { scheme: "violet", icon: "circle-dashed", label: "Unsent" },
  outstanding: { scheme: "blue", icon: "circle-half-stroke", rotate: 180, label: "Outstanding" },
  overdue: { scheme: "tomato", icon: "circle-exclamation", label: "Overdue" },
  paid: { scheme: "jade", icon: "circle-check", label: "Paid" },
  voided: { scheme: "gray", icon: "circle-xmark", label: "Voided" },
  forgiven: { scheme: "gray", icon: "circle-xmark", label: "Forgiven" },
} satisfies Record<string, StatusDef>;

export type BadgeInvoiceStatusStatus = keyof typeof STATUS;

const BadgeInvoiceStatus = createStatusBadge(STATUS);
export default BadgeInvoiceStatus;
