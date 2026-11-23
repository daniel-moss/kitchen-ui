import { createContext, useCallback, useContext, useMemo, useState } from "react";

// Which pricebook item a side panel shows, and HOW it was opened (Daniel,
// 2026-11-23, "easier to scan and navigate"):
//
//   from its LIST   the panel is NON-MODAL on desktop (no scrim, the list stays
//                   usable), its row stays pressed, ↑ / ↓ move through the
//                   rows, and a second click on the row closes it;
//   anywhere else   (Create, Job Details' "View pricebook item") the panel is
//                   the ordinary modal one.
//
// Every pricebook provider (labor rates, products, other charges, discounts,
// tax rates) keeps its panel in this hook and hands the list side to its
// page through a `ListPanelContext`.

export interface ListPanelValue {
  /** The row whose panel is open — only when it was opened from the list. */
  selectedId: string | null;
  /** Opens (or switches) the panel from the list — non-modal. */
  openFromList: (id: string) => void;
  /** Closes the panel. */
  close: () => void;
}

export const EMPTY_LIST_PANEL: ListPanelValue = { selectedId: null, openFromList: () => {}, close: () => {} };

/** A context per pricebook type, so each list reads its own panel. */
export const createListPanelContext = () => createContext<ListPanelValue>(EMPTY_LIST_PANEL);

export function usePanelState() {
  const [panel, setPanel] = useState<{ id: string; fromList: boolean } | null>(null);
  const open = useCallback((id: string) => setPanel({ id, fromList: false }), []);
  const openFromList = useCallback((id: string) => setPanel({ id, fromList: true }), []);
  const close = useCallback(() => setPanel(null), []);
  const fromList = panel?.fromList ?? false;
  const panelId = panel?.id ?? null;
  const listPanel = useMemo<ListPanelValue>(
    () => ({ selectedId: fromList ? panelId : null, openFromList, close }),
    [fromList, panelId, openFromList, close],
  );
  return { panelId, fromList, open, close, listPanel };
}

/** The list side of one provider's panel. */
export const useListPanel = (context: React.Context<ListPanelValue>) => useContext(context);
