import { MouseEvent, useEffect, useState } from "react";

import Avatar from "../components/Avatar/Avatar";
import Button from "../components/Button/Button";
import Dialog from "../components/Dialog/Dialog";
import SelectField from "../components/Fields/SelectField/SelectField";
import TextField from "../components/Fields/TextField/TextField";
import FormModule from "../components/FormModule/FormModule";
import { Icon } from "../components/Icon/Icon";
import IconButton from "../components/IconButton/IconButton";
import Input from "../components/Input/Input";
import ItemGroup from "../components/ItemGroup/ItemGroup";
import ListItem from "../components/ListItem/ListItem";
import PopoverFooter from "../components/Popover/PopoverFooter";
import SelectListItem from "../components/SelectList/SelectListItem";
import SelectListItemGroup from "../components/SelectList/SelectListItemGroup";
import ToggleItem from "../components/Toggle/ToggleItem";
import HoverTooltip from "../components/Tooltip/HoverTooltip";
import { TechStatus } from "../data/db";
import { SelectPopoverList, useSelectPopover } from "../modules/shared/selectPopover";

import { useCompanySettings } from "./store/CompanySettingsStore";

import styles from "./DemoSettingsPage.module.scss";

// The "Tech check-in statuses" section of the Demo settings page (Daniel,
// 2026-11-12). Every company starts with the same four; it can add, rename,
// remove and reorder them, or turn the feature off. Reorder = drag (the
// ItemGroup's own gesture); a row click edits; the × removes. While the
// feature is on the list keeps at least one status.

/** The icons a status can wear — a short pick, not the whole icon font. */
const STATUS_ICONS: { icon: string; label: string }[] = [
  { icon: "clipboard-list-check", label: "Checklist" },
  { icon: "van", label: "Van" },
  { icon: "truck", label: "Truck" },
  { icon: "car", label: "Car" },
  { icon: "wrench-simple", label: "Wrench" },
  { icon: "screwdriver-wrench", label: "Tools" },
  { icon: "toolbox", label: "Toolbox" },
  { icon: "cart-flatbed-boxes", label: "Parts cart" },
  { icon: "box-open", label: "Box" },
  { icon: "warehouse", label: "Warehouse" },
  { icon: "magnifying-glass", label: "Inspection" },
  { icon: "file-lines", label: "Paperwork" },
  { icon: "phone", label: "Phone" },
  { icon: "user-helmet-safety", label: "Safety" },
  { icon: "broom", label: "Cleaning" },
  { icon: "mug-hot", label: "Break" },
];

const iconLabel = (icon: string) => STATUS_ICONS.find((entry) => entry.icon === icon)?.label ?? icon;

const statusAvatar = (icon: string) => <Avatar shape="square" content="icon" icon={icon} size="xl" />;

/** Add (no `status`) or edit one status: its name and its icon. */
function StatusDialog({
  open,
  status,
  takenNames,
  mobile,
  onClose,
  onSave,
}: {
  open: boolean;
  status?: TechStatus;
  /** The OTHER statuses' names — a name must be unique. */
  takenNames: string[];
  mobile: boolean;
  onClose: () => void;
  onSave: (name: string, icon: string) => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);
  const pop = useSelectPopover(mobile);

  useEffect(() => {
    if (!open) return;
    setName(status?.name ?? "");
    setIcon(status?.icon);
    setSubmitted(false);
  }, [open, status]);

  const trimmed = name.trim();
  const nameError =
    trimmed === ""
      ? "Enter name"
      : takenNames.some((taken) => taken.toLowerCase() === trimmed.toLowerCase())
        ? "This status already exists"
        : undefined;
  const dirty = trimmed !== (status?.name ?? "") || icon !== status?.icon;

  const save = () => {
    if (nameError != null || icon == null) {
      setSubmitted(true);
      return;
    }
    onSave(trimmed, icon);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={status == null ? "New status" : "Edit status"}
        breakpoint={mobile ? "mobile" : "desktop"}
        confirmOnDismiss={dirty}
        footer={
          <PopoverFooter
            leadingButton={
              <Button size="lg" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            }
          >
            <Button size="lg" variant="solid" onClick={save}>
              {status == null ? "Add" : "Save"}
            </Button>
          </PopoverFooter>
        }
      >
        <Input label="Name">
          <TextField
            value={name}
            onChange={(event) => setName(event.target.value)}
            isValid={!(submitted && nameError != null)}
            errorMessage={nameError}
          />
        </Input>
        <Input label="Icon">
          <SelectField
            value={icon == null ? undefined : iconLabel(icon)}
            slotLeft={icon == null ? undefined : <Icon icon={icon} size={14} container="square" />}
            open={pop.open}
            onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
            isValid={!(submitted && icon == null)}
          />
        </Input>
      </Dialog>
      <SelectPopoverList pop={pop} mobile={mobile} title="Icon">
        <SelectListItemGroup>
          {STATUS_ICONS.map((entry) => (
            <SelectListItem
              key={entry.icon}
              label={entry.label}
              slotLeft={<Icon icon={entry.icon} size={14} container="square" />}
              selected={entry.icon === icon}
              onClick={() => {
                setIcon(entry.icon);
                pop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
}

export default function TechStatusesSettings({ mobile }: { mobile: boolean }) {
  const { settings, update } = useCompanySettings();
  const statuses = settings.techStatuses;
  const enabled = settings.techStatusesEnabled;
  // undefined = closed; null = adding; a status = editing it.
  const [editing, setEditing] = useState<TechStatus | null | undefined>(undefined);

  const setStatuses = (next: TechStatus[]) => update({ techStatuses: next });

  const reorder = (from: number, to: number) => {
    const next = [...statuses];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setStatuses(next);
  };

  const save = (name: string, icon: string) => {
    if (editing == null) {
      const id = `status-${Date.now().toString(36)}`;
      setStatuses([...statuses, { id, name, icon }]);
    } else {
      setStatuses(statuses.map((s) => (s.id === editing.id ? { ...s, name, icon } : s)));
    }
  };

  const lastOne = statuses.length <= 1;

  return (
    <FormModule
      title="Tech check-in statuses"
      caption="What a tech is doing while checked in. Past sessions keep the name they were logged under"
    >
      <ToggleItem
        label="Tech check-in statuses"
        caption="Off: checking in asks nothing, and sessions carry no status"
        checked={enabled}
        onChange={(event) => update({ techStatusesEnabled: event.target.checked })}
      />
      {enabled && (
        <div className={styles.statusList}>
          <ItemGroup onReorder={reorder}>
            {statuses.map((status) => (
              <ListItem
                key={status.id}
                variant="title"
                title={status.name}
                avatar={statusAvatar(status.icon)}
                isDraggable
                isClickable
                onClick={() => setEditing(status)}
                slotRight={
                  <HoverTooltip text={lastOne ? "Keep at least one status" : "Remove"}>
                    <IconButton
                      icon="xmark"
                      variant="muted"
                      size="md"
                      aria-label={`Remove ${status.name}`}
                      isDisabled={lastOne}
                      onClick={() => setStatuses(statuses.filter((s) => s.id !== status.id))}
                    />
                  </HoverTooltip>
                }
              />
            ))}
          </ItemGroup>
          <Button size="lg" variant="subtle" leftIcon="plus" onClick={() => setEditing(null)}>
            Add status
          </Button>
        </div>
      )}
      <StatusDialog
        open={editing !== undefined}
        status={editing ?? undefined}
        takenNames={statuses.filter((s) => s.id !== editing?.id).map((s) => s.name)}
        mobile={mobile}
        onClose={() => setEditing(undefined)}
        onSave={save}
      />
    </FormModule>
  );
}
