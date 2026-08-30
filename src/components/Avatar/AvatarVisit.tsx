import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarVisitProps } from "./AvatarVisit.types";

// Avatar template for a Visit: an object/icon avatar with the `visit` semantic
// icon. Icon-only — no statuses, no addOns.
export default function AvatarVisit({ size = "md", className }: AvatarVisitProps) {
  return (
    <Avatar shape="square" content="icon" icon={semanticIcons.visit} size={size} className={className} />
  );
}
