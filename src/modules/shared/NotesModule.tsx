import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import IconButton from "../../components/IconButton/IconButton";
import { SkeletonTypography } from "../../components/SkeletonTypography/SkeletonTypography";

import { copyText } from "./helpers";

import styles from "./NotesModule.module.scss";

// The "Notes" display module. Free text in body/400 spacious, with copy and
// edit buttons in the header; editing opens the shared TextArea dialog.
//
// SHARED since 2026-09-28 (promoted out of the Equipment side panel): the
// Warranty side panel draws exactly the same module (Figma 21869-14040 there,
// 17192-115394 in the Equipment panel) — same title, same two header buttons,
// same "No notes here yet" empty state, same four skeleton lines while
// loading. One build, so the two panels cannot drift.

interface NotesModuleProps {
  notes?: string;
  onEdit: () => void;
  isLoading?: boolean;
}

export default function NotesModule({ notes, onEdit, isLoading = false }: NotesModuleProps) {
  const hasNotes = notes != null && notes.trim() !== "";

  const content = isLoading ? (
    <>
      {[0, 1, 2, 3].map((line) => (
        <SkeletonTypography key={line} variant="bodySpacious" />
      ))}
    </>
  ) : hasNotes ? (
    <p className={styles.notes}>{notes}</p>
  ) : (
    <EmptyState caption="No notes here yet" />
  );

  return (
    <DisplayModule
      title="Notes"
      slotRight={
        isLoading ? undefined : (
          <>
            {/* Nothing to copy, no button — HIDDEN, not disabled (Daniel,
                2026-09-28): a disabled control offers an action that does not
                exist here. The Warranty panel's Empty node agrees — its header
                right slot holds ONE button (qty=1, the pen). */}
            {hasNotes && (
              <IconButton icon="copy" variant="ghost" size="md" aria-label="Copy notes" onClick={() => copyText(notes!, "Notes")} />
            )}
            <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit notes" onClick={onEdit} />
          </>
        )
      }
      bodyPadded={isLoading || hasNotes}
      content={content}
    />
  );
}
