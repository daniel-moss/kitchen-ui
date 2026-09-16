import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";
import { objectPlaceholder } from "../../data/users";

import { AvatarClientProps, AvatarClientStatus, AvatarClientType } from "./AvatarClient.types";

// Client type → icon token. Each type has its own icon since 2026-09-16.
const TYPE_ICON: Record<AvatarClientType, string> = {
  generic: semanticIcons.clientGeneric, // buildings
  business: semanticIcons.clientBusiness, // building
  individual: semanticIcons.clientIndividual, // building-user
};

// Status → the statusDot color (Figma 2026-09-16: dots replaced the corner
// status icons).
const DOT_COLOR: Record<Exclude<AvatarClientStatus, "none">, string> = {
  active: "var(--jade-a9)",
  inactive: "var(--gray-a9)",
};

// Avatar template for a Client: an object avatar whose icon depends on the
// client type, optionally showing an image (logo) and a statusDot.
export default function AvatarClient({
  size = "md",
  type = "business",
  content = "icon",
  status = "none",
  imageSrc,
  className,
}: AvatarClientProps) {
  // generic is icon-only and has no addOns.
  const effectiveContent = type === "generic" ? "icon" : content;
  const effectiveStatus = type === "generic" ? "none" : status;
  const dotColor = effectiveStatus === "none" ? undefined : DOT_COLOR[effectiveStatus];

  return (
    <Avatar
      shape="square"
      content={effectiveContent}
      icon={TYPE_ICON[type]}
      imageSrc={effectiveContent === "image" ? (imageSrc ?? objectPlaceholder) : undefined}
      size={size}
      className={className}
      addOn={dotColor ? "statusDot" : "none"}
      statusDotColor={dotColor}
    />
  );
}
