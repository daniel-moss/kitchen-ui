import { useState } from "react";

import { LABOR_LABELS, LaborItem } from "../../data/db";
import LaborRatePanel from "../LaborRatePanel/LaborRatePanel";

import { NewLaborRate } from "./NewLaborRateForm.types";

// Stories only: the "Create" button "opens the SidePanel" on the rate it just
// made (the Create button's annotation, step 5). The form only hands the new
// rate to `onOpenCreated`; a caller owns the panel — the demo app
// (src/app/shell/laborRates.tsx) does it with its store, and this hook does it
// for the module stories, so the whole flow can be tried in Storybook.

/** A created rate as the db would store it: confirmed, active, made by the viewer. */
export const laborItemOf = (input: NewLaborRate, id: string): LaborItem => {
  const now = new Date().toISOString();
  return {
    id,
    name: input.name,
    status: "active",
    isActive: true,
    subtypeId: input.subtypeId ?? null,
    description: "",
    notes: "",
    cost: input.cost,
    rate: input.rate,
    unitType: input.rateType === "hourly" ? "hourly" : "flatRate",
    taxable: input.isTaxable,
    labelIds: [],
    priceStrategy: input.priceStrategy,
    priceAdjustmentAmount: input.fixedMarkup,
    priceAdjustmentPercent: input.percentMarkup,
    quickbooksAccountId: input.quickbooksAccountId,
    createdAt: now,
    createdById: 1,
    lastModifiedAt: now,
    needsSyncing: true,
  };
};

const LABEL_POOL = LABOR_LABELS.map((label) => label.name);

/**
 * `onOpenCreated` for the form, and the panel it opens. `onCreated` hands back
 * the stored record, for a caller that also lists it (the SelectList story).
 */
export function useOpenCreatedPanel({
  breakpoint,
  existingNames = [],
  requireSubtypes = false,
  hasQuickbooksAccounting = true,
  onCreated,
}: {
  breakpoint: "desktop" | "mobile";
  existingNames?: string[];
  requireSubtypes?: boolean;
  hasQuickbooksAccounting?: boolean;
  onCreated?: (rate: LaborItem) => void;
}) {
  const [rate, setRate] = useState<LaborItem | null>(null);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  const edit = (changes: Partial<LaborItem>) => setRate((prev) => (prev == null ? prev : { ...prev, ...changes }));

  const onOpenCreated = (input: NewLaborRate) => {
    const created = laborItemOf(input, `created-${count}`);
    setCount((n) => n + 1);
    setRate(created);
    setOpen(true);
    onCreated?.(created);
  };

  const panel =
    rate == null ? null : (
      <LaborRatePanel
        open={open}
        onClose={() => setOpen(false)}
        rate={rate}
        labelPool={LABEL_POOL}
        existingNames={existingNames}
        requireSubtypes={requireSubtypes}
        hasQuickbooksAccounting={hasQuickbooksAccounting}
        breakpoint={breakpoint}
        onSaveGeneral={edit}
        onSavePricing={edit}
        onSaveAccounting={(quickbooksAccountId) => edit({ quickbooksAccountId })}
        onSaveLabels={(labels) =>
          edit({ labelIds: LABOR_LABELS.filter((label) => labels.includes(label.name)).map((label) => label.id) })
        }
        onSaveDescription={(description) => edit({ description })}
        onSaveNotes={(notes) => edit({ notes })}
        onDeactivate={() => edit({ isActive: false })}
        onReactivate={() => edit({ isActive: true })}
      />
    );

  return { onOpenCreated, panel };
}
