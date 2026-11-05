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

// A labor rate line's INPUTS, built once. The one-dialog form (./LaborLineForm)
// and the side panel's per-module dialogs (../LinePanels/LaborLinePanel) group
// them differently — the inputs and their rules are the same everywhere.
//
//   Subtype          pre-filled from the rate when it has one.
//   Service date(s)  an InputGroup of two DateFields — Start, End. Pre-selected
//                    from the job's "Scheduled for" day (both the same day),
//                    with the help text "Pre-selected based on "Scheduled for"
//                    date" while they still are that day; empty when the job
//                    has no "Scheduled for". End can not be before Start, and a
//                    Start after End moves End to the same day. Full dates on
//                    desktop, compact on mobile.
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
  end: Date | null;
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
  serviceEnd: isoOf(values.end),
  equipmentId: values.equipmentId,
  technicianId: values.technicianId,
  description: values.description.trim(),
});

/** What blocks each group of inputs from saving. */
export function laborProblems(values: LaborValues) {
  const hourly = values.type === "hourly";
  const missingDates = values.start == null || values.end == null;
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

interface FieldsProps {
  job: Job;
  values: LaborValues;
  set: (patch: Partial<LaborValues>) => void;
  /** The submit button was pressed — the missing-value errors show. */
  showErrors: boolean;
}

/** Subtype + Service date(s). */
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
  // "Help text hides when a user changes pre-selected dates."
  const preselected = scheduled != null && values.start?.getTime() === scheduled.getTime() && values.end?.getTime() === scheduled.getTime();
  const formatValue = mobile ? formatCompactDate : undefined;

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

      <Input label="Service date(s)" helpText={preselected ? 'Pre-selected based on "Scheduled for" date' : undefined}>
        <InputGroup isValid={!(showErrors && laborProblems(values).missingDates)}>
          <DateField
            value={values.start}
            onDateChange={(start) =>
              // A Start after End moves End to the same day.
              set({ start, end: start != null && values.end != null && start > values.end ? start : values.end })
            }
            pickerLabel="Start date"
            formatValue={formatValue}
            breakpoint={breakpoint}
          />
          <DateField
            value={values.end}
            onDateChange={(end) => set({ end })}
            minDate={values.start ?? undefined}
            pickerLabel="End date"
            formatValue={formatValue}
            breakpoint={breakpoint}
          />
        </InputGroup>
      </Input>
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
