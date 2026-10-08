import { ReactNode, createContext, useCallback, useContext, useRef, useState } from "react";

import { COMPANY, QUICKBOOKS_VENDORS, TAX_RATE_LABELS } from "../../data/db";
import { Breakpoint } from "../../hooks/useIsDesktop";
import NewTaxRateForm from "../../modules/NewTaxRateForm/NewTaxRateForm";
import TaxRatePanel from "../../modules/TaxRatePanel/TaxRatePanel";
import { useAppStore, useTaxRate } from "../store/AppStore";

// ONE "New tax rate" form and ONE "Tax rate" side panel for the whole app —
// the same arrangement the "New job" form uses (shell/newJob.tsx), and for the
// same reason: both are overlays that portal to <body>, and their entry points
// are far apart in the tree.
//
//   the form   the Tax rates list's "New" button, and the Create menu's
//              Pricebook item → Tax rate (rendered by the sidebar on desktop
//              and by the bottom bar on mobile).
//   the panel  a row click on the Tax rates list, and the "Preview" link on
//              the toast the form shows after creating a rate — which can be
//              on screen while ANY page is open, because the Create menu is
//              everywhere. A panel owned by the Tax rates page could not
//              serve that second one.
//
// Both read and write the app store, so an edit made in the panel shows in the
// list behind it, and a created rate appears there straight away.

const NewTaxRateContext = createContext<() => void>(() => {});
const OpenTaxRateContext = createContext<(id: string) => void>(() => {});

/** Opens the app's "New tax rate" form. Safe to call from anywhere in the app. */
export const useNewTaxRate = () => useContext(NewTaxRateContext);

/** Opens the "Tax rate" side panel on one rate. */
export const useOpenTaxRate = () => useContext(OpenTaxRateContext);

const LABEL_POOL = TAX_RATE_LABELS.map((label) => label.name);

// Whether this company has an accounting integration at all, and whether it is
// the one that gives a tax rate an agency. Both come from the database — the
// app must not assume (Daniel, 2026-10-05).
const HAS_ACCOUNTING = COMPANY.accountingIntegration !== "none";
const ON_QUICKBOOKS = COMPANY.accountingIntegration === "quickbooksDesktop";

/** The name → id map a save from the Labels picker is written back through. */
const labelIdsOf = (names: string[]) => TAX_RATE_LABELS.filter((label) => names.includes(label.name)).map((label) => label.id);

export function TaxRatesProvider({ breakpoint = "auto", children }: { breakpoint?: Breakpoint; children: ReactNode }) {
  const { taxRates, updateTaxRate, createTaxRate, deleteTaxRate } = useAppStore();

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
  const rate = useTaxRate(panelId);

  return (
    <NewTaxRateContext.Provider value={openForm}>
      <OpenTaxRateContext.Provider value={openPanel}>
        {children}

        <NewTaxRateForm
          open={formOpen}
          onClose={closeForm}
          labelPool={LABEL_POOL}
          // The duplicate-name check. Production's uniqueness spans every
          // pricebook item of the company; the app only has the tax rates, so
          // that is what it can offer.
          existingNames={taxRates.map((row) => row.name)}
          // The COMPANY decides whether accounting exists here (see
          // `accountingIntegration` in the database). Only QuickBooks Desktop
          // asks a tax rate for a collection agency, so only it hands the form
          // its QuickBooks context — and without one the whole "Accounting"
          // module is gone.
          quickbooks={ON_QUICKBOOKS ? { vendors: QUICKBOOKS_VENDORS } : undefined}
          onCreated={(input) => {
            // Remembered for "Preview" below: the form hands its own value to
            // that callback, but only the store knows the id it was given.
            createdId.current = createTaxRate(input);
          }}
          // The form's success toast offers "Preview"; it opens the panel on
          // the rate that was just created, wherever the user happens to be.
          onPreview={() => {
            if (createdId.current != null) openPanel(createdId.current);
          }}
          breakpoint={breakpoint}
        />

        {rate != null && (
          <TaxRatePanel
            open={panelId != null}
            onClose={closePanel}
            rate={rate}
            labelPool={LABEL_POOL}
            hasAccountingIntegration={HAS_ACCOUNTING}
            onSaveDetails={(edits) => updateTaxRate(rate.id, edits)}
            onSaveAccounting={(quickbooksVendorId) => updateTaxRate(rate.id, { quickbooksVendorId })}
            onSaveLabels={(labels) => updateTaxRate(rate.id, { labelIds: labelIdsOf(labels) })}
            onSaveSummary={(summary) => updateTaxRate(rate.id, { summary })}
            onSaveNotes={(notes) => updateTaxRate(rate.id, { notes })}
            onDeactivate={() => updateTaxRate(rate.id, { isActive: false })}
            onReactivate={() => updateTaxRate(rate.id, { isActive: true })}
            onConfirm={() => updateTaxRate(rate.id, { status: "active" })}
            onDelete={() => {
              deleteTaxRate(rate.id);
              closePanel();
            }}
            breakpoint={breakpoint}
          />
        )}
      </OpenTaxRateContext.Provider>
    </NewTaxRateContext.Provider>
  );
}
