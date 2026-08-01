import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";
import { objectPlaceholder } from "../../data/users";

import { AvatarClientProps, AvatarClientStatus, AvatarClientType } from "./AvatarClient.types";

// Client type → icon token.
const TYPE_ICON: Record<AvatarClientType, string> = {
  generic: semanticIcons.client, // building-user
  business: semanticIcons.clientBusiness, // building
  individual: semanticIcons.clientIndividual, // user
};

// Status → the icon addOn: glyph, color override, and rotation.
const STATUS: Record<
  Exclude<AvatarClientStatus, "none">,
  { icon: string; color: string; rotate: number }
> = {
  active: { icon: semanticIcons.active, color: "var(--jade-a9)", rotate: 90 },
  inactive: { icon: semanticIcons.inactive, color: "var(--gray-a9)", rotate: 0 },
};

// Avatar template for a Client: an object avatar whose icon depends on the
// client type, optionally showing an image (logo) and a status addOn.
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
  const s = effectiveStatus === "none" ? null : STATUS[effectiveStatus];

  return (
    <Avatar
      type="object"
      content={effectiveContent}
      icon={TYPE_ICON[type]}
      imageSrc={effectiveContent === "image" ? (imageSrc ?? objectPlaceholder) : undefined}
      size={size}
      className={className}
      addOn={s ? "icon" : "none"}
      addOnIcon={s?.icon}
      addOnIconColor={s?.color}
      addOnIconRotate={s?.rotate}
    />
  );
}
