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
//
// The title and its empty copy became PROPS on 2026-10-05, when the Tax rate
// panel drew the same module TWICE with different names — "Description"
// (renamed from "Summary template" 2026-10-07) and "Internal notes" (Figma
// 1-7357 and 1-7382). The defaults are the Equipment / Warranty wording, so
// neither panel changed.

interface NotesModuleProps {
  notes?: string;
  onEdit: () => void;
  isLoading?: boolean;
  /** The module title. Default "Notes". */
  title?: string;
  /**
   * The empty-state caption. Default "No notes here yet" — follow the same
   * shape when overriding it ("No description here yet").
   */
  emptyCaption?: string;
  /**
   * What the copy toast and the two aria-labels call this text. Defaults to
   * `title`, which is what both panels want.
   */
  copyLabel?: string;
  /**
   * False HIDES the edit button, keeping Copy — the record is read-only (the
   * Tax rate panel's inactive state: "Reactivate to edit details"), or the user
   * lacks the permission. Reading is not editing. Default true.
   */
  canEdit?: boolean;
}

export default function NotesModule({
  notes,
  onEdit,
  isLoading = false,
  title = "Notes",
  emptyCaption = "No notes here yet",
  copyLabel,
  canEdit = true,
}: NotesModuleProps) {
  const hasNotes = notes != null && notes.trim() !== "";
  const label = copyLabel ?? title;

  const content = isLoading ? (
    <>
      {[0, 1, 2, 3].map((line) => (
        <SkeletonTypography key={line} variant="bodySpacious" />
      ))}
    </>
  ) : hasNotes ? (
    <p className={styles.notes}>{notes}</p>
  ) : (
    <EmptyState caption={emptyCaption} />
  );

  return (
    <DisplayModule
      title={title}
      slotRight={
        isLoading ? undefined : (
          <>
            {/* Nothing to copy, no button — HIDDEN, not disabled (Daniel,
                2026-09-28): a disabled control offers an action that does not
                exist here. The Warranty panel's Empty node agrees — its header
                right slot holds ONE button (qty=1, the pen). */}
            {hasNotes && (
              <IconButton
                icon="copy"
                variant="ghost"
                size="md"
                aria-label={`Copy ${label.toLowerCase()}`}
                onClick={() => copyText(notes!, label)}
              />
            )}
            {canEdit && (
              <IconButton icon="pen" variant="ghost" size="md" aria-label={`Edit ${label.toLowerCase()}`} onClick={onEdit} />
            )}
          </>
        )
      }
      bodyPadded={isLoading || hasNotes}
      content={content}
    />
  );
}
