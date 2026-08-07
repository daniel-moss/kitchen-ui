import ActivityLog from "../../../../components/ActivityLog/ActivityLog";
import ActivityLogItem from "../../../../components/ActivityLog/ActivityLogItem";
import DisplayModule from "../../../../components/DisplayModule/DisplayModule";
import GroupLabel from "../../../../components/GroupLabel/GroupLabel";
import ItemGroup from "../../../../components/ItemGroup/ItemGroup";

import { formatSpan, periodSec, stretchLabel } from "../lifecycleData";
import { LifecycleConceptProps, SectionTitle, StatusGlyph, TopData } from "../shared";

import styles from "../Concept.module.scss";

// CONCEPT 3 — one ItemGroup ACCORDION per status (Figma 24559-131861). Each
// status is its own group: a primary GroupLabel header carrying the status
// glyph, the name and the total after a bullet dot, with a Divider between
// groups. Opening a group reveals its stretches as ActivityLog rows — here the
// row's TEXT is the date range and its right label is that stretch's length
// (Concept 1 puts them the other way round).
//
// Unlike Concept 1 there is no single collapse for the whole list: each status
// opens on its own.
export default function Concept3({
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

          <div className={styles.section}>
            <SectionTitle>Statuses</SectionTitle>
            <div className={styles.groupStack}>
              {breakdown.map((row, index) => (
                <ItemGroup
                  key={row.key}
                  accordion
                  // The first group opens by default so the shape is visible;
                  // `defaultOpen` opens every one at once.
                  defaultOpen={defaultOpen || index === 1}
                  divider={index < breakdown.length - 1}
                  label={
                    <GroupLabel
                      variant="primary"
                      slotLeft={<StatusGlyph row={row} />}
                      label={row.label}
                      caption={formatSpan(row.totalSec)}
                    />
                  }
                >
                  <div className={styles.subLogs}>
                    <ActivityLog>
                      {row.periods.map((p, i) => (
                        <ActivityLogItem
                          key={`${p.start}-${i}`}
                          symbol={<StatusGlyph row={row} />}
                          text={stretchLabel(p)}
                          label={formatSpan(periodSec(p))}
                          tooltipLabel=""
                        />
                      ))}
                    </ActivityLog>
                  </div>
                </ItemGroup>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
}
