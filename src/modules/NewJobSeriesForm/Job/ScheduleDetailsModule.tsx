import { MouseEvent } from "react";

import DateField from "../../../components/Fields/DateField/DateField";
import InputGroup from "../../../components/Fields/InputGroup/InputGroup";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import FormModule from "../../../components/FormModule/FormModule";
import Input from "../../../components/Input/Input";
import RadioGroup from "../../../components/Radio/RadioGroup";
import RadioItem from "../../../components/Radio/RadioItem";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import DurationField from "../../shared/DurationField";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

import { ScheduleDetailsModuleProps, ScheduleSelection } from "./ScheduleDetailsModule.types";
import styles from "./ScheduleDetailsModule.module.scss";

// Schedule step — the "Details" module (Figma 17241-67769): Schedule now /
// later radios ("now" selected by default; "later" = the job stays
// Unscheduled and the fields below disappear), the "Date & time" InputGroup
// (DateField + the time SelectField), and the required Duration (the shared
// hr/min + chips widget).

// Mobile shows the date compact — "Sun, Jan 1, 2026" (Daniel, 2026-09-08);
// desktop keeps the standard full format.
const COMPACT_DATE = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

// The platform's time list (the dev note): 15-minute steps, starting at
// 6:00 AM and wrapping past midnight to 5:45 AM — 96 options.
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const total = (6 * 60 + i * 15) % (24 * 60);
  const h24 = Math.floor(total / 60);
  const minute = String(total % 60).padStart(2, "0");
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${minute} ${h24 < 12 ? "AM" : "PM"}`;
});

/** "Schedule later" needs nothing; "now" needs the date, time and duration. */
export const isScheduleValid = (s: ScheduleSelection): boolean =>
  s.mode === "later" || (s.date != null && s.time != null && s.durationMinutes != null && s.durationMinutes > 0);

export default function ScheduleDetailsModule({ value, onChange, showErrors, mobile }: ScheduleDetailsModuleProps) {
  const timePop = useSelectPopover(mobile);

  const set = (changes: Partial<ScheduleSelection>) => onChange({ ...value, ...changes });

  const dateTimeMissing = value.date == null || value.time == null;
  const durationMissing = value.durationMinutes == null || value.durationMinutes === 0;

  return (
    <FormModule title="Details">
      <div className={styles.fields}>
        <RadioGroup
          orientation="horizontal"
          value={value.mode}
          onChange={(mode) => set({ mode: mode as ScheduleSelection["mode"] })}
        >
          <RadioItem value="now" label="Schedule now" />
          <RadioItem value="later" label="Schedule later" />
        </RadioGroup>

        {value.mode === "now" && (
          <>
            {/* One fused field, one shared error — "Provide Date & time"
                (the InputGroup default, from the label). */}
            <Input label="Date & time">
              <InputGroup isValid={!(showErrors && dateTimeMissing)}>
                <DateField
                  value={value.date}
                  onDateChange={(date) => set({ date })}
                  breakpoint={mobile ? "mobile" : "desktop"}
                  formatValue={mobile ? (date) => COMPACT_DATE.format(date) : undefined}
                />
                <SelectField
                  value={value.time ?? undefined}
                  open={timePop.open}
                  onClick={(event: MouseEvent<HTMLDivElement>) => timePop.toggle(event.currentTarget)}
                />
              </InputGroup>
            </Input>

            <Input label="Duration">
              <DurationField
                value={value.durationMinutes}
                onChange={(durationMinutes) => set({ durationMinutes })}
                mobile={mobile}
                isValid={!(showErrors && durationMissing)}
              />
            </Input>
          </>
        )}

        <SelectPopoverList pop={timePop} mobile={mobile} title="Time" searchable searchPlaceholder="Time...">
          <SelectListItemGroup>
            {TIME_OPTIONS.map((option) => (
              <SelectListItem
                key={option}
                variant="default"
                label={option}
                selected={value.time === option}
                onClick={() => set({ time: option })}
              />
            ))}
          </SelectListItemGroup>
        </SelectPopoverList>
      </div>
    </FormModule>
  );
}
