import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";
import { objectPlaceholder } from "../../data/users";

import { AvatarVendorProps, AvatarVendorStatus } from "./AvatarVendor.types";

// Status → the statusDot color (Figma 2026-09-16: dots replaced the corner
// status icons).
const DOT_COLOR: Record<Exclude<AvatarVendorStatus, "none">, string> = {
  active: "var(--jade-a9)",
  inactive: "var(--gray-a9)",
};

// Avatar template for a Vendor: an object avatar with the `vendor` semantic icon
// (or an image — Figma calls it the `logo` variant), and a status shown as a
// colored statusDot.
export default function AvatarVendor({
  size = "md",
  content = "icon",
  status = "none",
  imageSrc,
  className,
}: AvatarVendorProps) {
  const dotColor = status === "none" ? undefined : DOT_COLOR[status];

  return (
    <Avatar
      shape="square"
      content={content}
      icon={semanticIcons.vendor}
      imageSrc={content === "image" ? (imageSrc ?? objectPlaceholder) : undefined}
      size={size}
      className={className}
      addOn={dotColor ? "statusDot" : "none"}
      statusDotColor={dotColor}
    />
  );
}
