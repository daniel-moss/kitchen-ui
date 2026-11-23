import { ReactNode, createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

import { COMPANY, LABOR_ITEMS, OTHER_LABELS, OTHER_SUBTYPES, QUICKBOOKS_ACCOUNTS } from "../../data/db";
import { Breakpoint } from "../../hooks/useIsDesktop";
import NewOtherChargeForm from "../../modules/OtherCharge/NewOtherChargeForm/NewOtherChargeForm";
import OtherChargePanel from "../../modules/OtherCharge/SidePanel/OtherChargePanel";
import { pricebookHistoryRows } from "../../modules/shared/pricebookHistory";
import { useAppStore, useOtherCharge } from "../store/AppStore";
import { createListPanelContext, useListPanel, usePanelState } from "./listPanel";
import { openHistoryRow } from "./pricebookHistory";

// ONE "New other charge" form and ONE "Other charge" side panel for the whole
// app (2026-11-23) — the arrangement shell/products.tsx and shell/laborRates.tsx
// set up, for the same reason: both are overlays that portal to <body>, and
// their entry points are far apart in the tree.
//
//   the form:  the Other charges list's "New" button, and the Create menu's
//              Pricebook item → Other charge.
//   the panel: a row click on the Other charges list, and Create — the form
//              "opens the SidePanel" on the charge it just made.
//
// Both read and write the store, so an edit shows in the list behind them.

const NewOtherChargeContext = createContext<() => void>(() => {});
const OpenOtherChargeContext = createContext<(id: string) => void>(() => {});
const OtherChargeListPanelContext = createListPanelContext();

/** Opens the app's "New other charge" form. Safe to call from anywhere in the app. */
export const useNewOtherCharge = () => useContext(NewOtherChargeContext);

/** Opens the "Other charge" side panel on one charge. */
export const useOpenOtherCharge = () => useContext(OpenOtherChargeContext);

/** The OtherCharge list's side of the panel — the open row, opening from a row, closing. */
export const useOtherChargeListPanel = () => useListPanel(OtherChargeListPanelContext);

const LABEL_POOL = OTHER_LABELS.map((label) => label.name);

/** The name → id map a save from the Labels picker is written back through. */
const labelIdsOf = (names: string[]) => OTHER_LABELS.filter((label) => names.includes(label.name)).map((label) => label.id);

// A function, not a constant: the "Demo settings" page changes COMPANY at run time.
/** QuickBooks Desktop on the Detailed Split scheme only. */
const hasQuickbooks = () =>
  COMPANY.accountingIntegration === "quickbooksDesktop" && COMPANY.quickbooksLineItemScheme === "splitDetailed";

export function OtherChargesProvider({ breakpoint = "auto", children }: { breakpoint?: Breakpoint; children: ReactNode }) {
  const [formOpen, setFormOpen] = useState(false);
  const { panelId, fromList, open: openPanel, close: closePanel, listPanel } = usePanelState();
  const createdId = useRef<string | null>(null);
  const { otherCharges, createOtherCharge, updateOtherCharge, deleteOtherCharge, products, historySources } = useAppStore();

  // Stable, so a memoised consumer (the list's top bar) does not re-render on
  // every app render.
  const openForm = useCallback(() => setFormOpen(true), []);
  const closeForm = useCallback(() => setFormOpen(false), []);

  // Read from the store every render, so the panel shows what the list shows.
  // It goes undefined when the charge is deleted, which closes the panel.
  const charge = useOtherCharge(panelId);
  // The History tab reads the jobs and charge lines as they are in this session.
  const historyRows = useMemo(
    () => (panelId == null ? [] : pricebookHistoryRows((line) => line.otherChargeId === panelId, historySources)),
    [panelId, historySources],
  );
  // The duplicate-name check: production's uniqueness spans every pricebook
  // item of the company.
  const takenNames = useMemo(
    () => [...otherCharges, ...products, ...LABOR_ITEMS].map((row) => row.name),
    [otherCharges, products],
  );

  const update = (patch: Parameters<typeof updateOtherCharge>[1]) => {
    if (charge != null) updateOtherCharge(charge.id, patch);
  };

  return (
    <NewOtherChargeContext.Provider value={openForm}>
      <OpenOtherChargeContext.Provider value={openPanel}>
        <OtherChargeListPanelContext.Provider value={listPanel}>
        {children}

        <NewOtherChargeForm
          open={formOpen}
          onClose={closeForm}
          subtypes={OTHER_SUBTYPES}
          requireSubtypes={COMPANY.requireSubtypes}
          useTaxes={COMPANY.useTaxes}
          defaultIsTaxable={COMPANY.pricebookDefaultTaxableOther}
          quickbooks={hasQuickbooks() ? { accounts: QUICKBOOKS_ACCOUNTS } : undefined}
          existingNames={takenNames}
          onCreated={(input) => {
            // Remembered for onOpenCreated: only the store knows the new id.
            createdId.current = createOtherCharge(input);
          }}
          // Create "opens the SidePanel" on the charge it just made.
          onOpenCreated={() => {
            if (createdId.current != null) openPanel(createdId.current);
          }}
          breakpoint={breakpoint}
        />

        {charge != null && (
          <OtherChargePanel
            open={panelId != null}
            onClose={closePanel}
            // Opened from its list: non-modal, the list stays usable.
            isModal={!fromList}
            charge={charge}
            labelPool={LABEL_POOL}
            existingNames={takenNames}
            requireSubtypes={COMPANY.requireSubtypes}
            useTaxes={COMPANY.useTaxes}
            hasQuickbooksAccounting={hasQuickbooks()}
            historyRows={historyRows}
            onOpenHistory={openHistoryRow}
            onSaveGeneral={(edits) => update(edits)}
            onSavePricing={(edits) => update(edits)}
            onSaveAccounting={(quickbooksAccountId) => update({ quickbooksAccountId })}
            onSaveLabels={(labels) => update({ labelIds: labelIdsOf(labels) })}
            onSaveDescription={(summary) => update({ summary })}
            onSaveNotes={(notes) => update({ notes })}
            onDeactivate={() => update({ isActive: false })}
            onReactivate={() => update({ isActive: true })}
            onConfirm={() => update({ status: "active" })}
            onDelete={() => {
              deleteOtherCharge(charge.id);
              closePanel();
            }}
            breakpoint={breakpoint}
          />
        )}
        </OtherChargeListPanelContext.Provider>
      </OpenOtherChargeContext.Provider>
    </NewOtherChargeContext.Provider>
  );
}
