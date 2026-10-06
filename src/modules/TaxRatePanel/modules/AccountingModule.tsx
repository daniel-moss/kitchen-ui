import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import { Icon } from "../../../components/Icon/Icon";
import IconButton from "../../../components/IconButton/IconButton";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../components/ValueDisplay/ValueDisplayGroup";
import { TaxRateItem } from "../../../data/db";
import { lastSyncOf, syncStatusOf, vendorNameOf } from "../taxRateData";

// The Tax rate panel's "Accounting" module (Figma 25-5031) — the QuickBooks
// Desktop half of the record.
//
// The whole module is conditional: "Only shown if a company has accounting
// integration" (the Overview frame's annotation). The caller decides, because
// only it knows the company.
//
// Three rows, and only the first is unconditional:
//   QuickBooks tax collection agency  always.
//   Sync status                       hidden in REVIEW — production's export
//                                     filters `confirmed=True`, so an unvetted
//                                     rate is never pushed and the row could
//                                     only ever read "Not synced".
//   Last sync                         hidden in Review, and "only shown if
//                                     there is value" — a rate that has never
//                                     reached the accounting system has no
//                                     timestamp to report.

interface AccountingModuleProps {
  rate: TaxRateItem;
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

  return (
    <DisplayModule
      title="Accounting"
      slotRight={
        isLoading || !canEdit ? undefined : (
          <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit accounting" onClick={onEdit} />
        )
      }
      content={
        <ValueDisplayGroup>
          <ValueDisplay label="QuickBooks tax collection agency" value={vendorNameOf(rate)} isLoading={isLoading} />
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
