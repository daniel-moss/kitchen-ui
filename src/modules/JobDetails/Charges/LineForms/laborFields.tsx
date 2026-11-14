import CheckboxItem from "../../../../components/Checkbox/CheckboxItem";
import DateField from "../../../../components/Fields/DateField/DateField";
import InputGroup from "../../../../components/Fields/InputGroup/InputGroup";
import Input from "../../../../components/Input/Input";
import RadioGroup from "../../../../components/Radio/RadioGroup";
import RadioItem from "../../../../components/Radio/RadioItem";
import { COMPANY, LABOR_SUBTYPES } from "../../../../data/db";
import type { Job, LaborItem, LaborLine } from "../../../../data/db";
import { Breakpoint } from "../../../../hooks/useIsDesktop";
import { formatCompactDate } from "../../../../utils/calendar";
import { isBlank, numberOf } from "../../../Product/NewProductForm/productRules";
import { SubtypeField } from "../../../shared/pricebookFields";

import { costMismatchHelp, dayOf, hoursHelpText, isoOf, MoneyInput, moneyText, numberText, NumberInput } from "./lineFormParts";
import styles from "./LineForms.module.scss";

// A labor rate line's INPUTS, built once. The one-dialog form (./LaborLineForm)
// and the side panel's per-module dialogs (the frozen Concept 3 panels in ../../ChargesModule/LinePanels) group
// them differently — the inputs and their rules are the same everywhere.
//
//   Subtype          pre-filled from the rate when it has one.
//   Service date     (Figma 29380-43151, 2026-11-14) ONE DateField + an inline
//                    "Multi-day job" checkbox 12px below, off by default.
//                    Pre-selected from the job's "Scheduled for" day, with the
//                    help text "Pre-selected based on "Scheduled for" date"
//                    while Start is still that day (End is never
//                    pre-selected); empty when the job has no "Scheduled
//                    for". Full date with weekday on both breakpoints.
//                    Missing on submit: "Choose Service date".
//   Service dates    "Multi-day job" ticked: an InputGroup of two DateFields —
//                    Start, End (placeholders "Start date" / "End date"; the
//                    single field has none). Ticking starts End EMPTY (Figma
//                    29380-43152, 2026-11-14). End must be AFTER Start — the
//                    picker disables Start's day and every day before it,
//                    and a typed End on or before Start is dropped. A Start
//                    on or after End moves End to the day after Start
//                    (Daniel, 2026-11-14). Either one missing on
//                    submit: the whole group in error, "Provide Service
//                    dates". Full dates on desktop, compact on mobile.
//                    Unticking keeps Start only. A saved line with two
//                    different days opens ticked.
//   Type             Hourly / Flat cards — pre-selected from the rate. Hourly
//                    adds "per hour" to Cost and Price, and the Hours field.
//   Cost / Price     the "New labor rate" form's money fields; both required.
//                    Cost changed away from the pricebook's shows the mismatch
//                    help text; Price under Cost warns "Less than cost".
//   Hours            Hourly only; required, more than 0 — both checked on
//                    submit. Empty by default; the help text shows the job's
//                    estimated duration and the time logged so far.

export interface LaborValues {
  subtypeId: string | null;
  start: Date | null;
  /** Equals `start` while `multiDay` is off. */
  end: Date | null;
  /** "Multi-day job" — Start + End instead of one date. */
  multiDay: boolean;
  type: LaborLine["type"];
  cost: string;
  price: string;
  hours: string;
  description: string;
  equipmentId?: string;
  technicianId?: number;
}

/** What the inputs open with — the line's values, or the rate as a template. */
export const laborValuesOf = (job: Job, rate: LaborItem, line: LaborLine | null | undefined): LaborValues =>
  line != null
    ? {
        subtypeId: line.subtypeId,
        start: dayOf(line.serviceStart),
        end: dayOf(line.serviceEnd),
        multiDay: dayOf(line.serviceStart)?.getTime() !== dayOf(line.serviceEnd)?.getTime(),
        type: line.type,
        cost: moneyText(line.cost),
        price: moneyText(line.price),
        hours: numberText(line.hours),
        description: line.description,
        equipmentId: line.equipmentId,
        technicianId: line.technicianId,
      }
    : {
        subtypeId: rate.subtypeId ?? null,
        start: dayOf(job.scheduledFor),
        end: dayOf(job.scheduledFor),
        multiDay: false,
        type: rate.unitType === "hourly" ? "hourly" : "flat",
        cost: moneyText(rate.cost),
        price: moneyText(rate.rate),
        hours: "",
        description: rate.description,
      };

export const sameLaborValues = (a: LaborValues, b: LaborValues) =>
  JSON.stringify({ ...a, start: a.start?.getTime(), end: a.end?.getTime() }) === JSON.stringify({ ...b, start: b.start?.getTime(), end: b.end?.getTime() });

/** The line the inputs describe. */
export const laborLineOf = (values: LaborValues): LaborLine => ({
  type: values.type,
  subtypeId: values.subtypeId,
  cost: numberOf(values.cost),
  price: numberOf(values.price),
  hours: values.type === "hourly" ? numberOf(values.hours) : undefined,
  serviceStart: isoOf(values.start),
  serviceEnd: isoOf(values.multiDay ? values.end : values.start),
  equipmentId: values.equipmentId,
  technicianId: values.technicianId,
  description: values.description.trim(),
});

/** What blocks each group of inputs from saving. */
export function laborProblems(values: LaborValues) {
  const hourly = values.type === "hourly";
  const missingDates = values.start == null || (values.multiDay && values.end == null);
  const missingCost = isBlank(values.cost);
  const missingPrice = isBlank(values.price);
  const missingHours = hourly && isBlank(values.hours);
  const zeroHours = hourly && !missingHours && numberOf(values.hours) <= 0;
  return {
    missingDates,
    missingCost,
    missingPrice,
    missingHours,
    zeroHours,
    general: missingDates,
    pricing: missingCost || missingPrice || missingHours || zeroHours,
  };
}

// Compares CALENDAR days — a typed date can carry a time of day (Chrono
// parses "11/14/2026" to noon), which would make it "after" the same day.
const dayNumber = (date: Date) => date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();

interface FieldsProps {
  job: Job;
  values: LaborValues;
  set: (patch: Partial<LaborValues>) => void;
  /** The submit button was pressed — the missing-value errors show. */
  showErrors: boolean;
}

/** Subtype + Service date (or dates, for a multi-day job). */
export function LaborGeneralFields({
  job,
  values,
  set,
  showErrors,
  mobile,
  breakpoint,
  hasSubtypes = true,
}: FieldsProps & {
  mobile: boolean;
  breakpoint?: Breakpoint;
  /** False: the company does not use subtypes, so the field is not drawn. */
  hasSubtypes?: boolean;
}) {
  const scheduled = dayOf(job.scheduledFor);
  // "Help text hides when a user changes pre-selected date(s)." Only Start
  // is pre-selected — End starts empty.
  const preselected = scheduled != null && values.start != null && dayNumber(values.start) === dayNumber(scheduled);
  // End must be after Start: the earliest End is the day after Start.
  const dayAfterStart =
    values.start != null ? new Date(values.start.getFullYear(), values.start.getMonth(), values.start.getDate() + 1) : undefined;
  const helpText = preselected ? 'Pre-selected based on "Scheduled for" date' : undefined;
  const missing = showErrors && laborProblems(values).missingDates;

  return (
    <>
      <SubtypeField
        subtypes={hasSubtypes ? LABOR_SUBTYPES : []}
        required={COMPANY.requireSubtypes}
        value={values.subtypeId}
        onChange={(subtypeId) => set({ subtypeId })}
        showErrors={showErrors}
        mobile={mobile}
      />

      {/* The date input + the "Multi-day job" checkbox, 12px apart (the
          node's "Service Date" frame). */}
      <div className={styles.serviceDate}>
        {values.multiDay ? (
          <Input label="Service dates" helpText={helpText}>
            <InputGroup isValid={!missing}>
              <DateField
                value={values.start}
                onDateChange={(start) =>
                  // A Start on or after End moves End to the day after Start
                  // (End must be later — Daniel, 2026-11-14).
                  set({
                    start,
                    end:
                      start != null && values.end != null && dayNumber(start) >= dayNumber(values.end)
                        ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)
                        : values.end,
                  })
                }
                placeholder="Start date"
                pickerLabel="Start date"
                formatValue={mobile ? formatCompactDate : undefined}
                breakpoint={breakpoint}
              />
              <DateField
                value={values.end}
                onDateChange={(end) => {
                  // A TYPED End on or before Start is dropped — the picker
                  // already disables those days, typing skips the picker.
                  if (end != null && values.start != null && dayNumber(end) <= dayNumber(values.start)) return;
                  set({ end });
                }}
                minDate={dayAfterStart}
                placeholder="End date"
                pickerLabel="End date"
                formatValue={mobile ? formatCompactDate : undefined}
                breakpoint={breakpoint}
              />
            </InputGroup>
          </Input>
        ) : (
          <Input label="Service date" helpText={helpText}>
            <DateField value={values.start} onDateChange={(start) => set({ start, end: start })} isValid={!missing} breakpoint={breakpoint} />
          </Input>
        )}
        <CheckboxItem
          label="Multi-day job"
          checked={values.multiDay}
          // On: End starts empty. Off: one date again.
          onChange={(event) => set({ multiDay: event.target.checked, end: event.target.checked ? null : values.start })}
        />
      </div>
    </>
  );
}

interface PricingFieldsProps extends FieldsProps {
  /** The pricebook rate — what the Cost help text compares with. */
  rate: LaborItem;
  /** The user typed in Cost since the inputs opened. */
  costChanged: boolean;
  onCostChanged: () => void;
  /** "Click here" in the Cost help text — opens the rate's side panel. */
  onOpenRate?: () => void;
}

/** Type + Cost + Price + Hours. */
export function LaborPricingFields({ job, rate, values, set, showErrors, costChanged, onCostChanged, onOpenRate }: PricingFieldsProps) {
  const hourly = values.type === "hourly";
  const problems = laborProblems(values);
  const costMismatch = costChanged && !problems.missingCost && numberOf(values.cost) !== rate.cost;
  const belowCost = !problems.missingCost && !problems.missingPrice && numberOf(values.price) < numberOf(values.cost);

  return (
    <>
      <Input label="Type">
        <RadioGroup orientation="horizontal" value={values.type} onChange={(type) => set({ type: type as LaborLine["type"] })}>
          <RadioItem value="hourly" label="Hourly" />
          <RadioItem value="flat" label="Flat" />
        </RadioGroup>
      </Input>

      <MoneyInput
        label="Cost"
        value={values.cost}
        onChange={(cost) => {
          if (cost !== values.cost) onCostChanged();
          set({ cost });
        }}
        perHour={hourly}
        isValid={!(showErrors && problems.missingCost)}
        helpText={costMismatch ? costMismatchHelp(onOpenRate) : undefined}
        helpTextStatus="info"
      />

      <MoneyInput
        label="Price"
        value={values.price}
        onChange={(price) => set({ price })}
        perHour={hourly}
        isValid={!(showErrors && problems.missingPrice)}
        helpText={belowCost ? "Less than cost" : undefined}
        helpTextStatus="warning"
      />

      {hourly && (
        <NumberInput
          label="Hours"
          value={values.hours}
          onChange={(hours) => set({ hours })}
          isValid={!(showErrors && (problems.missingHours || problems.zeroHours))}
          errorMessage={problems.zeroHours ? "Must be greater than 0" : undefined}
          helpText={hoursHelpText(job)}
        />
      )}
    </>
  );
}
