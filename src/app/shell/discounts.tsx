import { ReactNode, createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

import { COMPANY, DISCOUNT_LABELS, DISCOUNT_SUBTYPES, LABOR_ITEMS, QUICKBOOKS_ACCOUNTS } from "../../data/db";
import { Breakpoint } from "../../hooks/useIsDesktop";
import NewDiscountForm from "../../modules/Discount/NewDiscountForm/NewDiscountForm";
import DiscountPanel from "../../modules/Discount/SidePanel/DiscountPanel";
import { pricebookHistoryRows } from "../../modules/shared/pricebookHistory";
import { useAppStore, useDiscount } from "../store/AppStore";
import { openHistoryRow } from "./pricebookHistory";

// ONE "New discount" form and ONE "Discount" side panel for the whole app
// (2026-11-23) — the shell/otherCharges.tsx arrangement.
//
//   the form:  the Discounts list's "New" button, and the Create menu's
//              Pricebook item → Discount.
//   the panel: a row click on the Discounts list, "View pricebook item" on a
//              Job Details discount line, and Create — the form "opens the
//              SidePanel" on the discount it just made.

const NewDiscountContext = createContext<() => void>(() => {});
const OpenDiscountContext = createContext<(id: string) => void>(() => {});

/** Opens the app's "New discount" form. Safe to call from anywhere in the app. */
export const useNewDiscount = () => useContext(NewDiscountContext);

/** Opens the "Discount" side panel on one discount. */
export const useOpenDiscount = () => useContext(OpenDiscountContext);

const LABEL_POOL = DISCOUNT_LABELS.map((label) => label.name);

/** The name → id map a save from the Labels picker is written back through. */
const labelIdsOf = (names: string[]) => DISCOUNT_LABELS.filter((label) => names.includes(label.name)).map((label) => label.id);

// A function, not a constant: the "Demo settings" page changes COMPANY at run time.
/** QuickBooks Desktop on the Detailed Split scheme only. */
const hasQuickbooks = () =>
  COMPANY.accountingIntegration === "quickbooksDesktop" && COMPANY.quickbooksLineItemScheme === "splitDetailed";

export function DiscountsProvider({ breakpoint = "auto", children }: { breakpoint?: Breakpoint; children: ReactNode }) {
  const [formOpen, setFormOpen] = useState(false);
  const [panelId, setPanelId] = useState<string | null>(null);
  const createdId = useRef<string | null>(null);
  const { discounts, createDiscount, updateDiscount, deleteDiscount, otherCharges, products, historySources } = useAppStore();

  const openForm = useCallback(() => setFormOpen(true), []);
  const closeForm = useCallback(() => setFormOpen(false), []);
  const openPanel = useCallback((id: string) => setPanelId(id), []);
  const closePanel = useCallback(() => setPanelId(null), []);

  // Read from the store every render; undefined once deleted, which closes the panel.
  const discount = useDiscount(panelId);
  const historyRows = useMemo(
    () => (panelId == null ? [] : pricebookHistoryRows((line) => line.discountId === panelId, historySources)),
    [panelId, historySources],
  );
  // Production's uniqueness spans every pricebook item of the company.
  const takenNames = useMemo(
    () => [...discounts, ...otherCharges, ...products, ...LABOR_ITEMS].map((row) => row.name),
    [discounts, otherCharges, products],
  );

  const update = (patch: Parameters<typeof updateDiscount>[1]) => {
    if (discount != null) updateDiscount(discount.id, patch);
  };

  return (
    <NewDiscountContext.Provider value={openForm}>
      <OpenDiscountContext.Provider value={openPanel}>
        {children}

        <NewDiscountForm
          open={formOpen}
          onClose={closeForm}
          subtypes={DISCOUNT_SUBTYPES}
          requireSubtypes={COMPANY.requireSubtypes}
          quickbooks={hasQuickbooks() ? { accounts: QUICKBOOKS_ACCOUNTS } : undefined}
          existingNames={takenNames}
          onCreated={(input) => {
            createdId.current = createDiscount(input);
          }}
          onOpenCreated={() => {
            if (createdId.current != null) openPanel(createdId.current);
          }}
          breakpoint={breakpoint}
        />

        {discount != null && (
          <DiscountPanel
            open={panelId != null}
            onClose={closePanel}
            discount={discount}
            labelPool={LABEL_POOL}
            existingNames={takenNames}
            requireSubtypes={COMPANY.requireSubtypes}
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
              deleteDiscount(discount.id);
              closePanel();
            }}
            breakpoint={breakpoint}
          />
        )}
      </OpenDiscountContext.Provider>
    </NewDiscountContext.Provider>
  );
}
