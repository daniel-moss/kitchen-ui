import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarCreditNoteProps, AvatarCreditNoteStatus } from "./AvatarCreditNote.types";

// Status → the icon addOn: glyph + color (no rotation). Status glyphs are raw
// names (no semantic tokens for these). (See avatar-credit-note.md.)
const STATUS: Record<Exclude<AvatarCreditNoteStatus, "none">, { icon: string; color: string }> = {
  draft: { icon: "circle-dashed", color: "var(--gray-a9)" },
  unsent: { icon: "circle-dashed", color: "var(--violet-a9)" },
  issued: { icon: "circle-check", color: "var(--jade-a9)" },
  voided: { icon: "circle-xmark", color: "var(--gray-a9)" },
};

// Avatar template for a Credit Note: an object/icon avatar with the `credit-note`
// semantic icon, and a status expressed as the corner icon addOn.
export default function AvatarCreditNote({
  size = "md",
  status = "none",
  className,
}: AvatarCreditNoteProps) {
  const s = status === "none" ? null : STATUS[status];

  return (
    <Avatar
      type="object"
      content="icon"
      icon={semanticIcons.creditNote}
      size={size}
      className={className}
      addOn={s ? "icon" : "none"}
      addOnIcon={s?.icon}
      addOnIconColor={s?.color}
    />
  );
}
