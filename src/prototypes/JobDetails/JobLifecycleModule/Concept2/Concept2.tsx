import ActivityLogGroup from "../../../../components/ActivityLog/ActivityLogGroup";
import ActivityLogItem from "../../../../components/ActivityLog/ActivityLogItem";
import { Divider } from "../../../../components/Divider/Divider";
import DisplayModule from "../../../../components/DisplayModule/DisplayModule";

import { formatSpan } from "../lifecycleData";
import { LifecycleConceptProps, StatusGlyph, TopData } from "../shared";

import styles from "../Concept.module.scss";

// CONCEPT 2 — Concept 1 with the rows FLATTENED (Daniel, 2026-08-07). Same
// ActivityLog timeline and the same one row per status, but a status does not
// open: there are no sub-logs and no carets, so the module only ever answers
// "how long in each status", never "in which stretches".
//
// The "Statuses break down" group label still collapses the whole list.
export default function Concept2({
  billableSec,
  lifecycleSec,
  breakdown,
  defaultOpen = true,
  mobile = false,
}: LifecycleConceptProps) {
  return (
    <DisplayModule
      variant="bodyOnly"
      bodyPadded={false}
      content={
        <div className={styles.body}>
          <TopData billableSec={billableSec} lifecycleSec={lifecycleSec} mobile={mobile} />
          <Divider />
          <div className={styles.logBody}>
            <ActivityLogGroup label="Statuses break down" defaultOpen={defaultOpen}>
              {breakdown.map((row) => (
                // No children ⇒ ActivityLogItem renders no accordion / caret.
                <ActivityLogItem
                  key={row.key}
                  symbol={<StatusGlyph row={row} />}
                  text={row.label}
                  label={formatSpan(row.totalSec)}
                  tooltipLabel=""
                />
              ))}
            </ActivityLogGroup>
          </div>
        </div>
      }
    />
  );
}
