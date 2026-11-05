import { ReactNode, useEffect, useRef, useState } from "react";

import Button from "../../../../components/Button/Button";
import DisplayModule from "../../../../components/DisplayModule/DisplayModule";
import IconButton from "../../../../components/IconButton/IconButton";
import PopoverFooter from "../../../../components/Popover/PopoverFooter";
import Prompt from "../../../../components/Prompt/Prompt";
import SidePanel from "../../../../components/SidePanel/SidePanel";
import { toast } from "../../../../components/Toast/Toaster";
import ValueDisplayGroup from "../../../../components/ValueDisplay/ValueDisplayGroup";
import type { Job } from "../../../../data/db";
import useIsDesktop, { Breakpoint } from "../../../../hooks/useIsDesktop";
import EditNotesDialog from "../../../shared/EditNotesDialog";
import NotesModule from "../../../shared/NotesModule";
import { AttributionFields, LineFormDialog, scrollToFirstError } from "../LineForms/lineFormParts";
import { AttributionRows } from "../lineDisplay";

// The side panel every charge line type shares (Figma "Job Details" Page — Next
// Update, Concept 3: Labor rate 28009-13182, Product 28009-18064, Other charge
// 28009-26345, Discount 28009-27494): the line's values in four modules, each
// with a pen and its own dialog — General, Pricing, Attribution, Description —
// and a Delete across the footer. General and Pricing differ per type, so a type
// hands them in; Attribution and Description are the same everywhere and live
// here. The inputs are the same as in the one-dialog forms (../LineForms); only
// the grouping changes.

// ---- a module's edit dialog ----------------------------------------------------

export interface SectionFields<V> {
  values: V;
  set: (patch: Partial<V>) => void;
  showErrors: boolean;
  mobile: boolean;
  /** The user typed in Cost since the dialog opened (the Cost help text). */
  costChanged: boolean;
  onCostChanged: () => void;
}

interface LineSectionDialogProps<V> {
  open: boolean;
  onClose: () => void;
  /** "General" / "Pricing" — also what the toast names. */
  title: string;
  /** What the inputs open with. */
  start: () => V;
  /** Only this dialog's own inputs block its Save. */
  isBlocked: (values: V) => boolean;
  onSave: (values: V) => void;
  breakpoint?: Breakpoint;
  children: (fields: SectionFields<V>) => ReactNode;
}

const sameValues = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function LineSectionDialog<V>({ open, onClose, title, start, isBlocked, onSave, breakpoint, children }: LineSectionDialogProps<V>) {
  const mobile = !useIsDesktop(breakpoint ?? "auto");
  const [initial, setInitial] = useState<V>(start);
  const [values, setValues] = useState<V>(initial);
  const [costChanged, setCostChanged] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Every open starts over, from the line as it is now.
  useEffect(() => {
    if (!open) return;
    const next = start();
    setInitial(next);
    setValues(next);
    setCostChanged(false);
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = () => {
    if (isBlocked(values)) {
      setShowErrors(true);
      requestAnimationFrame(() => scrollToFirstError(bodyRef.current));
      return;
    }
    onSave(values);
    toast({ type: "success", title: `"${title}" module updated` });
    onClose();
  };

  return (
    <LineFormDialog
      open={open}
      onClose={onClose}
      title={title}
      isEdit
      dirty={!sameValues(values, initial)}
      onSubmit={save}
      breakpoint={breakpoint}
      bodyRef={bodyRef}
    >
      {children({
        values,
        set: (patch) => setValues((previous) => ({ ...previous, ...patch })),
        showErrors,
        mobile,
        costChanged,
        onCostChanged: () => setCostChanged(true),
      })}
    </LineFormDialog>
  );
}

// ---- deleting a line -----------------------------------------------------------

interface DeleteLinePromptProps {
  open: boolean;
  /** What the prompt and the toast call the line: "labor rate", "product"… */
  noun: string;
  /** The line's name. */
  title: string;
  /** "Delete" was pressed. The toast is this prompt's own. */
  onConfirm: () => void;
  onCancel: () => void;
  breakpoint?: Breakpoint;
}

/** Every line's Delete, in a side panel or on a row: the prompt, then the toast. */
export function DeleteLinePrompt({ open, noun, title, onConfirm, onCancel, breakpoint }: DeleteLinePromptProps) {
  return (
    <Prompt
      open={open}
      title={`Delete ${noun}?`}
      body={`Are you sure you want to delete ${title}?`}
      actionLabel="Delete"
      actionVariant="danger"
      actionIcon="trash-can"
      onAction={() => {
        onConfirm();
        toast({ type: "success", title: `${noun.charAt(0).toUpperCase()}${noun.slice(1)} deleted` });
      }}
      onCancel={onCancel}
      breakpoint={breakpoint}
    />
  );
}

// ---- the panel -----------------------------------------------------------------

interface Attribution {
  equipmentId?: string;
  technicianId?: number;
}

export interface LinePanelProps {
  open: boolean;
  onClose: () => void;
  job: Job;
  /** The line's name. */
  title: string;
  /** A product's "Manufacturer · Part #". */
  caption?: string;
  /** The type's object avatar, xl, no status. */
  avatar: ReactNode;
  /** What Delete's prompt and toast call the line: "labor rate", "product"… */
  noun: string;
  /** The "General" module's rows. */
  general: ReactNode;
  onEditGeneral: () => void;
  /** The "Pricing" module's rows. */
  pricing: ReactNode;
  onEditPricing: () => void;
  equipmentId?: string;
  technicianId?: number;
  onAttributionChange: (attribution: Attribution) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  /** "Delete" was confirmed. */
  onDelete: () => void;
  breakpoint?: Breakpoint;
  /** The type's General and Pricing dialogs. */
  children: ReactNode;
}

export default function LinePanel({
  open,
  onClose,
  job,
  title,
  caption,
  avatar,
  noun,
  general,
  onEditGeneral,
  pricing,
  onEditPricing,
  equipmentId,
  technicianId,
  onAttributionChange,
  description,
  onDescriptionChange,
  onDelete,
  breakpoint,
  children,
}: LinePanelProps) {
  const [editingAttribution, setEditingAttribution] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hasAttribution = (job.equipmentIds?.length ?? 0) > 0 || (job.assigneeIds?.length ?? 0) > 0;

  return (
    <>
      <SidePanel
        open={open}
        onClose={onClose}
        title={title}
        caption={caption}
        avatar={avatar}
        breakpoint={breakpoint}
        footer={
          <PopoverFooter stretch>
            <Button size="lg" variant="danger" leftIcon="trash-can" onClick={() => setDeleting(true)}>
              Delete
            </Button>
          </PopoverFooter>
        }
      >
        <DisplayModule
          title="General"
          slotRight={<IconButton icon="pen" variant="ghost" size="md" aria-label="Edit general" onClick={onEditGeneral} />}
          content={<ValueDisplayGroup>{general}</ValueDisplayGroup>}
        />

        <DisplayModule
          title="Pricing"
          slotRight={<IconButton icon="pen" variant="ghost" size="md" aria-label="Edit pricing" onClick={onEditPricing} />}
          content={<ValueDisplayGroup>{pricing}</ValueDisplayGroup>}
        />

        {hasAttribution && (
          <DisplayModule
            title="Attribution"
            slotRight={<IconButton icon="pen" variant="ghost" size="md" aria-label="Edit attribution" onClick={() => setEditingAttribution(true)} />}
            content={
              <ValueDisplayGroup>
                <AttributionRows job={job} equipmentId={equipmentId} technicianId={technicianId} />
              </ValueDisplayGroup>
            }
          />
        )}

        <NotesModule
          title="Description"
          emptyCaption="No description"
          copyErrorTitle={'Couldn\'t copy "Description"'}
          notes={description}
          onEdit={() => setEditingDescription(true)}
        />
      </SidePanel>

      {children}

      <LineSectionDialog<Attribution>
        open={editingAttribution}
        onClose={() => setEditingAttribution(false)}
        title="Attribution"
        start={() => ({ equipmentId, technicianId })}
        isBlocked={() => false}
        onSave={onAttributionChange}
        breakpoint={breakpoint}
      >
        {({ values, set, mobile }) => (
          <AttributionFields
            job={job}
            equipmentId={values.equipmentId}
            onEquipmentChange={(next) => set({ equipmentId: next })}
            technicianId={values.technicianId}
            onTechnicianChange={(next) => set({ technicianId: next })}
            mobile={mobile}
            shortLabels
          />
        )}
      </LineSectionDialog>

      {/* The shared TextArea dialog, its field without a header. */}
      <EditNotesDialog
        open={editingDescription}
        onClose={() => setEditingDescription(false)}
        notes={description}
        onSave={onDescriptionChange}
        title="Description"
        fieldLabel="Description"
        toastSubject={'"Description" module'}
        errorTitle={'Couldn\'t update "Description" module'}
        showFieldLabel={false}
        breakpoint={breakpoint}
      />

      <DeleteLinePrompt
        open={deleting}
        noun={noun}
        title={title}
        onConfirm={() => {
          setDeleting(false);
          onDelete();
        }}
        onCancel={() => setDeleting(false)}
        breakpoint={breakpoint}
      />
    </>
  );
}
