import { useMemo, useState } from "react";

import Avatar from "../../components/Avatar/Avatar";
import Button from "../../components/Button/Button";
import Counter from "../../components/Counter/Counter";
import Dialog from "../../components/Dialog/Dialog";
import { Divider } from "../../components/Divider/Divider";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import TextField from "../../components/Fields/TextField/TextField";
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
import PopoverHeaderContent from "../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../components/Popover/PopoverHeaderText";
import SelectList from "../../components/SelectList/SelectList";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import { users } from "../../data/users";
import { JOB_SERVICE } from "./jobData";
import { STATUS_TS } from "./jobState";
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
}

// Demo forms (realistic names from the design's Example forms; states cover
// the documented row variants). Forms are NOT sorted — shown in added order.
const INITIAL_FORMS: JobForm[] = [
  { id: 1, name: "Hot Side - Repair", template: "Hot Side - Repair", visibility: "public", state: "notStarted" },
  { id: 2, name: "Ice Machine - PM", template: "Ice Machine - PM", visibility: "public", state: "requiredService", requiredFor: JOB_SERVICE },
  { id: 3, name: "HVAC - PM", template: "HVAC - PM", visibility: "private", state: "inProgress" },
  { id: 4, name: "Ice Machine - Repair", template: "Ice Machine - Repair", visibility: "private", state: "completed" },
];

// The workspace's form templates = the "Add forms" list. STATIC — a template
// never leaves the list; every row tap adds one MORE copy to the job (the job
// can hold any number of copies). Includes the templates of the initial forms,
// so their counts show right away.
const FORM_TEMPLATES = [
  "Hot Side - Repair",
  "Ice Machine - PM",
  "HVAC - PM",
  "Ice Machine - Repair",
  "Fryer Inspection",
  "Walk-in Cooler - Audit",
  "Equipment Intake",
];

// The colleague editing the "in progress" form (live avatar, orange ring).
const LIVE_EDITOR = users[2];

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
      return `Progress saved by Name S. on ${STATUS_TS}`;
    case "completed":
      return `Completed by Name S. on ${STATUS_TS}`;
  }
};

// The 36px form avatar: state drives fill + icon (no addOn marks in the design).
const FormAvatar = ({ state }: { state: FormState }) => {
  const kind =
    state === "completed" ? styles.avatarCompleted : state === "inProgress" || state === "progressSaved" ? styles.avatarActive : styles.avatarDefault;
  const icon = state === "completed" ? "check-circle" : state === "inProgress" || state === "progressSaved" ? "timer" : "list";
  return (
    <span className={`${styles.avatar} ${kind}`}>
      <Icon icon={icon} pack="solid" size={16} />
    </span>
  );
};

// ---- the row + its context menu ---------------------------------------------

const FormRow = ({
  form,
  mobile,
  onRename,
  onDuplicate,
  onToggleVisibility,
  onRemove,
}: {
  form: JobForm;
  mobile: boolean;
  onRename: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
}) => {
  const menu = useAnchoredMenu(!mobile, "end");
  const required = form.state === "requiredService" || form.state === "requiredEquipment";
  const completed = form.state === "completed";
  const isPrivate = form.visibility === "private";

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

  // Menus per state (Figma 23899-17325 / 24225-20002 / 20204 / 20516):
  // completed adds Preview; required + completed forms have NO Remove group.
  const menuBody = (
    <>
      <MenuItemGroup>
        {item("Edit", "pen", noop)}
        {completed && item("Preview", "eye", noop)}
        {item("Rename", "text-size", onRename)}
        {item("Duplicate", "clone", onDuplicate)}
        {isPrivate
          ? item("Make public", "globe", onToggleVisibility, "Visible to your client")
          : item("Make private", "lock", onToggleVisibility, "Visible to team members only")}
      </MenuItemGroup>
      {!required && !completed && (
        <MenuItemGroup>{item("Remove", "xmark", onRemove)}</MenuItemGroup>
      )}
    </>
  );

  return (
    <>
      <ListItem
        variant="titleCaption"
        title={form.name}
        caption={caption(form)}
        avatar={<FormAvatar state={form.state} />}
        isDraggable
        slotRight={
          <span className={styles.rowRight}>
            {form.state === "inProgress" && (
              <Avatar type="live" content="image" size="sm" ringColor="orange" imageSrc={LIVE_EDITOR.avatar} />
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
            <DrawerHeader>
              <PopoverHeaderContent avatar={<FormAvatar state={form.state} />}>
                <PopoverHeaderText variant="title" title={form.name} />
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

export default function FormsModule({ mobile = false }: { mobile?: boolean }) {
  const [forms, setForms] = useState<JobForm[]>(INITIAL_FORMS);
  const [nextId, setNextId] = useState(100);
  const [addOpen, setAddOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<JobForm | null>(null);

  const publicForms = useMemo(() => forms.filter((f) => f.visibility === "public"), [forms]);
  const privateForms = useMemo(() => forms.filter((f) => f.visibility === "private"), [forms]);

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
  // Remove just deletes the copy — the template stays in the Add list (its
  // count drops), so nothing needs to "return to the pool" anymore.
  const remove = (form: JobForm) => setForms((prev) => prev.filter((f) => f.id !== form.id));
  // Add-list row tap: one MORE copy of the template (identical name, fresh id).
  const addForm = (template: string) => {
    setForms((prev) => [...prev, { id: nextId, name: template, template, visibility: "public", state: "notStarted" }]);
    setNextId((n) => n + 1);
  };
  // The Add-list minus: undo a misclick — removes the NEWEST not-started copy
  // of the template. Copies with progress are never removable from here.
  const removeCopy = (template: string) =>
    setForms((prev) => {
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].template === template && prev[i].state === "notStarted") {
          return [...prev.slice(0, i), ...prev.slice(i + 1)];
        }
      }
      return prev;
    });

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

  const rowActions = (f: JobForm) => ({
    onRename: () => setRenameTarget(f),
    onDuplicate: () => duplicate(f),
    onToggleVisibility: () => toggleVisibility(f),
    onRemove: () => remove(f),
  });

  const group = (visibility: "public" | "private", items: JobForm[], last: boolean) => (
    <ItemGroup
      divider={!last}
      onReorder={items.length > 1 ? reorderGroup(visibility) : undefined}
      label={
        <GroupLabel
          variant="primary"
          slotLeft={<Icon icon={visibility === "public" ? "globe" : "lock"} size={14} />}
          label={visibility === "public" ? "Public" : "Private"}
        />
      }
    >
      {items.length > 0 ? (
        items.map((f) => <FormRow key={f.id} form={f} mobile={mobile} {...rowActions(f)} />)
      ) : (
        <EmptyState caption={visibility === "public" ? "No public forms here yet" : "No private forms here yet"} />
      )}
    </ItemGroup>
  );

  return (
    <>
      <DisplayModule
        title="Forms"
        titleSlotRight={forms.length > 0 ? <Counter value={forms.length} /> : undefined}
        slotRight={
          <HoverTooltip text="Add forms">
            <IconButton icon="plus" variant="ghost" size="md" aria-label="Add forms" onClick={() => setAddOpen(true)} />
          </HoverTooltip>
        }
        content={
          forms.length === 0 ? (
            <EmptyState caption="No forms here yet" />
          ) : (
            <div className={styles.listBody}>
              {group("public", publicForms, false)}
              {group("private", privateForms, true)}
            </div>
          )
        }
      />

      {/* Add forms (Figma 24233-23359, reworked per Daniel 2026-07-22): an
          ACTION list, not a multi-select — the template pool is static, each
          row tap adds one MORE copy (any number allowed). The row's tag shows
          the job's copy count + a minus that removes the newest not-started
          copy (misclick undo). `multiSelect` on the SelectList only keeps it
          OPEN across taps (no checkboxes on the rows). */}
      <SelectList
        variant={mobile ? "drawer" : "dialog"}
        breakpoint={mobile ? "mobile" : "desktop"}
        title="Forms"
        open={addOpen}
        onClose={() => setAddOpen(false)}
        multiSelect
        searchable
        searchPlaceholder="Search by form name..."
      >
        <SelectListItemGroup>
          {FORM_TEMPLATES.map((name) => {
            const copies = forms.filter((f) => f.template === name);
            const removable = copies.some((f) => f.state === "notStarted");
            return (
              <SelectListItem
                key={name}
                label={name}
                className={styles.poolRow}
                onClick={() => addForm(name)}
                tag={
                  copies.length > 0 ? (
                    <span className={styles.poolTag}>
                      {removable && (
                        // The guard span keeps the minus from ALSO adding: the row
                        // activates on click AND on touch pointerup, and its Enter/
                        // Space keydown handler sits on the row div — so pointer
                        // events and those two keys must not bubble out of here.
                        <span
                          className={styles.minusGuard}
                          onPointerDown={(e) => e.stopPropagation()}
                          onPointerUp={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") e.stopPropagation();
                          }}
                        >
                          <IconButton
                            icon="minus"
                            variant="ghost"
                            size="xxxs"
                            aria-label={`Remove one "${name}" copy`}
                            noDebounce
                            onClick={() => removeCopy(name)}
                          />
                        </span>
                      )}
                      <Counter value={copies.length} />
                    </span>
                  ) : undefined
                }
              />
            );
          })}
        </SelectListItemGroup>
      </SelectList>

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
