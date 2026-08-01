import { createStatusBadge, StatusDef } from "./statusBadge";

// Credit Note status → scheme · icon · label. (See badge-credit-note-status.md.)
export const STATUS = {
  draft: { scheme: "gray", icon: "circle-dashed", label: "Draft" },
  unsent: { scheme: "violet", icon: "circle-dashed", label: "Unsent" },
  issued: { scheme: "jade", icon: "circle-check", label: "Issued" },
  voided: { scheme: "gray", icon: "circle-xmark", label: "Voided" },
} satisfies Record<string, StatusDef>;

export type BadgeCreditNoteStatusStatus = keyof typeof STATUS;

const BadgeCreditNoteStatus = createStatusBadge(STATUS);
export default BadgeCreditNoteStatus;
