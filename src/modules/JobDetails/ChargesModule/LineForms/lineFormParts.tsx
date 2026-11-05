import { MouseEvent, ReactNode, RefObject } from "react";

import AvatarUser from "../../../../components/Avatar/AvatarUser";
import Button from "../../../../components/Button/Button";
import Dialog from "../../../../components/Dialog/Dialog";
import SelectField from "../../../../components/Fields/SelectField/SelectField";
import TextArea from "../../../../components/Fields/TextArea/TextArea";
import TextField from "../../../../components/Fields/TextField/TextField";
import { InputHelpTextStatus } from "../../../../components/InputHelpText/InputHelpText.types";
import Input from "../../../../components/Input/Input";
import PopoverFooter from "../../../../components/Popover/PopoverFooter";
import SelectListItem from "../../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../../components/SelectList/SelectListItemGroup";
import { equipmentById, historyOf } from "../../../../data/db";
import type { Job } from "../../../../data/db";
import { users } from "../../../../data/users";
import { Breakpoint } from "../../../../hooks/useIsDesktop";
import { TEXT_SEPARATOR } from "../../../../utils/textSeparator";
import { decimalText, isMoneyText, isQuantityText, padMoneyOnBlur } from "../../../Product/NewProductForm/productRules";
import DismissCancelButton from "../../../shared/DismissCancelButton";
import { EquipmentAvatar, equipmentCaptionText, equipmentLabel, equipmentTitle, toEquipment } from "../../../shared/equipmentRow";
import { SelectPopoverList, useSelectPopover } from "../../../shared/selectPopover";

import styles from "./LineForms.module.scss";

// The parts every job LINE ITEM edit form shares — Labor rate, Product, Other
// charge, Discount (the "Edit" sections of the four Charges module docs,
// Figma "Job Details" Page — Next Update: 27428-90512, 27831-59168,
// 27937-65412, 27940-66676).
//
//   The dialog   Dialog default: the item's name as the title (a product adds
//                "Manufacturer · Part #" as the caption), Cancel + Add — the
//                button reads "Save" when an existing line is edited. A form
//                with changes asks "Discard changes?" before it closes.
//   Money        Cost / Price / Discount — the "New labor rate" form's rules:
//                digits and a dot (a typed comma becomes a dot), 3 decimals,
//                7 digits before the dot, no minus; "$100" → "$100.00" when the
//                field loses the focus.
//   Numbers      Hours / Quantity: digits and a dot, 3 decimals, 4 digits
//                before the dot, no minus; the "decimal" keyboard.
//   Attribution  Equipment / Technician: optional, single-select, no default,
//                no search, A → Z; each shown only when the job has any.

/** The text a money field opens with — the stored number, padded to two decimals. */
export const moneyText = (value: number | undefined) => (value == null ? "" : padMoneyOnBlur(String(value)));

/** A quantity or hours number as the field shows it — "1", "0.5". */
export const numberText = (value: number | undefined) => (value == null ? "" : String(value));

/** A local Date ↔ the ISO day a line stores ("2027-01-01T00:00:00"). */
export const dayOf = (iso: string | null | undefined) => {
  if (iso == null) return null;
  const date = new Date(iso);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};
export const isoOf = (date: Date | null) => {
  if (date == null) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T00:00:00`;
};

/**
 * "1h 30m", "30m", "0m" — the Hours help text (Figma annotation "Help Text"):
 * hours only when greater than 0, minutes only when greater than 0, and an
 * unbreakable space between the two so they never wrap apart.
 */
export function durationText(minutes: number) {
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0 && m === 0) return "0m";
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** The time logged on the job so far, in minutes — every finished session. */
export const loggedMinutes = (job: Job) =>
  historyOf(job)
    .sessions.filter((session) => session.end != null)
    .reduce((acc, session) => acc + (new Date(session.end!).getTime() - new Date(session.start).getTime()) / 60000, 0);

// ---- the dialog --------------------------------------------------------------

interface LineFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** The item's name. */
  title: string;
  /** A product's "Manufacturer · Part #". */
  caption?: string;
  /** An existing line — the button reads "Save". */
  isEdit: boolean;
  /** Something changed — closing asks "Discard changes?" first. */
  dirty: boolean;
  onSubmit: () => void;
  /** A Delete in the footer's left slot, Cancel moving next to the main button. */
  onDelete?: () => void;
  /** False: no Cancel in the footer, the × is the way out (the line forms). Default true. */
  hasCancel?: boolean;
  breakpoint?: Breakpoint;
  bodyRef?: RefObject<HTMLDivElement>;
  children: ReactNode;
}

export function LineFormDialog({ open, onClose, title, caption, isEdit, dirty, onSubmit, onDelete, hasCancel = true, breakpoint, bodyRef, children }: LineFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      caption={caption}
      breakpoint={breakpoint}
      confirmOnDismiss={dirty}
      footer={
        <PopoverFooter
          // Cancel asks "Discard changes?" like the ×, through the Dialog's dismiss.
          slotLeft={
            onDelete != null ? (
              <Button size="lg" variant="danger" leftIcon="trash-can" onClick={onDelete}>
                Delete
              </Button>
            ) : hasCancel ? (
              <DismissCancelButton />
            ) : undefined
          }
        >
          {onDelete != null && hasCancel && <DismissCancelButton />}
          <Button size="lg" variant="solid" onClick={onSubmit}>
            {isEdit ? "Save" : "Add"}
          </Button>
        </PopoverFooter>
      }
    >
      <div ref={bodyRef} className={styles.fields}>
        {children}
      </div>
    </Dialog>
  );
}

/** "If an error is detected, scrolls to the first field with error." */
export const scrollToFirstError = (body: HTMLDivElement | null) =>
  body?.querySelector('[aria-invalid="true"], [class*="error"]')?.scrollIntoView({ block: "center", behavior: "smooth" });

// ---- fields ------------------------------------------------------------------

interface MoneyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Runs after the value is padded on blur. */
  onBlur?: () => void;
  /** "$" by default; a discount's is "−$". */
  prefix?: string;
  /** An Hourly labor rate adds "per hour". */
  perHour?: boolean;
  isValid?: boolean;
  errorMessage?: ReactNode;
  helpText?: ReactNode;
  helpTextStatus?: InputHelpTextStatus;
}

export function MoneyInput({ label, value, onChange, onBlur, prefix = "$", perHour = false, isValid, errorMessage, helpText, helpTextStatus }: MoneyInputProps) {
  return (
    <Input label={label} helpText={helpText} helpTextStatus={helpTextStatus}>
      <TextField
        value={value}
        onChange={(event) => {
          const next = decimalText(event.target.value);
          if (isMoneyText(next)) onChange(next);
        }}
        onBlur={() => {
          onChange(padMoneyOnBlur(value));
          onBlur?.();
        }}
        keyboard="decimal"
        prefix={prefix}
        suffix={perHour ? "per hour" : undefined}
        placeholder="0.00"
        isValid={isValid}
        errorMessage={errorMessage}
      />
    </Input>
  );
}

interface NumberInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  isValid?: boolean;
  errorMessage?: ReactNode;
  helpText?: ReactNode;
  helpTextStatus?: InputHelpTextStatus;
}

/** Hours / Quantity — 3 decimals, 4 digits before the dot, no minus. */
export function NumberInput({ label, value, onChange, onBlur, isValid, errorMessage, helpText, helpTextStatus }: NumberInputProps) {
  return (
    <Input label={label} helpText={helpText} helpTextStatus={helpTextStatus}>
      <TextField
        value={value}
        onChange={(event) => {
          const next = decimalText(event.target.value);
          if (isQuantityText(next)) onChange(next);
        }}
        onBlur={onBlur}
        keyboard="decimal"
        isValid={isValid}
        errorMessage={errorMessage}
      />
    </Input>
  );
}

/** Description — optional, pre-filled from the pricebook item, no limit. */
export function DescriptionInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Input label="Description" labelCondition="optional">
      <TextArea value={value} onChange={(event) => onChange(event.target.value)} />
    </Input>
  );
}

/**
 * The Cost help text (Figma 27856-63874): shown only once the user changed
 * the cost and it no longer matches the pricebook. "Click here" opens the
 * pricebook item — a labor rate opens its side panel above the dialog; the
 * other types have no panel yet, so their link does nothing.
 */
export function costMismatchHelp(onOpenItem?: () => void) {
  return (
    <>
      {"Doesn't match the cost in the pricebook. "}
      <button type="button" className={styles.inlineLink} onClick={onOpenItem}>
        Click here
      </button>
      {" to update the pricebook."}
    </>
  );
}

// ---- attribution ---------------------------------------------------------------

interface AttributionFieldsProps {
  job: Job;
  equipmentId: string | undefined;
  onEquipmentChange: (id: string | undefined) => void;
  technicianId: number | undefined;
  onTechnicianChange: (id: number | undefined) => void;
  mobile: boolean;
  /**
   * The labels without "attribution" — the side panel's "Attribution" dialog
   * (Figma 28009-16862), whose title already says it.
   */
  shortLabels?: boolean;
}

/**
 * "Equipment attribution" and "Technician attribution" — each only shown when
 * the job has at least one equipment / assignee. Single-select, no default,
 * always optional; the list is the job's own, A → Z, with no search (an
 * inline card on desktop, a drawer titled "Equipment" / "Assignees" on
 * mobile). Both fields are clearable — the field's own × empties them.
 */
export function AttributionFields({ job, equipmentId, onEquipmentChange, technicianId, onTechnicianChange, mobile, shortLabels = false }: AttributionFieldsProps) {
  const equipmentPop = useSelectPopover(mobile);
  const techPop = useSelectPopover(mobile);

  const jobEquipment = (job.equipmentIds ?? [])
    .map((id) => equipmentById(id))
    .filter((row): row is NonNullable<typeof row> => row != null)
    .map(toEquipment)
    .sort((a, b) => a.name.localeCompare(b.name));
  const assignees = users.filter((user) => job.assigneeIds?.includes(user.id)).sort((a, b) => a.name.localeCompare(b.name));
  const equipment = jobEquipment.find((row) => row.id === equipmentId);
  const technician = assignees.find((user) => user.id === technicianId);

  return (
    <>
      {jobEquipment.length > 0 && (
        <>
          <Input label={shortLabels ? "Equipment" : "Equipment attribution"} labelCondition="optional">
            <SelectField
              value={equipment != null ? equipmentLabel(equipment) : undefined}
              open={equipmentPop.open}
              onClick={(event: MouseEvent<HTMLDivElement>) => equipmentPop.toggle(event.currentTarget)}
              isClearable
              onClear={() => onEquipmentChange(undefined)}
            />
          </Input>
          <SelectPopoverList pop={equipmentPop} mobile={mobile} title="Equipment">
            <SelectListItemGroup>
              {jobEquipment.map((row) => (
                <SelectListItem
                  key={row.id}
                  variant="object"
                  label={equipmentTitle(row)}
                  caption={equipmentCaptionText(row)}
                  avatar={<EquipmentAvatar equipment={row} />}
                  selected={row.id === equipmentId}
                  onClick={() => {
                    onEquipmentChange(row.id);
                    equipmentPop.close();
                  }}
                />
              ))}
            </SelectListItemGroup>
          </SelectPopoverList>
        </>
      )}

      {assignees.length > 0 && (
        <>
          <Input label={shortLabels ? "Technician" : "Technician attribution"} labelCondition="optional">
            <SelectField
              value={technician?.name}
              slotLeft={technician != null ? <AvatarUser size="xs" imageSrc={technician.avatar} /> : undefined}
              open={techPop.open}
              onClick={(event: MouseEvent<HTMLDivElement>) => techPop.toggle(event.currentTarget)}
              isClearable
              onClear={() => onTechnicianChange(undefined)}
            />
          </Input>
          <SelectPopoverList pop={techPop} mobile={mobile} title="Assignees">
            <SelectListItemGroup>
              {assignees.map((user) => (
                <SelectListItem
                  key={user.id}
                  variant="default"
                  label={user.name}
                  slotLeft={<AvatarUser size="xs" imageSrc={user.avatar} />}
                  selected={user.id === technicianId}
                  onClick={() => {
                    onTechnicianChange(user.id);
                    techPop.close();
                  }}
                />
              ))}
            </SelectListItemGroup>
          </SelectPopoverList>
        </>
      )}
    </>
  );
}

/** "Est. duration: 1h 30m · Total logged: 14h 38m" — the Hours help text. */
export const hoursHelpText = (job: Job) =>
  `Est. duration: ${durationText(job.durationMinutes ?? 0)}${TEXT_SEPARATOR}Total logged: ${durationText(loggedMinutes(job))}`;
