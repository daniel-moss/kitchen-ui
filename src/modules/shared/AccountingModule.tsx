import DisplayModule from "../../components/DisplayModule/DisplayModule";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import ValueDisplay from "../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../components/ValueDisplay/ValueDisplayGroup";

import { accountNameIn, DEMO_ACCOUNT_LISTS, lastSyncOf, PricebookAccountLists, PricebookAccounting, syncStatusOf } from "./pricebookAccounting";

// The pricebook "Accounting" module — the whole "Accounting" tab, SHARED by
// every pricebook item (Figma "↳ Shared Tabs" → Accounting 3091-22787,
// Overview 25-5032, Warning 3086-18644, Sync Status 25-5038).
//
// The tab only exists "when a service company uses QuickBooks Desktop AND
// chose the 'Detailed Split' line-item setup" — the caller decides, because
// only it knows the company.
//
//   Revenue account          always. Wraps.
//   Cost of goods account    only for an "Inventory" product. Wraps.
//   Inventory asset account  only for an "Inventory" product. Wraps.
//   Sync status              "Synced" / "Not synced" — hidden in Review.
//   Last sync                hidden in Review, and only with a value.
//
// WARNING "fires only when Revenue account is missing": the warning ring, the
// "Key details missing!" banner and the amber "No Revenue account". The two
// inventory accounts are optional, so their "No …" is plain.

interface AccountingModuleProps {
  accounting: PricebookAccounting;
  /** An "Inventory" product: adds Cost of goods + Inventory asset account. */
  showInventoryAccounts?: boolean;
  /** The account lists the names come from. Default: the demo company's. */
  accounts?: PricebookAccountLists;
  onEdit: () => void;
  /** Hidden while the item is inactive, or without the edit permission. */
  canEdit?: boolean;
  /** Hide "Sync status" and "Last sync" — true while in Review. */
  hideSyncStatus?: boolean;
  isLoading?: boolean;
}

export default function AccountingModule({
  accounting,
  showInventoryAccounts = false,
  accounts = DEMO_ACCOUNT_LISTS,
  onEdit,
  canEdit = true,
  hideSyncStatus = false,
  isLoading = false,
}: AccountingModuleProps) {
  const sync = syncStatusOf(accounting);
  const lastSync = lastSyncOf(accounting);
  const revenue = accountNameIn(accounts.revenue, accounting.revenueAccountId);
  const missing = !isLoading && revenue == null;

  return (
    <DisplayModule
      title="Accounting"
      status={missing ? "warning" : "none"}
      banner={missing ? { children: "Key details missing!" } : undefined}
      slotRight={
        isLoading || !canEdit ? undefined : (
          <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit accounting" onClick={onEdit} />
        )
      }
      content={
        <ValueDisplayGroup>
          <ValueDisplay label="Revenue account" value={revenue} isWarning={missing} isLoading={isLoading} />
          {showInventoryAccounts && (
            <ValueDisplay
              label="Cost of goods account"
              value={accountNameIn(accounts.cogs, accounting.cogsAccountId)}
              isLoading={isLoading}
            />
          )}
          {showInventoryAccounts && (
            <ValueDisplay
              label="Inventory asset account"
              value={accountNameIn(accounts.asset, accounting.assetAccountId)}
              isLoading={isLoading}
            />
          )}
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
