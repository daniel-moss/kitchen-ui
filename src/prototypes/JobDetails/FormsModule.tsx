import { useEffect, useMemo, useRef, useState } from "react";


import Avatar from "../../components/Avatar/Avatar";
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
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import { users } from "../../data/users";
import HotSideRepairForm, { HotSideDraft, hotSideDraftHasContent } from "./HotSideRepairForm";
import HvacPmStepForm, { HvacPmStepDraft, hvacStepDraftHasContent } from "./HvacPmStepForm";
import ServiceCallForm, { ServiceCallDraft, serviceCallDraftHasContent } from "./ServiceCallForm";
import { Equipment } from "./equipment";
import { formatStatusTimestamp, STATUS_TS } from "./jobState";
import { noop, useAnchoredMenu } from "./shared";

import styles from "./FormsModule.module.scss";

// ---- data model (Figma "Forms" Module, node 21816-30805) --------------------

type FormState = "notStarted" | "requiredService" | "requiredEquipment" | "inProgress" | "progressSaved" | "completed";

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
  { id: 6, name: "HVAC PM", template: "HVAC PM", visibility: "public", state: "notStarted" },
  { id: 9, name: "Service call", template: "Service call", visibility: "public", state: "notStarted" },
  { id: 10, name: "Hot Side - Repair", template: "Hot Side - Repair", visibility: "public", state: "notStarted" },
  { id: 3, name: "RTU - PM", template: "RTU - PM", visibility: "private", state: "inProgress" },
  { id: 4, name: "Ice Machine - Repair", template: "Ice Machine - Repair", visibility: "private", state: "completed" },
];

// The workspace's form templates = the "Add forms" list. STATIC — a template
// never leaves the list; every row tap adds one MORE copy to the job (the job
// can hold any number of copies). Includes the templates of the initial forms,
// so their counts show right away. (Old legacy templates removed with the
// legacy rows — Daniel 2026-07-27.)
const FORM_TEMPLATES = [
  "HVAC PM",
  "Service call",
  "Hot Side - Repair",
  "RTU - PM",
  "Ice Machine - Repair",
  "Fryer Inspection",
  "Walk-in Cooler - Audit",
  "Equipment Intake",
];

// The forms with a real fillable questionnaire: "HVAC PM" = the 7-step
// stepper (Figma 24337-41981); "Service call" = the modules form (Figma
// 24277-27279). Identified by TEMPLATE so renames keep working.
type FillableTemplate = "HVAC PM" | "Service call" | "Hot Side - Repair";
const isFillable = (t: string): t is FillableTemplate =>
  t === "HVAC PM" || t === "Service call" || t === "Hot Side - Repair";
// The demo viewer filling the form (Lorne Riddle, the app-wide viewer).
const VIEWER = users[0];

// The colleague editing the "in progress" form (live avatar, orange ring).
const LIVE_EDITOR = users[2];
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
const FormAvatar = ({ state }: { state: FormState }) => {
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
  /** Row click — opens the form (a noop for forms without a questionnaire). */
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
}) => {
  const menu = useAnchoredMenu(!mobile, "end");
  const completed = form.state === "completed";
  const inProgress = form.state === "inProgress";
  const isPrivate = form.visibility === "private";
  // A union CONST (not an inline ternary spread) — TS must keep the two
  // branches apart to satisfy ListItem's draggable discriminated union.
  const dragProps = draggable ? ({ isDraggable: true, isDragging } as const) : ({ isDraggable: false } as const);

  const item = (label: string, icon: string, onClick: () => void, itemCaption?: string) => (
    <MenuItem
      label={label}
      caption={itemCaption}
      slotLeft={<Icon icon={icon} container="square" />}
      onClick={() => {
        menu.close();
        onClick();
      }}
    />
  );

  // Menus per status (Figma 2026-07-23 update: 23899-17336 notStarted /
  // 24225-20206 required / 24255-67714 inProgress / 24255-68260 progressSaved /
  // 24225-20518 completed): every status gets the standard menu WITH Remove,
  // completed adds Preview — EXCEPT inProgress, which is reduced to ONLY
  // Duplicate + the visibility toggle (someone is editing the form).
  const menuBody = (
    <>
      <MenuItemGroup>
        {!inProgress && item("Edit", "pen", noop)}
        {completed && item("Preview", "eye", noop)}
        {!inProgress && item("Rename", "text-size", onRename)}
        {item("Duplicate", "clone", onDuplicate)}
        {isPrivate
          ? item("Make public", "globe", onToggleVisibility, "Visible to your client")
          : item("Make private", "lock", onToggleVisibility, "Visible to team members only")}
      </MenuItemGroup>
      {!inProgress && <MenuItemGroup>{item("Remove", "xmark", onRemove)}</MenuItemGroup>}
    </>
  );

  return (
    <>
      <ListItem
        variant="titleCaption"
        title={form.name}
        caption={caption(form)}
        avatar={<FormAvatar state={form.state} />}
        disabled={disabled}
        isClickable
        onClick={onOpen}
        {...dragProps}
        slotRight={
          <span className={styles.rowRight}>
            {inProgress && (
              // Live avatars exist ONLY in md/lg/xl — this one is lg (32px).
              // Hover = the DisplayModule editing-state tooltip (item 1).
              <HoverTooltip text={LIVE_EDITOR_TOOLTIP}>
                <Avatar type="live" content="image" size="lg" ringColor="orange" imageSrc={LIVE_EDITOR.avatar} />
              </HoverTooltip>
            )}
            <IconButton
              icon="ellipsis"
              variant="ghost"
              size="md"
              aria-label={`${form.name} actions`}
              isPressed={menu.open}
              noDebounce
              onClick={menu.onActions}
            />
          </span>
        }
      />
      {mobile ? (
        <Menu
          open={menu.open}
          onClose={menu.close}
          header={
            // The drawer header mirrors the row: avatar + name + STATUS caption
            // (Figma 23899-17336 etc.); the in-progress one also carries the
            // live editor avatar on the right (24255-67714).
            <DrawerHeader>
              <PopoverHeaderContent
                avatar={<FormAvatar state={form.state} />}
                actions={
                  inProgress ? (
                    <Avatar type="live" content="image" size="lg" ringColor="orange" imageSrc={LIVE_EDITOR.avatar} />
                  ) : undefined
                }
              >
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
  /** Reports the forms' completion (Complete flow gates Next + the Generate button). */
  onCompletionChange?: (state: { all: boolean; any: boolean }) => void;
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
  const [serviceDraft, setServiceDraft] = useState<ServiceCallDraft | null>(null);
  const [hotSideDraft, setHotSideDraft] = useState<HotSideDraft | null>(null);
  // The Add list STAGES copies per template ({name: count}); the footer's Add
  // commits them all at once. Dismissing the list discards the staging.
  const [staged, setStaged] = useState<Record<string, number>>({});
  useEffect(() => {
    if (addTarget == null) setStaged({});
  }, [addTarget]);
  // The picker's title must SURVIVE the close: addTarget goes null the moment
  // it closes, but the dialog stays mounted for its fade-out — without this,
  // a closing "Private forms" flips to the default title mid-fade.
  const lastTarget = useRef<"public" | "private">("public");
  if (addTarget != null) lastTarget.current = addTarget;

  const publicForms = useMemo(() => forms.filter((f) => f.visibility === "public"), [forms]);
  const privateForms = useMemo(() => forms.filter((f) => f.visibility === "private"), [forms]);

  // Complete flow: report whether every / any form is completed (drives the
  // Skip-forms prompt on Next + the Summary "Generate" button).
  useEffect(() => {
    onCompletionChange?.({
      all: forms.length > 0 && forms.every((f) => f.state === "completed"),
      any: forms.some((f) => f.state === "completed"),
    });
  }, [forms, onCompletionChange]);

  const detailedToast = (title: string, formName: string) => toast({ type: "success", variant: "detailed", title, caption: formName });

  const rename = (form: JobForm, name: string) => setForms((prev) => prev.map((f) => (f.id === form.id ? { ...f, name } : f)));
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
  };
  // Remove just deletes the copy — its template returns to the Add list
  // (the list shows every template the job does NOT have).
  const remove = (form: JobForm) => setForms((prev) => prev.filter((f) => f.id !== form.id));

  // ---- Add-list staging -------------------------------------------------------
  // Only templates the job does not already have are offered.
  const availableTemplates = FORM_TEMPLATES.filter((t) => !forms.some((f) => f.template === t));
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
    const names = availableTemplates.flatMap((t) => Array<string>(staged[t] ?? 0).fill(t));
    if (names.length === 0) return;
    setForms((prev) => [
      ...prev,
      ...names.map((t, i) => ({ id: nextId + i, name: t, template: t, visibility: addTarget, state: "notStarted" as const })),
    ]);
    setNextId((n) => n + names.length);
    setAddTarget(null);
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
    remove(removeTarget);
    detailedToast("The form removed", removeTarget.name);
    setRemoveTarget(null);
  };

  // ---- the HVAC PM questionnaire flows --------------------------------------
  const setFillableState = (template: FillableTemplate, state: FormState) =>
    setForms((prev) =>
      prev.map((f) => (f.template === template ? { ...f, state, statusBy: shortName(VIEWER), statusAt: formatStatusTimestamp(new Date()) } : f)),
    );
  // Save progress: keep whatever was filled, no validation. An untouched form
  // stays notStarted (no toast) — saving nothing is not progress.
  const saveStepProgress = (draft: HvacPmStepDraft) => {
    setStepDraft(draft);
    if (!hvacStepDraftHasContent(draft)) return;
    setFillableState("HVAC PM", "progressSaved");
    detailedToast("The progress is saved", "HVAC PM");
  };
  const submitStep = (draft: HvacPmStepDraft) => {
    setStepDraft(draft);
    setFillableState("HVAC PM", "completed");
    detailedToast("The form submitted", "HVAC PM");
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
    setFillableState("Hot Side - Repair", "progressSaved");
    detailedToast("The progress is saved", "Hot Side - Repair");
  };
  const submitHotSide = (draft: HotSideDraft) => {
    setHotSideDraft(draft);
    setFillableState("Hot Side - Repair", "completed");
    detailedToast("The form submitted", "Hot Side - Repair");
  };

  const rowActions = (f: JobForm) => ({
    // Every row is clickable; only the questionnaire forms open (the rest noop).
    onOpen: isFillable(f.template) ? () => setOpenFormTemplate(f.template as FillableTemplate) : noop,
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
          per group (title "Public forms" / "Private forms"), shows only
          templates the job does NOT have yet. A row tap STAGES one more copy
          (the tag = staged count + an md minus to un-stage); nothing is added
          until the footer's Add commits the whole staging into the target
          group. Footer = the standard PopoverFooter shape (ghost Cancel left,
          solid Add right). `multiSelect` on the SelectList only keeps it OPEN
          across taps (no checkboxes on the rows). */}
      <SelectList
        variant={mobile ? "drawer" : "dialog"}
        breakpoint={mobile ? "mobile" : "desktop"}
        title={lastTarget.current === "private" ? "Private forms" : "Public forms"}
        open={addTarget != null}
        onClose={() => setAddTarget(null)}
        multiSelect
        searchable
        searchPlaceholder="Search by form name..."
        state={availableTemplates.length === 0 ? "empty" : "default"}
        emptyState={{ title: "Nothing here yet", caption: "Every form was already added to this job" }}
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
          {availableTemplates.map((name) => (
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

      {/* The "HVAC PM" stepper questionnaire (Figma 24337-41981). */}
      <HvacPmStepForm
        open={openFormTemplate === "HVAC PM"}
        onClose={() => setOpenFormTemplate(null)}
        title="HVAC PM"
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

      {/* The "Hot Side - Repair" form (Figma 23920-13390). */}
      <HotSideRepairForm
        open={openFormTemplate === "Hot Side - Repair"}
        onClose={() => setOpenFormTemplate(null)}
        initial={hotSideDraft}
        onSaveProgress={saveHotSideProgress}
        onSubmit={submitHotSide}
        mobile={mobile}
      />

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
