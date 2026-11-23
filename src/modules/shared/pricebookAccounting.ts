import { COMPANY, QUICKBOOKS_ACCOUNTS, QUICKBOOKS_ASSET_ACCOUNTS, QUICKBOOKS_COGS_ACCOUNTS, QUICKBOOKS_VENDORS } from "../../data/db";
import { QuickbooksAccount, QuickbooksVendor } from "../../data/db/types";
import { accountLabel } from "../Product/NewProductForm/AccountField";

import { formatShortDateTime } from "./dates";

// The pricebook "Accounting" tab's data rules — SHARED by every pricebook item
// (Figma "↳ Shared Tabs" → Accounting 3091-22787; Daniel 2026-11-20: "they
// will work the same across all pricebook items").

/**
 * One item's QuickBooks Desktop half, whatever the item type. The labor rate
 * and the product each map their record onto it.
 */
export interface PricebookAccounting {
  /** Production `quickbooks_desktop_revenue_account_id`. */
  revenueAccountId?: string;
  /** Production `quickbooks_desktop_cogs_account_id` — Inventory products only. */
  cogsAccountId?: string;
  /** Production `quickbooks_desktop_inventory_asset_account_id` — Inventory products only. */
  assetAccountId?: string;
  /** Production `quickbooks_desktop_tax_agency_vendor_id` — tax rates only, in place of the revenue account. */
  taxAgencyVendorId?: string;
  /** Production `quickbooks_desktop_item_needs_syncing`. */
  needsSyncing?: boolean;
  /** When it last reached QuickBooks. Undefined = never. */
  syncedAt?: string;
}

/** The three account lists the fields pick from, and the company's defaults for the two inventory ones. */
export interface PricebookAccountLists {
  revenue: QuickbooksAccount[];
  cogs: QuickbooksAccount[];
  asset: QuickbooksAccount[];
  /** The company's QuickBooks Desktop vendors — a tax rate's collection agency comes from these. */
  vendors: QuickbooksVendor[];
  defaultCogsId?: string;
  defaultAssetId?: string;
}

/** The demo company's lists and defaults. */
export const DEMO_ACCOUNT_LISTS: PricebookAccountLists = {
  revenue: QUICKBOOKS_ACCOUNTS,
  cogs: QUICKBOOKS_COGS_ACCOUNTS,
  asset: QUICKBOOKS_ASSET_ACCOUNTS,
  vendors: QUICKBOOKS_VENDORS,
  defaultCogsId: COMPANY.quickbooksDefaultCogsAccountId,
  defaultAssetId: COMPANY.quickbooksDefaultAssetAccountId,
};

/** "4010  ·  Service Revenue", or undefined when the item carries none ("No [Label]"). */
export const accountNameIn = (accounts: QuickbooksAccount[], id: string | undefined) => {
  const account = accounts.find((row) => row.id === id);
  return account == null ? undefined : accountLabel(account);
};

/**
 * "Synced" (jade, circle-check) or "Not synced" (placeholder). Production
 * reports only `needs_syncing` + `last_synced_at`, so a FAILED sync is
 * indistinguishable from "not synced yet".
 */
export const syncStatusOf = (item: Pick<PricebookAccounting, "needsSyncing" | "syncedAt">) =>
  item.needsSyncing || item.syncedAt == null
    ? { value: "Not synced", color: "var(--text-placeholder)", icon: undefined }
    : { value: "Synced", color: "var(--text-success)", icon: "circle-check" };

/** "Last sync" — undefined when it never synced, and the row is then not drawn ("Only shown if there is a value"). */
export const lastSyncOf = (item: Pick<PricebookAccounting, "syncedAt">) =>
  item.syncedAt == null ? undefined : formatShortDateTime(item.syncedAt);
