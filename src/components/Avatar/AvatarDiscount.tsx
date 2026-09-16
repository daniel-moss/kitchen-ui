import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarDiscountProps, AvatarDiscountStatus } from "./AvatarDiscount.types";

// Status → the statusDot color (Figma 2026-09-16: dots replaced the corner
// status icons on every pricebook avatar).
const DOT_COLOR: Record<Exclude<AvatarDiscountStatus, "none">, string> = {
  active: "var(--jade-a9)",
  review: "var(--amber-a9)",
  inactive: "var(--gray-a9)",
};

// Avatar template for a Discount: an object/icon avatar with the `discount`
// semantic icon, and a status shown as a colored statusDot.
export default function AvatarDiscount({
  size = "md",
  status = "none",
  className,
}: AvatarDiscountProps) {
  const dotColor = status === "none" ? undefined : DOT_COLOR[status];

  return (
    <Avatar
      shape="square"
      content="icon"
      icon={semanticIcons.discount}
      size={size}
      className={className}
      addOn={dotColor ? "statusDot" : "none"}
      statusDotColor={dotColor}
    />
  );
}
