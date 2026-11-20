import { useEffect, useRef, useState } from "react";

import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import Prompt from "../../../components/Prompt/Prompt";
import RadioGroup from "../../../components/Radio/RadioGroup";
import RadioItem from "../../../components/Radio/RadioItem";
import { toast } from "../../../components/Toast/Toaster";
import useIsDesktop from "../../../hooks/useIsDesktop";
import PriceStrategyField, { priceStrategyBlocks, usePriceStrategy } from "../../shared/PriceStrategyField";
import { CostField, NameField, nameIssues, SubtypeField, subtypeRules } from "../../shared/pricebookFields";

import AccountField, { accountValue } from "./AccountField";
import { isBlank, numberOf } from "./productRules";
import { NewProduct, NewProductFormProps } from "./NewProductForm.types";

import styles from "./NewProductForm.module.scss";

// The "Create" form for a product (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "Product" → "Create" Form 3167-7253): a Dialog titled "New product" holding
// ONLY the fields the user must fill in, stacked 24px apart with no
// FormModules — the same build as the labor rate's "Create" form.
//
//   Name · Subtype · Cost · Price strategy · Taxability · Stock type ·
//   Revenue account (+ Cost of goods / Inventory asset account for Inventory)
//
// Name, Subtype, Cost, Price strategy, Taxability and Revenue account are the
// pricebook's "Shared Fields" (shared/pricebookFields, shared/PriceStrategyField),
// built once with the labor rate form and the side panels. Which of them the
// form shows is the "Create" form rule (Shared Behavior → Which Fields Show):
// only the fields the user must fill in, and a required field with only one
// option read-only, with that option selected.
//
// Stock type (Product → Fields → Stock Type 3167-33088): pre-selected from the
// company setting; with no active inventory location it is locked on
// Non-inventory with "No active inventory locations", which wins over the
// company default. The stock levels per location are no longer set here —
// they move to the product side panel's "Inventory levels" tab.
//
// The two inventory accounts (Cost of goods, Inventory asset) show only while
// "Inventory" is selected (Daniel, 2026-11-16) — production sends them only
// for an inventory product. They open on the company's default accounts.
//
// Two entry Prompts replace the form when the user can not create a product
// (kept "for now", Daniel 2026-11-16): no synced QuickBooks income account,
// and "can't classify subtypes" with 2+ required subtypes.
//
// Labels, Manufacturer, Barcode, vendor costs, Image URL, Dimensions, Weight,
// Description and Internal notes are set later in the side panel. The form
// before this redesign is kept, unwired, in src/modules/Product/NewProductFormArchive.

export default function NewProductForm({
  open,
  onClose,
  subtypes = [],
  requireSubtypes = false,
  cannotClassifySubtypes = false,
  useTaxes = true,
  defaultIsTaxable = true,
  inventory,
  quickbooks,
  existingNames = [],
  onCreated,
  onOpenCreated,
  breakpoint = "auto",
}: NewProductFormProps) {
  const mobile = !useIsDesktop(breakpoint);

  // ---- the two entry Prompts ----
  const noSyncedAccounts = quickbooks != null && quickbooks.revenueAccounts.length === 0;
  const cantClassify = cannotClassifySubtypes && requireSubtypes && subtypes.length >= 2;

  // Subtype must be filled in only when the company requires it — so that is
  // the only time the Create form shows it. A lone subtype is pre-picked.
  const subtype = subtypeRules(subtypes, requireSubtypes);
  const hasAccounting = quickbooks != null;

  // "If there are no active inventory locations, Non-inventory is selected and
  // the input is read-only. This rule also wins over the company's default."
  const noActiveLocations = inventory != null && !inventory.locations.some((location) => location.isActive);
  const defaultTrack = inventory != null && !noActiveLocations && inventory.defaultTrackInventory;

  const [name, setName] = useState("");
  const [subtypeId, setSubtypeId] = useState<string | null>(null);
  const [cost, setCost] = useState("");
  // Price strategy opens on Manual. "If the Cost doesn't have value, assumes
  // that it equals to 0.00."
  const pricing = usePriceStrategy(numberOf(cost));
  // Pre-selected from the company defaults — never empty, so no error state.
  const [isTaxable, setIsTaxable] = useState<boolean>(defaultIsTaxable);
  const [trackInventory, setTrackInventory] = useState<boolean>(defaultTrack);
  const [revenueAccountId, setRevenueAccountId] = useState<string | null>(null);
  const [cogsAccountId, setCogsAccountId] = useState<string | null>(null);
  const [assetAccountId, setAssetAccountId] = useState<string | null>(null);
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
    setTrackInventory(defaultTrack);
    setRevenueAccountId(null);
    setCogsAccountId(quickbooks?.defaultCogsAccountId ?? null);
    setAssetAccountId(quickbooks?.defaultAssetAccountId ?? null);
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
  // A list with ONE account has that account as its value (shown read-only).
  const revenueAccount = accountValue(quickbooks?.revenueAccounts ?? [], revenueAccountId);
  // Optional fields: the pick itself, never the "only account" stand-in.
  const cogsAccount = cogsAccountId;
  const assetAccount = assetAccountId;
  const missingRevenueAccount = hasAccounting && revenueAccount == null;
  // Cost of goods and Inventory asset are OPTIONAL (Shared Tabs 3225-69833 /
  // 3225-69867, 2026-11-20) — production never requires them either.
  const missingInventoryAccounts = false;

  const blocked =
    nameProblems.missing ||
    nameProblems.tooLong != null ||
    nameProblems.duplicate ||
    missingSubtype ||
    missingCost ||
    priceStrategyBlocks(pricing.check) ||
    missingRevenueAccount ||
    missingInventoryAccounts;

  const dirty =
    name.trim() !== "" ||
    (subtypeId != null && subtypeId !== subtype.lone?.id) ||
    !isBlank(cost) ||
    pricing.values.strategy !== "manual" ||
    !isBlank(pricing.values.price) ||
    !isBlank(pricing.values.fixedMarkup) ||
    !isBlank(pricing.values.percentMarkup) ||
    isTaxable !== defaultIsTaxable ||
    trackInventory !== defaultTrack ||
    revenueAccountId != null ||
    cogsAccountId !== (quickbooks?.defaultCogsAccountId ?? null) ||
    assetAccountId !== (quickbooks?.defaultAssetAccountId ?? null);

  const create = async () => {
    pricing.judge();
    if (blocked) {
      setShowErrors(true);
      setSubmitAttempt((previous) => previous + 1);
      return;
    }

    const { values, check } = pricing;
    // The full product record. What the form no longer asks for is saved
    // empty and filled in later from the side panel.
    const product: NewProduct = {
      name: name.trim(),
      subtypeId: subtype.required ? (subtypeId ?? undefined) : undefined,
      labels: [],
      manufacturer: "",
      partNumber: "",
      barcode: "",
      vendorCosts: [],
      costStrategy: "manual",
      cost: numberOf(cost),
      priceStrategy: values.strategy,
      price: check.price,
      fixedMarkup: values.strategy === "fixedMarkup" ? numberOf(values.fixedMarkup) : undefined,
      percentMarkup: values.strategy === "percentMarkup" ? numberOf(values.percentMarkup) : undefined,
      isTaxable: useTaxes ? isTaxable : false,
      trackInventory,
      inventoryLevels: [],
      revenueAccountId: hasAccounting ? (revenueAccount ?? undefined) : undefined,
      cogsAccountId: hasAccounting && trackInventory ? (cogsAccount ?? undefined) : undefined,
      assetAccountId: hasAccounting && trackInventory ? (assetAccount ?? undefined) : undefined,
      imageUrl: "",
      description: "",
      notes: "",
    };

    setSubmitting(true);
    const failed = (await onCreated?.(product)) === false;
    setSubmitting(false);

    if (failed) {
      toast({
        type: "error",
        variant: "detailed",
        title: "Couldn't create the product",
        caption: "Something went wrong. Please try again.",
      });
      return;
    }

    // The name as the caption and no link — Create "opens the SidePanel" by
    // itself, which the caller owns.
    toast({ type: "success", variant: "detailed", title: "Product created", caption: product.name });
    onClose();
    onOpenCreated?.(product);
  };

  if (noSyncedAccounts || cantClassify)
    return (
      <Prompt
        open={open}
        title={noSyncedAccounts ? "Sync QuickBooks accounts first" : "You can't create products"}
        body={
          noSyncedAccounts
            ? "No QuickBooks accounts have been synced yet. Run a sync in the QuickBooks Web Connector, then create the product."
            : "Every product needs a subtype, and your account can’t choose one. Ask an admin to create the product."
        }
        hasCancel={false}
        actionLabel="OK"
        onAction={onClose}
        breakpoint={breakpoint}
      />
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New product"
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
          itemLabel="Product"
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

        <CostField value={cost} onChange={setCost} onBlur={pricing.judge} showErrors={showErrors} />

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

        {/* Only when the company has inventory. "Pre-selected based on a
            service company settings on Django." */}
        {inventory != null && (
          <Input label="Stock type" helpText={noActiveLocations ? "No active inventory locations" : undefined}>
            <RadioGroup
              orientation="vertical"
              value={trackInventory ? "inventory" : "nonInventory"}
              onChange={(value) => setTrackInventory(value === "inventory")}
            >
              <RadioItem value="nonInventory" label="Non-inventory" caption="Stock isn't tracked" readOnly={noActiveLocations} />
              <RadioItem
                value="inventory"
                label="Inventory"
                caption={
                  noActiveLocations
                    ? "Add an inventory location first. Contact Roopairs support."
                    : "Stock is tracked at each location and updates with jobs and purchase orders"
                }
                readOnly={noActiveLocations}
              />
            </RadioGroup>
          </Input>
        )}

        {/* QuickBooks Desktop with the "Detailed Split" line-item setup only. */}
        {hasAccounting && (
          <>
            <AccountField
              label="Revenue account"
              accounts={quickbooks.revenueAccounts}
              value={revenueAccountId}
              onChange={setRevenueAccountId}
              showErrors={showErrors}
              mobile={mobile}
            />
            {/* Only for an Inventory product (Daniel, 2026-11-16). */}
            {trackInventory && (
              <>
                <AccountField
                  label="Cost of goods account"
                  accounts={quickbooks.cogsAccounts}
                  value={cogsAccountId}
                  onChange={setCogsAccountId}
                  defaultId={quickbooks.defaultCogsAccountId}
                  optional
                  showErrors={showErrors}
                  mobile={mobile}
                />
                <AccountField
                  label="Inventory asset account"
                  accounts={quickbooks.assetAccounts}
                  value={assetAccountId}
                  onChange={setAssetAccountId}
                  defaultId={quickbooks.defaultAssetAccountId}
                  optional
                  showErrors={showErrors}
                  mobile={mobile}
                />
              </>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}

export type { NewProduct, NewProductFormProps } from "./NewProductForm.types";
