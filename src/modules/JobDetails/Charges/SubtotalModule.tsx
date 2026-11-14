import DisplayModule from "../../../components/DisplayModule/DisplayModule";

import { formatAmount } from "./lineDisplay";

import styles from "./SubtotalModule.module.scss";

// The body-only module under the four charge types (Figma 28284-40944, kept by
// Daniel 2026-11-13): the subtotal before tax. Discounts can take it below zero.
export default function SubtotalModule({ subtotal }: { subtotal: number }) {
  return (
    <DisplayModule
      variant="bodyOnly"
      bodyPadded={false}
      content={
        <div className={styles.footer}>
          <span className={styles.footerLabel}>Subtotal (before tax)</span>
          <span className={styles.footerValue}>{formatAmount(subtotal)}</span>
        </div>
      }
    />
  );
}
