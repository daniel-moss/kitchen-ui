import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarTaxRateProps, AvatarTaxRateStatus } from "./AvatarTaxRate.types";

// Status → the statusDot color (Figma 2026-09-16: dots replaced the corner
// status icons on every pricebook avatar).
const DOT_COLOR: Record<Exclude<AvatarTaxRateStatus, "none">, string> = {
  active: "var(--jade-a9)",
  review: "var(--amber-a9)",
  inactive: "var(--gray-a9)",
};

// Avatar template for a Tax Rate: an object/icon avatar with the `tax-rate`
// semantic icon (percent since 2026-09-16), and a status shown as a colored
// statusDot.
export default function AvatarTaxRate({ size = "md", status = "none", className }: AvatarTaxRateProps) {
  const dotColor = status === "none" ? undefined : DOT_COLOR[status];

  return (
    <Avatar
      shape="square"
      content="icon"
      icon={semanticIcons.taxRate}
      size={size}
      className={className}
      addOn={dotColor ? "statusDot" : "none"}
      statusDotColor={dotColor}
    />
  );
}
