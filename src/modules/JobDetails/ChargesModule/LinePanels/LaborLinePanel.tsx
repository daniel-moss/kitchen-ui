import { useState } from "react";

import AvatarLaborRate from "../../../../components/Avatar/AvatarLaborRate";
import ValueDisplay from "../../../../components/ValueDisplay/ValueDisplay";
import { formatCurrency } from "../../../../app/listData";
import { LABOR_SUBTYPES } from "../../../../data/db";
import type { Job, LaborItem, LaborLine } from "../../../../data/db";
import { Breakpoint } from "../../../../hooks/useIsDesktop";
import { LaborGeneralFields, laborLineOf, LaborPricingFields, laborProblems, LaborValues, laborValuesOf } from "../LineForms/laborFields";
import { laborAmount, serviceDates, subtypeName } from "../lineDisplay";

import LinePanel, { LineSectionDialog } from "./LinePanel";

// The LABOR RATE line's side panel (Figma 28009-13182).
//   General  Subtype, Service date(s).
//   Pricing  Type, Cost, Price, and on an Hourly line Hours + Amount. Amount is
//            a plain row on purpose (Daniel, 2026-11-04), not the node's divided
//            section: a Flat line would have no such section.

export interface LaborLinePanelProps {
  open: boolean;
  onClose: () => void;
  job: Job;
  /** The pricebook rate the line came from — its Cost is what the help text compares with. */
  rate: LaborItem;
  /** The line's name. */
  title: string;
  line: LaborLine;
  /** A module's dialog saved. */
  onChange: (line: LaborLine) => void;
  /** "Delete" was confirmed. */
  onDelete: () => void;
  /** "Click here" in the Cost help text — opens the rate's side panel. */
  onOpenRate?: () => void;
  breakpoint?: Breakpoint;
}

export default function LaborLinePanel({ open, onClose, job, rate, title, line, onChange, onDelete, onOpenRate, breakpoint }: LaborLinePanelProps) {
  const [editingGeneral, setEditingGeneral] = useState(false);
  const [editingPricing, setEditingPricing] = useState(false);
  const hourly = line.type === "hourly";
  const perHour = (n: number) => (hourly ? `${formatCurrency(n)}/hr` : formatCurrency(n));
  const dates = serviceDates(line);

  const dialogProps = {
    start: () => laborValuesOf(job, rate, line),
    onSave: (values: LaborValues) => onChange(laborLineOf(values)),
    breakpoint,
  };

  return (
    <LinePanel
      open={open}
      onClose={onClose}
      job={job}
      title={title}
      avatar={<AvatarLaborRate size="xl" />}
      noun="labor rate"
      general={
        <>
          <ValueDisplay label="Subtype" value={subtypeName(LABOR_SUBTYPES, line.subtypeId)} />
          <ValueDisplay label={dates.plural ? "Service dates" : "Service date"} value={dates.text} />
        </>
      }
      onEditGeneral={() => setEditingGeneral(true)}
      pricing={
        <>
          <ValueDisplay label="Type" value={hourly ? "Hourly" : "Flat"} />
          <ValueDisplay label="Cost" value={perHour(line.cost)} />
          <ValueDisplay label="Price" value={perHour(line.price)} />
          {hourly && <ValueDisplay label="Hours" value={`${line.hours} hr`} />}
          {hourly && <ValueDisplay label="Amount" value={formatCurrency(laborAmount(line))} />}
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
      <LineSectionDialog<LaborValues>
        {...dialogProps}
        open={editingGeneral}
        onClose={() => setEditingGeneral(false)}
        title="General"
        isBlocked={(values) => laborProblems(values).general}
      >
        {({ values, set, showErrors, mobile }) => (
          <LaborGeneralFields job={job} values={values} set={set} showErrors={showErrors} mobile={mobile} breakpoint={breakpoint} />
        )}
      </LineSectionDialog>
      <LineSectionDialog<LaborValues>
        {...dialogProps}
        open={editingPricing}
        onClose={() => setEditingPricing(false)}
        title="Pricing"
        isBlocked={(values) => laborProblems(values).pricing}
      >
        {({ values, set, showErrors, costChanged, onCostChanged }) => (
          <LaborPricingFields
            job={job}
            rate={rate}
            values={values}
            set={set}
            showErrors={showErrors}
            costChanged={costChanged}
            onCostChanged={onCostChanged}
            onOpenRate={onOpenRate}
          />
        )}
      </LineSectionDialog>
    </LinePanel>
  );
}
