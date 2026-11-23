import { useEffect, useState } from "react";

import AlertBanner from "../../components/AlertBanner/AlertBanner";
import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { toast } from "../../components/Toast/Toaster";
import useIsDesktop from "../../hooks/useIsDesktop";
import AccountField, { accountValue } from "../Product/NewProductForm/AccountField";

import { DEMO_ACCOUNT_LISTS, PricebookAccountLists, PricebookAccounting } from "./pricebookAccounting";

import styles from "./EditAccountingDialog.module.scss";

// The pricebook "Accounting" edit form — SHARED by every pricebook item
// (Figma "↳ Shared Tabs" → Accounting → Edit 25-5041: Desktop 25-5042, Mobile
// 25-5044). A default Dialog titled "Accounting":
//
//   info banner              "The [pricebook_item] won't be available for use
//                            in invoice or estimate line items until it's been
//                            synced with QuickBooks Desktop" — [pricebook_item]
//                            is the item type (labor rate, product, charge,
//                            discount). Dismissible, for this opening only.
//   Revenue account          required (Shared Fields 3054-11652).
//   Cost of goods account    "(optional)", Inventory products only; opens on
//   Inventory asset account  the saved account — or, when there is none, the
//                            company's default with "Pre-selected based on
//                            company default account" (3225-69833 / -69867).
//
// A TAX RATE (`isTaxRate`, 2026-11-23) edits "Tax collection agency" — the
// company's QuickBooks vendors, required — instead of the revenue account, and
// its banner says "during invoice or estimate creation", because a tax rate is
// never a line item.
//
// Save "validates the fields, applies the changes, closes the Dialog, triggers
// the Toast" ('"Accounting" module updated' / 'Couldn't update "Accounting"
// module').

/** What Save hands back — the three accounts, or a tax rate's agency. */
export type AccountingEdits = Pick<PricebookAccounting, "revenueAccountId" | "cogsAccountId" | "assetAccountId" | "taxAgencyVendorId">;

interface EditAccountingDialogProps {
  open: boolean;
  onClose: () => void;
  /** The item type the banner names — "labor rate", "product", "charge", "discount". */
  itemNoun: string;
  accounting: PricebookAccounting;
  /** An "Inventory" product: adds the two inventory account fields. */
  showInventoryAccounts?: boolean;
  /** A tax rate: the "Tax collection agency" field replaces every account field. */
  isTaxRate?: boolean;
  /** The account lists and the company defaults. Default: the demo company's. */
  accounts?: PricebookAccountLists;
  /** Return `false` to say the save FAILED: the error toast shows and the form stays open. */
  onSave: (edits: AccountingEdits) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function EditAccountingDialog({
  open,
  onClose,
  itemNoun,
  accounting,
  showInventoryAccounts = false,
  isTaxRate = false,
  accounts = DEMO_ACCOUNT_LISTS,
  onSave,
  breakpoint = "auto",
}: EditAccountingDialogProps) {
  const mobile = !useIsDesktop(breakpoint);

  const opening = () => ({
    revenue: accounting.revenueAccountId ?? null,
    cogs: accounting.cogsAccountId ?? accounts.defaultCogsId ?? null,
    asset: accounting.assetAccountId ?? accounts.defaultAssetId ?? null,
  });
  const [initial, setInitial] = useState(opening);
  const [revenueId, setRevenueId] = useState<string | null>(initial.revenue);
  const [cogsId, setCogsId] = useState<string | null>(initial.cogs);
  const [assetId, setAssetId] = useState<string | null>(initial.asset);
  const [agencyId, setAgencyId] = useState<string | null>(accounting.taxAgencyVendorId ?? null);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    const next = opening();
    setInitial(next);
    setRevenueId(next.revenue);
    setCogsId(next.cogs);
    setAssetId(next.asset);
    setAgencyId(accounting.taxAgencyVendorId ?? null);
    setBannerOpen(true);
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, accounting]);

  const revenue = accountValue(accounts.revenue, revenueId);
  const agency = accountValue(accounts.vendors, agencyId);
  const dirty = isTaxRate
    ? agency !== (accounting.taxAgencyVendorId ?? null)
    : revenue !== (accounting.revenueAccountId ?? null) ||
      (showInventoryAccounts && (cogsId !== initial.cogs || assetId !== initial.asset));

  const save = async () => {
    if (isTaxRate ? agency == null : revenue == null) {
      setShowErrors(true);
      return;
    }
    const edits: AccountingEdits = isTaxRate
      ? { taxAgencyVendorId: agency ?? undefined }
      : {
          revenueAccountId: revenue ?? undefined,
          cogsAccountId: showInventoryAccounts ? (cogsId ?? undefined) : accounting.cogsAccountId,
          assetAccountId: showInventoryAccounts ? (assetId ?? undefined) : accounting.assetAccountId,
        };
    if ((await onSave(edits)) === false) {
      toast({
        type: "error",
        variant: "detailed",
        title: 'Couldn\'t update "Accounting" module',
        caption: "Something went wrong. Please try again.",
      });
      return;
    }
    toast({ type: "success", title: '"Accounting" module updated' });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Accounting"
      breakpoint={breakpoint}
      confirmOnDismiss={dirty}
      footer={
        <PopoverFooter
          slotLeft={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={save}>
            Save
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.fields}>
        {bannerOpen && (
          <AlertBanner type="card" status="info" orientation="vertical" onDismiss={() => setBannerOpen(false)}>
            {isTaxRate
              ? `The ${itemNoun} won't be available for use during invoice or estimate creation until it's been synced with QuickBooks Desktop`
              : `The ${itemNoun} won't be available for use in invoice or estimate line items until it's been synced with QuickBooks Desktop`}
          </AlertBanner>
        )}
        {isTaxRate ? (
          <AccountField
            label="Tax collection agency"
            noun="vendor"
            accounts={accounts.vendors}
            value={agencyId}
            onChange={setAgencyId}
            showErrors={showErrors}
            mobile={mobile}
          />
        ) : (
          <AccountField
            label="Revenue account"
            accounts={accounts.revenue}
            value={revenueId}
            onChange={setRevenueId}
            showErrors={showErrors}
            mobile={mobile}
          />
        )}
        {showInventoryAccounts && (
          <>
            <AccountField
              label="Cost of goods account"
              accounts={accounts.cogs}
              value={cogsId}
              onChange={setCogsId}
              // The help text only while the field still holds the default it was pre-filled with.
              defaultId={accounting.cogsAccountId == null ? accounts.defaultCogsId : undefined}
              optional
              showErrors={showErrors}
              mobile={mobile}
            />
            <AccountField
              label="Inventory asset account"
              accounts={accounts.asset}
              value={assetId}
              onChange={setAssetId}
              defaultId={accounting.assetAccountId == null ? accounts.defaultAssetId : undefined}
              optional
              showErrors={showErrors}
              mobile={mobile}
            />
          </>
        )}
      </div>
    </Dialog>
  );
}
