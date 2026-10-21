import { MouseEvent, useEffect, useRef, useState } from "react";

import clsx from "clsx";

import AlertBanner from "../../../components/AlertBanner/AlertBanner";
import Badge from "../../../components/Badge/Badge";
import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import EmptyState from "../../../components/EmptyState/EmptyState";
import InputGroup from "../../../components/Fields/InputGroup/InputGroup";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import TextArea from "../../../components/Fields/TextArea/TextArea";
import TextField from "../../../components/Fields/TextField/TextField";
import FormModule from "../../../components/FormModule/FormModule";
import FormModuleGroup from "../../../components/FormModule/FormModuleGroup";
import IconButton from "../../../components/IconButton/IconButton";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import RadioGroup from "../../../components/Radio/RadioGroup";
import RadioItem from "../../../components/Radio/RadioItem";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import { toast } from "../../../components/Toast/Toaster";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import { DimensionUnit, WeightUnit } from "../../../data/db/types";
import useIsDesktop from "../../../hooks/useIsDesktop";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

import AccountField, { accountValue } from "./AccountField";
import InventoryLevelsField from "./InventoryLevelsField";
import {
  computePrice,
  CostStrategy,
  decimalText,
  DIMENSION_UNITS,
  dimensionsHelpText,
  isBlank,
  isImageUrl,
  isMeasureText,
  isMoneyText,
  isPercentText,
  isSignedMoneyText,
  MAX_BARCODE,
  MAX_IMAGE_URL,
  MAX_NAME,
  MAX_PERCENT,
  MAX_TEXT,
  missingDimensionsError,
  NO_SUGGESTIONS,
  money,
  numberOf,
  overLimitError,
  padMoneyOnBlur,
  PriceStrategy,
  resolveCost,
  stripControlCharacters,
  WEIGHT_UNITS,
} from "./productRules";
import ScanCodeDialog from "./ScanCodeDialog";
import VendorCostField from "./VendorCostField";
import { NewProduct, NewProductFormProps, NewProductInventoryLevel, NewProductVendorCost } from "./NewProductForm.types";

import styles from "./NewProductForm.module.scss";

// The reusable "New product" form (Figma file n4FkA98uVyhbOJeLY0AXZV —
// Desktop 2003-1517 / Mobile 1-7826): a Dialog titled "New product" holding
// up to six FormModules, in this order.
//
//   General     Name · Subtype · Labels · Manufacturer · Manufacturer part # · Barcode
//   Pricing     Vendor cost · Cost strategy · Price strategy · Taxability
//   Inventory   Stock type · Inventory levels      (`inventory` — the company feature)
//   Accounting  Revenue / Cost of goods / Inventory asset account
//                                                  (`quickbooks` — QB Desktop + Detailed Split)
//   Details     Image URL · Dimensions · Weight
//   Notes       Description · Internal notes
//
// The form's own rules:
//
// 1. Everything that can open on a value does: Cost AND Price strategy open on
//    Manual, Taxability on the company default, Stock type on the company
//    default, and the two inventory accounts on the company's default accounts.
// 2. The three VENDOR cost strategies stay disabled until a vendor cost card
//    exists, because without one production's trigger would write a cost of 0;
//    their captions show what each would resolve to, live. Removing the LAST
//    card while one of them is chosen falls back to Manual (showing its old
//    value, or 0.00).
// 3. A character limit never stops the typing — the field turns red with
//    "60 / 50 characters" while it is over (see productRules).
// 4. A unit travels only with its value. The unit selects open pre-filled, but
//    an empty Weight sends no `weight_unit` and empty dimensions send no
//    `dimension_unit` — the server rejects a unit without a value.
// 5. While a vendor or inventory card is open, Create does not create: it
//    scrolls to that card.
// 6. No entry Prompts: "no synced QuickBooks accounts" and "can't classify
//    subtypes" are left to the backend (Daniel + devs, 2026-10-21), so the
//    form always opens.

export default function NewProductForm({
  open,
  onClose,
  subtypes = [],
  requireSubtypes = false,
  useTaxes = true,
  defaultIsTaxable = true,
  vendors = [],
  canCreateVendor = false,
  onCreateVendor,
  inventory,
  quickbooks,
  labelPool = [],
  existingNames = [],
  existingBarcodes = {},
  isCreateBlocked = false,
  onCreated,
  breakpoint = "auto",
}: NewProductFormProps) {
  const mobile = !useIsDesktop(breakpoint);

  // ---- General ----
  const [name, setName] = useState("");
  const [subtypeId, setSubtypeId] = useState<string | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [manufacturer, setManufacturer] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);

  // ---- Pricing ----
  const [vendorCosts, setVendorCosts] = useState<NewProductVendorCost[]>([]);
  const [costStrategy, setCostStrategy] = useState<CostStrategy>("manual");
  const [cost, setCost] = useState("");
  const [priceStrategy, setPriceStrategy] = useState<PriceStrategy>("manual");
  const [price, setPrice] = useState("");
  const [fixedMarkup, setFixedMarkup] = useState("");
  const [percentMarkup, setPercentMarkup] = useState("");
  const [isTaxable, setIsTaxable] = useState<boolean>(defaultIsTaxable);

  // ---- Inventory ----
  // "If there are no active inventory locations, Non-inventory is selected and
  // the input is read-only. This rule also wins over the company's default."
  const noActiveLocations = inventory != null && !inventory.locations.some((location) => location.isActive);
  const [trackInventory, setTrackInventory] = useState<boolean>(
    inventory != null && !noActiveLocations && inventory.defaultTrackInventory,
  );
  const [inventoryLevels, setInventoryLevels] = useState<NewProductInventoryLevel[]>([]);

  // ---- Accounting ----
  const [revenueAccountId, setRevenueAccountId] = useState<string | null>(null);
  const [cogsAccountId, setCogsAccountId] = useState<string | null>(quickbooks?.defaultCogsAccountId ?? null);
  const [assetAccountId, setAssetAccountId] = useState<string | null>(quickbooks?.defaultAssetAccountId ?? null);
  const [syncNoticeDismissed, setSyncNoticeDismissed] = useState(false);

  // Which "add a card" field has a card open (rule 5).
  const [editingVendor, setEditingVendor] = useState(false);
  const [editingLevel, setEditingLevel] = useState(false);

  // ---- Details ----
  const [imageUrl, setImageUrl] = useState("");
  // The "Invalid URL" verdict of the last blur (or Create).
  const [imageUrlChecked, setImageUrlChecked] = useState(false);
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [dimensionUnit, setDimensionUnit] = useState<DimensionUnit>("in");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("oz");
  // "Validates only when the field loses the focus" — the group stays quiet
  // while it is being worked in, whether that is the first measurement or a
  // value being cleared to retype it. Two flags: has it ever been left, and is
  // the focus inside it right now.
  const [dimensionsTouched, setDimensionsTouched] = useState(false);
  const [dimensionsFocused, setDimensionsFocused] = useState(false);

  // ---- Notes ----
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const [showErrors, setShowErrors] = useState(false);
  // A money field states its problem when it LOSES FOCUS, and from then on
  // live — the Labor rate form's rule, and every "Validates only when the field
  // loses the focus" annotation here.
  // The price checks that run "when the field loses the focus" — less than
  // cost, a negative price, a percent over the top value. They are a VERDICT
  // taken at that moment (blur of Cost, Price or a markup, or Create), not a
  // live reading, so typing never flips them on or off. Kept with the strategy
  // it was taken under, so another strategy's card does not inherit it.
  const [priceVerdict, setPriceVerdict] = useState<{
    strategy: PriceStrategy;
    belowCost: boolean;
    negative: boolean;
    tooHigh: boolean;
  } | null>(null);
  const [submitAttempt, setSubmitAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [pool, setPool] = useState<string[]>(labelPool);

  const subtypePop = useSelectPopover(mobile);
  const labelsPop = useSelectPopover(mobile);
  // "Hugs the content" — a 59px trigger must not squeeze the list, so the
  // card takes its natural width and hangs from the trigger's right edge.
  const dimensionUnitPop = useSelectPopover(mobile, "belowEnd");
  const weightUnitPop = useSelectPopover(mobile, "belowEnd");

  useEffect(() => {
    if (!open) return;
    setPool(labelPool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Scroll to the first thing that blocked Create.
  useEffect(() => {
    if (submitAttempt === 0) return;
    const firstError = bodyRef.current?.querySelector('[aria-invalid="true"], [class*="error"]');
    firstError?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [submitAttempt]);

  // ---- the live numbers ----

  const vendorCostValues = vendorCosts.map((row) => row.cost);
  const hasVendorCosts = vendorCostValues.length > 0;
  const resolvedCost = resolveCost(costStrategy, numberOf(cost), vendorCostValues);
  const percentValue = numberOf(percentMarkup);
  const computedPrice = computePrice(priceStrategy, resolvedCost, numberOf(fixedMarkup), percentValue);

  const markupText = priceStrategy === "fixedMarkup" ? fixedMarkup : percentMarkup;
  const markupEmpty = isBlank(markupText);

  // ---- validation ----

  // Name: duplicates are checked "in real-time while typing", ignoring case
  // and the spaces around it.
  const missingName = name.trim() === "";
  const duplicateName = !missingName && existingNames.some((taken) => taken.trim().toLowerCase() === name.trim().toLowerCase());
  const nameTooLong = overLimitError(name, MAX_NAME);

  // Barcode: the duplicate check runs while typing too.
  const barcodeOwner = barcode.trim() === "" ? undefined : existingBarcodes[barcode.trim()];
  const barcodeTooLong = overLimitError(barcode, MAX_BARCODE);

  const manufacturerTooLong = overLimitError(manufacturer, MAX_TEXT);
  const partNumberTooLong = overLimitError(partNumber, MAX_TEXT);
  const imageUrlTooLong = overLimitError(imageUrl, MAX_IMAGE_URL);
  // "Invalid URL" — validated when the field loses the focus.
  const imageUrlInvalid = !isImageUrl(imageUrl);

  const missingSubtype = requireSubtypes && subtypes.length > 0 && subtypeId == null;

  // Accounting: the revenue account always, the two inventory ones only for an
  // inventory product.
  const hasAccounting = quickbooks != null;
  // A list with ONE account has that account as its value (shown read-only).
  const revenueAccount = accountValue(quickbooks?.revenueAccounts ?? [], revenueAccountId);
  const cogsAccount = accountValue(quickbooks?.cogsAccounts ?? [], cogsAccountId);
  const assetAccount = accountValue(quickbooks?.assetAccounts ?? [], assetAccountId);
  const missingRevenueAccount = hasAccounting && revenueAccount == null;
  const missingInventoryAccounts = hasAccounting && trackInventory && (cogsAccount == null || assetAccount == null);

  // Cost is required under Manual — "Enter Cost" (Figma 4057-13777).
  const missingCost = costStrategy === "manual" && isBlank(cost);
  const missingPrice = priceStrategy === "manual" && isBlank(price);
  const missingMarkup = (priceStrategy === "fixedMarkup" || priceStrategy === "percentMarkup") && markupEmpty;
  const negativePrice = priceStrategy !== "manual" && !markupEmpty && computedPrice < 0;
  const percentTooHigh = priceStrategy === "percentMarkup" && percentValue > MAX_PERCENT;
  const belowCost =
    priceStrategy === "manual"
      ? !isBlank(price) && numberOf(price) < resolvedCost
      : !markupEmpty && computedPrice >= 0 && computedPrice < resolvedCost;

  const judgePrice = () =>
    setPriceVerdict({ strategy: priceStrategy, belowCost, negative: negativePrice, tooHigh: percentTooHigh });
  const verdict = priceVerdict?.strategy === priceStrategy ? priceVerdict : null;
  const showBelowCost = verdict?.belowCost === true;
  const showNegativePrice = verdict?.negative === true;
  const showPercentTooHigh = verdict?.tooHigh === true;
  // An EMPTY value is checked by Create only, and marks the input alone — the
  // card turns red only for a negative price or a percent over the top value.
  const showMissingPrice = showErrors && missingPrice;
  const showMissingMarkup = showErrors && missingMarkup;

  // The three dimensions are all-or-nothing (production's own pairing rule).
  const dimensionValues = [length, width, height];
  const anyDimension = dimensionValues.some((value) => !isBlank(value));
  const partialDimensions = anyDimension && dimensionValues.some((value) => isBlank(value));
  const showDimensionError = partialDimensions && !dimensionsFocused && (dimensionsTouched || showErrors);

  const blocked =
    missingName ||
    duplicateName ||
    nameTooLong != null ||
    barcodeOwner != null ||
    barcodeTooLong != null ||
    manufacturerTooLong != null ||
    partNumberTooLong != null ||
    missingSubtype ||
    missingCost ||
    missingPrice ||
    missingMarkup ||
    negativePrice ||
    percentTooHigh ||
    missingRevenueAccount ||
    missingInventoryAccounts ||
    imageUrlTooLong != null ||
    imageUrlInvalid ||
    partialDimensions;

  const dirty =
    name.trim() !== "" ||
    subtypeId != null ||
    labels.length > 0 ||
    manufacturer.trim() !== "" ||
    partNumber.trim() !== "" ||
    barcode.trim() !== "" ||
    vendorCosts.length > 0 ||
    !isBlank(cost) ||
    !isBlank(price) ||
    !isBlank(fixedMarkup) ||
    !isBlank(percentMarkup) ||
    inventoryLevels.length > 0 ||
    revenueAccountId != null ||
    imageUrl.trim() !== "" ||
    anyDimension ||
    !isBlank(weight) ||
    description.trim() !== "" ||
    notes.trim() !== "";

  // THE LAYOUT-FREEZE RULE: the badge row grows BELOW the field, which would
  // push it out from under the open card.
  const shownLabels = labelsPop.freeze(labels);

  const toggleLabel = (label: string) =>
    setLabels((prev) => (prev.includes(label) ? prev.filter((row) => row !== label) : [...prev, label]));

  const createLabel = (query: string) => {
    const label = query.trim();
    if (label === "" || pool.includes(label)) return;
    setPool((prev) => [...prev, label]);
    setLabels((prev) => [...prev, label]);
  };

  const subtypeName = subtypes.find((row) => row.id === subtypeId)?.name;
  // Required + exactly one option: it is chosen for the user, read-only.
  const lockedSubtype = requireSubtypes && subtypes.length === 1 ? subtypes[0] : undefined;

  useEffect(() => {
    if (lockedSubtype && subtypeId == null) setSubtypeId(lockedSubtype.id);
  }, [lockedSubtype, subtypeId]);

  // Removing the LAST vendor card under a vendor strategy falls back to
  // Manual, showing its old value or "0.00" (the "Remove Last Vendor Cost"
  // annotation).
  const changeVendorCosts = (next: NewProductVendorCost[]) => {
    setVendorCosts(next);
    if (next.length === 0 && costStrategy !== "manual") {
      setCostStrategy("manual");
      if (isBlank(cost)) setCost("0.00");
    }
  };

  const create = async () => {
    // Rule 5: an open card is unfinished work — go back to it.
    if (editingVendor || editingLevel) {
      bodyRef.current?.querySelector("[data-editing-card]")?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    judgePrice();
    if (blocked) {
      setShowErrors(true);
      setImageUrlChecked(imageUrlInvalid);
      setSubmitAttempt((previous) => previous + 1);
      return;
    }

    const product: NewProduct = {
      name: name.trim(),
      subtypeId: subtypeId ?? undefined,
      labels,
      manufacturer: manufacturer.trim(),
      partNumber: partNumber.trim(),
      barcode: barcode.trim(),
      vendorCosts,
      costStrategy,
      cost: resolvedCost,
      priceStrategy,
      price: priceStrategy === "manual" ? numberOf(price) : computedPrice,
      fixedMarkup: priceStrategy === "fixedMarkup" ? numberOf(fixedMarkup) : undefined,
      percentMarkup: priceStrategy === "percentMarkup" ? percentValue : undefined,
      isTaxable: useTaxes ? isTaxable : false,
      trackInventory,
      inventoryLevels: trackInventory ? inventoryLevels : [],
      revenueAccountId: hasAccounting ? (revenueAccount ?? undefined) : undefined,
      cogsAccountId: hasAccounting && trackInventory ? (cogsAccount ?? undefined) : undefined,
      assetAccountId: hasAccounting && trackInventory ? (assetAccount ?? undefined) : undefined,
      imageUrl: imageUrl.trim(),
      // The unit only travels with a value — see the header note.
      weight: isBlank(weight) ? undefined : numberOf(weight),
      weightUnit: isBlank(weight) ? undefined : weightUnit,
      length: anyDimension ? numberOf(length) : undefined,
      width: anyDimension ? numberOf(width) : undefined,
      height: anyDimension ? numberOf(height) : undefined,
      dimensionUnit: anyDimension ? dimensionUnit : undefined,
      description: description.trim(),
      notes: notes.trim(),
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

    toast({
      type: "success",
      variant: "detailed",
      title: "Product created",
      caption: product.name,
    });
    onClose();
  };

  // The calculated Price under a markup — one ValueDisplay, three states.
  const priceValueDisplay = (
    <ValueDisplay
      label="Price"
      emptyText={priceStrategy === "fixedMarkup" ? "Enter Fixed markup" : "Enter Percent markup"}
      value={
        markupEmpty
          ? undefined
          : showNegativePrice
            ? `${money(computedPrice)} — must be $0.00 or more`
            : showBelowCost
              ? `${money(computedPrice)} — less than cost`
              : money(computedPrice)
      }
      valueColor={showNegativePrice ? "var(--text-error)" : undefined}
      isWarning={showBelowCost}
    />
  );

  return (
    <>
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
            <Button
              size="lg"
              variant="solid"
              isProcessing={submitting}
              isDisabled={isCreateBlocked}
              onClick={create}
            >
              Create
            </Button>
          </PopoverFooter>
        }
      >
        <div ref={bodyRef}>
          <FormModuleGroup>
            {/* ---------------- General ---------------- */}
            <FormModule title="General">
              <Input label="Name">
                <TextField
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  {...NO_SUGGESTIONS}
                  isValid={!(nameTooLong || duplicateName || (showErrors && missingName))}
                  errorMessage={nameTooLong ?? (duplicateName ? "Product with this name already exists" : undefined)}
                />
              </Input>

              {subtypes.length > 0 &&
                (lockedSubtype != null ? (
                  // Shared Fields → Subtype: the help line replaces the
                  // "(read-only)" tag and says why the field is locked.
                  <Input label="Subtype" helpText="The only subtype available">
                    <SelectField value={lockedSubtype.name} readOnly />
                  </Input>
                ) : (
                  <Input label="Subtype" labelCondition={requireSubtypes ? undefined : "optional"}>
                    <SelectField
                      value={subtypeName}
                      open={subtypePop.open}
                      onClick={(event: MouseEvent<HTMLDivElement>) => subtypePop.toggle(event.currentTarget)}
                      isValid={!(showErrors && missingSubtype)}
                    />
                  </Input>
                ))}

              <Input label="Labels" labelCondition="optional">
                <>
                  <SelectField
                    value={labels.length === 1 ? labels[0] : undefined}
                    multiSelect
                    count={labels.length}
                    multiSelectLabel="Labels selected"
                    onClearSelection={() => setLabels([])}
                    open={labelsPop.open}
                    onClick={(event: MouseEvent<HTMLDivElement>) => labelsPop.toggle(event.currentTarget)}
                  />
                  {shownLabels.length > 0 && (
                    <div className={styles.labelRow}>
                      {shownLabels.map((label) => (
                        <Badge key={label} size="lg" isDismissable onDismiss={() => toggleLabel(label)}>
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              </Input>

              {/* One row on desktop (280 + 16 + 280 in the node), stacked on a phone. */}
              <div className={clsx(styles.fieldRow, mobile && styles.fieldRowStacked)}>
                <Input label="Manufacturer" labelCondition="optional">
                  <TextField
                    value={manufacturer}
                    onChange={(event) => setManufacturer(event.target.value)}
                    {...NO_SUGGESTIONS}
                    isValid={manufacturerTooLong == null}
                    errorMessage={manufacturerTooLong}
                  />
                </Input>

                <Input label="Manufacturer part #" labelCondition="optional">
                  <TextField
                    value={partNumber}
                    onChange={(event) => setPartNumber(event.target.value)}
                    {...NO_SUGGESTIONS}
                    isValid={partNumberTooLong == null}
                    errorMessage={partNumberTooLong}
                  />
                </Input>
              </div>

              {/* The code and its scanner. The duplicate check runs while
                  typing; control characters (a scanned GS1 code can carry
                  them) are dropped on the way in. */}
              <Input label="Barcode or QR code" labelCondition="optional" helpText="Scan or type the code printed on the product">
                <div className={styles.barcodeRow}>
                  <TextField
                    value={barcode}
                    onChange={(event) => setBarcode(stripControlCharacters(event.target.value))}
                    {...NO_SUGGESTIONS}
                    isValid={barcodeTooLong == null && barcodeOwner == null}
                    errorMessage={barcodeTooLong ?? (barcodeOwner != null ? `Already registered to ${barcodeOwner}` : undefined)}
                  />
                  <HoverTooltip text="Scan">
                    <IconButton icon="qrcode-read" variant="ghost" size="lg" aria-label="Scan" onClick={() => setScanning(true)} />
                  </HoverTooltip>
                </div>
              </Input>
            </FormModule>

            {/* ---------------- Pricing ---------------- */}
            <FormModule title="Pricing">
              <VendorCostField
                vendors={vendors}
                costs={vendorCosts}
                onChange={changeVendorCosts}
                costFollowsVendors={costStrategy !== "manual"}
                canCreateVendor={canCreateVendor}
                onCreateVendor={onCreateVendor}
                onEditingChange={setEditingVendor}
                mobile={mobile}
              />

              <Input
                label="Cost strategy"
                helpText={hasVendorCosts ? undefined : "Add vendor cost to enable Min, Max and Avg vendor cost options"}
              >
                <RadioGroup
                  orientation="vertical"
                  value={costStrategy}
                  onChange={(value) => setCostStrategy(value as CostStrategy)}
                >
                  <RadioItem
                    value="manual"
                    label="Manual"
                    content={
                      <Input label="Cost">
                        <TextField
                          value={cost}
                          onChange={(event) => isMoneyText(decimalText(event.target.value)) && setCost(decimalText(event.target.value))}
                          onBlur={() => {
                            setCost(padMoneyOnBlur(cost));
                            judgePrice();
                          }}
                          keyboard="decimal"
                          prefix="$"
                          placeholder="0.00"
                          // "Enter Cost" — checked by Create only.
                          isValid={!(showErrors && missingCost)}
                        />
                      </Input>
                    }
                  />
                  <RadioItem
                    value="minVendorCost"
                    label="Min vendor cost"
                    caption={hasVendorCosts ? money(resolveCost("minVendorCost", 0, vendorCostValues)) : undefined}
                    disabled={!hasVendorCosts}
                  />
                  <RadioItem
                    value="maxVendorCost"
                    label="Max vendor cost"
                    caption={hasVendorCosts ? money(resolveCost("maxVendorCost", 0, vendorCostValues)) : undefined}
                    disabled={!hasVendorCosts}
                  />
                  <RadioItem
                    value="avgVendorCost"
                    label="Avg vendor cost"
                    caption={hasVendorCosts ? money(resolveCost("avgVendorCost", 0, vendorCostValues)) : undefined}
                    disabled={!hasVendorCosts}
                  />
                </RadioGroup>
              </Input>

              <Input label="Price strategy">
                <RadioGroup
                  orientation="vertical"
                  value={priceStrategy}
                  onChange={(value) => setPriceStrategy(value as PriceStrategy)}
                >
                  <RadioItem
                    value="manual"
                    label="Manual"
                    content={
                      <Input label="Price" helpText={showBelowCost ? "Less than cost" : undefined} helpTextStatus="warning">
                        <TextField
                          value={price}
                          onChange={(event) => isMoneyText(decimalText(event.target.value)) && setPrice(decimalText(event.target.value))}
                          onBlur={() => {
                            setPrice(padMoneyOnBlur(price));
                            judgePrice();
                          }}
                          keyboard="decimal"
                          prefix="$"
                          placeholder="0.00"
                          isValid={!showMissingPrice}
                        />
                      </Input>
                    }
                  />

                  <RadioItem
                    value="fixedMarkup"
                    label="Fixed markup"
                    error={priceStrategy === "fixedMarkup" && showNegativePrice}
                    contentPadded={false}
                    content={
                      <div className={styles.cardContent}>
                        <Input label="Fixed markup">
                          <TextField
                            value={fixedMarkup}
                            onChange={(event) => isSignedMoneyText(decimalText(event.target.value)) && setFixedMarkup(decimalText(event.target.value))}
                            onBlur={() => {
                              setFixedMarkup(padMoneyOnBlur(fixedMarkup));
                              judgePrice();
                            }}
                            {...NO_SUGGESTIONS}
                            prefix="$"
                            placeholder="0.00"
                            isValid={!(showMissingMarkup || showNegativePrice)}
                            // The negative price's own message is the Price row
                            // below, so the field turns red without one.
                            errorMessage={showNegativePrice ? "" : undefined}
                          />
                        </Input>
                        {priceValueDisplay}
                      </div>
                    }
                  />

                  <RadioItem
                    value="percentMarkup"
                    label="Percent markup"
                    error={priceStrategy === "percentMarkup" && (showNegativePrice || showPercentTooHigh)}
                    contentPadded={false}
                    content={
                      <div className={styles.cardContent}>
                        <Input label="Percent markup">
                          <TextField
                            value={percentMarkup}
                            onChange={(event) => isPercentText(decimalText(event.target.value)) && setPercentMarkup(decimalText(event.target.value))}
                            onBlur={() => {
                              setPercentMarkup(padMoneyOnBlur(percentMarkup));
                              judgePrice();
                            }}
                            {...NO_SUGGESTIONS}
                            suffix="%"
                            placeholder="0.00"
                            isValid={!(showMissingMarkup || showNegativePrice || showPercentTooHigh)}
                            errorMessage={
                              showPercentTooHigh ? `Must be ${MAX_PERCENT}% or less` : showNegativePrice ? "" : undefined
                            }
                          />
                        </Input>
                        {priceValueDisplay}
                      </div>
                    }
                  />
                </RadioGroup>
              </Input>

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
            </FormModule>

            {/* ---------------- Inventory ---------------- */}
            {/* "Only shown if the company enables this feature (Django)." */}
            {inventory != null && (
              <FormModule title="Inventory">
                <Input label="Stock type">
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

                {trackInventory && (
                  <InventoryLevelsField
                    locations={inventory.locations}
                    levels={inventoryLevels}
                    onChange={setInventoryLevels}
                    onEditingChange={setEditingLevel}
                    mobile={mobile}
                  />
                )}
              </FormModule>
            )}

            {/* ---------------- Accounting ---------------- */}
            {/* "Only shown if a service company uses QuickBooks Desktop and
                chose the Detailed Split line-item setup in settings." */}
            {hasAccounting && quickbooks != null && (
              <FormModule
                title="Accounting"
                banner={
                  !syncNoticeDismissed && (
                    <AlertBanner type="card" status="info" orientation="vertical" onDismiss={() => setSyncNoticeDismissed(true)}>
                      The product won&apos;t be available for use in invoice or estimate line items until it&apos;s been synced
                      with QuickBooks Desktop
                    </AlertBanner>
                  )
                }
              >
                <AccountField
                  label="Revenue account"
                  accounts={quickbooks.revenueAccounts}
                  value={revenueAccountId}
                  onChange={setRevenueAccountId}
                  showErrors={showErrors}
                  mobile={mobile}
                />
                {/* "Only shown for Inventory products." */}
                {trackInventory && (
                  <>
                    <AccountField
                      label="Cost of goods account"
                      accounts={quickbooks.cogsAccounts}
                      value={cogsAccountId}
                      onChange={setCogsAccountId}
                      defaultId={quickbooks.defaultCogsAccountId}
                      showErrors={showErrors}
                      mobile={mobile}
                    />
                    <AccountField
                      label="Inventory asset account"
                      accounts={quickbooks.assetAccounts}
                      value={assetAccountId}
                      onChange={setAssetAccountId}
                      defaultId={quickbooks.defaultAssetAccountId}
                      showErrors={showErrors}
                      mobile={mobile}
                    />
                  </>
                )}
              </FormModule>
            )}

            {/* ---------------- Details ---------------- */}
            <FormModule title="Details">
              <Input label="Image URL" labelCondition="optional">
                <TextField
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  // "Validates when the field loses the focus" — the check runs
                  // on blur only, so typing never flips the error on or off.
                  onBlur={() => setImageUrlChecked(!isImageUrl(imageUrl))}
                  keyboard="url"
                  {...NO_SUGGESTIONS}
                  prefix="https://"
                  isValid={imageUrlTooLong == null && !imageUrlChecked}
                  errorMessage={imageUrlTooLong ?? "Invalid URL"}
                />
              </Input>

              {/* One fused row: three measurements that fill the width and a
                  unit that hugs. The help text rewrites itself from the values. */}
              <Input
                label="Dimensions"
                labelCondition="optional"
                helpText={dimensionsHelpText(length, width, height, dimensionUnit)}
              >
                {/* The three measurements and the unit are ONE field, so the
                    error waits for focus to leave the WHOLE group — stepping
                    from Length to Width is not losing the focus (Daniel,
                    2026-10-13). `onBlur` is React's focusout, so it bubbles
                    here and `relatedTarget` says where the focus went; the open
                    unit list counts as inside, because it belongs to the row. */}
                <div
                  onFocus={() => setDimensionsFocused(true)}
                  onBlur={(event) => {
                    const next = event.relatedTarget as Node | null;
                    // Still inside the row (another segment, or the open unit
                    // list): the field has not been left, so nothing is judged.
                    if (event.currentTarget.contains(next) || dimensionUnitPop.open) return;
                    setDimensionsFocused(false);
                    setDimensionsTouched(true);
                  }}
                >
                  <InputGroup isValid={!showDimensionError} errorMessage={missingDimensionsError(length, width, height)}>
                  <TextField
                    value={length}
                    onChange={(event) => isMeasureText(decimalText(event.target.value)) && setLength(decimalText(event.target.value))}
                    keyboard="decimal"
                    placeholder="Length"
                  />
                  <TextField
                    value={width}
                    onChange={(event) => isMeasureText(decimalText(event.target.value)) && setWidth(decimalText(event.target.value))}
                    keyboard="decimal"
                    placeholder="Width"
                  />
                  <TextField
                    value={height}
                    onChange={(event) => isMeasureText(decimalText(event.target.value)) && setHeight(decimalText(event.target.value))}
                    keyboard="decimal"
                    placeholder="Height"
                  />
                    <SelectField
                      value={DIMENSION_UNITS.find((unit) => unit.value === dimensionUnit)?.tag}
                      fitContent
                      open={dimensionUnitPop.open}
                      onClick={(event: MouseEvent<HTMLDivElement>) => dimensionUnitPop.toggle(event.currentTarget)}
                    />
                  </InputGroup>
                </div>
              </Input>

              <Input label="Weight" labelCondition="optional">
                <InputGroup>
                  <TextField
                    value={weight}
                    onChange={(event) => isMeasureText(decimalText(event.target.value)) && setWeight(decimalText(event.target.value))}
                    keyboard="decimal"
                  />
                  <SelectField
                    value={WEIGHT_UNITS.find((unit) => unit.value === weightUnit)?.tag}
                    fitContent
                    open={weightUnitPop.open}
                    onClick={(event: MouseEvent<HTMLDivElement>) => weightUnitPop.toggle(event.currentTarget)}
                  />
                </InputGroup>
              </Input>
            </FormModule>

            {/* ---------------- Notes ---------------- */}
            <FormModule title="Notes">
              <Input
                label="Description"
                labelCondition="optional"
                helpText="Copied to the line item when this product is added, and customers see it"
              >
                <TextArea value={description} onChange={(event) => setDescription(event.target.value)} />
              </Input>

              <Input
                label="Internal notes"
                labelCondition="optional"
                helpText="Only your team sees this, and it never goes on a line item"
              >
                <TextArea value={notes} onChange={(event) => setNotes(event.target.value)} />
              </Input>
            </FormModule>
          </FormModuleGroup>
        </div>
      </Dialog>

      {/* "Sorted by name from A to Z" — the Subtype list's own annotation. */}
      <SelectPopoverList
        pop={subtypePop}
        mobile={mobile}
        title="Subtype"
        searchable
        searchPlaceholder="Subtype..."
        noResultsState={<EmptyState caption="No subtypes match" />}
      >
        <SelectListItemGroup>
          {/* "Only exists if subtype is NOT required by company settings." */}
          {!requireSubtypes && (
            <SelectListItem
              label="No subtype"
              selected={subtypeId == null}
              onClick={() => {
                setSubtypeId(null);
                subtypePop.close();
              }}
            />
          )}
          {[...subtypes]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((subtype) => (
              <SelectListItem
                key={subtype.id}
                label={subtype.name}
                selected={subtype.id === subtypeId}
                onClick={() => {
                  setSubtypeId(subtype.id);
                  subtypePop.close();
                }}
              />
            ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      <SelectPopoverList
        pop={labelsPop}
        mobile={mobile}
        title="Labels"
        multiSelect
        searchable
        searchPlaceholder="Label..."
        createFromSearch={{ label: "Create new label:", onCreate: createLabel }}
        state={pool.length === 0 ? "empty" : "default"}
        emptyState={{ icon: "tag", title: "No labels here yet", caption: "Start typing to create a new label" }}
      >
        <SelectListItemGroup>
          {pool.map((label) => (
            <SelectListItem key={label} label={label} multiSelect selected={labels.includes(label)} onClick={() => toggleLabel(label)} />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      <SelectPopoverList pop={dimensionUnitPop} mobile={mobile} title="Dimensions unit">
        <SelectListItemGroup>
          {DIMENSION_UNITS.map((unit) => (
            <SelectListItem
              key={unit.value}
              label={unit.name}
              tag={unit.tag}
              selected={unit.value === dimensionUnit}
              onClick={() => {
                setDimensionUnit(unit.value);
                dimensionUnitPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      <SelectPopoverList pop={weightUnitPop} mobile={mobile} title="Weight unit">
        <SelectListItemGroup>
          {WEIGHT_UNITS.map((unit) => (
            <SelectListItem
              key={unit.value}
              label={unit.name}
              tag={unit.tag}
              selected={unit.value === weightUnit}
              onClick={() => {
                setWeightUnit(unit.value);
                weightUnitPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      <ScanCodeDialog
        open={scanning}
        onClose={() => setScanning(false)}
        onRegister={(code) => {
          setBarcode(stripControlCharacters(code));
          setScanning(false);
        }}
        registered={existingBarcodes}
        breakpoint={breakpoint}
      />
    </>
  );
}
