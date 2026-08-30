import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarLocationProps } from "./AvatarLocation.types";

// Avatar template for a Location: an object/icon avatar with the `location`
// semantic icon. Icon-only — no statuses, no addOns.
export default function AvatarLocation({ size = "md", className }: AvatarLocationProps) {
  return (
    <Avatar shape="square" content="icon" icon={semanticIcons.location} size={size} className={className} />
  );
}
