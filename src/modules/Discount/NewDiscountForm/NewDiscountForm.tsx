import { useEffect, useRef, useState } from "react";

import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import { toast } from "../../../components/Toast/Toaster";
import useIsDesktop from "../../../hooks/useIsDesktop";
import AccountField, { accountValue } from "../../Product/NewProductForm/AccountField";
import { isBlank, numberOf } from "../../Product/NewProductForm/productRules";
import { NameField, nameIssues, SubtypeField, subtypeRules } from "../../shared/pricebookFields";

import DiscountField from "./DiscountField";
import { NewDiscount, NewDiscountFormProps } from "./NewDiscountForm.types";

import styles from "./NewDiscountForm.module.scss";

// The "Create" form for a discount (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "↳ Discount" → "Create" Form 3251-77813): a Dialog titled "New discount"
// holding ONLY the fields the user must fill in, stacked 24px apart — the same
// build as the other pricebook "Create" forms.
//
//   Name · Subtype · Discount · Revenue account
//
// Name, Subtype and Revenue account are the pricebook's "Shared Fields";
// Discount is the type's own field (DiscountField). No Cost, no Price
// strategy and no Taxability: production offers a discount none of them.
//
// Labels, Description and Internal notes are set later in the side panel.

export default function NewDiscountForm({
  open,
  onClose,
  subtypes = [],
  requireSubtypes = false,
  quickbooks,
  existingNames = [],
  onCreated,
  onOpenCreated,
  breakpoint = "auto",
}: NewDiscountFormProps) {
  const mobile = !useIsDesktop(breakpoint);

  // Subtype must be filled in only when the company requires it — so that is
  // the only time the Create form shows it. A lone subtype is pre-picked.
  const subtype = subtypeRules(subtypes, requireSubtypes);
  const hasAccounting = quickbooks != null;

  const [name, setName] = useState("");
  const [subtypeId, setSubtypeId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  // Bumped on every blocked Create, so pressing it twice scrolls again.
  const [submitAttempt, setSubmitAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // A fresh form every time it opens.
  useEffect(() => {
    if (!open) return;
    setName("");
    setSubtypeId(subtype.lone?.id ?? null);
    setAmount("");
    setAccountId(null);
    setShowErrors(false);
    setSubmitAttempt(0);
    setSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // "If an error is detected, scrolls to the first field with error."
  useEffect(() => {
    if (submitAttempt === 0) return;
    const firstError = bodyRef.current?.querySelector('[aria-invalid="true"], [class*="error"]');
    firstError?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [submitAttempt]);

  const nameProblems = nameIssues(name, existingNames);
  const missingSubtype = subtype.required && subtypeId == null;
  const missingAmount = isBlank(amount);
  const chosenAccountId = accountValue(quickbooks?.accounts ?? [], accountId);
  const missingAccount = hasAccounting && chosenAccountId == null;

  const blocked =
    nameProblems.missing || nameProblems.tooLong != null || nameProblems.duplicate || missingSubtype || missingAmount || missingAccount;

  const dirty =
    name.trim() !== "" || (subtypeId != null && subtypeId !== subtype.lone?.id) || !isBlank(amount) || accountId != null;

  const create = async () => {
    if (blocked) {
      setShowErrors(true);
      setSubmitAttempt((previous) => previous + 1);
      return;
    }

    const discount: NewDiscount = {
      name: name.trim(),
      subtypeId: subtype.required ? (subtypeId ?? undefined) : undefined,
      // Typed positive, stored negative ($0.00 stays 0).
      price: -numberOf(amount) || 0,
      quickbooksAccountId: hasAccounting ? (chosenAccountId ?? undefined) : undefined,
    };

    setSubmitting(true);
    const failed = (await onCreated?.(discount)) === false;
    setSubmitting(false);

    if (failed) {
      toast({
        type: "error",
        variant: "detailed",
        title: "Couldn't create the discount",
        caption: "Something went wrong. Please try again.",
      });
      return;
    }

    toast({ type: "success", variant: "detailed", title: "Discount created", caption: discount.name });
    onClose();
    onOpenCreated?.(discount);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New discount"
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
        <NameField value={name} onChange={setName} existingNames={existingNames} itemLabel="Discount" showErrors={showErrors} />

        {/* "Only shown if subtype is required." */}
        {subtype.required && (
          <SubtypeField
            subtypes={subtypes}
            required
            value={subtypeId}
            onChange={setSubtypeId}
            showErrors={showErrors}
            mobile={mobile}
          />
        )}

        <DiscountField value={amount} onChange={setAmount} showErrors={showErrors} />

        {/* QuickBooks Desktop with the "Detailed Split" line-item setup only. */}
        {hasAccounting && (
          <AccountField
            label="Revenue account"
            accounts={quickbooks.accounts}
            value={accountId}
            onChange={setAccountId}
            showErrors={showErrors}
            mobile={mobile}
          />
        )}
      </div>
    </Dialog>
  );
}

export type { NewDiscount, NewDiscountFormProps } from "./NewDiscountForm.types";
