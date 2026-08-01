import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarInvoiceProps, AvatarInvoiceStatus } from "./AvatarInvoice.types";

// Status → the icon addOn: glyph + color + rotation. Status glyphs are raw names
// (no semantic tokens for these). (See avatar-invoice.md.)
const STATUS: Record<
  Exclude<AvatarInvoiceStatus, "none">,
  { icon: string; color: string; rotate: number }
> = {
  draft: { icon: "circle-dashed", color: "var(--gray-a9)", rotate: 0 },
  unsent: { icon: "circle-dashed", color: "var(--violet-a9)", rotate: 0 },
  outstanding: { icon: "circle-half-stroke", color: "var(--blue-a9)", rotate: 180 },
  overdue: { icon: "circle-exclamation", color: "var(--tomato-a9)", rotate: 0 },
  paid: { icon: "circle-check", color: "var(--jade-a9)", rotate: 0 },
  voided: { icon: "circle-xmark", color: "var(--gray-a9)", rotate: 0 },
  forgiven: { icon: "circle-xmark", color: "var(--gray-a9)", rotate: 0 },
};

// Avatar template for an Invoice: an object/icon avatar with the `invoice`
// semantic icon, and a status expressed as the corner icon addOn.
export default function AvatarInvoice({
  size = "md",
  status = "none",
  className,
}: AvatarInvoiceProps) {
  const s = status === "none" ? null : STATUS[status];

  return (
    <Avatar
      type="object"
      content="icon"
      icon={semanticIcons.invoice}
      size={size}
      className={className}
      addOn={s ? "icon" : "none"}
      addOnIcon={s?.icon}
      addOnIconColor={s?.color}
      addOnIconRotate={s?.rotate}
    />
  );
}
