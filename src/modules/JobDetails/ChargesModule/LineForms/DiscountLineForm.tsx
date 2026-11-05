import { useEffect, useRef, useState } from "react";

import type { ChargeItem, DiscountLine, Job } from "../../../../data/db";
import useIsDesktop, { Breakpoint } from "../../../../hooks/useIsDesktop";

import { DiscountGeneralFields, discountLineOf, DiscountPricingFields, discountProblems, DiscountValues, discountValuesOf } from "./discountFields";
import { AttributionFields, DescriptionInput, LineFormDialog, scrollToFirstError } from "./lineFormParts";

// The DISCOUNT line item form (Figma 27940-66676, "Edit" section): every input
// in one dialog. The inputs and their rules live in ./discountFields.

export interface DiscountLineFormProps {
  open: boolean;
  onClose: () => void;
  job: Job;
  /** The pricebook discount — its price is NEGATIVE in the db. */
  discount: ChargeItem;
  /** An existing line — the form opens on its values and the button reads "Save". */
  line?: DiscountLine | null;
  onSubmit: (line: DiscountLine) => void;
  /** Adds a Delete to the footer (Concept 4 — its card has no other way). */
  onDelete?: () => void;
  /** False: the company does not use subtypes. Default true. */
  hasSubtypes?: boolean;
  breakpoint?: Breakpoint;
}

export default function DiscountLineForm({
  open,
  onClose,
  job,
  discount,
  line,
  onSubmit,
  onDelete,
  hasSubtypes = true,
  breakpoint = "auto",
}: DiscountLineFormProps) {
  const mobile = !useIsDesktop(breakpoint);
  const [initial, setInitial] = useState<DiscountValues>(() => discountValuesOf(discount, line));
  const [values, setValues] = useState<DiscountValues>(initial);
  const [showErrors, setShowErrors] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const next = discountValuesOf(discount, line);
    setInitial(next);
    setValues(next);
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (patch: Partial<DiscountValues>) => setValues((previous) => ({ ...previous, ...patch }));

  const submit = () => {
    if (discountProblems(values).pricing) {
      setShowErrors(true);
      requestAnimationFrame(() => scrollToFirstError(bodyRef.current));
      return;
    }
    onSubmit(discountLineOf(values));
    onClose();
  };

  return (
    <LineFormDialog
      open={open}
      onClose={onClose}
      title={discount.name}
      isEdit={line != null}
      dirty={JSON.stringify(values) !== JSON.stringify(initial)}
      onSubmit={submit}
      onDelete={onDelete}
      hasCancel={false}
      breakpoint={breakpoint}
      bodyRef={bodyRef}
    >
      <DiscountGeneralFields values={values} set={set} showErrors={showErrors} mobile={mobile} hasSubtypes={hasSubtypes} />

      <DiscountPricingFields values={values} set={set} showErrors={showErrors} />

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
