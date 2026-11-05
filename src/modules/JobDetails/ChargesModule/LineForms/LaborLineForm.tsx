import { useEffect, useRef, useState } from "react";

import type { Job, LaborItem, LaborLine } from "../../../../data/db";
import useIsDesktop, { Breakpoint } from "../../../../hooks/useIsDesktop";

import { LaborGeneralFields, laborLineOf, LaborPricingFields, laborProblems, LaborValues, laborValuesOf, sameLaborValues } from "./laborFields";
import { AttributionFields, DescriptionInput, LineFormDialog, scrollToFirstError } from "./lineFormParts";

// The LABOR RATE line item form (Figma 27428-90512 — Flat / Hourly × Desktop /
// Mobile, plus the Hours and Service date(s) parts): every input in one dialog.
// A picked pricebook rate is only the TEMPLATE: every value is copied in and
// can be changed. The inputs and their rules live in ./laborFields.

export interface LaborLineFormProps {
  open: boolean;
  onClose: () => void;
  job: Job;
  /** The pricebook rate — the template of a new line, the source of an edited one. */
  rate: LaborItem;
  /** An existing line — the form opens on its values and the button reads "Save". */
  line?: LaborLine | null;
  onSubmit: (line: LaborLine) => void;
  /** Adds a Delete to the footer (Concept 4 — its card has no other way). */
  onDelete?: () => void;
  /** "Click here" in the Cost help text — opens the rate's side panel. */
  onOpenRate?: () => void;
  /** False: the company does not use subtypes. Default true. */
  hasSubtypes?: boolean;
  breakpoint?: Breakpoint;
}

export default function LaborLineForm({
  open,
  onClose,
  job,
  rate,
  line,
  onSubmit,
  onDelete,
  onOpenRate,
  hasSubtypes = true,
  breakpoint = "auto",
}: LaborLineFormProps) {
  const mobile = !useIsDesktop(breakpoint);
  const [initial, setInitial] = useState<LaborValues>(() => laborValuesOf(job, rate, line));
  const [values, setValues] = useState<LaborValues>(initial);
  const [costChanged, setCostChanged] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Every open starts over — from the line, or from the rate as a template.
  useEffect(() => {
    if (!open) return;
    const next = laborValuesOf(job, rate, line);
    setInitial(next);
    setValues(next);
    setCostChanged(false);
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (patch: Partial<LaborValues>) => setValues((previous) => ({ ...previous, ...patch }));

  const submit = () => {
    const problems = laborProblems(values);
    if (problems.general || problems.pricing) {
      setShowErrors(true);
      requestAnimationFrame(() => scrollToFirstError(bodyRef.current));
      return;
    }
    onSubmit(laborLineOf(values));
    onClose();
  };

  return (
    <LineFormDialog
      open={open}
      onClose={onClose}
      title={rate.name}
      isEdit={line != null}
      dirty={!sameLaborValues(values, initial)}
      onSubmit={submit}
      onDelete={onDelete}
      hasCancel={false}
      breakpoint={breakpoint}
      bodyRef={bodyRef}
    >
      <LaborGeneralFields job={job} values={values} set={set} showErrors={showErrors} mobile={mobile} breakpoint={breakpoint} hasSubtypes={hasSubtypes} />

      <LaborPricingFields
        job={job}
        rate={rate}
        values={values}
        set={set}
        showErrors={showErrors}
        costChanged={costChanged}
        onCostChanged={() => setCostChanged(true)}
        onOpenRate={onOpenRate}
      />

      <AttributionFields
        job={job}
        equipmentId={values.equipmentId}
        onEquipmentChange={(equipmentId) => set({ equipmentId })}
        technicianId={values.technicianId}
        onTechnicianChange={(technicianId) => set({ technicianId })}
        mobile={mobile}
      />

      <DescriptionInput value={values.description} onChange={(description) => set({ description })} />
    </LineFormDialog>
  );
}
