import { useEffect, useRef, useState } from "react";

import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import { toast } from "../../../components/Toast/Toaster";
import useIsDesktop from "../../../hooks/useIsDesktop";
import AccountField, { accountValue } from "../../Product/NewProductForm/AccountField";
import { isBlank, numberOf } from "../../Product/NewProductForm/productRules";
import PricebookEntryPrompt, { entryPromptReason } from "../../shared/PricebookEntryPrompt";
import { NameField, nameIssues } from "../../shared/pricebookFields";

import { NewTaxRate, NewTaxRateFormProps } from "./NewTaxRateForm.types";
import PercentageField, { isOverMax } from "./PercentageField";

import styles from "./NewTaxRateForm.module.scss";

// The "Create" form for a tax rate (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "↳ Tax Rate" → "Create" Form 3254-79932), rebuilt 2026-11-23 to the other
// pricebook "Create" forms: a Dialog titled "New tax rate" holding ONLY the
// fields the user must fill in, stacked 24px apart.
//
//   Name · Percentage · Tax collection agency
//
// Name is the pricebook's "Shared Fields" one; Percentage is the type's own
// (PercentageField); Tax collection agency is Shared Fields → Tax Collection
// Agency — the company's QuickBooks Desktop vendors, for QuickBooks Desktop
// "whatever the line-item setting". No subtype, cost, price strategy or
// taxability: production offers a tax rate none of them.
//
// With QuickBooks Desktop and no vendor synced, the "Sync QuickBooks vendors
// first" Prompt replaces the form (Tax Rate → "No Synced Vendors" 3254-82819).
//
// Labels, Description and Internal notes are set later in the side panel. The
// form before the redesign is kept, unwired, in TaxRate/NewTaxRateFormArchive.

export default function NewTaxRateForm({
  open,
  onClose,
  quickbooks,
  existingNames = [],
  onCreated,
  onOpenCreated,
  breakpoint = "auto",
}: NewTaxRateFormProps) {
  const mobile = !useIsDesktop(breakpoint);
  const hasAccounting = quickbooks != null;

  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [rateTouched, setRateTouched] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [submitAttempt, setSubmitAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // A fresh form every time it opens.
  useEffect(() => {
    if (!open) return;
    setName("");
    setRate("");
    setRateTouched(false);
    setVendorId(null);
    setShowErrors(false);
    setSubmitAttempt(0);
    setSubmitting(false);
  }, [open]);

  // "If an error is detected, scrolls to the first field with error."
  useEffect(() => {
    if (submitAttempt === 0) return;
    const firstError = bodyRef.current?.querySelector('[aria-invalid="true"], [class*="error"]');
    firstError?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [submitAttempt]);

  const nameProblems = nameIssues(name, existingNames);
  const chosenVendorId = accountValue(quickbooks?.vendors ?? [], vendorId);
  const missingVendor = hasAccounting && chosenVendorId == null;
  const blocked =
    nameProblems.missing || nameProblems.tooLong != null || nameProblems.duplicate || isBlank(rate) || isOverMax(rate) || missingVendor;
  const dirty = name.trim() !== "" || !isBlank(rate) || vendorId != null;

  const create = async () => {
    if (blocked) {
      setShowErrors(true);
      setSubmitAttempt((previous) => previous + 1);
      return;
    }

    const taxRate: NewTaxRate = {
      name: name.trim(),
      rate: numberOf(rate),
      quickbooksVendorId: hasAccounting ? (chosenVendorId ?? undefined) : undefined,
    };

    setSubmitting(true);
    const failed = (await onCreated?.(taxRate)) === false;
    setSubmitting(false);

    if (failed) {
      toast({
        type: "error",
        variant: "detailed",
        title: "Couldn't create the tax rate",
        caption: "Something went wrong. Please try again.",
      });
      return;
    }

    toast({ type: "success", variant: "detailed", title: "Tax rate created", caption: taxRate.name });
    onClose();
    onOpenCreated?.(taxRate);
  };

  const entryPrompt = entryPromptReason({ vendorCount: quickbooks?.vendors.length });
  if (entryPrompt != null)
    return <PricebookEntryPrompt open={open} reason={entryPrompt} noun="tax rate" onClose={onClose} breakpoint={breakpoint} />;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New tax rate"
      breakpoint={breakpoint}
      isProcessing={submitting}
      confirmOnDismiss={dirty}
      footer={
        <PopoverFooter
          slotLeft={
            <Button size="lg" variant="ghost" isDisabled={submitting} onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" isProcessing={submitting} onClick={create}>
            Create
          </Button>
        </PopoverFooter>
      }
    >
      <div ref={bodyRef} className={styles.fields}>
        <NameField value={name} onChange={setName} existingNames={existingNames} itemLabel="Tax rate" showErrors={showErrors} />

        <PercentageField
          value={rate}
          onChange={setRate}
          touched={rateTouched}
          onTouched={() => setRateTouched(true)}
          showErrors={showErrors}
        />

        {/* QuickBooks Desktop, whatever the line-item setting. */}
        {hasAccounting && (
          <AccountField
            label="Tax collection agency"
            noun="vendor"
            accounts={quickbooks.vendors}
            value={vendorId}
            onChange={setVendorId}
            showErrors={showErrors}
            mobile={mobile}
          />
        )}
      </div>
    </Dialog>
  );
}

export type { NewTaxRate, NewTaxRateFormProps } from "./NewTaxRateForm.types";
