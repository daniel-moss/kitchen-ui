import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";
import { objectPlaceholder } from "../../data/users";

import { AvatarVendorProps } from "./AvatarVendor.types";

// active / inactive → the statusDot color (Figma 2026-09-16: dots replaced the
// corner status icons).
const DOT_COLOR = {
  active: "var(--jade-a9)",
  inactive: "var(--gray-a9)",
} as const;

// Avatar template for a Vendor: an object avatar with the `vendor` semantic icon
// (or an image), and an addOn — a colored statusDot for active / inactive, or
// the amber crown for a preferred vendor (Figma 23629-10403, 2026-10-15; the
// same crown AvatarUser uses for a primary contact).
export default function AvatarVendor({
  size = "md",
  content = "icon",
  addOn = "none",
  imageSrc,
  className,
}: AvatarVendorProps) {
  const dotColor = addOn === "active" || addOn === "inactive" ? DOT_COLOR[addOn] : undefined;
  // Avatar has no icon addOn on xxs, so the crown is dropped there.
  const crown = addOn === "preferred" && size !== "xxs";

  return (
    <Avatar
      shape="square"
      content={content}
      icon={semanticIcons.vendor}
      imageSrc={content === "image" ? (imageSrc ?? objectPlaceholder) : undefined}
      size={size}
      className={className}
      addOn={dotColor ? "statusDot" : crown ? "icon" : "none"}
      statusDotColor={dotColor}
      addOnIcon={crown ? "crown" : undefined}
      addOnIconColor={crown ? "var(--amber-a10)" : undefined}
    />
  );
}
