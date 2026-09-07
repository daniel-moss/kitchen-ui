import { ChangeEvent, MouseEvent } from "react";

import Chip from "../../components/Chip/Chip";
import ChipGroup from "../../components/Chip/ChipGroup";
import SelectField from "../../components/Fields/SelectField/SelectField";
import InputGroup from "../../components/Fields/InputGroup/InputGroup";
import TextField from "../../components/Fields/TextField/TextField";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";

import { SelectPopoverList, useSelectPopover } from "./selectPopover";
import styles from "./DurationField.module.scss";

// The duration widget shared by the "New Service" form and the Schedule
// step's Details module (Figma 17205-69539 / 17241-70803): an InputGroup of
// an hours TextField ("hr") and a minutes SelectField ("min"), plus the
// quick-pick chips of the most frequent durations. The value is total
// minutes; null = untouched.

const MINUTE_OPTIONS = [0, 15, 30, 45];
const PRESETS = [30, 60, 90, 120, 150];

const presetLabel = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

export interface DurationFieldProps {
  /** Total minutes; null = not set. */
  value: number | null;
  onChange: (minutes: number | null) => void;
  /** Mobile presentation (minutes drawer). */
  mobile: boolean;
  /**
   * false → the group's error treatment + "Provide [Label]" below (from the
   * surrounding Input's label). The Schedule step requires a duration; the
   * "New Service" form leaves it optional. Default true.
   */
  isValid?: boolean;
}

export default function DurationField({ value, onChange, mobile, isValid = true }: DurationFieldProps) {
  const minutesPop = useSelectPopover(mobile);

  const hours = value != null ? Math.floor(value / 60) : null;
  const minutes = value != null ? value % 60 : 0;

  const handleHours = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 2);
    if (digits === "" && minutes === 0) {
      onChange(null);
      return;
    }
    onChange((digits === "" ? 0 : parseInt(digits, 10)) * 60 + minutes);
  };

  return (
    <div className={styles.stack}>
      <InputGroup isValid={isValid}>
        <TextField value={hours != null && hours > 0 ? String(hours) : ""} onChange={handleHours} suffix="hr" keyboard="tel" />
        <SelectField
          value={String(minutes).padStart(2, "0")}
          suffix="min"
          open={minutesPop.open}
          onClick={(event: MouseEvent<HTMLDivElement>) => minutesPop.toggle(event.currentTarget)}
        />
      </InputGroup>
      <ChipGroup>
        {PRESETS.map((preset) => (
          <Chip key={preset} isSelected={value === preset} onClick={() => onChange(preset)}>
            {presetLabel(preset)}
          </Chip>
        ))}
      </ChipGroup>

      <SelectPopoverList pop={minutesPop} mobile={mobile} title="Minutes">
        <SelectListItemGroup>
          {MINUTE_OPTIONS.map((option) => (
            <SelectListItem
              key={option}
              variant="default"
              label={String(option).padStart(2, "0")}
              selected={minutes === option && value != null}
              onClick={() => onChange((hours ?? 0) * 60 + option)}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </div>
  );
}
