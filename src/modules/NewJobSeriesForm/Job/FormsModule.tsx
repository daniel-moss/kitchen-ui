import { MouseEvent, useEffect, useState } from "react";

import Avatar from "../../../components/Avatar/Avatar";
import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import TextField from "../../../components/Fields/TextField/TextField";
import FormModule from "../../../components/FormModule/FormModule";
import GroupLabel from "../../../components/GroupLabel/GroupLabel";
import { Icon } from "../../../components/Icon/Icon";
import IconButton from "../../../components/IconButton/IconButton";
import ItemGroup from "../../../components/ItemGroup/ItemGroup";
import ListItem from "../../../components/ListItem/ListItem";
import Menu from "../../../components/Menu/Menu";
import MenuItem from "../../../components/Menu/MenuItem";
import MenuItemGroup from "../../../components/Menu/MenuItemGroup";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import SelectListFooter from "../../../components/SelectList/SelectListFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import { toast } from "../../../components/Toast/Toaster";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import { JOB_FORMS } from "../../../data/db";
import { useAnchoredMenu } from "../../shared/anchoredMenu";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

import { FormPick, FormsModuleProps, FormVisibility } from "./FormsModule.types";
import styles from "./FormsModule.module.scss";

// The "Forms" module of the "New Job" form (Figma 23837-19027) — the Job
// Details prototype's forms functionality (Daniel, 2026-09-08): the picks
// live in Public / Private groups, rows drag-reorder within their group and
// carry a ⋯ menu (Preview · Rename · Duplicate · Make public/private ·
// Remove) plus a direct ×; required picks cannot be removed. The ADD list is
// the staging pattern: counter rows + the actionBar's Add commits (new picks
// land in Public). The row click / Preview would open the read-only form
// preview — out of scope, so both are no-ops (flagged).

const formAvatar = <Avatar shape="square" content="icon" icon="clipboard-list-check" size="xl" />;

const nameOf = (pick: FormPick) => pick.customName ?? JOB_FORMS.find((row) => row.id === pick.formId)?.name ?? pick.formId;

// ---- one row (wrapper over ListItem + its menu; must forward the drag
// clone props — the FormRow lesson) ------------------------------------------

const FormRow = ({
  pick,
  mobile,
  draggable = false,
  isDragging,
  disabled,
  onRename,
  onDuplicate,
  onToggleVisibility,
  onRemove,
}: {
  pick: FormPick;
  mobile: boolean;
  draggable?: boolean;
  isDragging?: boolean;
  disabled?: boolean;
  onRename: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
}) => {
  const menu = useAnchoredMenu(!mobile);
  const isPrivate = pick.visibility === "private";
  const dragProps = draggable ? ({ isDraggable: true, isDragging } as const) : ({ isDraggable: false } as const);

  const item = (label: string, icon: string, onClick: () => void, caption?: string) => (
    <MenuItem
      label={label}
      caption={caption}
      slotLeft={<Icon icon={icon} container="square" />}
      onClick={() => {
        menu.close();
        onClick();
      }}
    />
  );

  const menuBody = (
    <>
      <MenuItemGroup>
        {item("Preview", "eye", () => {})}
        {item("Rename", "text-size", onRename)}
        {item("Duplicate", "clone", onDuplicate)}
        {isPrivate
          ? item("Make public", "globe", onToggleVisibility, "Visible to your client")
          : item("Make private", "lock", onToggleVisibility, "Visible to team members only")}
      </MenuItemGroup>
      {pick.requiredFor == null && <MenuItemGroup>{item("Remove", "xmark", onRemove)}</MenuItemGroup>}
    </>
  );

  const slotRight = (
    <>
      <IconButton
        icon="ellipsis"
        variant="ghost"
        size="md"
        aria-label={`${nameOf(pick)} actions`}
        isPressed={menu.open}
        noDebounce
        onClick={menu.onActions}
      />
      {pick.requiredFor == null && (
        <HoverTooltip text="Remove">
          <IconButton icon="xmark" variant="muted" size="md" aria-label={`Remove ${nameOf(pick)}`} onClick={onRemove} />
        </HoverTooltip>
      )}
    </>
  );

  const shared = { avatar: formAvatar, disabled, ...dragProps, slotRight, isClickable: true as const, onClick: () => {} };

  return (
    <>
      {pick.requiredFor != null ? (
        <ListItem variant="titleCaption" title={nameOf(pick)} caption={`Required for "${pick.requiredFor}"`} {...shared} />
      ) : (
        <ListItem variant="title" title={nameOf(pick)} {...shared} />
      )}
      {mobile ? (
        <Menu open={menu.open} onClose={menu.close} breakpoint="mobile">
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

// ---- rename dialog (the Job Details pattern) --------------------------------

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
  const submit = () => {
    if (name.trim() === "") {
      setShowError(true);
      return;
    }
    onRename(name.trim());
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
      <TextField
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setShowError(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
        }}
        isValid={!(showError && name.trim() === "")}
        errorMessage="Enter Name"
      />
    </Dialog>
  );
};

// ---- the module -------------------------------------------------------------

export default function FormsModule({ value, onChange, mobile }: FormsModuleProps) {
  const pop = useSelectPopover(mobile);
  const [staged, setStaged] = useState<Record<string, number>>({});
  const [renameTarget, setRenameTarget] = useState<FormPick | null>(null);
  const stagedTotal = Object.values(staged).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    if (!pop.open) setStaged({});
  }, [pop.open]);

  const options = [...JOB_FORMS].sort((a, b) => a.name.localeCompare(b.name));
  const publicPicks = value.filter((pick) => pick.visibility === "public");
  const privatePicks = value.filter((pick) => pick.visibility === "private");

  const stage = (formId: string) => setStaged((current) => ({ ...current, [formId]: (current[formId] ?? 0) + 1 }));
  const unstage = (formId: string) =>
    setStaged((current) => ({ ...current, [formId]: Math.max(0, (current[formId] ?? 0) - 1) }));
  const commitAdd = () => {
    const added: FormPick[] = Object.entries(staged).flatMap(([formId, count]) =>
      Array.from({ length: count }, (_, index) => ({
        key: `${formId}-${Date.now()}-${index}`,
        formId,
        visibility: "public" as const,
      })),
    );
    onChange([...value, ...added]);
    pop.close();
  };

  const duplicate = (pick: FormPick) => {
    const index = value.findIndex((row) => row.key === pick.key);
    const copy: FormPick = { key: `${pick.formId}-${Date.now()}`, formId: pick.formId, visibility: pick.visibility, customName: pick.customName };
    onChange([...value.slice(0, index + 1), copy, ...value.slice(index + 1)]);
    toast({ type: "success", variant: "detailed", title: "The form is duplicated", caption: nameOf(pick) });
  };

  const toggleVisibility = (pick: FormPick) => {
    const toPrivate = pick.visibility === "public";
    onChange(value.map((row) => (row.key === pick.key ? { ...row, visibility: toPrivate ? "private" : "public" } : row)));
    toast({
      type: "success",
      variant: "detailed",
      title: toPrivate ? "The form is now private" : "The form is now public",
      caption: nameOf(pick),
    });
  };

  const rename = (pick: FormPick, name: string) =>
    onChange(value.map((row) => (row.key === pick.key ? { ...row, customName: name } : row)));

  const remove = (pick: FormPick) => onChange(value.filter((row) => row.key !== pick.key));

  // Reorder within ONE visibility group, mapped back onto the full list.
  const reorderGroup = (visibility: FormVisibility) => (from: number, to: number) => {
    const group = value.filter((row) => row.visibility === visibility);
    const moved = [...group];
    const [row] = moved.splice(from, 1);
    moved.splice(to, 0, row);
    let cursor = 0;
    onChange(value.map((item) => (item.visibility === visibility ? moved[cursor++] : item)));
  };

  // Unlike Job Details, a group only shows when it HOLDS forms (Daniel,
  // 2026-09-08 — a New-Job-only rule).
  const group = (visibility: FormVisibility, picks: FormPick[], last: boolean) => {
    if (picks.length === 0) return null;
    const canDrag = picks.length > 1;
    return (
      <ItemGroup
        divider={!last}
        onReorder={canDrag ? reorderGroup(visibility) : undefined}
        label={
          <GroupLabel
            variant="primary"
            slotLeft={<Icon icon={visibility === "public" ? "globe" : "lock"} size={14} />}
            label={visibility === "public" ? "Public" : "Private"}
          />
        }
      >
        {picks.map((pick) => (
          <FormRow
            key={pick.key}
            pick={pick}
            mobile={mobile}
            draggable={canDrag}
            onRename={() => setRenameTarget(pick)}
            onDuplicate={() => duplicate(pick)}
            onToggleVisibility={() => toggleVisibility(pick)}
            onRemove={() => remove(pick)}
          />
        ))}
      </ItemGroup>
    );
  };

  return (
    <>
      <FormModule
        title="Forms"
        titleCondition="optional"
        caption="Forms the tech needs to fill out when completing the job"
      >
        <div className={styles.stack}>
          <SelectField
            multiSelect
            count={value.length}
            value={value.length === 1 ? nameOf(value[0]) : undefined}
            multiSelectLabel="Forms selected"
            onClearSelection={() => onChange(value.filter((pick) => pick.requiredFor != null))}
            open={pop.open}
            onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
          />
          {value.length > 0 && (
            <DisplayModule
              variant="bodyOnly"
              bodyPadded={false}
              content={
                <div>
                  {group("public", publicPicks, privatePicks.length === 0)}
                  {group("private", privatePicks, true)}
                </div>
              }
            />
          )}
        </div>
      </FormModule>

      {/* The ADD list — the Job Details staging pattern: counter rows +
          the actionBar Add; `multiSelect` only keeps the card open. */}
      <SelectPopoverList
        pop={pop}
        mobile={mobile}
        title="Forms"
        multiSelect
        searchable
        searchPlaceholder="Form..."
        noResultsCaption="Try a different search"
        footer={
          <SelectListFooter
            variant="actionBar"
            leadingButton={
              <Button size="lg" variant="ghost" onClick={() => pop.close()}>
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
          {options.map((form) => (
            <SelectListItem
              key={form.id}
              label={form.name}
              select="counter"
              count={staged[form.id] ?? 0}
              onDecrement={() => unstage(form.id)}
              onClick={() => stage(form.id)}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      {renameTarget != null && (
        <RenameForm
          key={renameTarget.key}
          open
          initial={nameOf(renameTarget)}
          onClose={() => setRenameTarget(null)}
          onRename={(name) => rename(renameTarget, name)}
          mobile={mobile}
        />
      )}
    </>
  );
}
