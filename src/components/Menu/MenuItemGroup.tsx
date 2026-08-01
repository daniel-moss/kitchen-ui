import clsx from "clsx";

import { Divider } from "../Divider/Divider";

import styles from "./MenuItemGroup.module.scss";
import { MenuItemGroupProps } from "./MenuItemGroup.types";

// MenuItemGroup — groups MenuItems inside a menu: the items stack (4px
// padding) and an optional bottom divider (16px inset) separating it from the
// next group. See Figma "MenuItemGroup".
export default function MenuItemGroup({ children, divider = false, className, ...rest }: MenuItemGroupProps) {
  return (
    <div role="group" className={clsx(styles.group, className)} {...rest}>
      <div className={styles.items}>{children}</div>
      {divider && (
        <div className={styles.dividerWrap}>
          <Divider />
        </div>
      )}
    </div>
  );
}
