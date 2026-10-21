import { useEffect, useRef, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import { toast } from "../../components/Toast/Toaster";
import useIsDesktop from "../../hooks/useIsDesktop";
import AccountField, { accountValue } from "../Product/NewProductForm/AccountField";
import { numberOf } from "../Product/NewProductForm/productRules";
import { NameField, nameIssues, SubtypeField, subtypeRules } from "../shared/pricebookFields";

import LaborPricingFields, { LaborPricingValues, laborPricingIssues } from "./LaborPricingFields";
import { LaborRateType, NewLaborRate, NewLaborRateFormProps } from "./NewLaborRateForm.types";

import styles from "./NewLaborRateForm.module.scss";

// The "Create" form for a labor rate (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "Labor Rate" → "Create" Form): a Dialog titled "New labor rate" holding ONLY
// the required fields, stacked 24px apart with no FormModules around them.
//
//   Name · Subtype · Rate type · Cost · Rate · Taxability · Revenue account
//
// The inputs are the pricebook's "Shared Fields" (Name, Subtype, Taxability,
// Revenue account) and the labor rate's own Fields (Rate type, Cost, Rate) —
// each built once and shared with the side panel's edit dialogs. Which of them
// this form shows is the "Create" form rule (Shared Behavior → Which Fields
// Show): only the fields the user must fill in, and a required field with only
// one option read-only, with that option selected.
//
// Labels, Description and Internal notes are set later in the side panel.
//
// A LABOR RATE is today's "Service Charge" pricebook item (`PriceBookItem`,
// type 1). The form before the 2026-10-21 redesign is kept, unwired, in
// src/modules/NewLaborRateFormArchive.

const EMPTY_PRICING: LaborPricingValues = { rateType: null, cost: "", rate: "" };

export default function NewLaborRateForm({
  open,
  onClose,
  subtypes = [],
  requireSubtypes = false,
  useTaxes = true,
  defaultTaxable = false,
  quickbooks,
  existingNames = [],
  onCreated,
  onOpenCreated,
  breakpoint = "auto",
}: NewLaborRateFormProps) {
  const mobile = !useIsDesktop(breakpoint);

  // Subtype must be filled in only when the company requires it — so that is
  // the only time the Create form shows it. A lone subtype is pre-picked.
  const subtype = subtypeRules(subtypes, requireSubtypes);
  const hasAccounting = quickbooks != null;

  const [name, setName] = useState("");
  const [subtypeId, setSubtypeId] = useState<string | null>(null);
  // Rate type has "No selection" by default.
  const [pricing, setPricing] = useState<LaborPricingValues>(EMPTY_PRICING);
  const [rateTouched, setRateTouched] = useState(false);
  // Pre-selected from the company default — never empty, so no error state.
  const [isTaxable, setIsTaxable] = useState<boolean>(defaultTaxable);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  // Bumped on every blocked Create, so pressing it twice scrolls again.
  const [submitAttempt, setSubmitAttempt] = useState(0);
  // Create is running: the button spins, Cancel and the ✕ are disabled, and
  // the dialog ignores every dismissal until the request answers.
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // A fresh form every time it opens — this one creates a record, it does not
  // edit one. The single subtype is pre-picked here, not on every render.
  useEffect(() => {
    if (!open) return;
    setName("");
    setSubtypeId(subtype.lone?.id ?? null);
    setPricing(EMPTY_PRICING);
    setRateTouched(false);
    setIsTaxable(defaultTaxable);
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
  const pricingProblems = laborPricingIssues(pricing);
  const missingSubtype = subtype.required && subtypeId == null;
  // A single synced account is the value — AccountField shows it read-only.
  const chosenAccountId = accountValue(quickbooks?.accounts ?? [], accountId);
  const missingAccount = hasAccounting && chosenAccountId == null;

  const blocked =
    nameProblems.missing ||
    nameProblems.tooLong != null ||
    nameProblems.duplicate ||
    missingSubtype ||
    pricingProblems.missingRateType ||
    pricingProblems.missingCost ||
    pricingProblems.missingRate ||
    missingAccount;

  const dirty =
    name.trim() !== "" ||
    (subtypeId != null && subtypeId !== subtype.lone?.id) ||
    pricing.rateType != null ||
    isTaxable !== defaultTaxable ||
    accountId != null;

  const create = async () => {
    if (blocked) {
      setShowErrors(true);
      setSubmitAttempt((previous) => previous + 1);
      return;
    }

    const laborRate: NewLaborRate = {
      name: name.trim(),
      subtypeId: subtype.required ? (subtypeId ?? undefined) : undefined,
      rateType: pricing.rateType as LaborRateType,
      cost: numberOf(pricing.cost),
      rate: numberOf(pricing.rate),
      isTaxable,
      quickbooksAccountId: hasAccounting ? (chosenAccountId ?? undefined) : undefined,
    };

    setSubmitting(true);
    const failed = (await onCreated?.(laborRate)) === false;
    setSubmitting(false);

    if (failed) {
      toast({
        type: "error",
        variant: "detailed",
        title: "Couldn't create the labor rate",
        caption: "Something went wrong. Please try again.",
      });
      return;
    }

    // The name as the caption and no link — Create "opens the SidePanel" by
    // itself, which the caller owns.
    toast({ type: "success", variant: "detailed", title: "Labor rate created", caption: laborRate.name });
    onClose();
    onOpenCreated?.(laborRate);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New labor rate"
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
          itemLabel="Labor rate"
          showErrors={showErrors}
        />

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

        {/* "Picking an option shows Cost and Rate below it." */}
        <LaborPricingFields
          values={pricing}
          onChange={setPricing}
          showErrors={showErrors}
          rateTouched={rateTouched}
          onRateTouched={() => setRateTouched(true)}
        />

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

export type { NewLaborRate, NewLaborRateFormProps } from "./NewLaborRateForm.types";
