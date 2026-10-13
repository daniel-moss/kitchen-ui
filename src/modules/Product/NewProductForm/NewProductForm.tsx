import { MouseEvent, useEffect, useRef, useState } from "react";

import clsx from "clsx";

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

import {
  computePrice,
  COUNTER_FROM,
  CostStrategy,
  DIMENSION_UNITS,
  dimensionsHelpText,
  isBlank,
  isMeasureText,
  isMoneyText,
  isPercentText,
  isSignedMoneyText,
  MAX_BARCODE,
  MAX_IMAGE_URL,
  MAX_NAME,
  MAX_PERCENT,
  MAX_TEXT,
  money,
  numberOf,
  padMoneyOnBlur,
  PriceStrategy,
  resolveCost,
  WEIGHT_UNITS,
} from "./productRules";
import ScanCodeDialog from "./ScanCodeDialog";
import VendorCostField from "./VendorCostField";
import { NewProduct, NewProductFormProps, NewProductVendorCost } from "./NewProductForm.types";

import styles from "./NewProductForm.module.scss";

// The reusable "New product" form (Figma file n4FkA98uVyhbOJeLY0AXZV —
// Desktop 2003-1517 / Mobile 1-7826): a Dialog titled "New product" holding
// four FormModules.
//
//   General   Name · Subtype · Labels · Manufacturer · Manufacturer part # · Barcode
//   Pricing   Vendor cost · Cost strategy · Price strategy · Taxability
//   Details   Image URL · Dimensions · Weight
//   Notes     Description · Internal notes
//
// INVENTORY IS NOT BUILT YET (Daniel, 2026-10-13). It is the fifth module, and
// the heaviest: a Non-inventory / Inventory choice that opens a row per
// inventory location, and those rows are being designed.
//
// Three rules that are this form's own:
//
// 1. Cost strategy opens on MANUAL ("'Manual' is a default selection"), while
//    Price strategy and Taxability open EMPTY and both are required — their
//    nodes say "Default — No selection" and draw a "Choose …" error.
// 2. The three VENDOR cost strategies stay disabled until a vendor cost card
//    exists, because without one production's trigger would write a cost of 0.
//    Their captions show what each would resolve to, live.
// 3. A unit travels only with its value. The unit selects open pre-filled, but
//    an empty Weight sends no `weight_unit` and empty dimensions send no
//    `dimension_unit` — the server rejects a unit without a value, and an
//    untouched field means "not measured" however the select looks.

export default function NewProductForm({
  open,
  onClose,
  subtypes = [],
  requireSubtypes = false,
  useTaxes = true,
  vendors = [],
  canCreateVendor = false,
  onCreateVendor,
  labelPool = [],
  existingNames = [],
  existingBarcodes = {},
  isCreateBlocked = false,
  onCreated,
  onPreview,
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
  const [barcodeTouched, setBarcodeTouched] = useState(false);
  const [scanning, setScanning] = useState(false);

  // ---- Pricing ----
  const [vendorCosts, setVendorCosts] = useState<NewProductVendorCost[]>([]);
  const [costStrategy, setCostStrategy] = useState<CostStrategy>("manual");
  const [cost, setCost] = useState("");
  const [priceStrategy, setPriceStrategy] = useState<PriceStrategy | null>(null);
  const [price, setPrice] = useState("");
  const [fixedMarkup, setFixedMarkup] = useState("");
  const [percentMarkup, setPercentMarkup] = useState("");
  const [isTaxable, setIsTaxable] = useState<boolean | null>(null);

  // ---- Details ----
  const [imageUrl, setImageUrl] = useState("");
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
  const [touched, setTouched] = useState({ price: false, fixed: false, percent: false });
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
  const computedPrice = computePrice(priceStrategy ?? "manual", resolvedCost, numberOf(fixedMarkup), percentValue);

  const markupText = priceStrategy === "fixedMarkup" ? fixedMarkup : percentMarkup;
  const markupEmpty = isBlank(markupText);

  // ---- validation ----

  const nameLeft = Math.max(0, MAX_NAME - name.length);
  const missingName = name.trim() === "";
  const duplicateName = !missingName && existingNames.some((taken) => taken.trim().toLowerCase() === name.trim().toLowerCase());

  const barcodeLeft = Math.max(0, MAX_BARCODE - barcode.length);
  const barcodeOwner = barcode.trim() === "" ? undefined : existingBarcodes[barcode.trim()];
  const duplicateBarcode = barcodeOwner != null && barcodeTouched;

  const manufacturerLeft = Math.max(0, MAX_TEXT - manufacturer.length);
  const partNumberLeft = Math.max(0, MAX_TEXT - partNumber.length);
  const imageUrlLeft = Math.max(0, MAX_IMAGE_URL - imageUrl.length);

  const missingSubtype = requireSubtypes && subtypes.length > 0 && subtypeId == null;
  const missingPriceStrategy = priceStrategy == null;
  const missingTaxability = useTaxes && isTaxable == null;

  const missingPrice = priceStrategy === "manual" && isBlank(price);
  const missingMarkup = (priceStrategy === "fixedMarkup" || priceStrategy === "percentMarkup") && markupEmpty;
  const negativePrice = priceStrategy !== "manual" && priceStrategy != null && !markupEmpty && computedPrice < 0;
  const percentTooHigh = priceStrategy === "percentMarkup" && percentValue > MAX_PERCENT;
  const belowCost =
    priceStrategy === "manual"
      ? !isBlank(price) && numberOf(price) < resolvedCost
      : !markupEmpty && computedPrice >= 0 && computedPrice < resolvedCost;

  const priceChecked = showErrors || touched.price;
  const markupChecked = showErrors || (priceStrategy === "fixedMarkup" ? touched.fixed : touched.percent);
  const showBelowCost = belowCost && (priceStrategy === "manual" ? priceChecked : markupChecked);
  const showNegativePrice = negativePrice && markupChecked;

  // The three dimensions are all-or-nothing (production's own pairing rule).
  const dimensionValues = [length, width, height];
  const anyDimension = dimensionValues.some((value) => !isBlank(value));
  const partialDimensions = anyDimension && dimensionValues.some((value) => isBlank(value));
  const showDimensionError = partialDimensions && !dimensionsFocused && (dimensionsTouched || showErrors);

  const blocked =
    missingName ||
    duplicateName ||
    barcodeOwner != null ||
    missingSubtype ||
    missingPriceStrategy ||
    missingTaxability ||
    missingPrice ||
    missingMarkup ||
    negativePrice ||
    percentTooHigh ||
    partialDimensions;

  const dirty =
    name.trim() !== "" ||
    subtypeId != null ||
    labels.length > 0 ||
    manufacturer.trim() !== "" ||
    partNumber.trim() !== "" ||
    barcode.trim() !== "" ||
    vendorCosts.length > 0 ||
    priceStrategy != null ||
    isTaxable != null ||
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

  const create = async () => {
    if (blocked) {
      setShowErrors(true);
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
      priceStrategy: priceStrategy ?? "manual",
      price: priceStrategy === "manual" ? numberOf(price) : computedPrice,
      fixedMarkup: priceStrategy === "fixedMarkup" ? numberOf(fixedMarkup) : undefined,
      percentMarkup: priceStrategy === "percentMarkup" ? percentValue : undefined,
      isTaxable: isTaxable ?? false,
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
        title: "Could not create the product",
        caption: "Something went wrong. Please try again.",
      });
      return;
    }

    toast({
      type: "success",
      variant: "detailed",
      title: "Product created",
      caption: product.name,
      cta: onPreview == null ? undefined : { children: "Preview", onClick: () => onPreview(product) },
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
              <Input label="Name" helpText={nameLeft <= COUNTER_FROM ? `${nameLeft} characters left` : undefined}>
                <TextField
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={MAX_NAME}
                  isValid={!(showErrors && (missingName || duplicateName))}
                  errorMessage={duplicateName ? "Product with this name already exists" : undefined}
                />
              </Input>

              {subtypes.length > 0 &&
                (lockedSubtype != null ? (
                  <Input label="Subtype" labelCondition="readOnly">
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
                <Input
                  label="Manufacturer"
                  labelCondition="optional"
                  helpText={manufacturerLeft <= COUNTER_FROM ? `${manufacturerLeft} characters left` : undefined}
                >
                  <TextField value={manufacturer} onChange={(event) => setManufacturer(event.target.value)} maxLength={MAX_TEXT} />
                </Input>

                <Input
                  label="Manufacturer part #"
                  labelCondition="optional"
                  helpText={partNumberLeft <= COUNTER_FROM ? `${partNumberLeft} characters left` : undefined}
                >
                  <TextField value={partNumber} onChange={(event) => setPartNumber(event.target.value)} maxLength={MAX_TEXT} />
                </Input>
              </div>

              {/* The code and its scanner. The duplicate check fires on blur —
                  typing a code that is taken should not wait for Create. */}
              <Input
                label="Barcode or QR code"
                labelCondition="optional"
                helpText={
                  barcodeLeft <= COUNTER_FROM ? `${barcodeLeft} characters left` : "Scan or type the code printed on the product"
                }
              >
                <div className={styles.barcodeRow}>
                  <TextField
                    value={barcode}
                    onChange={(event) => {
                      setBarcode(event.target.value);
                      setBarcodeTouched(false);
                    }}
                    onBlur={() => setBarcodeTouched(true)}
                    maxLength={MAX_BARCODE}
                    isValid={!duplicateBarcode}
                    errorMessage={duplicateBarcode ? `Already registered to ${barcodeOwner}` : undefined}
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
                onChange={setVendorCosts}
                costFollowsVendors={costStrategy !== "manual"}
                canCreateVendor={canCreateVendor}
                onCreateVendor={onCreateVendor}
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
                          onChange={(event) => isMoneyText(event.target.value) && setCost(event.target.value)}
                          onBlur={() => setCost(padMoneyOnBlur(cost))}
                          keyboard="decimal"
                          prefix="$"
                          placeholder="0.00"
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
                  value={priceStrategy ?? undefined}
                  onChange={(value) => setPriceStrategy(value as PriceStrategy)}
                  isValid={!(showErrors && missingPriceStrategy)}
                >
                  <RadioItem
                    value="manual"
                    label="Manual"
                    error={priceStrategy === "manual" && priceChecked && missingPrice}
                    content={
                      <Input label="Price" helpText={showBelowCost ? "Less than cost" : undefined} helpTextStatus="warning">
                        <TextField
                          value={price}
                          onChange={(event) => isMoneyText(event.target.value) && setPrice(event.target.value)}
                          onBlur={() => {
                            setPrice(padMoneyOnBlur(price));
                            setTouched((prev) => ({ ...prev, price: true }));
                          }}
                          keyboard="decimal"
                          prefix="$"
                          isValid={!(priceChecked && missingPrice)}
                        />
                      </Input>
                    }
                  />

                  <RadioItem
                    value="fixedMarkup"
                    label="Fixed markup"
                    error={priceStrategy === "fixedMarkup" && markupChecked && (missingMarkup || negativePrice)}
                    contentPadded={false}
                    content={
                      <div className={styles.cardContent}>
                        <Input label="Fixed markup">
                          <TextField
                            value={fixedMarkup}
                            onChange={(event) => isSignedMoneyText(event.target.value) && setFixedMarkup(event.target.value)}
                            onBlur={() => {
                              setFixedMarkup(padMoneyOnBlur(fixedMarkup));
                              setTouched((prev) => ({ ...prev, fixed: true }));
                            }}
                            keyboard="decimal"
                            prefix="$"
                            isValid={!(markupChecked && (missingMarkup || negativePrice))}
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
                    error={priceStrategy === "percentMarkup" && markupChecked && (missingMarkup || negativePrice || percentTooHigh)}
                    contentPadded={false}
                    content={
                      <div className={styles.cardContent}>
                        <Input label="Percent markup">
                          <TextField
                            value={percentMarkup}
                            onChange={(event) => isPercentText(event.target.value) && setPercentMarkup(event.target.value)}
                            onBlur={() => {
                              setPercentMarkup(padMoneyOnBlur(percentMarkup));
                              setTouched((prev) => ({ ...prev, percent: true }));
                            }}
                            keyboard="decimal"
                            suffix="%"
                            isValid={!(markupChecked && (missingMarkup || negativePrice || percentTooHigh))}
                            errorMessage={
                              markupChecked && percentTooHigh ? `Must be ${MAX_PERCENT}% or less` : showNegativePrice ? "" : undefined
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
                    value={isTaxable == null ? undefined : isTaxable ? "taxable" : "non-taxable"}
                    onChange={(value) => setIsTaxable(value === "taxable")}
                    isValid={!(showErrors && missingTaxability)}
                  >
                    <RadioItem value="non-taxable" label="Non-taxable" />
                    <RadioItem value="taxable" label="Taxable" />
                  </RadioGroup>
                </Input>
              )}
            </FormModule>

            {/* ---------------- Details ---------------- */}
            <FormModule title="Details">
              <Input
                label="Image URL"
                labelCondition="optional"
                helpText={imageUrlLeft <= COUNTER_FROM ? `${imageUrlLeft} characters left` : undefined}
              >
                <TextField
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  maxLength={MAX_IMAGE_URL}
                  prefix="https://"
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
                  <InputGroup isValid={!showDimensionError} errorMessage="The field is required when any dimension is set">
                  <TextField
                    value={length}
                    onChange={(event) => isMeasureText(event.target.value) && setLength(event.target.value)}
                    keyboard="decimal"
                    placeholder="Length"
                  />
                  <TextField
                    value={width}
                    onChange={(event) => isMeasureText(event.target.value) && setWidth(event.target.value)}
                    keyboard="decimal"
                    placeholder="Width"
                  />
                  <TextField
                    value={height}
                    onChange={(event) => isMeasureText(event.target.value) && setHeight(event.target.value)}
                    keyboard="decimal"
                    placeholder="Height"
                  />
                    <SelectField
                      value={dimensionUnit}
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
                    onChange={(event) => isMeasureText(event.target.value) && setWeight(event.target.value)}
                    keyboard="decimal"
                  />
                  <SelectField
                    value={weightUnit}
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
        noResultsState={<EmptyState caption="No matching subtypes" />}
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
              tag={unit.value}
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
              tag={unit.value}
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
          setBarcode(code);
          setBarcodeTouched(true);
          setScanning(false);
        }}
        registered={existingBarcodes}
        breakpoint={breakpoint}
      />
    </>
  );
}
