import { useEffect, useMemo, useRef, useState } from "react";


import Avatar from "../../components/Avatar/Avatar";
import AvatarLive from "../../components/Avatar/AvatarLive";
import Button from "../../components/Button/Button";
import Counter from "../../components/Counter/Counter";
import Dialog from "../../components/Dialog/Dialog";
import { Divider } from "../../components/Divider/Divider";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import TextField from "../../components/Fields/TextField/TextField";
import FormModule from "../../components/FormModule/FormModule";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import ListItem from "../../components/ListItem/ListItem";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import Menu from "../../components/Menu/Menu";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import DrawerHeader from "../../components/Popover/DrawerHeader";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import Prompt from "../../components/Prompt/Prompt";
import PopoverHeaderContent from "../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../components/Popover/PopoverHeaderText";
import SelectList from "../../components/SelectList/SelectList";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import FormPreviewPanel from "../../forms/formSchema/FormPreviewPanel";
import { HOT_SIDE_REPAIR_SCHEMA } from "../../forms/formSchema/hotSideRepairSchema";
import { HVAC_PM_SCHEMA } from "../../forms/formSchema/hvacPmSchema";
import { ICE_MACHINE_REPAIR_SCHEMA } from "../../forms/formSchema/iceMachineRepairSchema";
import { SERVICE_CALL_SCHEMA } from "../../forms/formSchema/serviceCallSchema";
import { DEMO_HOT_SIDE_DRAFT, DEMO_SERVICE_CALL_DRAFT } from "./demoFormDrafts";
import { hotSideAnswers, hvacPmAnswers, iceMachineAnswers, serviceCallAnswers } from "./formAnswers";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import { users } from "../../data/users";
import HotSideRepairForm, { HotSideDraft, hotSideDraftHasContent } from "./HotSideRepairForm";
import HvacPmStepForm, { HvacPmStepDraft, hvacStepDraftHasContent } from "./HvacPmStepForm";
import IceMachineRepairForm, { IceMachineDraft, iceMachineDraftHasContent } from "./IceMachineRepairForm";
import ServiceCallForm, { ServiceCallDraft, serviceCallDraftHasContent } from "./ServiceCallForm";
import { Equipment } from "./equipment";
import { formatStatusTimestamp, STATUS_TS } from "./jobState";
import { noop, useAnchoredMenu } from "./shared";

import styles from "./FormsModule.module.scss";

// ---- data model (Figma "Forms" Module, node 21816-30805) --------------------

type FormState = "notStarted" | "requiredService" | "requiredEquipment" | "inProgress" | "progressSaved" | "completed";

/** What another step needs to LIST a form read-only (the Signature step). */
/**
 * One "Forms" module Activity log (Figma 24592-40934). Every shape the node
 * draws, and nothing else:
 *   added / removed  — one or several names, the removed ones struck through
 *   visibility       — "updated {name} visibility to Public|Private"
 *   renamed          — "renamed a form: ~~old~~ → new"
 *   completed / saved — "completed a form {name}" / "saved changes to a form {name}"
 */
export type FormsLog =
  | { kind: "added"; names: string[] }
  | { kind: "removed"; names: string[] }
  | { kind: "visibility"; name: string; visibility: "public" | "private" }
  | { kind: "renamed"; from: string; to: string }
  | { kind: "completed"; name: string }
  | { kind: "saved"; name: string };

export interface FormSummary {
  id: number;
  name: string;
  completed: boolean;
  /** "Completed by Name S. on Jan 1 at 12:00 PM" — empty until completed. */
  caption: string;
}

interface JobForm {
  id: number;
  name: string;
  /** The template this copy came from — rename keeps the link (counts stay right). */
  template: string;
  visibility: "public" | "private";
  state: FormState;
  /** The service / equipment the form is required for (required states). */
  requiredFor?: string;
  /** Who saved/completed the form (live flows; demo rows fall back to defaults). */
  statusBy?: string;
  /** When it was saved/completed (formatted; demo rows fall back to STATUS_TS). */
  statusAt?: string;
}

// Demo forms (Daniel 2026-07-27: Public = ONLY the two fillable forms — the
// HVAC PM stepper + Service call; the old one-page HVAC PM/v2 and the demo
// rows are gone). Forms are NOT sorted — shown in added order.
const INITIAL_FORMS: JobForm[] = [
  // PM - HVAC starts EMPTY (Daniel, 2026-08-25). It supports the preview, but
  // the preview is reached by filling the form — not by a demo draft.
  { id: 6, name: "PM - HVAC", template: "PM - HVAC", visibility: "public", state: "notStarted" },
  // Both schema-backed forms start COMPLETED and pre-filled (demoFormDrafts.ts)
  // so the read-only preview can be shown without filling a form first
  // (Daniel, 2026-08-06).
  { id: 9, name: "Service call", template: "Service call", visibility: "public", state: "completed", statusBy: "Lorne R." },
  { id: 10, name: "Repair - Hot Side", template: "Repair - Hot Side", visibility: "public", state: "completed", statusBy: "Thiago C." },
  // PUBLIC and EMPTY on purpose (Daniel, 2026-08-06): this is the row to walk
  // Not started → Progress saved → Completed by hand, so Private keeps one row.
  { id: 4, name: "Repair - Ice Machine", template: "Repair - Ice Machine", visibility: "public", state: "notStarted" },
  { id: 3, name: "PM - RTU", template: "PM - RTU", visibility: "private", state: "inProgress" },
];

// The workspace's form templates = the "Add forms" list. STATIC — a template
// never leaves the list; every row tap adds one MORE copy to the job (the job
// can hold any number of copies). The templates of the forms already on the job
// STAY on the list too (Daniel 2026-08-25): the list is the workspace's form
// library, not "what is missing" — a form on the job was picked from here, so
// hiding it made the list look wrong.
//
// NAMING (Daniel 2026-08-25): "<Service> - <Equipment>" — the work type first,
// the equipment second. Sorted A→Z, that makes the list read as groups (every
// "Inspection - …" together, every "PM - …", every "Repair - …") without a real
// grouping. "Service call" is the one exception: it is not tied to a piece of
// equipment, and it is the real Roopairs form name.
const FORM_TEMPLATES = [
  "Audit - Walk-in Cooler",
  "Claim - Warranty",
  "Inspection - Fryer",
  "Inspection - Gas Line",
  "Inspection - Hood & Exhaust",
  "Inspection - Safety",
  "Intake - Equipment",
  "PM - Combi Oven",
  "PM - HVAC",
  "PM - RTU",
  "PM - Walk-in Cooler",
  "Repair - Dishwasher",
  "Repair - Hot Side",
  "Repair - Ice Machine",
  "Repair - Refrigeration",
  "Request - Parts",
  "Service - Espresso Machine",
  "Service - Grease Trap",
  "Service call",
  "Survey - Site",
  // Sorted here, and sorted again at load — a new template can be appended
  // anywhere above and the list stays A→Z.
].sort((a, b) => a.localeCompare(b));

// The forms with a real fillable questionnaire: "PM - HVAC" = the 7-step
// stepper (Figma 24337-41981); "Service call" = the modules form (Figma
// 24277-27279); "Repair - Hot Side" (23920-13390) and "Repair - Ice Machine"
// (24564-137511) = the flat WCE field lists. Identified by TEMPLATE so renames
// keep working.
type FillableTemplate = "PM - HVAC" | "Service call" | "Repair - Hot Side" | "Repair - Ice Machine";
const FILLABLE: FillableTemplate[] = ["PM - HVAC", "Service call", "Repair - Hot Side", "Repair - Ice Machine"];
const isFillable = (t: string): t is FillableTemplate => FILLABLE.includes(t as FillableTemplate);
// The demo viewer filling the form (Lorne Riddle, the app-wide viewer).
const VIEWER = users[0];

// The colleague editing the "in progress" form (live avatar, orange ring) —
// Thiago Cummings, the job's second assignee (Daniel, 2026-08-25).
const LIVE_EDITOR = users[1];
// The live avatar's hover tooltip — the SAME copy convention as DisplayModule's
// editing state ("<first name + last initial> is editing…", per the Figma
// Live-Editing annotation + the DS DisplayModule story).
const LIVE_EDITOR_TOOLTIP = `${LIVE_EDITOR.firstName} ${LIVE_EDITOR.lastName[0]}. is editing…`;

// Real demo users for the state captions (Daniel: real names, not the
// design's "Name S." placeholder).
const SAVED_BY = users[3]; // Kate Charles
const COMPLETED_BY = users[4]; // Dirk Horton
const shortName = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName[0]}.`;

// Which Remove needs a confirm Prompt: required forms get the required
// prompt; saved-progress AND completed count as forms with saved progress
// (Daniel 2026-07-23) and get the clear-data prompt. Only notStarted removes
// directly.
const isRequiredState = (f: JobForm) => f.state === "requiredService" || f.state === "requiredEquipment";
const needsRemovePrompt = (f: JobForm) => isRequiredState(f) || f.state === "progressSaved" || f.state === "completed";

// Row caption per state (Figma 24088-14278). Timestamps follow the app-wide
// weekday + conditional-year rule (the design's "Jan 1 at 12:00 PM" predates it).
const caption = (f: JobForm) => {
  switch (f.state) {
    case "notStarted":
      return "Not started";
    case "requiredService":
    case "requiredEquipment":
      return `Required for "${f.requiredFor}"`;
    case "inProgress":
      return "In progress";
    case "progressSaved":
      return `Progress saved by ${f.statusBy ?? shortName(SAVED_BY)} on ${f.statusAt ?? STATUS_TS}`;
    case "completed":
      return `Completed by ${f.statusBy ?? shortName(COMPLETED_BY)} on ${f.statusAt ?? STATUS_TS}`;
  }
};

// The 36px form avatar: state drives fill + icon (no addOn marks in the design).
// Icons per the 2026-07-23 List-Items update: circle-dashed (not started /
// required), circle-half-stroke ROTATED 180° (in progress / saved — the fill
// moves to the RIGHT half), check-circle (completed).
export const FormAvatar = ({ state }: { state: FormState }) => {
  const active = state === "inProgress" || state === "progressSaved";
  const kind = state === "completed" ? styles.avatarCompleted : active ? styles.avatarActive : styles.avatarDefault;
  const icon = state === "completed" ? "check-circle" : active ? "circle-half-stroke" : "circle-dashed";
  return (
    <span className={`${styles.avatar} ${kind}`}>
      <Icon icon={icon} pack="solid" size={16} className={active ? styles.halfIcon : undefined} />
    </span>
  );
};

// ---- the row + its context menu ---------------------------------------------

/** Everything a form's context menu can do. `onPreview` is dropped inside the
 *  preview panel itself — see `formMenuItems`. */
export interface FormMenuActions {
  onOpen: () => void;
  onPreview: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
}

/**
 * The form context menu (Figma 23899-17336 notStarted / 24225-20206 required /
 * 24255-68260 progressSaved / 24225-20518 completed): every status gets the
 * standard menu WITH Remove, completed adds Preview.
 *
 * A form someone ELSE is editing (inProgress) has NO menu at all — its row
 * carries only the live editor's avatar (Figma 24219-18867, Daniel confirmed
 * 2026-08-10), so this function is never called for it.
 *
 * Shared so the row's ⋯ and the PREVIEW PANEL's ⋯ cannot drift apart (Daniel,
 * 2026-08-06). `includePreview` is false inside the panel — the preview is
 * already open there, so the item would do nothing.
 */
export const formMenuItems = (
  form: Pick<JobForm, "state" | "visibility">,
  actions: FormMenuActions,
  close: () => void,
  includePreview = true,
) => {
  const completed = form.state === "completed";
  const isPrivate = form.visibility === "private";

  const item = (label: string, icon: string, onClick: () => void, itemCaption?: string) => (
    <MenuItem
      label={label}
      caption={itemCaption}
      slotLeft={<Icon icon={icon} container="square" />}
      onClick={() => {
        close();
        onClick();
      }}
    />
  );

  return (
    <>
      <MenuItemGroup>
        {item("Edit", "pen", actions.onOpen)}
        {completed && includePreview && item("Preview", "eye", actions.onPreview)}
        {item("Rename", "text-size", actions.onRename)}
        {item("Duplicate", "clone", actions.onDuplicate)}
        {isPrivate
          ? item("Make public", "globe", actions.onToggleVisibility, "Visible to your client")
          : item("Make private", "lock", actions.onToggleVisibility, "Visible to team members only")}
      </MenuItemGroup>
      <MenuItemGroup>{item("Remove", "xmark", actions.onRemove)}</MenuItemGroup>
    </>
  );
};

// NOTE: FormRow is a WRAPPER around ListItem, and ItemGroup clones the
// wrapper with `isDragging`/`disabled` for the lifted drag copy — they MUST be
// accepted and forwarded (the FileRow lesson), or the dragged copy renders flat.
const FormRow = ({
  form,
  mobile,
  draggable = false,
  isDragging,
  disabled,
  onOpen,
  onPreview,
  onRename,
  onDuplicate,
  onToggleVisibility,
  onRemove,
}: {
  form: JobForm;
  mobile: boolean;
  /** Drag is a GROUP decision: only groups with more than one row allow it. */
  draggable?: boolean;
  isDragging?: boolean;
  disabled?: boolean;
  /** Row click — opens the form, or its preview once completed. */
  onOpen: () => void;
  /** Opens the read-only preview (completed forms only). */
  onPreview: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
}) => {
  const menu = useAnchoredMenu(!mobile);
  const completed = form.state === "completed";
  const inProgress = form.state === "inProgress";
  // A union CONST (not an inline ternary spread) — TS must keep the two
  // branches apart to satisfy ListItem's draggable discriminated union.
  const dragProps = draggable ? ({ isDraggable: true, isDragging } as const) : ({ isDraggable: false } as const);

  const menuBody = formMenuItems(
    form,
    { onOpen, onPreview, onRename, onDuplicate, onToggleVisibility, onRemove },
    menu.close,
  );

  const rowProps = {
    variant: "titleCaption" as const,
    title: form.name,
    caption: caption(form),
    avatar: <FormAvatar state={form.state} />,
    disabled,
    ...dragProps,
    // A form SOMEONE ELSE is editing carries ONLY the live editor's avatar —
    // no ⋯ button, because that form has no actions (Figma 24219-18867,
    // Daniel 2026-08-10).
    slotRight: inProgress ? (
      // Live avatars exist ONLY in md/lg/xl — this one is lg (32px).
      // Hover = the DisplayModule editing-state tooltip.
      <HoverTooltip text={LIVE_EDITOR_TOOLTIP}>
        <AvatarLive content="image" size="lg" color="orange" imageSrc={LIVE_EDITOR.avatar} />
      </HoverTooltip>
    ) : (
      <IconButton
        icon="ellipsis"
        variant="ghost"
        size="md"
        aria-label={`${form.name} actions`}
        isPressed={menu.open}
        noDebounce
        onClick={menu.onActions}
      />
    ),
  };

  // A form someone else is editing is not clickable either — there is nothing
  // to open (Daniel, 2026-08-07). So the row stands alone, with no menu at all.
  if (inProgress) return <ListItem {...rowProps} />;

  return (
    <>
      {/* A completed form opens its PREVIEW; the menu's Edit still opens the
          form itself. */}
      <ListItem {...rowProps} isClickable onClick={completed ? onPreview : onOpen} />
      {mobile ? (
        <Menu
          open={menu.open}
          onClose={menu.close}
          drawerHeader={
            // The drawer header mirrors the row: avatar + name + STATUS caption
            // (Figma 23899-17336 etc.).
            <DrawerHeader>
              <PopoverHeaderContent avatar={<FormAvatar state={form.state} />}>
                <PopoverHeaderText variant="titleCaption" title={form.name} caption={caption(form)} />
              </PopoverHeaderContent>
            </DrawerHeader>
          }
          breakpoint="mobile"
        >
          {menuBody}
        </Menu>
      ) : (
        menu.pos != null && (
          <div ref={menu.cardRef} className={styles.anchoredMenu} style={{ top: menu.pos.top, left: menu.pos.left, right: menu.pos.right }}>
            <Menu open={menu.open} onClose={menu.close} breakpoint="desktop">
              {menuBody}
            </Menu>
          </div>
        )
      )}
    </>
  );
};

// ---- rename dialog (Figma 24224-26529) --------------------------------------

const RenameForm = ({
  open,
  initial,
  onClose,
  onRename,
  mobile,
}: {
  open: boolean;
  initial: string;
  onClose: () => void;
  onRename: (name: string) => void;
  mobile: boolean;
}) => {
  const [name, setName] = useState(initial);
  const [showError, setShowError] = useState(false);
  // Reset per open (key on the caller side keeps this simple).
  const submit = () => {
    if (name.trim() === "") {
      setShowError(true);
      return;
    }
    onRename(name.trim());
    // Rename's success toast is the COMPACT one (Figma 24224-26540).
    toast({ type: "success", title: "The form renamed" });
    onClose();
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Form name"
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={name !== initial}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={submit}>
            Rename
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.renameBody}>
        {/* Label-less input — the missing-value copy comes from the designs. */}
        <TextField
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setShowError(false);
          }}
          isValid={!(showError && name.trim() === "")}
          errorMessage="Enter Name"
        />
      </div>
    </Dialog>
  );
};

// ---- the module -------------------------------------------------------------

export default function FormsModule({
  mobile = false,
  jobEquipment = [],
  stepVariant = false,
  onCompletionChange,
  onFormsRevision,
  onFormsChange,
  registerPreview,
  onLog,
}: {
  mobile?: boolean;
  /** The job's live Equipment-module list (the Service call form reads it). */
  jobEquipment?: Equipment[];
  /**
   * Complete-job flow variant (Figma 24395-35194): the module renders inside a
   * FormModule header ("Forms" + caption) instead of its own DisplayModule
   * header. Everything else (rows, menus, fillable forms, Add list) is identical.
   */
  stepVariant?: boolean;
  /**
   * Reports the forms' completion (Complete flow gates Next + the Generate
   * button). `count` is how many forms the job has at all — with none, the
   * Summary step hides Generate entirely (Figma 24395-36289).
   */
  onCompletionChange?: (state: { all: boolean; any: boolean; count: number }) => void;
  /**
   * Fires whenever a form's ANSWERS or completion state change (not a rename
   * or a visibility switch). The Work summary module compares this against the
   * revision its summary was written from, to know the forms moved on
   * (Figma 24268-68841 "Forms updated. Update the summary?").
   */
  onFormsRevision?: (revision: number) => void;
  /** Reports the job's forms, so another step can list them read-only. */
  onFormsChange?: (forms: FormSummary[]) => void;
  /**
   * Hands the caller a function that opens a form's read-only preview. The
   * Complete-job Signature step uses it: its Forms list is rendered there, but
   * the preview panel lives here, next to the answers it shows.
   */
  registerPreview?: (open: (id: number) => void) => void;
  /**
   * Writes one Activity log per change (Figma 24592-40934). The module owns its
   * own forms state, so the shell can only learn about a change this way.
   * Duplicating a form has NO designed log, so it writes none — flagged.
   */
  onLog?: (log: FormsLog) => void;
}) {
  const [forms, setForms] = useState<JobForm[]>(INITIAL_FORMS);
  const [nextId, setNextId] = useState(100);
  // Which group is being added to — each GroupLabel has its own plus ("Add
  // public forms" / "Add private forms"); the committed copies land in it.
  const [addTarget, setAddTarget] = useState<"public" | "private" | null>(null);
  const [renameTarget, setRenameTarget] = useState<JobForm | null>(null);
  // The form whose Remove awaits confirmation (required / saved-progress).
  const [removeTarget, setRemoveTarget] = useState<JobForm | null>(null);
  // The fillable questionnaires: which one is open + a stored draft per form
  // (prefills reopen). Each dialog has a fixed title, so no last-shown refs.
  const [openFormTemplate, setOpenFormTemplate] = useState<FillableTemplate | null>(null);
  const [stepDraft, setStepDraft] = useState<HvacPmStepDraft | null>(null);
  // Pre-filled demo answers — the two completed rows above open their preview.
  const [serviceDraft, setServiceDraft] = useState<ServiceCallDraft | null>(DEMO_SERVICE_CALL_DRAFT);
  const [hotSideDraft, setHotSideDraft] = useState<HotSideDraft | null>(DEMO_HOT_SIDE_DRAFT);
  // Ice Machine starts EMPTY — the row to fill by hand (Daniel, 2026-08-06).
  const [iceMachineDraft, setIceMachineDraft] = useState<IceMachineDraft | null>(null);
  // The Add list STAGES copies per template ({name: count}); the footer's Add
  // commits them all at once. Dismissing the list discards the staging.
  // The form whose read-only preview is open (a completed row / its menu).
  const [previewForm, setPreviewForm] = useState<JobForm | null>(null);
  const [staged, setStaged] = useState<Record<string, number>>({});
  useEffect(() => {
    if (addTarget == null) setStaged({});
  }, [addTarget]);

  const publicForms = useMemo(() => forms.filter((f) => f.visibility === "public"), [forms]);
  const privateForms = useMemo(() => forms.filter((f) => f.visibility === "private"), [forms]);

  // Complete flow: report whether every / any form is completed (drives the
  // Skip-forms prompt on Next + the Summary "Generate" button).
  useEffect(() => {
    onCompletionChange?.({
      all: forms.length > 0 && forms.every((f) => f.state === "completed"),
      any: forms.some((f) => f.state === "completed"),
      count: forms.length,
    });
  }, [forms, onCompletionChange]);

  // The same list, in a shape another step can render read-only.
  useEffect(() => {
    onFormsChange?.(
      forms.map((f) => ({ id: f.id, name: f.name, completed: f.state === "completed", caption: caption(f) })),
    );
  }, [forms, onFormsChange]);

  // The forms' CONTENT revision: the completion states plus the stored answers.
  // A rename or a visibility switch also rewrites `forms`, so the states are
  // keyed rather than watched as an array — otherwise renaming a form would
  // claim the summary is out of date.
  const stateKey = forms.map((f) => `${f.id}:${f.state}`).join("|");
  const revision = useRef(0);
  const firstRevision = useRef(true);
  useEffect(() => {
    // The first run is the initial render, not an edit.
    if (firstRevision.current) {
      firstRevision.current = false;
      return;
    }
    revision.current += 1;
    onFormsRevision?.(revision.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateKey, serviceDraft, hotSideDraft, stepDraft, iceMachineDraft]);

  const detailedToast = (title: string, formName: string) => toast({ type: "success", variant: "detailed", title, caption: formName });

  // ---- the read-only preview -------------------------------------------------
  // A preview needs a SCHEMA and stored answers, so every FILLABLE form has one
  // — including the PM - HVAC stepper since 2026-08-25 (Figma "Mapping / Step ->
  // Preview" 24631-58494). A form with no draft yet has nothing to preview.
  const previewAnswersOf = (form: JobForm) => {
    if (form.template === "PM - HVAC" && stepDraft != null) {
      return { schema: HVAC_PM_SCHEMA, answers: hvacPmAnswers(stepDraft) };
    }
    if (form.template === "Service call" && serviceDraft != null) {
      return { schema: SERVICE_CALL_SCHEMA, answers: serviceCallAnswers(serviceDraft, jobEquipment) };
    }
    if (form.template === "Repair - Hot Side" && hotSideDraft != null) {
      return { schema: HOT_SIDE_REPAIR_SCHEMA, answers: hotSideAnswers(hotSideDraft, jobEquipment) };
    }
    if (form.template === "Repair - Ice Machine" && iceMachineDraft != null) {
      return { schema: ICE_MACHINE_REPAIR_SCHEMA, answers: iceMachineAnswers(iceMachineDraft, jobEquipment) };
    }
    return null;
  };
  // Another step can open the preview through this (the Signature step lists
  // the forms but the preview panel belongs here, with the answers).
  useEffect(() => {
    registerPreview?.((id: number) => setPreviewForm(forms.find((f) => f.id === id) ?? null));
  }, [registerPreview, forms]);

  // The panel keeps its content through the close animation.
  const lastPreview = useRef<JobForm | null>(null);
  if (previewForm != null) lastPreview.current = previewForm;
  const shownPreview = previewForm ?? lastPreview.current;
  const preview = shownPreview != null ? previewAnswersOf(shownPreview) : null;

  const rename = (form: JobForm, name: string) => {
    setForms((prev) => prev.map((f) => (f.id === form.id ? { ...f, name } : f)));
    if (name !== form.name) onLog?.({ kind: "renamed", from: form.name, to: name });
  };
  // Duplicate = a fresh not-started copy right after the original (cleared fields).
  const duplicate = (form: JobForm) => {
    setForms((prev) => {
      const i = prev.findIndex((f) => f.id === form.id);
      const copy: JobForm = { id: nextId, name: form.name, template: form.template, visibility: form.visibility, state: "notStarted" };
      return [...prev.slice(0, i + 1), copy, ...prev.slice(i + 1)];
    });
    setNextId((n) => n + 1);
    detailedToast("The form is duplicated", form.name);
  };
  const toggleVisibility = (form: JobForm) => {
    const toPrivate = form.visibility === "public";
    setForms((prev) => prev.map((f) => (f.id === form.id ? { ...f, visibility: toPrivate ? "private" : "public" } : f)));
    detailedToast(toPrivate ? "The form is now private" : "The form is now public", form.name);
    onLog?.({ kind: "visibility", name: form.name, visibility: toPrivate ? "private" : "public" });
  };
  // Remove just deletes the copy. The Add list is unaffected — it always shows
  // every template the workspace has.
  const remove = (form: JobForm) => {
    setForms((prev) => prev.filter((f) => f.id !== form.id));
    onLog?.({ kind: "removed", names: [form.name] });
  };

  // ---- Add-list staging -------------------------------------------------------
  // EVERY template is offered, including the ones already on the job — a form
  // can be added more than once.
  const stagedTotal = Object.values(staged).reduce((a, b) => a + b, 0);
  const stage = (template: string) => setStaged((prev) => ({ ...prev, [template]: (prev[template] ?? 0) + 1 }));
  // The minus: un-stage one copy (a misclick undo); at zero the tag disappears.
  const unstage = (template: string) =>
    setStaged((prev) => {
      const next = { ...prev };
      const n = (next[template] ?? 0) - 1;
      if (n <= 0) delete next[template];
      else next[template] = n;
      return next;
    });
  // The footer's Add: commit every staged copy (identical names, fresh ids)
  // into the group whose plus opened the list.
  const commitAdd = () => {
    if (addTarget == null) return;
    const names = FORM_TEMPLATES.flatMap((t) => Array<string>(staged[t] ?? 0).fill(t));
    if (names.length === 0) return;
    setForms((prev) => [
      ...prev,
      ...names.map((t, i) => ({ id: nextId + i, name: t, template: t, visibility: addTarget, state: "notStarted" as const })),
    ]);
    setNextId((n) => n + names.length);
    setAddTarget(null);
    // ONE log for the whole Add, however many copies it commits — the node
    // writes "added forms A, B", not a log per form.
    onLog?.({ kind: "added", names });
  };

  // Reorder within one visibility group (forms keep their added order otherwise).
  const reorderGroup = (visibility: "public" | "private") => (from: number, to: number) => {
    setForms((prev) => {
      const group = prev.filter((f) => f.visibility === visibility);
      const rest = prev.filter((f) => f.visibility !== visibility);
      const next = [...group];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return visibility === "public" ? [...next, ...rest] : [...rest, ...next];
    });
  };

  // Prompt-confirmed removal (required / saved-progress): remove + the
  // detailed success toast (Figma 24255-67523; its error variant has no
  // failure path here, so it stays unwired).
  const confirmRemove = () => {
    if (removeTarget == null) return;
    // `remove` writes the log itself, so this path adds only the toast.
    remove(removeTarget);
    detailedToast("The form removed", removeTarget.name);
    setRemoveTarget(null);
  };

  // ---- the HVAC PM questionnaire flows --------------------------------------
  // Both write the log too: a form is identified by its TEMPLATE here, but the
  // log names it as the user sees it — the name a rename may have changed.
  const setFillableState = (template: FillableTemplate, state: FormState) => {
    setForms((prev) =>
      prev.map((f) => (f.template === template ? { ...f, state, statusBy: shortName(VIEWER), statusAt: formatStatusTimestamp(new Date()) } : f)),
    );
    const name = forms.find((f) => f.template === template)?.name ?? template;
    if (state === "completed") onLog?.({ kind: "completed", name });
    if (state === "progressSaved") onLog?.({ kind: "saved", name });
  };
  // Save progress: keep whatever was filled, no validation. An untouched form
  // stays notStarted (no toast) — saving nothing is not progress.
  const saveStepProgress = (draft: HvacPmStepDraft) => {
    setStepDraft(draft);
    if (!hvacStepDraftHasContent(draft)) return;
    setFillableState("PM - HVAC", "progressSaved");
    detailedToast("The progress is saved", "PM - HVAC");
  };
  const submitStep = (draft: HvacPmStepDraft) => {
    setStepDraft(draft);
    setFillableState("PM - HVAC", "completed");
    detailedToast("The form submitted", "PM - HVAC");
  };
  const saveServiceProgress = (draft: ServiceCallDraft) => {
    setServiceDraft(draft);
    if (!serviceCallDraftHasContent(draft)) return;
    setFillableState("Service call", "progressSaved");
    detailedToast("The progress is saved", "Service call");
  };
  const submitService = (draft: ServiceCallDraft) => {
    setServiceDraft(draft);
    setFillableState("Service call", "completed");
    detailedToast("The form submitted", "Service call");
  };
  const saveHotSideProgress = (draft: HotSideDraft) => {
    setHotSideDraft(draft);
    if (!hotSideDraftHasContent(draft)) return;
    setFillableState("Repair - Hot Side", "progressSaved");
    detailedToast("The progress is saved", "Repair - Hot Side");
  };
  const submitHotSide = (draft: HotSideDraft) => {
    setHotSideDraft(draft);
    setFillableState("Repair - Hot Side", "completed");
    detailedToast("The form submitted", "Repair - Hot Side");
  };
  const saveIceMachineProgress = (draft: IceMachineDraft) => {
    setIceMachineDraft(draft);
    if (!iceMachineDraftHasContent(draft)) return;
    setFillableState("Repair - Ice Machine", "progressSaved");
    detailedToast("The progress is saved", "Repair - Ice Machine");
  };
  const submitIceMachine = (draft: IceMachineDraft) => {
    setIceMachineDraft(draft);
    setFillableState("Repair - Ice Machine", "completed");
    detailedToast("The form submitted", "Repair - Ice Machine");
  };

  const rowActions = (f: JobForm) => ({
    // Every row is clickable; only the questionnaire forms open (the rest noop).
    onOpen: isFillable(f.template) ? () => setOpenFormTemplate(f.template as FillableTemplate) : noop,
    // Only the two schema-backed forms have a preview (the stepper is out of
    // scope, and the demo rows carry no answers) — the rest noop, flagged.
    onPreview: previewAnswersOf(f) != null ? () => setPreviewForm(f) : noop,
    onRename: () => setRenameTarget(f),
    onDuplicate: () => duplicate(f),
    onToggleVisibility: () => toggleVisibility(f),
    // Required + saved-progress confirm via a Prompt; the rest remove directly.
    onRemove: () => (needsRemovePrompt(f) ? setRemoveTarget(f) : remove(f)),
  });

  const group = (visibility: "public" | "private", items: JobForm[], last: boolean) => {
    // Drag is enabled ONLY when the group holds more than one row — the group
    // gets onReorder AND its rows get isDraggable together.
    const canDrag = items.length > 1;
    return (
      <ItemGroup
        divider={!last}
        onReorder={canDrag ? reorderGroup(visibility) : undefined}
        label={
          <GroupLabel
            variant="primary"
            slotLeft={<Icon icon={visibility === "public" ? "globe" : "lock"} size={14} />}
            label={visibility === "public" ? "Public" : "Private"}
            slotRight={
              // One shared tooltip for BOTH groups (Figma 21820-59251, Daniel
              // 2026-07-27) — the opened picker's title still says which group.
              <HoverTooltip text="Add forms">
                <IconButton icon="plus" variant="ghost" size="md" aria-label="Add forms" onClick={() => setAddTarget(visibility)} />
              </HoverTooltip>
            }
          />
        }
      >
        {items.length > 0 ? (
          items.map((f) => <FormRow key={f.id} form={f} mobile={mobile} draggable={canDrag} {...rowActions(f)} />)
        ) : (
          <EmptyState caption={visibility === "public" ? "No public forms here yet" : "No private forms here yet"} />
        )}
      </ItemGroup>
    );
  };

  // The two Public / Private groups — the module body (shared by both variants).
  const groupsBody = (
    // Both groups ALWAYS render, each with its own empty caption — even when the
    // whole module is empty (Figma 21820-59271 "No Forms": the groups + captions
    // stay, only the header Counter disappears).
    <div className={styles.listBody}>
      {group("public", publicForms, false)}
      {group("private", privateForms, true)}
    </div>
  );

  return (
    <>
      {stepVariant ? (
        // Complete-job flow (Figma 24395-35194): a FormModule header (title +
        // caption) over a header-less DisplayModule card holding the groups.
        <FormModule title="Forms" caption="Fill in all the forms related to this service">
          <DisplayModule variant="bodyOnly" content={groupsBody} />
        </FormModule>
      ) : (
        <DisplayModule
          title="Forms"
          titleSlotRight={forms.length > 0 ? <Counter value={forms.length} /> : undefined}
          content={groupsBody}
        />
      )}

      {/* Add forms (Figma 24233-23359, reworked per Daniel 2026-07-23): opened
          by either group's plus, titled "Forms" in both cases (Daniel
          2026-08-25 — the group is already clear from where the plus was
          tapped). Lists EVERY workspace template, the ones already on the job
          included. A row tap STAGES one more copy (the tag = staged count + an
          md minus to un-stage); nothing is added until the footer's Add commits
          the whole staging into the target group. Footer = the standard
          PopoverFooter shape (ghost Cancel left, solid Add right). `multiSelect`
          on the SelectList only keeps it OPEN across taps (no checkboxes on the
          rows). */}
      <SelectList
        variant={mobile ? "drawer" : "dialog"}
        breakpoint={mobile ? "mobile" : "desktop"}
        title="Forms"
        open={addTarget != null}
        onClose={() => setAddTarget(null)}
        multiSelect
        searchable
        searchPlaceholder="Search by form name..."
        footer={
          <SelectListFooter
            variant="actionBar"
            leadingButton={
              <Button size="lg" variant="ghost" onClick={() => setAddTarget(null)}>
                Cancel
              </Button>
            }
          >
            <Button size="lg" variant="solid" isDisabled={stagedTotal === 0} onClick={commitAdd}>
              {stagedTotal === 0 ? "Add" : stagedTotal === 1 ? "Add 1 form" : `Add ${stagedTotal} forms`}
            </Button>
          </SelectListFooter>
        }
      >
        <SelectListItemGroup>
          {/* The DS counter rows (select="counter"): row tap stages one more
              copy, the built-in circle-minus un-stages one. */}
          {FORM_TEMPLATES.map((name) => (
            <SelectListItem
              key={name}
              label={name}
              select="counter"
              count={staged[name] ?? 0}
              onDecrement={() => unstage(name)}
              onClick={() => stage(name)}
            />
          ))}
        </SelectListItemGroup>
      </SelectList>

      {/* The "PM - HVAC" stepper questionnaire (Figma 24337-41981). */}
      <HvacPmStepForm
        open={openFormTemplate === "PM - HVAC"}
        onClose={() => setOpenFormTemplate(null)}
        title="PM - HVAC"
        initial={stepDraft}
        onSaveProgress={saveStepProgress}
        onSubmit={submitStep}
        mobile={mobile}
      />

      {/* The "Service call" form (Figma 24277-27279). */}
      <ServiceCallForm
        open={openFormTemplate === "Service call"}
        onClose={() => setOpenFormTemplate(null)}
        equipment={jobEquipment}
        initial={serviceDraft}
        onSaveProgress={saveServiceProgress}
        onSubmit={submitService}
        mobile={mobile}
      />

      {/* The "Repair - Hot Side" form (Figma 23920-13390). */}
      <HotSideRepairForm
        open={openFormTemplate === "Repair - Hot Side"}
        onClose={() => setOpenFormTemplate(null)}
        title="Repair - Hot Side"
        equipment={jobEquipment}
        initial={hotSideDraft}
        onSaveProgress={saveHotSideProgress}
        onSubmit={submitHotSide}
        mobile={mobile}
      />

      {/* The "Repair - Ice Machine" form (Figma 24564-137511). */}
      <IceMachineRepairForm
        open={openFormTemplate === "Repair - Ice Machine"}
        onClose={() => setOpenFormTemplate(null)}
        title="Repair - Ice Machine"
        equipment={jobEquipment}
        initial={iceMachineDraft}
        onSaveProgress={saveIceMachineProgress}
        onSubmit={submitIceMachine}
        mobile={mobile}
      />

      {/* The read-only preview (Figma 24463-34993 / 24467-36576): a SidePanel
          over the page, opened by a completed row or its menu's Preview. Its
          header ⋯ opens the SAME menu as the row's (Daniel, 2026-08-06) —
          without "Preview", which would do nothing here. Edit and Remove CLOSE
          the panel first: the form opens over the page, and a removed form has
          nothing left to preview. */}
      {preview != null && shownPreview != null && (
        <FormPreviewPanel
          open={previewForm != null}
          onClose={() => setPreviewForm(null)}
          title={shownPreview.name}
          schema={preview.schema}
          answers={preview.answers}
          breakpoint={mobile ? "mobile" : "desktop"}
          headerMenu={(close) => {
            const actions = rowActions(shownPreview);
            const closePanel = (run: () => void) => () => {
              setPreviewForm(null);
              run();
            };
            return formMenuItems(
              shownPreview,
              {
                ...actions,
                onOpen: closePanel(actions.onOpen),
                onRemove: closePanel(actions.onRemove),
              },
              close,
              false,
            );
          }}
        />
      )}

      {/* Remove confirms (Figma 24255-67421 required / 24255-68517 saved
          progress; typos in the required body fixed per Daniel). */}
      {removeTarget != null && (
        <Prompt
          open
          breakpoint={mobile ? "mobile" : "desktop"}
          title={isRequiredState(removeTarget) ? "Remove required form?" : "Remove filled form?"}
          body={
            isRequiredState(removeTarget)
              ? "The form is marked as required. Are you sure you want to remove the form?"
              : "The form has saved answers. Removing the form will delete them."
          }
          actionLabel="Remove"
          actionVariant="danger"
          onAction={confirmRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}

      {/* Rename (key remounts per target so the field prefills fresh). */}
      {renameTarget != null && (
        <RenameForm
          key={renameTarget.id}
          open
          initial={renameTarget.name}
          onClose={() => setRenameTarget(null)}
          onRename={(name) => rename(renameTarget, name)}
          mobile={mobile}
        />
      )}
    </>
  );
}
