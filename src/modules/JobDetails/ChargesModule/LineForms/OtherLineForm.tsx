import { useEffect, useRef, useState } from "react";

import type { ChargeItem, Job, OtherLine } from "../../../../data/db";
import useIsDesktop, { Breakpoint } from "../../../../hooks/useIsDesktop";

import { AttributionFields, DescriptionInput, LineFormDialog, scrollToFirstError } from "./lineFormParts";
import { OtherGeneralFields, otherLineOf, OtherPricingFields, otherProblems, OtherValues, otherValuesOf } from "./otherFields";

// The OTHER CHARGE line item form (Figma 27937-65412, "Edit" section): every
// input in one dialog. The picked pricebook charge is only the TEMPLATE. The
// inputs and their rules live in ./otherFields.

export interface OtherLineFormProps {
  open: boolean;
  onClose: () => void;
  job: Job;
  /** The pricebook charge — the template of a new line, the source of an edited one. */
  charge: ChargeItem;
  /** An existing line — the form opens on its values and the button reads "Save". */
  line?: OtherLine | null;
  onSubmit: (line: OtherLine) => void;
  /** Adds a Delete to the footer (Concept 4 — its card has no other way). */
  onDelete?: () => void;
  /** False: the company does not use subtypes. Default true. */
  hasSubtypes?: boolean;
  breakpoint?: Breakpoint;
}

export default function OtherLineForm({
  open,
  onClose,
  job,
  charge,
  line,
  onSubmit,
  onDelete,
  hasSubtypes = true,
  breakpoint = "auto",
}: OtherLineFormProps) {
  const mobile = !useIsDesktop(breakpoint);
  const [initial, setInitial] = useState<OtherValues>(() => otherValuesOf(charge, line));
  const [values, setValues] = useState<OtherValues>(initial);
  const [costChanged, setCostChanged] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const next = otherValuesOf(charge, line);
    setInitial(next);
    setValues(next);
    setCostChanged(false);
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (patch: Partial<OtherValues>) => setValues((previous) => ({ ...previous, ...patch }));

  const submit = () => {
    if (otherProblems(values).pricing) {
      setShowErrors(true);
      requestAnimationFrame(() => scrollToFirstError(bodyRef.current));
      return;
    }
    onSubmit(otherLineOf(values));
    onClose();
  };

  return (
    <LineFormDialog
      open={open}
      onClose={onClose}
      title={charge.name}
      isEdit={line != null}
      dirty={JSON.stringify(values) !== JSON.stringify(initial)}
      onSubmit={submit}
      onDelete={onDelete}
      hasCancel={false}
      breakpoint={breakpoint}
      bodyRef={bodyRef}
    >
      <OtherGeneralFields values={values} set={set} showErrors={showErrors} mobile={mobile} hasSubtypes={hasSubtypes} />

      <OtherPricingFields
        charge={charge}
        values={values}
        set={set}
        showErrors={showErrors}
        costChanged={costChanged}
        onCostChanged={() => setCostChanged(true)}
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
