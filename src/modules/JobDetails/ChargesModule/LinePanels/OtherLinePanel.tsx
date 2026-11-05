import { useState } from "react";

import AvatarOther from "../../../../components/Avatar/AvatarOther";
import ValueDisplay from "../../../../components/ValueDisplay/ValueDisplay";
import { formatCurrency } from "../../../../app/listData";
import { OTHER_SUBTYPES } from "../../../../data/db";
import type { ChargeItem, Job, OtherLine } from "../../../../data/db";
import { Breakpoint } from "../../../../hooks/useIsDesktop";
import { OtherGeneralFields, otherLineOf, OtherPricingFields, otherProblems, OtherValues, otherValuesOf } from "../LineForms/otherFields";
import { otherAmount, subtypeName } from "../lineDisplay";

import LinePanel, { LineSectionDialog } from "./LinePanel";

// The OTHER CHARGE line's side panel (Figma 28009-26345).
//   General  Subtype.
//   Pricing  Cost, Price, Quantity, Amount — a plain row, like the labor rate's.

export interface OtherLinePanelProps {
  open: boolean;
  onClose: () => void;
  job: Job;
  /** The pricebook charge the line came from. */
  charge: ChargeItem;
  /** The line's name. */
  title: string;
  line: OtherLine;
  /** A module's dialog saved. */
  onChange: (line: OtherLine) => void;
  /** "Delete" was confirmed. */
  onDelete: () => void;
  breakpoint?: Breakpoint;
}

export default function OtherLinePanel({ open, onClose, job, charge, title, line, onChange, onDelete, breakpoint }: OtherLinePanelProps) {
  const [editingGeneral, setEditingGeneral] = useState(false);
  const [editingPricing, setEditingPricing] = useState(false);

  const dialogProps = {
    start: () => otherValuesOf(charge, line),
    onSave: (values: OtherValues) => onChange(otherLineOf(values)),
    breakpoint,
  };

  return (
    <LinePanel
      open={open}
      onClose={onClose}
      job={job}
      title={title}
      avatar={<AvatarOther size="xl" />}
      noun="charge"
      general={<ValueDisplay label="Subtype" value={subtypeName(OTHER_SUBTYPES, line.subtypeId)} />}
      onEditGeneral={() => setEditingGeneral(true)}
      pricing={
        <>
          <ValueDisplay label="Cost" value={formatCurrency(line.cost)} />
          <ValueDisplay label="Price" value={formatCurrency(line.price)} />
          <ValueDisplay label="Quantity" value={String(line.quantity)} />
          <ValueDisplay label="Amount" value={formatCurrency(otherAmount(line))} />
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
      <LineSectionDialog<OtherValues> {...dialogProps} open={editingGeneral} onClose={() => setEditingGeneral(false)} title="General" isBlocked={() => false}>
        {({ values, set, showErrors, mobile }) => <OtherGeneralFields values={values} set={set} showErrors={showErrors} mobile={mobile} />}
      </LineSectionDialog>
      <LineSectionDialog<OtherValues>
        {...dialogProps}
        open={editingPricing}
        onClose={() => setEditingPricing(false)}
        title="Pricing"
        isBlocked={(values) => otherProblems(values).pricing}
      >
        {({ values, set, showErrors, costChanged, onCostChanged }) => (
          <OtherPricingFields charge={charge} values={values} set={set} showErrors={showErrors} costChanged={costChanged} onCostChanged={onCostChanged} />
        )}
      </LineSectionDialog>
    </LinePanel>
  );
}
