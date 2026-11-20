import { HistoryRow } from "../../modules/EquipmentPanel/equipmentData";
import { formatHash } from "../routing/routes";

// The pricebook side panels' "History" tab in the demo app (2026-11-20).
//
// A row opens its job or invoice ON A SEPARATE BROWSER TAB — the Equipment
// panel's rule, which the shared History follows — so the panel the user was
// reading stays where it was. The job has a details page; an invoice route
// still falls back to the Invoices list (no invoice page yet).
export function openHistoryRow(row: HistoryRow) {
  const hash = formatHash({ kind: "object", object: row.kind === "invoice" ? "invoice" : "job", id: row.id });
  const url = `${window.location.pathname}${window.location.search}${hash}`;
  window.open(url, "_blank", "noopener");
}
