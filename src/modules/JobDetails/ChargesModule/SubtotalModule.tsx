import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import { formatCurrency } from "../../../app/listData";

import styles from "./SubtotalModule.module.scss";

// The body-only module under the charge types (Concepts 2, 3 and 4; Figma
// 28284-40944): the subtotal before tax. Discounts can take it below zero.
export default function SubtotalModule({ subtotal }: { subtotal: number }) {
  return (
    <DisplayModule
      variant="bodyOnly"
      bodyPadded={false}
      content={
        <div className={styles.footer}>
          <span className={styles.footerLabel}>Subtotal (before tax)</span>
          <span className={styles.footerValue}>{formatCurrency(subtotal)}</span>
        </div>
      }
    />
  );
}
