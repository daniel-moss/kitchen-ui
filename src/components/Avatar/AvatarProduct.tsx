import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";
import { objectPlaceholder } from "../../data/users";

import { AvatarProductProps, AvatarProductStatus } from "./AvatarProduct.types";

// Status → the icon addOn: glyph token, color, and rotation.
const STATUS: Record<
  Exclude<AvatarProductStatus, "none">,
  { icon: string; color: string; rotate: number }
> = {
  active: { icon: semanticIcons.active, color: "var(--jade-a9)", rotate: 90 },
  inactive: { icon: semanticIcons.inactive, color: "var(--gray-a9)", rotate: 0 },
  review: { icon: semanticIcons.review, color: "var(--amber-a9)", rotate: 0 },
};

// Avatar template for a Product: an object avatar with the `product` semantic
// icon (or an image), and a status expressed as the corner icon addOn.
export default function AvatarProduct({
  size = "md",
  content = "icon",
  status = "none",
  imageSrc,
  className,
}: AvatarProductProps) {
  const s = status === "none" ? null : STATUS[status];

  return (
    <Avatar
      type="object"
      content={content}
      icon={semanticIcons.product}
      imageSrc={content === "image" ? (imageSrc ?? objectPlaceholder) : undefined}
      size={size}
      className={className}
      addOn={s ? "icon" : "none"}
      addOnIcon={s?.icon}
      addOnIconColor={s?.color}
      addOnIconRotate={s?.rotate}
    />
  );
}
