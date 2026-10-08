import { MouseEvent, useEffect, useRef, useState } from "react";

import AlertBanner from "../../components/AlertBanner/AlertBanner";
import Badge from "../../components/Badge/Badge";
import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import EmptyState from "../../components/EmptyState/EmptyState";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import TextField from "../../components/Fields/TextField/TextField";
import FormModule from "../../components/FormModule/FormModule";
import FormModuleGroup from "../../components/FormModule/FormModuleGroup";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import ValueDisplay from "../../components/ValueDisplay/ValueDisplay";
import useIsDesktop from "../../hooks/useIsDesktop";
import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";

import {
  computeRate,
  formatOnBlur,
  isAmountText,
  isSignedText,
  MAX_NAME,
  MAX_PERCENT,
  money,
  NAME_COUNTER_FROM,
  numberOf,
  PriceStrategy,
} from "./rateMath";
import { LaborUnitType, NewLaborRate, NewLaborRateFormProps, QuickBooksAccount } from "./NewLaborRateForm.types";

import styles from "./NewLaborRateForm.module.scss";

// The reusable "New labor rate" form (Figma file U2V0ZqWOhV89yql8GKRmjy,
// section 1-7817 — Desktop 2003-1517 / Mobile 1-7826): a Dialog titled "New
// labor rate" holding three FormModules.
//
//   General     Name · Subtype
//   Pricing     Unit type · Cost · Price strategy · Taxability
//   Additional  Labels · Description · Internal notes
//
// A LABOR RATE is today's "Service Charge" pricebook item (`PriceBookItem`,
// type 1). The app is splitting that one concept in two — a SERVICE (the type
// of work on a job, which carries the default priority and est. duration) and
// a LABOR RATE (the charge) — so neither job default lives in this form.
//
// TWO things the Pricing module does that no other form here does:
//
// 1. Cost and Price strategy appear only once a Unit type is chosen (the
//    module's "Default — No selection" frame shows the other two fields
//    alone). The unit decides the "per hour" suffix on every money field
//    below it, so it is asked first.
// 2. The Price strategy is a vertical RadioGroup of CARDS, and the selected
//    card holds its own field: Manual reveals the Rate, each markup reveals
//    its value plus the calculated Rate as a ValueDisplay. Nothing is
//    disabled — a computed rate is simply not an input.

export default function NewLaborRateForm({
  open,
  onClose,
  subtypes = [],
  requireSubtypes = false,
  useTaxes = true,
  defaultTaxable = false,
  quickbooks,
  labelPool = [],
  existingNames = [],
  onCreated,
  onPreview,
  breakpoint = "auto",
}: NewLaborRateFormProps) {
  const mobile = !useIsDesktop(breakpoint);

  // "Only shown if a company supports subtypes". It is REQUIRED only when the
  // company says so; then a lone option is picked for the user and locked
  // (the node's two annotations). Optional otherwise, and the list offers
  // "No subtype" to clear it.
  const hasSubtypes = subtypes.length > 0;
  const subtypeRequired = hasSubtypes && requireSubtypes;
  const lockedSubtype = subtypeRequired && subtypes.length === 1 ? subtypes[0] : undefined;

  // The Accounting module exists only for QuickBooks Desktop + the detailed
  // line-item scheme, and its two faces are the account list being there or
  // not (nothing synced yet).
  const accounts = quickbooks?.accounts ?? [];
  const hasQuickbooks = quickbooks != null;
  const noSyncedAccounts = hasQuickbooks && accounts.length === 0;

  const [name, setName] = useState("");
  const [subtypeId, setSubtypeId] = useState<string | null>(null);
  const [unitType, setUnitType] = useState<LaborUnitType | null>(null);
  const [cost, setCost] = useState("");
  const [strategy, setStrategy] = useState<PriceStrategy | null>(null);
  const [rate, setRate] = useState("");
  const [fixedMarkup, setFixedMarkup] = useState("");
  const [percentMarkup, setPercentMarkup] = useState("");
  // Pre-selected from the company default — production's switch is never
  // empty, so there is no "choose one" error here.
  const [isTaxable, setIsTaxable] = useState<boolean>(defaultTaxable);
  const [accountId, setAccountId] = useState<string | null>(null);
  // Both banners carry the node's dismiss ✕. A dismissed WARNING comes back on
  // a blocked Create — it is the only thing explaining why nothing happens.
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  // Per-field validation: a money field states its problem when it LOSES
  // FOCUS, and from then on live, so fixing it clears the message at once.
  // Create marks all three at once. (Cost is not here — it is optional and has
  // no error state.)
  const [touched, setTouched] = useState({ rate: false, fixed: false, percent: false });
  // Bumped on every blocked Create, so pressing it twice scrolls again.
  const [submitAttempt, setSubmitAttempt] = useState(0);
  // Create is running: the button spins, Cancel and the ✕ are disabled, and
  // the dialog ignores every dismissal until the request answers.
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  // Local so a label created in the flow can join it; re-seeded on every open.
  const [pool, setPool] = useState<string[]>(labelPool);

  const subtypePop = useSelectPopover(mobile);
  const labelsPop = useSelectPopover(mobile);
  const accountPop = useSelectPopover(mobile);

  // A fresh form every time it opens — this one creates a record, it does not
  // edit one. The single subtype is pre-picked here, not on every render.
  useEffect(() => {
    if (!open) return;
    setName("");
    setSubtypeId(lockedSubtype?.id ?? null);
    setUnitType(null);
    setCost("");
    setStrategy(null);
    setRate("");
    setFixedMarkup("");
    setPercentMarkup("");
    setIsTaxable(defaultTaxable);
    setAccountId(null);
    setNoticeDismissed(false);
    setLabels([]);
    setDescription("");
    setNotes("");
    setShowErrors(false);
    setTouched({ rate: false, fixed: false, percent: false });
    setSubmitAttempt(0);
    setSubmitting(false);
    setPool(labelPool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // A blocked Create reveals the errors — and takes the user to the FIRST of
  // them, which can be three modules above the button they just pressed
  // (production's own form scrolls the same way).
  useEffect(() => {
    if (submitAttempt === 0) return;
    const firstError = bodyRef.current?.querySelector('[aria-invalid="true"], [data-form-blocker], [class*="error"]');
    firstError?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [submitAttempt]);

  // ---- the Pricing module's live numbers ----------------------------------

  const costValue = numberOf(cost);
  const percentValue = numberOf(percentMarkup);
  const rateValue = strategy == null ? 0 : computeRate(strategy, costValue, numberOf(fixedMarkup), percentValue);

  // "Only shown if 'Hourly' unit type is selected" — the suffix of every money
  // field in the module, and of the calculated Rate.
  const perHour = unitType === "hourly" ? " per hour" : "";
  const unitSuffix = unitType === "hourly" ? "per hour" : undefined;

  const markupText = strategy === "fixed" ? fixedMarkup : percentMarkup;
  const markupEmpty = markupText.trim() === "" || markupText.trim() === "-";

  // The two states a markup's Rate can reach, both read off the node:
  // negative is an ERROR ("can not be less than $0"), below cost a WARNING.
  const negativeRate = strategy !== null && strategy !== "manual" && !markupEmpty && rateValue < 0;
  const belowCost = !markupEmpty && rateValue >= 0 && rateValue < costValue;
  const percentTooHigh = strategy === "percent" && percentValue > MAX_PERCENT;

  // Manual carries the same warning, as help text under its own Rate field.
  const manualBelowCost = strategy === "manual" && rate.trim() !== "" && numberOf(rate) < costValue;

  // ---- validation ---------------------------------------------------------

  // Clamped: the field caps at MAX_NAME, so "left" never goes negative even if
  // a value arrives from outside the keyboard.
  const nameLeft = Math.max(0, MAX_NAME - name.length);
  const missingName = name.trim() === "";
  const duplicateName =
    !missingName && existingNames.some((taken) => taken.trim().toLowerCase() === name.trim().toLowerCase());
  const missingSubtype = subtypeRequired && subtypeId == null;
  const missingUnitType = unitType == null;
  const missingStrategy = unitType != null && strategy == null;
  const missingRate = strategy === "manual" && rate.trim() === "";
  const missingMarkup = (strategy === "fixed" || strategy === "percent") && markupEmpty;
  // The account is required when there is one to choose. With NOTHING synced
  // the field stays quiet — "Choose…" would be an instruction nobody can
  // follow — and the module's warning banner is the message instead.
  const missingAccount = hasQuickbooks && accounts.length > 0 && accountId == null;

  // Shown only once the field has been left (or Create was pressed).
  const rateChecked = showErrors || touched.rate;
  const fixedChecked = showErrors || touched.fixed;
  const percentChecked = showErrors || touched.percent;
  const markupChecked = strategy === "fixed" ? fixedChecked : percentChecked;
  const showNegativeRate = negativeRate && markupChecked;
  // The warning waits for the blur too (Daniel, 2026-10-08): one rule for the
  // whole module — a money field stays quiet while it is being typed in, and
  // speaks when it is left.
  const showBelowCost = belowCost && markupChecked;
  const showManualBelowCost = manualBelowCost && rateChecked;

  const blocked =
    missingName ||
    duplicateName ||
    missingSubtype ||
    missingUnitType ||
    missingStrategy ||
    missingRate ||
    missingMarkup ||
    negativeRate ||
    percentTooHigh ||
    missingAccount ||
    noSyncedAccounts;

  const dirty =
    name.trim() !== "" ||
    (subtypeId != null && subtypeId !== lockedSubtype?.id) ||
    unitType != null ||
    cost.trim() !== "" ||
    strategy != null ||
    isTaxable !== defaultTaxable ||
    accountId != null ||
    labels.length > 0 ||
    description.trim() !== "" ||
    notes.trim() !== "";

  // THE LAYOUT-FREEZE RULE: the badge row grows BELOW the field, which would
  // push the field out from under the open card.
  const shownLabels = labelsPop.freeze(labels);

  const toggleLabel = (label: string) =>
    setLabels((prev) => (prev.includes(label) ? prev.filter((row) => row !== label) : [...prev, label]));

  const createLabel = (query: string) => {
    const label = query.trim();
    if (label === "" || pool.includes(label)) return;
    setPool((prev) => [...prev, label]);
    setLabels((prev) => [...prev, label]);
  };

  const create = async () => {
    if (blocked) {
      setShowErrors(true);
      setSubmitAttempt((previous) => previous + 1);
      return;
    }

    const laborRate: NewLaborRate = {
      name: name.trim(),
      subtypeId: subtypeId ?? undefined,
      unitType: unitType as LaborUnitType,
      cost: costValue,
      priceStrategy: strategy as PriceStrategy,
      rate: strategy === "manual" ? numberOf(rate) : rateValue,
      fixedMarkup: strategy === "fixed" ? numberOf(fixedMarkup) : undefined,
      percentMarkup: strategy === "percent" ? percentValue : undefined,
      isTaxable,
      quickbooksAccountId: accountId ?? undefined,
      labels,
      description: description.trim(),
      notes: notes.trim(),
    };

    setSubmitting(true);
    const failed = (await onCreated?.(laborRate)) === false;
    setSubmitting(false);

    if (failed) {
      toast({
        type: "error",
        variant: "detailed",
        title: "Could not create the labor rate",
        caption: "Something went wrong. Please try again.",
      });
      return;
    }

    // Node 2063-6176: the name as the caption, and a "Preview" link that opens
    // the "Labor rate" side panel — which the caller owns.
    toast({
      type: "success",
      variant: "detailed",
      title: "Labor rate created",
      caption: laborRate.name,
      cta: onPreview == null ? undefined : { children: "Preview", onClick: () => onPreview(laborRate) },
    });
    onClose();
  };

  // The calculated Rate under a markup — one ValueDisplay, three states.
  const rateValueDisplay = (
    <ValueDisplay
      label="Rate"
      emptyText={strategy === "fixed" ? "Enter Fixed markup" : "Enter Percent markup"}
      value={
        markupEmpty
          ? undefined
          : showNegativeRate
            ? `${money(rateValue)}${perHour} — must be $0 or more`
            : showBelowCost
              ? `${money(rateValue)}${perHour} — less than cost`
              : `${money(rateValue)}${perHour}`
      }
      valueColor={showNegativeRate ? "var(--text-error)" : undefined}
      isWarning={showBelowCost}
    />
  );

  const subtypeName = subtypes.find((row) => row.id === subtypeId)?.name;

  // "4010: Service Revenue" — accounts with no number show the name alone
  // (the list's annotation, and production's own option builder).
  const accountOption = (account: QuickBooksAccount) =>
    account.number ? `${account.number}: ${account.name}` : account.name;
  // "Sorted by number from 0 to 9 and then by name from A to Z" — numbered
  // accounts first, the unnumbered ones after them alphabetically. (Production
  // orders by number then name in SQL, where a blank number sorts FIRST; the
  // node puts those last, which reads better — flagged.)
  const byAccount = (a: QuickBooksAccount, b: QuickBooksAccount) => {
    if (a.number && b.number) return a.number.localeCompare(b.number) || a.name.localeCompare(b.name);
    if (a.number) return -1;
    if (b.number) return 1;
    return a.name.localeCompare(b.name);
  };
  const chosenAccount = accounts.find((account) => account.id === accountId);
  const accountLabel = chosenAccount ? accountOption(chosenAccount) : undefined;

  return (
    <>
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
        <div ref={bodyRef}>
          <FormModuleGroup>
          <FormModule title="General">
            {/* The counter appears only in the last 10 characters, and the cap
                never becomes an error — the field simply stops accepting
                input (the node's two annotations). */}
            <Input label="Name" helpText={nameLeft <= NAME_COUNTER_FROM ? `${nameLeft} characters left` : undefined}>
              <TextField
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={MAX_NAME}
                isValid={!(showErrors && (missingName || duplicateName))}
                errorMessage={duplicateName ? "Labor rate with this name already exists" : undefined}
              />
            </Input>

            {hasSubtypes &&
              (lockedSubtype ? (
                // Required + one option: chosen for the user, nothing to do.
                <Input label="Subtype">
                  <SelectField value={lockedSubtype.name} readOnly />
                </Input>
              ) : (
                <Input label="Subtype" labelCondition={subtypeRequired ? undefined : "optional"}>
                  <SelectField
                    value={subtypeName}
                    open={subtypePop.open}
                    onClick={(event: MouseEvent<HTMLDivElement>) => subtypePop.toggle(event.currentTarget)}
                    isValid={!(showErrors && missingSubtype)}
                  />
                </Input>
              ))}
          </FormModule>

          <FormModule title="Pricing">
            <Input label="Unit type">
              <RadioGroup
                orientation="horizontal"
                value={unitType ?? undefined}
                onChange={(value) => setUnitType(value as LaborUnitType)}
                isValid={!(showErrors && missingUnitType)}
              >
                <RadioItem value="hourly" label="Hourly" />
                <RadioItem value="flat" label="Flat rate" />
              </RadioGroup>
            </Input>

            {/* Both appear with the unit type — every money field below needs
                to know whether it is per hour or flat. */}
            {unitType != null && (
              <>
                <Input label="Cost" labelCondition="optional">
                  <TextField
                    value={cost}
                    onChange={(event) => isAmountText(event.target.value) && setCost(event.target.value)}
                    onBlur={() => setCost(formatOnBlur(cost))}
                    keyboard="decimal"
                    prefix="$"
                    suffix={unitSuffix}
                    // "No value = $0" — the placeholder says so while the field
                    // is empty (node 2037-2071).
                    placeholder="0"
                  />
                </Input>

                <Input label="Price strategy">
                  <RadioGroup
                    orientation="vertical"
                    value={strategy ?? undefined}
                    onChange={(value) => setStrategy(value as PriceStrategy)}
                    isValid={!(showErrors && missingStrategy)}
                  >
                    <RadioItem
                      value="manual"
                      label="Manual"
                      // Scoped to the OPEN card: the other two are collapsed,
                      // and a collapsed card has nothing to be wrong about.
                      error={strategy === "manual" && rateChecked && missingRate}
                      content={
                        // The warning rides the Input's own help text, so it
                        // sits under the LABEL with the status icon — where
                        // the node draws it.
                        <Input
                          label="Rate"
                          helpText={showManualBelowCost ? "Less than cost" : undefined}
                          helpTextStatus="warning"
                        >
                          <TextField
                            value={rate}
                            onChange={(event) => isAmountText(event.target.value) && setRate(event.target.value)}
                            onBlur={() => {
                              setRate(formatOnBlur(rate));
                              setTouched((prev) => ({ ...prev, rate: true }));
                            }}
                            keyboard="decimal"
                            prefix="$"
                            suffix={unitSuffix}
                            isValid={!(rateChecked && missingRate)}
                          />
                        </Input>
                      }
                    />

                    <RadioItem
                      value="fixed"
                      label="Fixed markup"
                      error={strategy === "fixed" && fixedChecked && (missingMarkup || negativeRate)}
                      // The markup cards carry their own padding: 12px at the
                      // BOTTOM, 16px elsewhere (the node's content slot).
                      contentPadded={false}
                      content={
                        <div className={styles.cardContent}>
                          <Input label="Fixed markup">
                            <TextField
                              value={fixedMarkup}
                              onChange={(event) => isSignedText(event.target.value) && setFixedMarkup(event.target.value)}
                              onBlur={() => {
                                setFixedMarkup(formatOnBlur(fixedMarkup));
                                setTouched((prev) => ({ ...prev, fixed: true }));
                              }}
                              keyboard="decimal"
                              prefix="$"
                              isValid={!(fixedChecked && (missingMarkup || negativeRate))}
                              // The negative rate's own message is the Rate row
                              // below, so the field turns red without one.
                              errorMessage={showNegativeRate ? "" : undefined}
                            />
                          </Input>
                          {rateValueDisplay}
                        </div>
                      }
                    />

                    <RadioItem
                      value="percent"
                      label="Percent markup"
                      error={strategy === "percent" && percentChecked && (missingMarkup || negativeRate || percentTooHigh)}
                      contentPadded={false}
                      content={
                        <div className={styles.cardContent}>
                          <Input label="Percent markup">
                            <TextField
                              value={percentMarkup}
                              onChange={(event) =>
                                isSignedText(event.target.value) && setPercentMarkup(event.target.value)
                              }
                              onBlur={() => {
                                setPercentMarkup(formatOnBlur(percentMarkup));
                                setTouched((prev) => ({ ...prev, percent: true }));
                              }}
                              keyboard="decimal"
                              suffix="%"
                              isValid={!(percentChecked && (missingMarkup || negativeRate || percentTooHigh))}
                              errorMessage={
                                percentChecked && percentTooHigh
                                  ? `Must be ${MAX_PERCENT}% or less`
                                  : showNegativeRate
                                    ? ""
                                    : undefined
                              }
                            />
                          </Input>
                          {rateValueDisplay}
                        </div>
                      }
                    />
                  </RadioGroup>
                </Input>
              </>
            )}

            {/* Production hides the whole field when the company does not use
                taxes, and otherwise opens it on the company default — so it is
                never empty and has no error state. */}
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

          <FormModule title="Additional">
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

            {/* Production's `summary_template` — the summary every line item
                made from this rate starts with. */}
            <Input label="Description" labelCondition="optional">
              <TextArea value={description} onChange={(event) => setDescription(event.target.value)} onClear={() => setDescription("")} />
            </Input>

            <Input label="Internal notes" labelCondition="optional">
              <TextArea value={notes} onChange={(event) => setNotes(event.target.value)} onClear={() => setNotes("")} />
            </Input>
          </FormModule>

          {/* Only for a company on QuickBooks Desktop with the DETAILED
              line-item scheme — the one setup where the rate carries its own
              revenue account. Last, because it belongs to the integration
              rather than to the rate. */}
          {hasQuickbooks && (
            <FormModule
              title="Accounting"
              banner={
                noSyncedAccounts ? (
                  // The blocking condition, and the anchor a blocked Create
                  // scrolls to. There is no field under it to mark: with
                  // nothing synced the module is this banner alone — which is
                  // also why it cannot be dismissed (Figma 2069-7921,
                  // isDismissable = false). Closing it would leave the module
                  // empty and the form blocked with nothing saying why.
                  <div data-form-blocker>
                    <AlertBanner status="warning" orientation="vertical">
                      No QuickBooks accounts have been synced yet. Run a sync in the QuickBooks Web Connector, then
                      create this labor rate.
                    </AlertBanner>
                  </div>
                ) : (
                  !noticeDismissed && (
                    <AlertBanner status="info" orientation="vertical" onDismiss={() => setNoticeDismissed(true)}>
                      The labor rate won&apos;t be available for use in invoice or estimate line items until it&apos;s
                      been synced with QuickBooks
                    </AlertBanner>
                  )
                )
              }
            >
              {/* No field with nothing to choose from (Figma 2069-7921 draws
                  the body slot hidden): an empty picker is a control that
                  cannot do anything. The banner above says what to do
                  instead, and the module is that banner alone. */}
              {!noSyncedAccounts && (
                <Input label="QuickBooks revenue account">
                  <SelectField
                    value={accountLabel}
                    open={accountPop.open}
                    onClick={(event: MouseEvent<HTMLDivElement>) => accountPop.toggle(event.currentTarget)}
                    isValid={!(showErrors && missingAccount)}
                  />
                </Input>
              )}
            </FormModule>
          )}
          </FormModuleGroup>
        </div>
      </Dialog>

      {/* "Sorted by name from A to Z" (the Select List's annotation). The
          no-match answer is the node's own caption-only EmptyState — it names
          the object instead of the DS default ("No results found" + icon). */}
      <SelectPopoverList
        pop={subtypePop}
        mobile={mobile}
        title="Subtype"
        searchable
        searchPlaceholder="Subtype..."
        noResultsState={<EmptyState caption="No matching subtypes" />}
      >
        <SelectListItemGroup>
          {/* "Only exists if subtype is NOT required by company settings. It
              allows the user to clear the selection. Always on top of the
              list." */}
          {!subtypeRequired && (
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

      {/* The company's synced QuickBooks INCOME accounts, "sorted by number
          from 0 to 9 and then by name from A to Z" (the list's annotation).
          It exists only alongside its field: with nothing synced there is no
          field to open it from, so there is no empty state to draw either. */}
      {!noSyncedAccounts && (
        <SelectPopoverList
          pop={accountPop}
          mobile={mobile}
          title="QuickBooks revenue account"
          searchable
          searchPlaceholder="Account..."
          noResultsState={<EmptyState caption="No matching accounts" />}
        >
          <SelectListItemGroup>
            {[...accounts]
              .sort(byAccount)
              .map((account) => (
                <SelectListItem
                  key={account.id}
                  label={accountOption(account)}
                  selected={account.id === accountId}
                  onClick={() => {
                    setAccountId(account.id);
                    accountPop.close();
                  }}
                />
              ))}
          </SelectListItemGroup>
        </SelectPopoverList>
      )}

      {/* The shared Labels picker — header, create-from-search, no footer. */}
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
    </>
  );
}

export type { NewLaborRate, NewLaborRateFormProps } from "./NewLaborRateForm.types";
