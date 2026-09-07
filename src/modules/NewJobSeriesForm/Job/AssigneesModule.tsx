import { MouseEvent } from "react";

import AvatarUser from "../../../components/Avatar/AvatarUser";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import FormModule from "../../../components/FormModule/FormModule";
import IconButton from "../../../components/IconButton/IconButton";
import ItemGroup from "../../../components/ItemGroup/ItemGroup";
import ListItem from "../../../components/ListItem/ListItem";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

import { usersSorted } from "./newJobData";
import styles from "./AssigneesModule.module.scss";

// Schedule step — the "Assignees" module (Figma 17241-71044): an optional
// multi-select of technicians. The list (23858-13516) is the techs pool A→Z
// with avatars; the picks render below as a card of static rows, in the
// order they were added — LATEST FIRST, no limit, no truncation (the dev
// notes). The row's × removes the pick and unticks it in the list.

export interface AssigneesModuleProps {
  /** Selected user ids, latest pick first. */
  value: number[];
  onChange: (next: number[]) => void;
  mobile: boolean;
}

export default function AssigneesModule({ value, onChange, mobile }: AssigneesModuleProps) {
  const pop = useSelectPopover(mobile);
  const pool = usersSorted();

  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter((row) => row !== id) : [id, ...value]);

  // The picked rows grow BELOW the trigger — the layout-freeze rule: they
  // hold still while the list is open and sync when it closes. The field's
  // own counter keeps updating live.
  const shown = pop.freeze(value);
  const shownUsers = shown.map((id) => pool.find((user) => user.id === id)).filter((user) => user != null);

  const single = value.length === 1 ? pool.find((user) => user.id === value[0]) : undefined;

  return (
    <FormModule title="Assignees" titleCondition="optional">
      <div className={styles.stack}>
        <SelectField
          multiSelect
          count={value.length}
          value={single?.name}
          multiSelectLabel="Assignees selected"
          onClearSelection={() => onChange([])}
          open={pop.open}
          onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
        />

        {shownUsers.length > 0 && (
          <DisplayModule
            variant="bodyOnly"
            bodyPadded={false}
            content={
              <ItemGroup>
                {shownUsers.map((user) => (
                  <ListItem
                    key={user.id}
                    variant="title"
                    title={user.name}
                    avatar={<AvatarUser size="xl" imageSrc={user.avatar} />}
                    slotRight={
                      <HoverTooltip text="Remove">
                        <IconButton
                          icon="xmark"
                          variant="muted"
                          size="md"
                          aria-label={`Remove ${user.name}`}
                          onClick={() => onChange(value.filter((row) => row !== user.id))}
                        />
                      </HoverTooltip>
                    }
                  />
                ))}
              </ItemGroup>
            }
          />
        )}

        <SelectPopoverList
          pop={pop}
          mobile={mobile}
          title="Assignees"
          multiSelect
          searchable
          searchPlaceholder="Assignee..."
          state={pool.length === 0 ? "empty" : undefined}
          emptyState={{ icon: "user", title: "No team members here yet" }}
        >
          <SelectListItemGroup>
            {pool.map((user) => (
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
    </FormModule>
  );
}
