import { MouseEvent } from "react";

import Badge from "../../components/Badge/Badge";
import AvatarUser from "../../components/Avatar/AvatarUser";
import SelectField from "../../components/Fields/SelectField/SelectField";
import Input from "../../components/Input/Input";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { users } from "../../data/users";

import { SelectPopoverList, useSelectPopover } from "./selectPopover";
import styles from "./AssigneesField.module.scss";

// The "Assignees" input (New Job Figma 17241-71044, reused by Job Details'
// "Reschedule job" form 27091-45839): an optional multi-select of techs. The
// list is the techs pool A→Z with avatars; the picks show BELOW the field as
// dismissable lg Badges with the tech's avatar — in the order they were added,
// LATEST FIRST, every one of them (no truncation). A badge's × removes the
// pick and unticks it in the list.

const pool = () => [...users].sort((a, b) => a.name.localeCompare(b.name));

export interface AssigneesFieldProps {
  /** Selected user ids, latest pick first. */
  value: number[];
  onChange: (next: number[]) => void;
  mobile: boolean;
  /**
   * Wraps the field in an Input labelled "Assignees (optional)". The New Job
   * form leaves it out — its FormModule already carries that title.
   */
  showLabel?: boolean;
}

export default function AssigneesField({ value, onChange, mobile, showLabel = false }: AssigneesFieldProps) {
  const pop = useSelectPopover(mobile);
  const techs = pool();

  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter((row) => row !== id) : [id, ...value]);

  // The badges grow BELOW the trigger — the layout-freeze rule: they hold
  // still while the list is open and sync when it closes. The field's own
  // counter keeps updating live.
  const shown = pop.freeze(value);
  const shownUsers = shown.map((id) => techs.find((user) => user.id === id)).filter((user) => user != null);

  const single = value.length === 1 ? techs.find((user) => user.id === value[0]) : undefined;

  const field = (
    <SelectField
      multiSelect
      count={value.length}
      value={single?.name}
      multiSelectLabel="Assignees selected"
      onClearSelection={() => onChange([])}
      open={pop.open}
      onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
    />
  );

  return (
    <div className={styles.stack}>
      {showLabel ? (
        <Input label="Assignees" labelCondition="optional">
          {field}
        </Input>
      ) : (
        field
      )}

      {shownUsers.length > 0 && (
        <div className={styles.badges}>
          {shownUsers.map((user) => (
            <Badge
              key={user.id}
              size="lg"
              avatarSrc={user.avatar}
              isDismissable
              onDismiss={() => onChange(value.filter((row) => row !== user.id))}
            >
              {user.name}
            </Badge>
          ))}
        </div>
      )}

      <SelectPopoverList
        pop={pop}
        mobile={mobile}
        title="Assignees"
        multiSelect
        searchable
        searchPlaceholder="Assignee..."
        state={techs.length === 0 ? "empty" : undefined}
        emptyState={{ icon: "user", title: "No team members here yet" }}
      >
        <SelectListItemGroup>
          {techs.map((user) => (
            <SelectListItem
              key={user.id}
              variant="default"
              label={user.name}
              slotLeft={<AvatarUser size="xs" imageSrc={user.avatar} />}
              selected={value.includes(user.id)}
              onClick={() => toggle(user.id)}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </div>
  );
}
