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
// The whole module is conditional, on TWO company settings: "Only shown if the
// QuickBooks Desktop integration is on and the company uses the detailed
// line-item scheme" (the Overview frame's annotation). Only that scheme gives
// an item its own revenue account — on the generic one the account lives in
// the company's settings, and the item has nothing to show. The caller
// decides, because only it knows the company.
//
// Three rows, and only the first is unconditional:
//   QuickBooks revenue account  always. Empty on a Review item: the system
//                               mints those straight through the ORM, which
//                               skips the check that would require one.
//   Sync status                 hidden in REVIEW — production's export filters
//                               `confirmed=True`, so an unvetted item is never
//                               pushed and the row could only read "Not synced".
//   Last sync                   hidden in Review, and "only shown if there is
//                               value" — an item that has never reached
//                               QuickBooks has no timestamp to report.

interface AccountingModuleProps {
  rate: LaborItem;
  onEdit: () => void;
  /** Hidden while the rate is inactive or in Review, or without the edit permission. */
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
          <ValueDisplay label="QuickBooks revenue account" value={accountNameOf(rate)} isLoading={isLoading} />
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
