import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarDiscountProps, AvatarDiscountStatus } from "./AvatarDiscount.types";

// Status → the icon addOn: glyph token, color, and rotation.
// (See avatar-discount.md.)
const STATUS: Record<
  Exclude<AvatarDiscountStatus, "none">,
  { icon: string; color: string; rotate: number }
> = {
  active: { icon: semanticIcons.active, color: "var(--jade-a9)", rotate: 90 },
  review: { icon: semanticIcons.review, color: "var(--amber-a9)", rotate: 0 },
  inactive: { icon: semanticIcons.inactive, color: "var(--gray-a9)", rotate: 0 },
};

// Avatar template for a Discount: an object/icon avatar with the `discount`
// semantic icon, and a status expressed as the corner icon addOn.
export default function AvatarDiscount({
  size = "md",
  status = "none",
  className,
}: AvatarDiscountProps) {
  const s = status === "none" ? null : STATUS[status];

  return (
    <Avatar
      type="object"
      content="icon"
      icon={semanticIcons.discount}
      size={size}
      className={className}
      addOn={s ? "icon" : "none"}
      addOnIcon={s?.icon}
      addOnIconColor={s?.color}
      addOnIconRotate={s?.rotate}
    />
  );
}
