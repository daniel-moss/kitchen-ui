import clsx from "clsx";

import { Icon } from "../../../components/Icon/Icon";
import { IconSize } from "../../../components/Icon/Icon.types";
import HintTrigger from "../../../components/Hint/HintTrigger";
import HoverHint from "../../../components/Hint/HoverHint";

import { formatHighlight, formatLifecycle, LifecycleRow } from "./lifecycleData";

import styles from "./shared.module.scss";

// The parts every "Job lifecycle" concept shares: the two highlight numbers on
// top, the section title under them, and the status glyphs. Only the list
// BELOW the highlights differs between concepts.

/** Props every concept takes, so any of them can be dropped into the job. */
export interface LifecycleConceptProps {
  /** Seconds the job has spent in "Active" — the Billable time highlight. */
  billableSec: number;
  /** Seconds from the job's creation until it ended (or now). */
  lifecycleSec: number;
  /** Every status the job entered, in the designed order. */
  breakdown: LifecycleRow[];
  /** Start with the list collapsed / truncated (the Figma variant). */
  defaultOpen?: boolean;
  mobile?: boolean;
}

/**
 * One "Value" box of the Top Data row. An empty value ("0 min") is written in
 * the placeholder color (Figma "Billable Time" 24575-150179).
 */
const Highlight = ({ title, value }: { title: string; value: string }) => (
  <div className={styles.value}>
    <span className={styles.valueTitle}>{title}</span>
    <span className={clsx(styles.valueNumber, value === "0 min" && styles.valueEmpty)}>{value}</span>
  </div>
);

/** The two highlight numbers — identical in every concept. */
export const TopData = ({
  billableSec,
  lifecycleSec,
  mobile,
}: {
  billableSec: number;
  lifecycleSec: number;
  mobile?: boolean;
}) => (
  <div className={clsx(styles.highlights, mobile && styles.stacked)}>
    <Highlight title="Billable time" value={formatHighlight(billableSec)} />
    <Highlight title="Lifecycle time" value={formatLifecycle(lifecycleSec)} />
  </div>
);

/** The hint the section titles carry (my copy — the nodes show the trigger
 *  with no bubble content). */
const SECTION_HINT = "How long the job has spent in each of its statuses.";

/** A section title over the list ("Statuses" / "Break down"), with its hint. */
export const SectionTitle = ({ children, hint = true }: { children: string; hint?: boolean }) => (
  <div className={styles.sectionTitle}>
    <span>{children}</span>
    {hint && (
      <HoverHint caption={SECTION_HINT} width={375}>
        <HintTrigger />
      </HoverHint>
    )}
  </div>
);

/**
 * A status glyph, 14px solid in its status color. "Upcoming" is the
 * half-stroke circle turned so its fill sits on the RIGHT.
 */
export const StatusGlyph = ({
  row,
  size = 14,
}: {
  row: Pick<LifecycleRow, "icon" | "color" | "rotate">;
  size?: IconSize;
}) => (
  <span className={clsx(styles.glyph, row.rotate && styles.rotated)} style={{ color: row.color }}>
    <Icon icon={row.icon} pack="solid" size={size} />
  </span>
);

/**
 * The 36px avatar the ListItem concepts use: the status glyph on a tinted
 * square. The tint is the glyph's own color at low opacity, so one rule
 * covers every status (the same shape FormAvatar uses for form states).
 */
export const StatusAvatar = ({ row }: { row: Pick<LifecycleRow, "icon" | "color" | "rotate"> }) => (
  <span className={styles.avatar} style={{ color: row.color }}>
    <span className={clsx(styles.avatarTint, row.rotate && styles.rotated)}>
      <Icon icon={row.icon} pack="solid" size={16} />
    </span>
  </span>
);
