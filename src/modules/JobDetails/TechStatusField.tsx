import { MouseEvent } from "react";

import SelectField from "../../components/Fields/SelectField/SelectField";
import { Icon } from "../../components/Icon/Icon";
import Input from "../../components/Input/Input";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";

import { categoryIcon, techStatuses } from "./TimesheetPanel";

/** The DS RadioGroup holds up to 4 options; a longer list becomes a select. */
const MAX_CARDS = 4;

// "Your status" — the tech check-in status pick, ONE build for every form that
// asks it: Check in, the Time tracker drawer, the Time session form and the
// Check In / Out control (2026-11-12, when the statuses became a company
// setting).
//
// Up to 4 statuses it is the designed stack of card radios (Figma 24105-15772).
// A company can add more, and the DS RadioGroup is for "up to 4 options", so
// from 5 it becomes a SelectField over a SelectList — Daniel's call. Renders
// nothing when the company has the statuses off; the caller skips its
// validation then too.
export default function TechStatusField({
  value,
  onChange,
  isValid = true,
  errorMessage = "Choose your status",
  mobile = false,
}: {
  value: string;
  onChange: (status: string) => void;
  isValid?: boolean;
  errorMessage?: string;
  mobile?: boolean;
}) {
  const statuses = techStatuses();
  const pop = useSelectPopover(mobile);
  if (statuses.length === 0) return null;

  if (statuses.length <= MAX_CARDS) {
    return (
      <Input label="Your status">
        <RadioGroup value={value} onChange={onChange} isValid={isValid} errorMessage={errorMessage}>
          {statuses.map((s) => (
            <RadioItem key={s.value} value={s.value} variant="card" icon={s.icon} iconPack="regular" label={s.value} />
          ))}
        </RadioGroup>
      </Input>
    );
  }

  return (
    <>
      <Input label="Your status">
        <SelectField
          value={value === "" ? undefined : value}
          slotLeft={value === "" ? undefined : <Icon icon={categoryIcon(value)} size={14} container="square" />}
          open={pop.open}
          onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
          isValid={isValid}
          errorMessage={errorMessage}
        />
      </Input>
      <SelectPopoverList pop={pop} mobile={mobile} title="Your status">
        <SelectListItemGroup>
          {statuses.map((s) => (
            <SelectListItem
              key={s.value}
              label={s.value}
              slotLeft={<Icon icon={s.icon} size={14} container="square" />}
              selected={s.value === value}
              onClick={() => {
                onChange(s.value);
                pop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
}
