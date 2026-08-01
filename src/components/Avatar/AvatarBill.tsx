import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarBillProps, AvatarBillStatus } from "./AvatarBill.types";

// Status → the icon addOn: glyph, color override, and rotation. "none" has no
// addOn. (See ../Kitchen UI/components/avatar-bill.md.)
const STATUS: Record<
  Exclude<AvatarBillStatus, "none">,
  { icon: string; color: string; rotate: number }
> = {
  draft: { icon: "circle-dashed", color: "var(--gray-a9)", rotate: 0 },
  outstanding: { icon: "circle-half-stroke", color: "var(--blue-a9)", rotate: 180 },
  overdue: { icon: "circle-exclamation", color: "var(--tomato-a9)", rotate: 0 },
  paid: { icon: "circle-check", color: "var(--jade-a9)", rotate: 0 },
  voided: { icon: "circle-xmark", color: "var(--gray-a9)", rotate: 0 },
};

// Avatar template for a Bill: an object/icon avatar with the `bill` semantic
// icon, and a status expressed as the corner icon addOn.
export default function AvatarBill({ size = "md", status = "none", className }: AvatarBillProps) {
  const s = status === "none" ? null : STATUS[status];

  return (
    <Avatar
      type="object"
      content="icon"
      icon={semanticIcons.bill}
      size={size}
      className={className}
      addOn={s ? "icon" : "none"}
      addOnIcon={s?.icon}
      addOnIconColor={s?.color}
      addOnIconRotate={s?.rotate}
    />
  );
}
