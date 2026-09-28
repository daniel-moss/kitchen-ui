import Badge from "../../../components/Badge/Badge";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import EmptyState from "../../../components/EmptyState/EmptyState";
import IconButton from "../../../components/IconButton/IconButton";
import { Skeleton } from "../../../components/Skeleton/Skeleton";

import styles from "../EquipmentPanel.module.scss";

// The "Labels" module (Figma 17192-115371). A wrapping row of md badges, or
// the caption-only empty state. Editing opens the shared Labels select list.

interface LabelsModuleProps {
  labels: string[];
  onEdit: () => void;
  isLoading?: boolean;
}

/** The Loading frame draws four badge-shaped bars of mixed width. */
const SKELETON_WIDTHS = [63, 94, 102, 117];

export default function LabelsModule({ labels, onEdit, isLoading = false }: LabelsModuleProps) {
  const content = isLoading ? (
    <div className={styles.badgeRow}>
      {SKELETON_WIDTHS.map((width) => (
        <Skeleton key={width} width={width} height={28} borderRadius="var(--border-radius-1_5)" />
      ))}
    </div>
  ) : labels.length === 0 ? (
    <EmptyState caption="No labels here yet" />
  ) : (
    <div className={styles.badgeRow}>
      {labels.map((label) => (
        <Badge key={label}>{label}</Badge>
      ))}
    </div>
  );

  return (
    <DisplayModule
      title="Labels"
      slotRight={isLoading ? undefined : <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit labels" onClick={onEdit} />}
      // An empty module's body is only an EmptyState, whose own 32px padding
      // is the whole padding (the Files module's rule).
      bodyPadded={!isLoading && labels.length > 0}
      content={content}
    />
  );
}
