import { MouseEvent, useEffect, useState } from "react";

import AvatarUser from "../../components/Avatar/AvatarUser";
import Badge from "../../components/Badge/Badge";
import Button from "../../components/Button/Button";
import EmptyState from "../../components/EmptyState/EmptyState";
import SelectField from "../../components/Fields/SelectField/SelectField";
import Input from "../../components/Input/Input";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
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
//
// The list (Figma 23858-13516): multi-select CHECKBOX rows with the tech's
// avatar, A→Z, a search ("Assignee..."). On DESKTOP every tick applies at
// once; on MOBILE the ticks are held until the full-width "Apply" (always
// shown) — closing the drawer any other way drops them. Empty: "No assignees";
// no match: "No assignees match".

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

  // Mobile holds the ticks here until "Apply"; every open starts from the
  // field's own value.
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (pop.open) setDraft(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pop.open]);
  const ticked = mobile ? draft : value;

  const toggle = (id: number) => {
    const next = ticked.includes(id) ? ticked.filter((row) => row !== id) : [id, ...ticked];
    if (mobile) setDraft(next);
    else onChange(next);
  };
  const apply = () => {
    onChange(draft);
    pop.close();
  };

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
        emptyState={{ caption: "No assignees" }}
        noResultsState={<EmptyState caption="No assignees match" />}
        footer={
          mobile && techs.length > 0 ? (
            <SelectListFooter variant="actionBar" stretch>
              <Button size="lg" variant="solid" onClick={apply}>
                Apply
              </Button>
            </SelectListFooter>
          ) : undefined
        }
      >
        <SelectListItemGroup>
          {techs.map((user) => (
            <SelectListItem
              key={user.id}
              variant="default"
              select="multi"
              label={user.name}
              slotLeft={<AvatarUser size="xs" imageSrc={user.avatar} />}
              selected={ticked.includes(user.id)}
              onClick={() => toggle(user.id)}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </div>
  );
}
