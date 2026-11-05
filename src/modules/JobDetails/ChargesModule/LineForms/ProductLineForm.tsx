import { useEffect, useRef, useState } from "react";

import type { Job, ProductItem, ProductLine } from "../../../../data/db";
import useIsDesktop, { Breakpoint } from "../../../../hooks/useIsDesktop";
import { joinWithSeparator } from "../../../../utils/textSeparator";

import { AttributionFields, DescriptionInput, LineFormDialog, scrollToFirstError } from "./lineFormParts";
import { ProductGeneralFields, productLineOf, ProductPricingFields, productProblems, ProductValues, productValuesOf } from "./productFields";

// The PRODUCT line item form (Figma 27831-59168, "Edit" section): every input in
// one dialog. The picked pricebook product is only the TEMPLATE: every value is
// copied in. The title is the product's name with "Manufacturer · Part #" as the
// caption; the inputs and their rules live in ./productFields.

export interface ProductLineFormProps {
  open: boolean;
  onClose: () => void;
  job: Job;
  /** The pricebook product — the template of a new line, the source of an edited one. */
  product: ProductItem;
  /** An existing line — the form opens on its values and the button reads "Save". */
  line?: ProductLine | null;
  onSubmit: (line: ProductLine) => void;
  /** Adds a Delete to the footer (Concept 4 — its card has no other way). */
  onDelete?: () => void;
  /** False: the company does not use subtypes. Default true. */
  hasSubtypes?: boolean;
  breakpoint?: Breakpoint;
}

export default function ProductLineForm({
  open,
  onClose,
  job,
  product,
  line,
  onSubmit,
  onDelete,
  hasSubtypes = true,
  breakpoint = "auto",
}: ProductLineFormProps) {
  const mobile = !useIsDesktop(breakpoint);
  const [initial, setInitial] = useState<ProductValues>(() => productValuesOf(product, line));
  const [values, setValues] = useState<ProductValues>(initial);
  const [costChanged, setCostChanged] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const next = productValuesOf(product, line);
    setInitial(next);
    setValues(next);
    setCostChanged(false);
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (patch: Partial<ProductValues>) => setValues((previous) => ({ ...previous, ...patch }));

  const submit = () => {
    const problems = productProblems(product, values);
    if (problems.general || problems.pricing) {
      setShowErrors(true);
      requestAnimationFrame(() => scrollToFirstError(bodyRef.current));
      return;
    }
    onSubmit(productLineOf(product, values));
    onClose();
  };

  return (
    <LineFormDialog
      open={open}
      onClose={onClose}
      title={product.name}
      caption={joinWithSeparator(product.manufacturer || "No Manufacturer", product.partNumber || "No Part #")}
      isEdit={line != null}
      dirty={JSON.stringify(values) !== JSON.stringify(initial)}
      onSubmit={submit}
      onDelete={onDelete}
      hasCancel={false}
      breakpoint={breakpoint}
      bodyRef={bodyRef}
    >
      <ProductGeneralFields product={product} values={values} set={set} showErrors={showErrors} mobile={mobile} hasSubtypes={hasSubtypes} />

      <ProductPricingFields
        product={product}
        line={line}
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
