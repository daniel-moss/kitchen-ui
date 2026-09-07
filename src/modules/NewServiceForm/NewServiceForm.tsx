import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextField from "../../components/Fields/TextField/TextField";
import { Icon } from "../../components/Icon/Icon";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import useIsDesktop from "../../hooks/useIsDesktop";

import DurationField from "../shared/DurationField";
import { PRIORITY_OPTIONS, priorityOf } from "../shared/priority";
import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";

import { NewServiceFormProps } from "./NewServiceForm.types";
import styles from "./NewServiceForm.module.scss";

// The "New service" form (Figma 17205-69539) — a reusable module, like
// NewLocationForm / NewEquipmentForm (Daniel, 2026-09-08). Name and Default
// priority are required (a service cannot be created without a priority);
// Duration is optional — the shared hr/min widget with the quick-pick chips.

const PRIORITY_HINT =
  "When this service is selected, the priority is filled in with this value. It can still be changed.";
const DURATION_HINT =
  "When this service is selected, the duration is filled in with this value. It can still be changed.";

export default function NewServiceForm({ open, onClose, onCreated, breakpoint = "auto" }: NewServiceFormProps) {
  const isDesktop = useIsDesktop(breakpoint);
  const [name, setName] = useState("");
  const [priority, setPriority] = useState<1 | 2 | 3 | 4 | null>(null);
  const [priorityPicked, setPriorityPicked] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const priorityPop = useSelectPopover(!isDesktop);

  useEffect(() => {
    if (!open) {
      setName("");
      setPriority(null);
      setPriorityPicked(false);
      setDuration(null);
      setShowErrors(false);
    }
  }, [open]);

  const create = () => {
    if (name.trim() === "" || !priorityPicked) {
      setShowErrors(true);
      return;
    }
    const trimmed = name.trim();
    onCreated?.({
      id: `created-${Date.now()}`,
      name: trimmed,
      defaultPriority: priority,
      defaultDurationMinutes: duration ?? undefined,
    });
    toast({ type: "success", variant: "detailed", title: "Service created", caption: trimmed });
    onClose();
  };

  const priorityDef = priorityOf(priority);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New service"
      breakpoint={breakpoint}
      confirmOnDismiss={name.trim() !== "" || priorityPicked || duration != null}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={create}>
            Create
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        <Input label="Name">
          <TextField
            value={name}
            onChange={(event) => setName(event.target.value)}
            isValid={!(showErrors && name.trim() === "")}
          />
        </Input>
        <Input label="Default priority" labelHintContent={PRIORITY_HINT}>
          <SelectField
            value={priorityPicked ? priorityDef.label : undefined}
            slotLeft={
              priorityPicked ? (
                <Icon
                  icon={priorityDef.icon}
                  pack={priorityDef.pack}
                  size={14}
                  container="square"
                  className={priorityDef.isUrgent ? styles.urgent : undefined}
                />
              ) : undefined
            }
            open={priorityPop.open}
            isValid={!(showErrors && !priorityPicked)}
            onClick={(event: MouseEvent<HTMLDivElement>) => priorityPop.toggle(event.currentTarget)}
          />
        </Input>
        <Input label="Duration" labelCondition="optional" labelHintContent={DURATION_HINT}>
          <DurationField value={duration} onChange={setDuration} mobile={!isDesktop} />
        </Input>
      </div>

      <SelectPopoverList pop={priorityPop} mobile={!isDesktop} title="Default priority">
        <SelectListItemGroup>
          {PRIORITY_OPTIONS.map((option) => {
            const def = priorityOf(option);
            return (
              <SelectListItem
                key={def.label}
                variant="default"
                label={def.label}
                slotLeft={
                  <Icon
                    icon={def.icon}
                    pack={def.pack}
                    size={14}
                    container="square"
                    className={def.isUrgent ? styles.urgent : undefined}
                  />
                }
                selected={priorityPicked && priority === option}
                onClick={() => {
                  setPriority(option);
                  setPriorityPicked(true);
                }}
              />
            );
          })}
        </SelectListItemGroup>
      </SelectPopoverList>
    </Dialog>
  );
}
