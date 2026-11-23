import { useEffect, useRef, useState } from "react";

import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import RadioGroup from "../../../components/Radio/RadioGroup";
import RadioItem from "../../../components/Radio/RadioItem";
import { toast } from "../../../components/Toast/Toaster";
import useIsDesktop from "../../../hooks/useIsDesktop";
import AccountField, { accountValue } from "../../Product/NewProductForm/AccountField";
import { isBlank, numberOf } from "../../Product/NewProductForm/productRules";
import PriceStrategyField, { priceStrategyBlocks, usePriceStrategy } from "../../shared/PriceStrategyField";
import { CostField, NameField, nameIssues, SubtypeField, subtypeRules } from "../../shared/pricebookFields";

import { NewOtherCharge, NewOtherChargeFormProps } from "./NewOtherChargeForm.types";

import styles from "./NewOtherChargeForm.module.scss";

// The "Create" form for an other charge (Figma file qhebbfbPHDVnv8IF1EC7Zg,
// page "↳ Other Charges" → "Create" Form 3249-72815): a Dialog titled "New
// other charge" holding ONLY the fields the user must fill in, stacked 24px
// apart with no FormModules — the same build as the labor rate and product
// "Create" forms.
//
//   Name · Subtype · Cost · Price strategy · Taxability · Revenue account
//
// Every field is one of the pricebook's "Shared Fields" (shared/pricebookFields,
// shared/PriceStrategyField, Product's AccountField). Which of them the form
// shows is the "Create" form rule (Shared Behavior → Which Fields Show): only
// the fields the user must fill in, and a required field with only one option
// read-only, with that option selected.
//
// Cost always has a value (Daniel, 2026-11-23): production saves an empty Cost
// as $0.00, so the field is required here like on the other two forms.
//
// Labels, Description and Internal notes are set later in the side panel.
//
// An OTHER CHARGE is today's "Miscellaneous" pricebook item (`PriceBookItem`,
// type 3, "Other Charge" in the code).

export default function NewOtherChargeForm({
  open,
  onClose,
  subtypes = [],
  requireSubtypes = false,
  useTaxes = true,
  defaultIsTaxable = true,
  quickbooks,
  existingNames = [],
  onCreated,
  onOpenCreated,
  breakpoint = "auto",
}: NewOtherChargeFormProps) {
  const mobile = !useIsDesktop(breakpoint);

  // Subtype must be filled in only when the company requires it — so that is
  // the only time the Create form shows it. A lone subtype is pre-picked.
  const subtype = subtypeRules(subtypes, requireSubtypes);
  const hasAccounting = quickbooks != null;

  const [name, setName] = useState("");
  const [subtypeId, setSubtypeId] = useState<string | null>(null);
  const [cost, setCost] = useState("");
  // Price strategy opens on Manual. "If the Cost doesn't have value, assumes
  // that it equals to 0.00."
  const pricing = usePriceStrategy(numberOf(cost));
  // Pre-selected from the company default — never empty, so no error state.
  const [isTaxable, setIsTaxable] = useState<boolean>(defaultIsTaxable);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  // Bumped on every blocked Create, so pressing it twice scrolls again.
  const [submitAttempt, setSubmitAttempt] = useState(0);
  // Create is running: the button spins, Cancel and the ✕ are disabled, and
  // the dialog ignores every dismissal until the request answers.
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // A fresh form every time it opens — it creates a record, it does not edit
  // one. The defaults are read here, so a changed company setting applies to
  // the next open.
  useEffect(() => {
    if (!open) return;
    setName("");
    setSubtypeId(subtype.lone?.id ?? null);
    setCost("");
    pricing.reset();
    setIsTaxable(defaultIsTaxable);
    setAccountId(null);
    setShowErrors(false);
    setSubmitAttempt(0);
    setSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // "If an error is detected, scrolls to the first field with error" (the
  // Create button's annotation).
  useEffect(() => {
    if (submitAttempt === 0) return;
    const firstError = bodyRef.current?.querySelector('[aria-invalid="true"], [class*="error"]');
    firstError?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [submitAttempt]);

  // ---- validation ---------------------------------------------------------

  const nameProblems = nameIssues(name, existingNames);
  const missingSubtype = subtype.required && subtypeId == null;
  const missingCost = isBlank(cost);
  // A single synced account is the value — AccountField shows it read-only.
  const chosenAccountId = accountValue(quickbooks?.accounts ?? [], accountId);
  const missingAccount = hasAccounting && chosenAccountId == null;

  const blocked =
    nameProblems.missing ||
    nameProblems.tooLong != null ||
    nameProblems.duplicate ||
    missingSubtype ||
    missingCost ||
    priceStrategyBlocks(pricing.check) ||
    missingAccount;

  const dirty =
    name.trim() !== "" ||
    (subtypeId != null && subtypeId !== subtype.lone?.id) ||
    !isBlank(cost) ||
    pricing.values.strategy !== "manual" ||
    !isBlank(pricing.values.price) ||
    !isBlank(pricing.values.fixedMarkup) ||
    !isBlank(pricing.values.percentMarkup) ||
    isTaxable !== defaultIsTaxable ||
    accountId != null;

  const create = async () => {
    pricing.judge();
    if (blocked) {
      setShowErrors(true);
      setSubmitAttempt((previous) => previous + 1);
      return;
    }

    const { values, check } = pricing;
    const charge: NewOtherCharge = {
      name: name.trim(),
      subtypeId: subtype.required ? (subtypeId ?? undefined) : undefined,
      cost: numberOf(cost),
      priceStrategy: values.strategy,
      price: check.price,
      fixedMarkup: values.strategy === "fixedMarkup" ? numberOf(values.fixedMarkup) : undefined,
      percentMarkup: values.strategy === "percentMarkup" ? numberOf(values.percentMarkup) : undefined,
      isTaxable: useTaxes ? isTaxable : false,
      quickbooksAccountId: hasAccounting ? (chosenAccountId ?? undefined) : undefined,
    };

    setSubmitting(true);
    const failed = (await onCreated?.(charge)) === false;
    setSubmitting(false);

    if (failed) {
      toast({
        type: "error",
        variant: "detailed",
        title: "Couldn't create the other charge",
        caption: "Something went wrong. Please try again.",
      });
      return;
    }

    // The name as the caption and no link — Create "opens the SidePanel" by
    // itself, which the caller owns.
    toast({ type: "success", variant: "detailed", title: "Other charge created", caption: charge.name });
    onClose();
    onOpenCreated?.(charge);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New other charge"
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
        <NameField
          value={name}
          onChange={setName}
          existingNames={existingNames}
          itemLabel="Other charge"
          showErrors={showErrors}
        />

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

        <CostField value={cost} onChange={setCost} onBlur={pricing.judge} showErrors={showErrors && missingCost} />

        <PriceStrategyField state={pricing} showErrors={showErrors} />

        {/* "Only shown when a service company uses taxes. Pre-populated based
            on service company settings." */}
        {useTaxes && (
          <Input label="Taxability">
            <RadioGroup
              orientation="horizontal"
              value={isTaxable ? "taxable" : "non-taxable"}
              onChange={(value) => setIsTaxable(value === "taxable")}
            >
              <RadioItem value="non-taxable" label="Non-taxable" />
              <RadioItem value="taxable" label="Taxable" />
            </RadioGroup>
          </Input>
        )}

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

export type { NewOtherCharge, NewOtherChargeFormProps } from "./NewOtherChargeForm.types";
