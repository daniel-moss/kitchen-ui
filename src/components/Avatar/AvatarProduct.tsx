import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";
import { objectPlaceholder } from "../../data/users";

import { AvatarProductProps, AvatarProductStatus } from "./AvatarProduct.types";

// Status → the statusDot color (Figma 2026-09-16: dots replaced the corner
// status icons on every pricebook avatar).
const DOT_COLOR: Record<Exclude<AvatarProductStatus, "none">, string> = {
  active: "var(--jade-a9)",
  review: "var(--amber-a9)",
  inactive: "var(--gray-a9)",
};

// Avatar template for a Product: an object avatar with the `product` semantic
// icon (or an image — Figma calls it the `preview` variant), and a status
// shown as a colored statusDot.
export default function AvatarProduct({
  size = "md",
  content = "icon",
  status = "none",
  imageSrc,
  className,
}: AvatarProductProps) {
  const dotColor = status === "none" ? undefined : DOT_COLOR[status];

  return (
    <Avatar
      shape="square"
      content={content}
      icon={semanticIcons.product}
      imageSrc={content === "image" ? (imageSrc ?? objectPlaceholder) : undefined}
      size={size}
      className={className}
      addOn={dotColor ? "statusDot" : "none"}
      statusDotColor={dotColor}
    />
  );
}
