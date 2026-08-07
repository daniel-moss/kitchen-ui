import ActivityLogGroup from "../../../../components/ActivityLog/ActivityLogGroup";
import ActivityLogItem from "../../../../components/ActivityLog/ActivityLogItem";
import ActivityLogSubItem from "../../../../components/ActivityLog/ActivityLogSubItem";
import { Divider } from "../../../../components/Divider/Divider";
import DisplayModule from "../../../../components/DisplayModule/DisplayModule";

import { formatSpan, periodSec, stretchLabel } from "../lifecycleData";
import { LifecycleConceptProps, StatusGlyph, TopData } from "../shared";

import styles from "../Concept.module.scss";

// CONCEPT 1 — the built one (Figma 24560-134494). The break-down is an
// ActivityLog: one accordion row per status on a connected timeline, each
// expanding into its separate stretches. The whole list sits under one
// collapsible "Time in statuses" group label, COLLAPSED by default (Figma
// 24575-146246: "collapsed by default").
//
// This is the concept the Job Details Activity tab uses.
export default function Concept1({
  billableSec,
  lifecycleSec,
  breakdown,
  defaultOpen = false,
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
            <ActivityLogGroup label="Time in statuses" defaultOpen={defaultOpen}>
              {breakdown.map((row) => (
                <ActivityLogItem
                  key={row.key}
                  symbol={<StatusGlyph row={row} />}
                  text={row.label}
                  // The duration sits where a log's timestamp normally does —
                  // it is not a date, so its tooltip is dropped.
                  label={formatSpan(row.totalSec)}
                  tooltipLabel=""
                >
                  {row.periods.map((p, i) => (
                    <ActivityLogSubItem key={`${p.start}-${i}`} title={formatSpan(periodSec(p))} caption={stretchLabel(p)} />
                  ))}
                </ActivityLogItem>
              ))}
            </ActivityLogGroup>
          </div>
        </div>
      }
    />
  );
}
