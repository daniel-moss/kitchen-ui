import DisplayModule from "../../components/DisplayModule/DisplayModule";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import ListItem from "../../components/ListItem/ListItem";
import ListItemTextRight from "../../components/ListItem/ListItemTextRight";

import { formatSpan, momentLabel, periodSec, stretchLabel, toEvents } from "./lifecycleData";
import { LifecycleConceptProps, SectionTitle, StatusAvatar, TopData } from "./shared";

import styles from "./Concept.module.scss";

/** How many rows show before the "Show N more" button (ItemGroup truncation). */
const VISIBLE_ROWS = 5;

// CONCEPT 5 — the CHRONOLOGICAL break-down (Figma 24556-122708). The one
// concept that does not aggregate: it lists every stretch in the order the job
// actually moved through them, so a status that was entered twice appears
// twice. Each 60px row is the status glyph + name, the date range as its
// caption, and that stretch's length on the right.
//
// A TERMINAL event ("Finalized") is a moment, not a span: it shows one
// timestamp and no duration.
//
// The list uses ItemGroup's built-in truncation, so a long history collapses
// behind "Show N more" instead of running the module down the page.
export default function Concept5({
  billableSec,
  lifecycleSec,
  breakdown,
  defaultOpen = true,
  mobile = false,
}: LifecycleConceptProps) {
  const events = toEvents(breakdown);

  return (
    <DisplayModule
      variant="bodyOnly"
      bodyPadded={false}
      content={
        <div className={styles.body}>
          <TopData billableSec={billableSec} lifecycleSec={lifecycleSec} mobile={mobile} />

          <div className={styles.section}>
            <SectionTitle>Break down</SectionTitle>
            <ItemGroup truncateAfter={defaultOpen ? undefined : VISIBLE_ROWS}>
              {events.map((event) => (
                <ListItem
                  key={event.id}
                  variant="titleCaption"
                  title={event.label}
                  caption={event.terminal ? momentLabel(event.period.start) : stretchLabel(event.period)}
                  avatar={<StatusAvatar row={event} />}
                  slotRight={
                    event.terminal ? undefined : <ListItemTextRight title={formatSpan(periodSec(event.period))} />
                  }
                />
              ))}
            </ItemGroup>
          </div>
        </div>
      }
    />
  );
}
