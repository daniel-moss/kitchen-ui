import clsx from "clsx";

import Button from "../../components/Button/Button";
import { Divider } from "../../components/Divider/Divider";

import { HiddenBarGroupProps, HiddenBarProps } from "./HiddenBar.types";

import styles from "./HiddenBar.module.scss";

/**
 * One "N objects hidden by X" sentence, optionally followed by the button that
 * undoes the hiding.
 */
export const HiddenBarGroup = ({ children, action, className }: HiddenBarGroupProps) => (
  <span className={clsx(styles.group, className)}>
    <p className={styles.text}>{children}</p>
    {action && (
      <Button variant="ghost" size="sm" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </span>
);

/**
 * The strip that tells the user some rows are not on screen and offers the way
 * back. Built for the object lists' "N jobs hidden by filters" bar and reused
 * by the Equipment side panel's History tab ("N objects hidden by filter" +
 * "Show objects").
 *
 * It renders nothing on its own — the caller decides when there is something
 * hidden and writes the sentence, because the noun and the mechanism differ
 * per list.
 */
export default function HiddenBar({ children, divider = true, className }: HiddenBarProps) {
  return (
    <div className={clsx(styles.root, className)}>
      {divider && <Divider contrast="medium" />}
      <div className={styles.row}>{children}</div>
    </div>
  );
}
