import { ReactNode } from "react";
import clsx from "clsx";

import DisplayModule from "../../components/DisplayModule/DisplayModule";

import styles from "./StatWidget.module.scss";

// The stat widget shared by the Timesheet and Activity tabs (Figma names it
// "DisplayModule"): a bodyOnly module holding label (Regular 14/20 subtle) +
// value (Medium 32/40) + sub (Regular 13/20). Empty → value + sub read
// placeholder. `bodyPadded={false}` because the Figma body is px-16 py-12, not
// the module's default 16px.

/** The widgets row: side by side on desktop, stacked on mobile. */
export const StatWidgetRow = ({ mobile = false, children }: { mobile?: boolean; children: ReactNode }) => (
  <div className={clsx(styles.widgets, mobile && styles.widgetsMobile)}>{children}</div>
);

export const StatWidget = ({ label, value, sub, empty = false }: { label: string; value: string; sub: string; empty?: boolean }) => (
  <DisplayModule
    variant="bodyOnly"
    bodyPadded={false}
    className={styles.widget}
    content={
      <div className={styles.widgetBody}>
        <span className={styles.widgetLabel}>{label}</span>
        <div className={clsx(styles.widgetValueBlock, empty && styles.widgetValueBlockEmpty)}>
          <span className={styles.widgetValue}>{value}</span>
          <span className={styles.widgetSub}>{sub}</span>
        </div>
      </div>
    }
  />
);

export default StatWidget;
