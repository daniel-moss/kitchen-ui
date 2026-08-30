import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";
import { objectPlaceholder } from "../../data/users";

import { AvatarVendorProps, AvatarVendorStatus } from "./AvatarVendor.types";

// Status → the icon addOn: glyph token, color, and rotation.
const STATUS: Record<
  Exclude<AvatarVendorStatus, "none">,
  { icon: string; color: string; rotate: number }
> = {
  active: { icon: semanticIcons.active, color: "var(--jade-a9)", rotate: 90 },
  inactive: { icon: semanticIcons.inactive, color: "var(--gray-a9)", rotate: 0 },
};

// Avatar template for a Vendor: an object avatar with the `vendor` semantic icon
// (or an image), and a status expressed as the corner icon addOn.
export default function AvatarVendor({
  size = "md",
  content = "icon",
  status = "none",
  imageSrc,
  className,
}: AvatarVendorProps) {
  const s = status === "none" ? null : STATUS[status];

  return (
    <Avatar
      shape="square"
      content={content}
      icon={semanticIcons.vendor}
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
