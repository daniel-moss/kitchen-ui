import clsx from "clsx";

import styles from "./Icon.module.scss";
import { IconPack, IconProps } from "./Icon.types";

const PACK_CLASS: Record<IconPack, string | undefined> = {
  regular: undefined,
  solid: styles.solid,
  brand: styles.brand,
  custom: styles.custom,
  "custom-duotone": styles.customDuotone,
};

export function Icon({
  icon,
  size = 14,
  pack = "regular",
  container = "fixedHeight",
  spin = false,
  rotate,
  isLoading = false,
  className,
  style,
  ...rest
}: IconProps) {
  // Square side: size + 2px up to 16, size + 4px from 18 (Kitchen UI sizing rule).
  const squareSide = size <= 16 ? size + 2 : size + 4;

  return (
    <i
      className={clsx(
        styles.base,
        // Loading: a filled "circle" placeholder; force solid so it is a disc.
        isLoading ? "g-circle" : `g-${icon}`,
        isLoading ? styles.solid : PACK_CLASS[pack],
        styles[container],
        { [styles.spin]: spin && !isLoading, [styles.loading]: isLoading },
        className
      )}
      style={{
        fontSize: size,
        height: container === "square" ? squareSide : size,
        ...(container === "square" && { width: squareSide }),
        ...(rotate ? { transform: `rotate(${rotate}deg)` } : {}),
        // caller styles merge on top of the computed sizing
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    />
  );
}
