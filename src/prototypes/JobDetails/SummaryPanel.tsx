import { useCallback, useEffect, useRef, useState } from "react";

import Button from "../../components/Button/Button";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import IconButton from "../../components/IconButton/IconButton";
import TabGroup from "../../components/Tabs/TabGroup";
import TabItem from "../../components/Tabs/TabItem";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";

import ChargesTab from "./ChargesTab";
import { Equipment } from "./equipment";
import FormsModule, { FormsLog } from "./FormsModule";
import NotesForm from "./NotesForm";
import SignatureModule, { SignatureData, SignatureResult, SignatureState } from "./SignatureModule";
import WorkSummaryForm from "./WorkSummaryForm";
import useSummaryGenerator from "./summaryGenerator";

import styles from "./SummaryPanel.module.scss";

// ---- module header button --------------------------------------------------

const EditButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <HoverTooltip text={label}>
    <IconButton icon="pen" variant="ghost" size="md" aria-label={label} onClick={onClick} />
  </HoverTooltip>
);

// The Signature module is filled by the COMPLETE-JOB flow: signing the pad
// gives the `collected` state, "Skip and complete" the `skipped` one with its
// reason. Until the job is completed there is nothing to show (Daniel,
// 2026-08-07 — it used to be pinned to "Not collected", which is why signing
// never reached the module).
const signatureView = (result?: SignatureResult): { state: SignatureState; data?: SignatureData } => {
  if (result == null) return { state: "notCollected" };
  if (result.state === "collected") {
    return { state: "collected", data: { signedBy: result.signedBy, date: result.date, ink: result.ink } };
  }
  return { state: "skipped", data: { signedBy: "", date: result.date, skipReason: result.skipReason } };
};

// The "Summary" tab (Figma 23824-25409): a segmented Tech work / Charges /
// Signature control. Tech work holds the Forms, Work summary and Notes-to-
// dispatcher modules.
export default function SummaryPanel({
  mobile = false,
  jobEquipment = [],
  signature,
  onFormsLog,
  onTextLog,
}: {
  mobile?: boolean;
  /** The job's live Equipment-module list — the Service call form reads it. */
  jobEquipment?: Equipment[];
  /**
   * What the Complete-job flow collected. Without it the module reads
   * "Not collected" — completing the job is the only thing that fills it
   * (Daniel, 2026-08-07).
   */
  signature?: SignatureResult;
  /** One Activity log per Forms-module change (Figma 24592-40934). */
  onFormsLog?: (log: FormsLog) => void;
  /**
   * Work summary / Notes to dispatcher(s) edits. Both are single TextArea
   * properties, so they take the general update-log shape (Figma 24489-50029):
   * "{user} updated {property}" over the old → new diff.
   */
  onTextLog?: (property: string, oldValue: string, newValue: string) => void;
}) {
  const [sub, setSub] = useState("tech-work");

  // ---- Work summary (Figma 21833-91131) ----
  const [summary, setSummary] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  // Which forms revision the current summary was written from, and where the
  // forms are now. Different → the "Forms updated" banner.
  const [summaryRevision, setSummaryRevision] = useState(0);
  const [formsRevision, setFormsRevision] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  // Generate from the module's own empty state — it writes straight into the
  // saved summary (there is no field to type into here).
  const inlineGen = useSummaryGenerator(setSummary);

  // ---- Notes to dispatcher(s) (Figma 21820-59549) ----
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);

  const [formsDone, setFormsDone] = useState({ all: false, any: false });

  // FormsModule reports through effects — a new function identity every render
  // would make it report in a loop.
  const handleFormsRevision = useCallback((revision: number) => setFormsRevision(revision), []);

  // Saving (from the form or the inline Generate) marks the summary current.
  const acceptSummary = (text: string) => {
    if (text !== summary) onTextLog?.("Work summary", summary, text);
    setSummary(text);
    setSummaryRevision(formsRevision);
    setBannerDismissed(false);
  };

  // Generating writes straight into the saved summary, one character per tick.
  // So the log cannot be written per write — the text before the run is kept
  // here and logged once, when the typewriter finishes (phase back to idle).
  const genFrom = useRef<string | null>(null);
  const generateInline = () => {
    genFrom.current = summary;
    inlineGen.generate();
    setSummaryRevision(formsRevision);
    setBannerDismissed(false);
  };
  useEffect(() => {
    if (inlineGen.phase !== "idle" || genFrom.current == null) return;
    const before = genFrom.current;
    genFrom.current = null;
    if (before !== summary) onTextLog?.("Work summary", before, summary);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inlineGen.phase]);

  // The forms moved on after the summary was written (Figma 24268-68841).
  const formsMovedOn = summary !== "" && formsRevision !== summaryRevision && !bannerDismissed;

  // The four Work summary bodies (Figma 21833-91133 / 23866-10982 /
  // 23867-11398 / 24268-68842).
  const summaryBody =
    summary !== "" ? (
      <p className={styles.paragraph}>{summary}</p>
    ) : formsDone.any ? (
      // ONE completed form is enough to generate from (Daniel, 2026-08-07).
      <div className={styles.generateBody}>
        <Button
          variant="subtle"
          size="lg"
          leftIcon="wand-magic-sparkles"
          isDisabled={inlineGen.busy}
          isProcessing={inlineGen.phase === "thinking"}
          onClick={generateInline}
        >
          Generate
        </Button>
        <p className={styles.generateCaption}>Roopairs will write summary based on completed forms</p>
      </div>
    ) : (
      // At least one form is not completed → generation is not offered.
      <EmptyState caption="Complete the forms to enable AI generation or fill out manually" />
    );

  return (
    <div className={styles.panel}>
      <TabGroup variant="contained" size="lg" isFullWidth value={sub} onChange={setSub}>
        <TabItem value="tech-work">Tech work</TabItem>
        <TabItem value="charges">Charges</TabItem>
        <TabItem value="signature">Signature</TabItem>
      </TabGroup>

      {sub === "charges" ? (
        <ChargesTab mobile={mobile} />
      ) : sub === "signature" ? (
        <SignatureModule {...signatureView(signature)} />
      ) : (
        <>
          {/* Forms (Figma 21816-30805) — the full module: Public/Private
              groups, per-state rows + menus, rename/duplicate/visibility
              flows, and the Add-forms select list. */}
          <FormsModule
            mobile={mobile}
            jobEquipment={jobEquipment}
            onCompletionChange={setFormsDone}
            onFormsRevision={handleFormsRevision}
            onLog={onFormsLog}
          />

          {/* Work summary — 4 states (filled / generate / incomplete forms /
              forms updated). The pencil always opens the edit form. */}
          <DisplayModule
            title="Work summary"
            slotRight={<EditButton label="Edit" onClick={() => setSummaryOpen(true)} />}
            status={formsMovedOn ? "warning" : "none"}
            banner={
              formsMovedOn
                ? {
                    children: "Forms updated. Update the summary?",
                    ctaLabel: "Update",
                    ctaIcon: "wand-magic-sparkles",
                    ctaOnClick: generateInline,
                    onDismiss: () => setBannerDismissed(true),
                  }
                : undefined
            }
            // Only the saved paragraph uses the module's 16px body padding —
            // the Generate block and the EmptyState bring their own.
            bodyPadded={summary !== ""}
            content={summaryBody}
          />

          {/* Notes to dispatcher(s) — filled paragraph or the empty state.
              The pencil opens the edit form in both (Figma, 2026-08-06). */}
          <DisplayModule
            title="Notes to dispatcher(s)"
            slotRight={<EditButton label="Edit" onClick={() => setNotesOpen(true)} />}
            bodyPadded={notes !== ""}
            content={notes !== "" ? <p className={styles.paragraph}>{notes}</p> : <EmptyState caption="No notes here yet" />}
          />

          <WorkSummaryForm
            open={summaryOpen}
            onClose={() => setSummaryOpen(false)}
            value={summary}
            onSave={acceptSummary}
            canGenerate={formsDone.any}
            mobile={mobile}
          />
          <NotesForm
            open={notesOpen}
            onClose={() => setNotesOpen(false)}
            value={notes}
            onSave={(next) => {
              if (next !== notes) onTextLog?.("Notes to dispatcher(s)", notes, next);
              setNotes(next);
            }}
            mobile={mobile}
          />
        </>
      )}
    </div>
  );
}
