import ActivityLog from "../../../../components/ActivityLog/ActivityLog";
import ActivityLogItem from "../../../../components/ActivityLog/ActivityLogItem";
import DisplayModule from "../../../../components/DisplayModule/DisplayModule";
import ItemGroup from "../../../../components/ItemGroup/ItemGroup";
import ListItem from "../../../../components/ListItem/ListItem";
import ListItemTextRight from "../../../../components/ListItem/ListItemTextRight";

import { formatSpan, periodSec, stretchLabel } from "../lifecycleData";
import { LifecycleConceptProps, SectionTitle, StatusAvatar, StatusGlyph, TopData } from "../shared";

import styles from "../Concept.module.scss";

// CONCEPT 4 — one ItemGroup of ACCORDION ListItems (Figma 24558-129868). Each
// status is a 60px row: a caret on the left, the status glyph on a tinted
// 36px avatar, the status name, and the total on the right. Opening a row
// reveals its stretches as ActivityLog rows, like Concept 3.
//
// Against Concept 3 this trades the group headers for ordinary list rows, so
// the seven statuses read as one list instead of seven sections.
export default function Concept4({
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
            <ItemGroup>
              {breakdown.map((row, index) => (
                <ListItem
                  key={row.key}
                  isAccordion
                  // The second row opens by default so the shape is visible;
                  // `defaultOpen` opens every one at once.
                  defaultOpen={defaultOpen || index === 1}
                  variant="title"
                  title={row.label}
                  avatar={<StatusAvatar row={row} />}
                  slotRight={<ListItemTextRight title={formatSpan(row.totalSec)} />}
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
                </ListItem>
              ))}
            </ItemGroup>
          </div>
        </div>
      }
    />
  );
}
