import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarJobSeriesProps, AvatarJobSeriesStatus } from "./AvatarJobSeries.types";

// Unlike most templates, Job Series shows its status as a colored statusDot
// (not an icon addOn). (See avatar-job-series.md.)
const DOT_COLOR: Record<Exclude<AvatarJobSeriesStatus, "none">, string> = {
  open: "var(--jade-a9)",
  closed: "var(--gray-a9)",
};

// Avatar template for a Job Series: an object/icon avatar with the `job-series`
// semantic icon, and a status shown as a colored statusDot.
export default function AvatarJobSeries({
  size = "md",
  status = "none",
  className,
}: AvatarJobSeriesProps) {
  const dotColor = status === "none" ? undefined : DOT_COLOR[status];

  return (
    <Avatar
      shape="square"
      content="icon"
      icon={semanticIcons.jobSeries}
      size={size}
      className={className}
      addOn={dotColor ? "statusDot" : "none"}
      statusDotColor={dotColor}
    />
  );
}
