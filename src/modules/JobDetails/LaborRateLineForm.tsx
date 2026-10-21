import { MouseEvent, useEffect, useState } from "react";

import AlertBanner from "../../components/AlertBanner/AlertBanner";
import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import DateField from "../../components/Fields/DateField/DateField";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import TextField from "../../components/Fields/TextField/TextField";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { COMPANY, LABOR_SUBTYPES, TODAY, historyOf, jobById } from "../../data/db";
import type { LaborItem } from "../../data/db/types";
import { users } from "../../data/users";
import useIsDesktop, { Breakpoint } from "../../hooks/useIsDesktop";
import { TEXT_SEPARATOR } from "../../utils/textSeparator";
import { moneyText } from "../NewLaborRateForm/LaborPricingFields";
import { decimalText, isBlank, isMeasureText, isMoneyText, numberOf, padMoneyOnBlur } from "../Product/NewProductForm/productRules";
import { SubtypeField } from "../shared/pricebookFields";
import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";
import { useCurrentJobId } from "./currentJob";
import { Equipment } from "./equipment";
import { formatHrMin } from "./TimesheetPanel";

import styles from "./LaborRateLineForm.module.scss";

// The labor rate LINE ITEM dialog (Figma "Job Details" Page — Next Update,
// 27083-33173: Flat 27083-33174 / Hourly 27083-34651).
//
// A labor rate on a job is NOT the pricebook labor rate. Picking a rate in the
// "Labor rates" list only uses it as a TEMPLATE: its subtype, rate type, cost,
// rate and description are copied into a new line item, and the user can still
// change every one of them here (Daniel, 2026-10-22). A line item has no
// labels, internal notes or accounting — those belong to the pricebook rate.
//
// Daniel called this a quick concept to share, not a finished design, so the
// rules below are the build's own and are flagged where they are guesses.
//
//   Rate type  Hourly → Rate + Hours, both "per hour"-aware, and an info
//              banner with the job's estimated duration and the time logged
//              so far. Flat → Cost + Rate, billed once.
//   Required   Rate always; Hours on an Hourly line (the total needs them).

export type LaborRateType = "hourly" | "flat";

/** One labor rate line on the job — what "Add" hands back. */
export interface LaborRateLine {
  /** The pricebook rate the line was started from (its template). */
  laborRateId: string;
  name: string;
  subtypeId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  rateType: LaborRateType;
  cost: number;
  rate: number;
  /** Hourly only — the billed hours. 1 on a Flat line. */
  hours: number;
  description: string;
  technicianId: number | null;
  equipmentId: string | null;
}

export interface LaborRateLineFormProps {
  open: boolean;
  onClose: () => void;
  /** The pricebook rate picked in the list — the template of a NEW line. */
  template?: LaborItem | null;
  /**
   * An existing line — the dialog opens on its values to edit them, and "Add"
   * becomes "Save". Wins over `template`.
   */
  line?: LaborRateLine | null;
  /** The job's equipment, for "Equipment attribution". */
  jobEquipment?: Equipment[];
  /** "Add" (a new line) or "Save" (an edited one). */
  onSubmit: (line: LaborRateLine) => void;
  breakpoint?: Breakpoint;
}

const NO_ERRORS = { rate: false, hours: false };

export default function LaborRateLineForm({ open, onClose, template = null, line = null, jobEquipment = [], onSubmit, breakpoint = "auto" }: LaborRateLineFormProps) {
  const mobile = !useIsDesktop(breakpoint);
  const job = jobById(useCurrentJobId());

  const [subtypeId, setSubtypeId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [rateType, setRateType] = useState<LaborRateType>("hourly");
  const [cost, setCost] = useState("");
  const [rate, setRate] = useState("");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [technicianId, setTechnicianId] = useState<number | null>(null);
  const [equipmentId, setEquipmentId] = useState<string | null>(null);
  const [errors, setErrors] = useState(NO_ERRORS);

  // Every open starts from the line being edited, or from the template — the
  // template's values are copied, not linked.
  useEffect(() => {
    if (!open) return;
    if (line != null) {
      setSubtypeId(line.subtypeId);
      setStartDate(line.startDate);
      setEndDate(line.endDate);
      setRateType(line.rateType);
      setCost(moneyText(line.cost));
      setRate(moneyText(line.rate));
      setHours(line.rateType === "hourly" ? String(line.hours) : "");
      setDescription(line.description);
      setTechnicianId(line.technicianId);
      setEquipmentId(line.equipmentId);
    } else if (template != null) {
      setSubtypeId(template.subtypeId);
      setStartDate(TODAY);
      setEndDate(TODAY);
      setRateType(template.unitType === "hourly" ? "hourly" : "flat");
      setCost(moneyText(template.cost));
      setRate(moneyText(template.rate));
      setHours("");
      setDescription(template.summary);
      setTechnicianId(null);
      setEquipmentId(null);
    }
    setErrors(NO_ERRORS);
  }, [open, template, line]);

  const techPop = useSelectPopover(mobile);
  const equipmentPop = useSelectPopover(mobile);
  // The job's own techs first; the attribution is one person.
  const technicians = users.filter((user) => job?.assigneeIds.includes(user.id));
  const technician = users.find((user) => user.id === technicianId);
  const equipment = jobEquipment.find((row) => row.id === equipmentId);

  const hourly = rateType === "hourly";
  const perHour = hourly ? "per hour" : undefined;

  const money = (set: (text: string) => void) => (text: string) => {
    const next = decimalText(text);
    if (isMoneyText(next)) set(next);
  };

  // The banner's two numbers (Figma 27083-45488): the estimate the job was
  // booked with, and every session tracked on it so far.
  const loggedSec =
    job == null
      ? 0
      : historyOf(job)
          .sessions.filter((session) => session.end != null)
          .reduce((acc, session) => acc + (new Date(session.end!).getTime() - new Date(session.start).getTime()) / 1000, 0);
  const estimate = job?.durationMinutes != null ? formatHrMin(job.durationMinutes * 60) : "Not set";

  // Where the line came from — kept on an edit, the template on a new line.
  const source = line ?? (template == null ? null : { laborRateId: template.id, name: template.name });

  const submit = () => {
    const next = { rate: isBlank(rate), hours: hourly && isBlank(hours) };
    if (next.rate || next.hours) {
      setErrors(next);
      return;
    }
    if (source == null) return;
    onSubmit({
      laborRateId: source.laborRateId,
      name: source.name,
      subtypeId,
      startDate,
      endDate,
      rateType,
      cost: numberOf(cost),
      rate: numberOf(rate),
      hours: hourly ? numberOf(hours) : 1,
      description: description.trim(),
      technicianId,
      equipmentId,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={source?.name ?? ""}
      breakpoint={breakpoint}
      footer={
        <PopoverFooter
          slotLeft={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={submit}>
            {line != null ? "Save" : "Add"}
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.fields}>
        <SubtypeField subtypes={LABOR_SUBTYPES} required={COMPANY.requireSubtypes} value={subtypeId} onChange={setSubtypeId} showErrors={false} mobile={mobile} />

        <div className={styles.pair}>
          <Input label="Start date">
            <DateField value={startDate} onDateChange={setStartDate} breakpoint={breakpoint} />
          </Input>
          <Input label="End date">
            <DateField value={endDate} onDateChange={setEndDate} minDate={startDate ?? undefined} breakpoint={breakpoint} />
          </Input>
        </div>

        <Input label="Rate type">
          <RadioGroup orientation="horizontal" value={rateType} onChange={(value) => setRateType(value as LaborRateType)}>
            <RadioItem value="hourly" label="Hourly" />
            <RadioItem value="flat" label="Flat" />
          </RadioGroup>
        </Input>

        <Input label="Cost">
          <TextField
            value={cost}
            onChange={(event) => money(setCost)(event.target.value)}
            onBlur={() => setCost(padMoneyOnBlur(cost))}
            keyboard="decimal"
            prefix="$"
            suffix={perHour}
            placeholder="0.00"
          />
        </Input>

        {hourly && (
          <AlertBanner type="card" status="info" orientation="vertical">
            {`Est. job duration — ${estimate}${TEXT_SEPARATOR}Total time logged — ${formatHrMin(loggedSec)}`}
          </AlertBanner>
        )}

        <div className={hourly ? styles.pair : undefined}>
          <Input label="Rate">
            <TextField
              value={rate}
              onChange={(event) => money(setRate)(event.target.value)}
              onBlur={() => setRate(padMoneyOnBlur(rate))}
              keyboard="decimal"
              prefix="$"
              suffix={perHour}
              placeholder="0.00"
              isValid={!errors.rate || !isBlank(rate)}
              errorMessage="Enter Rate"
            />
          </Input>
          {hourly && (
            <Input label="Hours">
              <TextField
                value={hours}
                onChange={(event) => {
                  const next = decimalText(event.target.value);
                  if (isMeasureText(next)) setHours(next);
                }}
                keyboard="decimal"
                isValid={!errors.hours || !isBlank(hours)}
                errorMessage="Enter Hours"
              />
            </Input>
          )}
        </div>

        <Input label="Description" labelCondition="optional">
          <TextArea value={description} onChange={(event) => setDescription(event.target.value)} clearable onClear={() => setDescription("")} />
        </Input>

        <Input label="Technician attribution" labelCondition="optional">
          <SelectField
            value={technician?.name}
            open={techPop.open}
            onClick={(event: MouseEvent<HTMLDivElement>) => techPop.toggle(event.currentTarget)}
          />
        </Input>
        <SelectPopoverList pop={techPop} mobile={mobile} title="Technician" searchable searchPlaceholder="Technician...">
          <SelectListItemGroup>
            {technicians.map((user) => (
              <SelectListItem
                key={user.id}
                label={user.name}
                selected={user.id === technicianId}
                onClick={() => {
                  setTechnicianId(user.id === technicianId ? null : user.id);
                  techPop.close();
                }}
              />
            ))}
          </SelectListItemGroup>
        </SelectPopoverList>

        <Input label="Equipment attribution" labelCondition="optional">
          <SelectField
            value={equipment?.name}
            open={equipmentPop.open}
            onClick={(event: MouseEvent<HTMLDivElement>) => equipmentPop.toggle(event.currentTarget)}
          />
        </Input>
        <SelectPopoverList
          pop={equipmentPop}
          mobile={mobile}
          title="Equipment"
          searchable
          searchPlaceholder="Equipment..."
          state={jobEquipment.length === 0 ? "empty" : "default"}
          emptyState={{ caption: "No equipment on this job" }}
        >
          <SelectListItemGroup>
            {jobEquipment.map((row) => (
              <SelectListItem
                key={row.id}
                label={row.name}
                selected={row.id === equipmentId}
                onClick={() => {
                  setEquipmentId(row.id === equipmentId ? null : row.id);
                  equipmentPop.close();
                }}
              />
            ))}
          </SelectListItemGroup>
        </SelectPopoverList>
      </div>
    </Dialog>
  );
}
