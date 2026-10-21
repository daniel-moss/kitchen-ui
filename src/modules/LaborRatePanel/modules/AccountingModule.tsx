import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import { Icon } from "../../../components/Icon/Icon";
import IconButton from "../../../components/IconButton/IconButton";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../components/ValueDisplay/ValueDisplayGroup";
import { LaborItem } from "../../../data/db";
import { accountNameOf, lastSyncOf, syncStatusOf } from "../laborRateData";

// The Labor rate panel's "Accounting" module (Figma 25-5031) — the QuickBooks
// Desktop half of the record, and the last module in the panel.
//
// The whole module is conditional: "Only shown when a service company uses
// QuickBooks Desktop AND chose the 'Detailed Split' line-item setup" — the one
// setup where an item carries its own revenue account. The caller decides,
// because only it knows the company.
//
//   Revenue account  always. Empty = "No Revenue account" with the module's
//                    "Warning" state (any status — a Review item minted from a
//                    line item has none, and so does an item older than the
//                    integration).
//   Sync status      hidden in Review — an unconfirmed item is never sent to
//                    QuickBooks, so the row could only read "Not synced".
//   Last sync        hidden in Review, and only shown if there is a value.

interface AccountingModuleProps {
  rate: LaborItem;
  onEdit: () => void;
  /** Hidden while the rate is inactive, or without the edit permission. */
  canEdit?: boolean;
  /** Hide the "Sync status" and "Last sync" rows — true while in Review. */
  hideSyncStatus?: boolean;
  isLoading?: boolean;
}

export default function AccountingModule({
  rate,
  onEdit,
  canEdit = true,
  hideSyncStatus = false,
  isLoading = false,
}: AccountingModuleProps) {
  const sync = syncStatusOf(rate);
  const lastSync = lastSyncOf(rate);
  const account = accountNameOf(rate);
  const missing = !isLoading && account == null;

  return (
    <DisplayModule
      title="Accounting"
      status={missing ? "warning" : "none"}
      banner={missing ? { children: "This labor rate needs a revenue account" } : undefined}
      slotRight={
        isLoading || !canEdit ? undefined : (
          <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit accounting" onClick={onEdit} />
        )
      }
      content={
        <ValueDisplayGroup>
          <ValueDisplay label="Revenue account" value={account} isWarning={missing} isLoading={isLoading} />
          {!hideSyncStatus && (
            <ValueDisplay
              label="Sync status"
              value={sync.value}
              valueColor={sync.color}
              slotLeft={sync.icon == null ? undefined : <Icon icon={sync.icon} pack="solid" size={14} />}
              isLoading={isLoading}
            />
          )}
          {!hideSyncStatus && (lastSync != null || isLoading) && (
            <ValueDisplay label="Last sync" value={lastSync} isLoading={isLoading} />
          )}
        </ValueDisplayGroup>
      }
    />
  );
}
