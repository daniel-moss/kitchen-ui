import { useEffect, useState } from "react";

import clsx from "clsx";

import AvatarGroup from "../Avatar/AvatarGroup";

import styles from "./Tooltip.module.scss";
import { TooltipProps } from "./Tooltip.types";

// The tooltip body/tongue use the OPPOSITE theme (dark chip on a light UI, light
// chip on a dark UI). We invert by applying the opposite theme class to the body
// subtree, which re-declares the whole scale for it. The ambient theme is read
// from the document root (set by the Storybook theme toolbar / app).
function useAmbientDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setDark(el.classList.contains("dark") || el.classList.contains("dark-theme"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

// A tooltip chip: an inverted body with a tongue (arrow). Positioning against a
// trigger is the consumer's job. (See tooltip.md.)
export default function Tooltip({
  placement = "top",
  align = "center",
  variant = "text",
  text = "Text",
  textAlign = "center",
  items = [],
  avatarGroupSize = "xs",
  children,
  maxWidth = 240,
  className,
}: TooltipProps) {
  const ambientDark = useAmbientDark();
  // Opposite of the ambient theme (a real global class that re-declares the scale).
  const invertClass = ambientDark ? "light-theme" : "dark";

  // The root stays in the ambient theme so its drop-shadow follows normal mode.
  return (
    <div className={clsx(styles.tooltip, className)}>
      <div
        className={clsx(invertClass, styles.body, styles[placement], styles[align], {
          [styles.avatar]: variant === "avatarGroup",
          [styles.textLeft]: variant === "text" && textAlign === "left",
        })}
        style={{ maxWidth }}
      >
        {variant === "text" && text}
        {variant === "avatarGroup" && <AvatarGroup variation="stack" size={avatarGroupSize} items={items} />}
        {variant === "slot" && children}

        <span className={styles.arrow} aria-hidden="true" />
      </div>
    </div>
  );
}
