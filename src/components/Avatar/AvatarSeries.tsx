import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarSeriesProps, AvatarSeriesStatus } from "./AvatarSeries.types";

// Series shows its status as a colored statusDot
// (not an icon addOn).
const DOT_COLOR: Record<Exclude<AvatarSeriesStatus, "none">, string> = {
  open: "var(--jade-a9)",
  closed: "var(--gray-a9)",
};

// Avatar template for a Series: an object/icon avatar with the `series`
// semantic icon, and a status shown as a colored statusDot.
export default function AvatarSeries({
  size = "md",
  status = "none",
  className,
}: AvatarSeriesProps) {
  const dotColor = status === "none" ? undefined : DOT_COLOR[status];

  return (
    <Avatar
      shape="square"
      content="icon"
      icon={semanticIcons.series}
      size={size}
      className={className}
      addOn={dotColor ? "statusDot" : "none"}
      statusDotColor={dotColor}
    />
  );
}
