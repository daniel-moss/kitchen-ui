import { ReactNode, createContext, useCallback, useContext, useRef, useState } from "react";

import { COMPANY, LABOR_LABELS, LABOR_SUBTYPES, QUICKBOOKS_ACCOUNTS } from "../../data/db";
import { Breakpoint } from "../../hooks/useIsDesktop";
import LaborRatePanel from "../../modules/LaborRatePanel/LaborRatePanel";
import NewLaborRateForm from "../../modules/NewLaborRateForm/NewLaborRateForm";
import { useAppStore, useLaborRate } from "../store/AppStore";

// ONE "New labor rate" form and ONE "Labor rate" side panel for the whole app
// — the arrangement shell/taxRates.tsx set up, for the same reason: both are
// overlays that portal to <body>, and their entry points are far apart in the
// tree.
//
//   the form   the Labor rates list's "New" button, and the Create menu's
//              Pricebook item → Labor rate (rendered by the sidebar on desktop
//              and by the bottom bar on mobile).
//   the panel  a row click on the Labor rates list, and the "Preview" link on
//              the toast the form shows after creating a rate — which can be
//              on screen while ANY page is open, because the Create menu is
//              everywhere.
//
// Both read and write the app store, so an edit made in the panel shows in the
// list behind it, and a created rate appears there straight away.

const NewLaborRateContext = createContext<() => void>(() => {});
const OpenLaborRateContext = createContext<(id: string) => void>(() => {});

/** Opens the app's "New labor rate" form. Safe to call from anywhere in the app. */
export const useNewLaborRate = () => useContext(NewLaborRateContext);

/** Opens the "Labor rate" side panel on one rate. */
export const useOpenLaborRate = () => useContext(OpenLaborRateContext);

const LABEL_POOL = LABOR_LABELS.map((label) => label.name);

// Everything company-shaped comes from the database, never from an assumption
// (the rule Daniel set on 2026-10-05). A labor rate carries its OWN QuickBooks
// revenue account in exactly one setup: QuickBooks Desktop plus the detailed
// line-item scheme. Under the generic scheme the account lives in the
// company's settings, so the form's field and the panel's whole "Accounting"
// module disappear.
const ON_QUICKBOOKS_DETAILED =
  COMPANY.accountingIntegration === "quickbooksDesktop" && COMPANY.quickbooksLineItemScheme === "splitDetailed";

/** The name → id map a save from the Labels picker is written back through. */
const labelIdsOf = (names: string[]) => LABOR_LABELS.filter((label) => names.includes(label.name)).map((label) => label.id);

export function LaborRatesProvider({ breakpoint = "auto", children }: { breakpoint?: Breakpoint; children: ReactNode }) {
  const { laborRates, updateLaborRate, createLaborRate, deleteLaborRate } = useAppStore();

  const [formOpen, setFormOpen] = useState(false);
  const [panelId, setPanelId] = useState<string | null>(null);
  const createdId = useRef<string | null>(null);

  // Stable, so a memoised consumer (the list's top bar, the table) does not
  // re-render on every app render.
  const openForm = useCallback(() => setFormOpen(true), []);
  const closeForm = useCallback(() => setFormOpen(false), []);
  const openPanel = useCallback((id: string) => setPanelId(id), []);
  const closePanel = useCallback(() => setPanelId(null), []);

  // The record is read from the store every render, so the panel shows the
  // same values the list does. It goes undefined when the rate is deleted,
  // which is also what closes the panel.
  const rate = useLaborRate(panelId);

  return (
    <NewLaborRateContext.Provider value={openForm}>
      <OpenLaborRateContext.Provider value={openPanel}>
        {children}

        <NewLaborRateForm
          open={formOpen}
          onClose={closeForm}
          subtypes={LABOR_SUBTYPES}
          requireSubtypes={COMPANY.requireSubtypes}
          useTaxes={COMPANY.useTaxes}
          defaultTaxable={COMPANY.pricebookDefaultTaxableLabor}
          quickbooks={ON_QUICKBOOKS_DETAILED ? { accounts: QUICKBOOKS_ACCOUNTS } : undefined}
          labelPool={LABEL_POOL}
          // The duplicate-name check. Production's uniqueness spans every
          // pricebook item of the company; the app only has these rates, so
          // that is what it can offer.
          existingNames={laborRates.map((row) => row.name)}
          onCreated={(input) => {
            // Remembered for "Preview" below: the form hands its own value to
            // that callback, but only the store knows the id it was given.
            createdId.current = createLaborRate(input);
          }}
          // The form's success toast offers "Preview"; it opens the panel on
          // the rate that was just created, wherever the user happens to be.
          onPreview={() => {
            if (createdId.current != null) openPanel(createdId.current);
          }}
          breakpoint={breakpoint}
        />

        {rate != null && (
          <LaborRatePanel
            open={panelId != null}
            onClose={closePanel}
            rate={rate}
            labelPool={LABEL_POOL}
            existingNames={laborRates.map((row) => row.name)}
            requireSubtypes={COMPANY.requireSubtypes}
            useTaxes={COMPANY.useTaxes}
            hasQuickbooksAccounting={ON_QUICKBOOKS_DETAILED}
            onSaveGeneral={(edits) => updateLaborRate(rate.id, edits)}
            onSavePricing={(edits) => updateLaborRate(rate.id, edits)}
            onSaveAccounting={(quickbooksAccountId) => updateLaborRate(rate.id, { quickbooksAccountId })}
            onSaveLabels={(labels) => updateLaborRate(rate.id, { labelIds: labelIdsOf(labels) })}
            onSaveSummary={(summary) => updateLaborRate(rate.id, { summary })}
            onSaveNotes={(notes) => updateLaborRate(rate.id, { notes })}
            onDeactivate={() => updateLaborRate(rate.id, { isActive: false })}
            onReactivate={() => updateLaborRate(rate.id, { isActive: true })}
            onConfirm={() => updateLaborRate(rate.id, { status: "active" })}
            onDelete={() => {
              deleteLaborRate(rate.id);
              closePanel();
            }}
            breakpoint={breakpoint}
          />
        )}
      </OpenLaborRateContext.Provider>
    </NewLaborRateContext.Provider>
  );
}
