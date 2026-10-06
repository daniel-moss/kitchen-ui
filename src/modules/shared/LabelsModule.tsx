import Badge from "../../components/Badge/Badge";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import IconButton from "../../components/IconButton/IconButton";

import styles from "./LabelsModule.module.scss";

// The "Labels" display module: a wrapping row of badges, or the caption-only
// empty state. Editing opens the shared Labels select list.
//
// SHARED since 2026-10-05 (promoted out of the Equipment side panel, where it
// was Figma 17192-115371). Three panels drew the same module from two separate
// builds — Equipment, Job Details and now Tax rate (Figma 1-7298) — and the
// badge SIZE had already drifted: Equipment used md while Job Details and the
// Tax rate node use lg. Daniel settled it on lg for all of them, so that is
// the default here and the Equipment panel moved with it.

interface LabelsModuleProps {
  /** The labels, by name. */
  labels: string[];
  onEdit: () => void;
  isLoading?: boolean;
  /** The module title. Default "Labels". */
  title?: string;
  /** The empty-state caption. Default "No labels here yet". */
  emptyCaption?: string;
  /**
   * False HIDES the edit button — the record is read-only, or the user lacks
   * the permission. Default true. (A disabled control would offer an action
   * that does not exist; Daniel, 2026-09-28.)
   */
  canEdit?: boolean;
}

/**
 * Loading (node 22012-19762): THREE real Badges in their own loading state —
 * the bordered chip with a SkeletonTypography label — not plain skeleton bars.
 */
const LOADING_BADGES = 3;

export default function LabelsModule({
  labels,
  onEdit,
  isLoading = false,
  title = "Labels",
  emptyCaption = "No labels here yet",
  canEdit = true,
}: LabelsModuleProps) {
  const content = isLoading ? (
    <div className={styles.badgeRow}>
      {Array.from({ length: LOADING_BADGES }, (unused, index) => (
        <Badge key={index} size="lg" isLoading />
      ))}
    </div>
  ) : labels.length === 0 ? (
    <EmptyState caption={emptyCaption} />
  ) : (
    <div className={styles.badgeRow}>
      {labels.map((label) => (
        <Badge key={label} size="lg">
          {label}
        </Badge>
      ))}
    </div>
  );

  return (
    <DisplayModule
      title={title}
      slotRight={
        isLoading || !canEdit ? undefined : <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit labels" onClick={onEdit} />
      }
      // An empty module's body is only an EmptyState, whose own 32px padding
      // is the whole padding (the Files module's rule). The badge row — real
      // labels or loading ones — keeps the body's 16px.
      bodyPadded={isLoading || labels.length > 0}
      content={content}
    />
  );
}
