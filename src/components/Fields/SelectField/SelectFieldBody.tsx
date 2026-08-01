import clsx from "clsx";

import styles from "./SelectFieldBody.module.scss";
import { SelectFieldBodyProps } from "./SelectFieldBody.types";

// SelectFieldBody — the inner content row of a SelectField: an optional left
// slot (icon / user avatar), the value (truncates), and an optional right suffix
// text. The field chrome (border, chevron, sizes, states) lives on SelectField.
// See Figma "SelectField › Body".
export default function SelectFieldBody({ value, slotLeft, suffix, className, ...rest }: SelectFieldBodyProps) {
  return (
    <div className={clsx(styles.body, className)} {...rest}>
      {slotLeft != null && <span className={styles.slotLeft}>{slotLeft}</span>}
      <span className={styles.value}>{value}</span>
      {suffix != null && <span className={styles.suffix}>{suffix}</span>}
    </div>
  );
}
