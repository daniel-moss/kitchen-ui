import { useState } from "react";

import AvatarDiscount from "../../../../components/Avatar/AvatarDiscount";
import ValueDisplay from "../../../../components/ValueDisplay/ValueDisplay";
import { formatCurrency } from "../../../../app/listData";
import { DISCOUNT_SUBTYPES } from "../../../../data/db";
import type { ChargeItem, DiscountLine, Job } from "../../../../data/db";
import { Breakpoint } from "../../../../hooks/useIsDesktop";
import { DiscountGeneralFields, discountLineOf, DiscountPricingFields, discountProblems, DiscountValues, discountValuesOf } from "../LineForms/discountFields";
import { discountAmount, negative, subtypeName } from "../lineDisplay";

import LinePanel, { LineSectionDialog } from "./LinePanel";

// The DISCOUNT line's side panel (Figma 28009-27494).
//   General  Subtype.
//   Pricing  Discount, Quantity, Amount — a plain row, like the labor rate's.
//            Both money values read with the minus ("−$100.00").

export interface DiscountLinePanelProps {
  open: boolean;
  onClose: () => void;
  job: Job;
  /** The pricebook discount the line came from. */
  discount: ChargeItem;
  /** The line's name. */
  title: string;
  line: DiscountLine;
  /** A module's dialog saved. */
  onChange: (line: DiscountLine) => void;
  /** "Delete" was confirmed. */
  onDelete: () => void;
  breakpoint?: Breakpoint;
}

export default function DiscountLinePanel({ open, onClose, job, discount, title, line, onChange, onDelete, breakpoint }: DiscountLinePanelProps) {
  const [editingGeneral, setEditingGeneral] = useState(false);
  const [editingPricing, setEditingPricing] = useState(false);

  const dialogProps = {
    start: () => discountValuesOf(discount, line),
    onSave: (values: DiscountValues) => onChange(discountLineOf(values)),
    breakpoint,
  };

  return (
    <LinePanel
      open={open}
      onClose={onClose}
      job={job}
      title={title}
      avatar={<AvatarDiscount size="xl" />}
      noun="discount"
      general={<ValueDisplay label="Subtype" value={subtypeName(DISCOUNT_SUBTYPES, line.subtypeId)} />}
      onEditGeneral={() => setEditingGeneral(true)}
      pricing={
        <>
          <ValueDisplay label="Discount" value={formatCurrency(negative(line.discount))} />
          <ValueDisplay label="Quantity" value={String(line.quantity)} />
          <ValueDisplay label="Amount" value={formatCurrency(discountAmount(line))} />
        </>
      }
      onEditPricing={() => setEditingPricing(true)}
      equipmentId={line.equipmentId}
      technicianId={line.technicianId}
      onAttributionChange={(attribution) => onChange({ ...line, ...attribution })}
      description={line.description}
      onDescriptionChange={(description) => onChange({ ...line, description })}
      onDelete={onDelete}
      breakpoint={breakpoint}
    >
      <LineSectionDialog<DiscountValues> {...dialogProps} open={editingGeneral} onClose={() => setEditingGeneral(false)} title="General" isBlocked={() => false}>
        {({ values, set, showErrors, mobile }) => <DiscountGeneralFields values={values} set={set} showErrors={showErrors} mobile={mobile} />}
      </LineSectionDialog>
      <LineSectionDialog<DiscountValues>
        {...dialogProps}
        open={editingPricing}
        onClose={() => setEditingPricing(false)}
        title="Pricing"
        isBlocked={(values) => discountProblems(values).pricing}
      >
        {({ values, set, showErrors }) => <DiscountPricingFields values={values} set={set} showErrors={showErrors} />}
      </LineSectionDialog>
    </LinePanel>
  );
}
