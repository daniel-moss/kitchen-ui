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
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import useIsDesktop from "../../hooks/useIsDesktop";
import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";

import { isRateText, MAX_NAME, NAME_COUNTER_FROM, rateIssue } from "./rateRules";
import { NewTaxRate, NewTaxRateFormProps } from "./NewTaxRateForm.types";

import styles from "./NewTaxRateForm.module.scss";

// The reusable "New tax rate" form (Figma file dxBs07gWILPa0dhg04fjDR, section
// 1-7817 — Desktop 1-7818 / Mobile 1-7826): a Dialog titled "New tax rate"
// holding three FormModules.
//
//   General     Name · Percentage
//   Additional  Labels · Description · Internal notes
//   Accounting  QuickBooks tax collection agency
//
// REBUILT 2026-10-08 to the "New labor rate" form's shape: the fields used to
// be a flat list in the dialog body, and the QuickBooks notice sat on top of
// it. Now the form has sections, and the notice belongs to the section it
// explains.
//
// A tax rate is production's leanest pricebook item — no cost, no subtype, no
// taxability — so these six fields are the whole record. The last module exists
// only for a company on QuickBooks Desktop (see `quickbooks`), and has two
// faces: the vendor list being there, or not (nothing synced yet).

export default function NewTaxRateForm({
  open,
  onClose,
  labelPool = [],
  existingNames = [],
  quickbooks,
  onCreated,
  onPreview,
  breakpoint = "auto",
}: NewTaxRateFormProps) {
  const mobile = !useIsDesktop(breakpoint);

  // The company's integration decides whether the Accounting module exists at
  // all; an EMPTY vendor list is the module's second face.
  const vendors = quickbooks?.vendors ?? [];
  const hasQuickbooks = quickbooks != null;
  const noSyncedVendors = hasQuickbooks && vendors.length === 0;

  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  // The percentage states its problem when it LOSES FOCUS, and from then on
  // live — the rule the "New labor rate" form's number fields follow (Daniel,
  // 2026-10-07). Create marks everything at once.
  const [rateTouched, setRateTouched] = useState(false);
  // Bumped on every blocked Create, so pressing it twice scrolls again.
  const [submitAttempt, setSubmitAttempt] = useState(0);
  // Create is running: the button spins, Cancel and the ✕ are disabled, and the
  // dialog ignores every dismissal until the request answers.
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  // Local so a label created in the flow can join it; re-seeded on every open.
  const [pool, setPool] = useState<string[]>(labelPool);

  // Both pickers are anchored lists under their field (desktop) / drawers
  // (mobile), per the "Labels" Select List documentation: header=true,
  // footer=FALSE. Picks apply live — there is nothing to confirm.
  const vendorPop = useSelectPopover(mobile);
  const labelsPop = useSelectPopover(mobile);

  // A fresh form every time it opens — this one creates a record, it does not
  // edit one, so there is nothing to re-read.
  useEffect(() => {
    if (!open) return;
    setName("");
    setRate("");
    setVendorId(null);
    setLabels([]);
    setSummary("");
    setNotes("");
    setNoticeDismissed(false);
    setShowErrors(false);
    setRateTouched(false);
    setSubmitAttempt(0);
    setSubmitting(false);
    setPool(labelPool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // "Validates the form. If an error is detected, scrolls to the first field
  // with error" (the Create button's annotation) — the first error can be two
  // modules above the button that was just pressed.
  useEffect(() => {
    if (submitAttempt === 0) return;
    const firstError = bodyRef.current?.querySelector('[aria-invalid="true"], [data-form-blocker], [class*="error"]');
    firstError?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [submitAttempt]);

  // "Enter Name", "Enter Percentage" and "Choose QuickBooks tax collection
  // agency" are exactly what TextField and SelectField derive from their Input
  // labels, so only the two rules with copy of their own need a message.
  const nameLeft = Math.max(0, MAX_NAME - name.length);
  const missingName = name.trim() === "";
  const duplicateName = !missingName && existingNames.some((taken) => taken.trim().toLowerCase() === name.trim().toLowerCase());
  const missingVendor = hasQuickbooks && vendors.length > 0 && vendorId == null;

  const issue = rateIssue(rate);
  const rateInvalid = issue !== undefined;
  const rateChecked = showErrors || rateTouched;

  const blocked = missingName || duplicateName || rateInvalid || missingVendor || noSyncedVendors;

  const dirty =
    name.trim() !== "" || rate.trim() !== "" || vendorId != null || labels.length > 0 || summary.trim() !== "" || notes.trim() !== "";

  // "Numerical value only" / "digits and dot" (the Percentage input's
  // annotation): the characters AND the 2-decimal cap are enforced on the way
  // into state, so the field cannot hold a value the rules could not judge.
  const changeRate = (value: string) => {
    if (isRateText(value)) setRate(value);
  };

  // THE LAYOUT-FREEZE RULE: the badge row grows BELOW the field, which would
  // push the field out from under the open card. The frozen copy syncs when the
  // list closes.
  const shownLabels = labelsPop.freeze(labels);

  const toggleLabel = (label: string) =>
    setLabels((prev) => (prev.includes(label) ? prev.filter((row) => row !== label) : [...prev, label]));

  // Create-from-search: the new label joins the pool AND becomes selected.
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

    const taxRate: NewTaxRate = {
      name: name.trim(),
      rate: Number(rate),
      quickbooksVendorId: vendorId ?? undefined,
      labels,
      summary: summary.trim(),
      notes: notes.trim(),
    };

    setSubmitting(true);
    const failed = (await onCreated?.(taxRate)) === false;
    setSubmitting(false);

    if (failed) {
      // The designed failure toast (node 1-7845). The form stays open with the
      // values intact so the user can try again.
      toast({
        type: "error",
        variant: "detailed",
        title: "Could not create the tax rate",
        caption: "Something went wrong. Please try again.",
      });
      return;
    }

    // "Tax rate created" with the name as the caption, and a "Preview" link
    // that opens the "Tax rate" side panel — which the caller owns.
    toast({
      type: "success",
      variant: "detailed",
      title: "Tax rate created",
      caption: taxRate.name,
      cta: onPreview == null ? undefined : { children: "Preview", onClick: () => onPreview(taxRate) },
    });
    onClose();
  };

  const vendorName = vendors.find((vendor) => vendor.id === vendorId)?.name;

  return (
    <>
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
        <div ref={bodyRef}>
          <FormModuleGroup>
            <FormModule title="General">
              {/* The counter appears only in the last 10 characters, and the
                  cap never becomes an error — the field simply stops accepting
                  input (the node's two annotations). */}
              <Input label="Name" helpText={nameLeft <= NAME_COUNTER_FROM ? `${nameLeft} characters left` : undefined}>
                <TextField
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={MAX_NAME}
                  isValid={!(showErrors && (missingName || duplicateName))}
                  errorMessage={duplicateName ? "Tax rate with this name already exists" : undefined}
                />
              </Input>

              <Input label="Percentage">
                <TextField
                  value={rate}
                  onChange={(event) => changeRate(event.target.value)}
                  onBlur={() => setRateTouched(true)}
                  // The pad WITH a separator key — a percentage has decimals.
                  keyboard="decimal"
                  suffix="%"
                  isValid={!(rateChecked && rateInvalid)}
                  errorMessage={issue?.message}
                />
              </Input>
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
                  {/* The picked labels, as dismissible lg badges under the
                      field (the doc's "Selected Labels" frame). */}
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

              {/* RENAMED from "Summary template" 2026-10-07, and the label hint
                  went with it. The state still carries production's
                  `summary_template`. */}
              <Input label="Description" labelCondition="optional">
                <TextArea value={summary} onChange={(event) => setSummary(event.target.value)} onClear={() => setSummary("")} />
              </Input>

              <Input label="Internal notes" labelCondition="optional">
                <TextArea value={notes} onChange={(event) => setNotes(event.target.value)} onClear={() => setNotes("")} />
              </Input>
            </FormModule>

            {/* Only for a company on QuickBooks Desktop, which is the one setup
                where production REQUIRES a tax rate to name the agency it is
                collected for. Last, because it belongs to the integration
                rather than to the rate. */}
            {hasQuickbooks && (
              <FormModule
                title="Accounting"
                banner={
                  noSyncedVendors ? (
                    // The blocking condition, and the anchor a blocked Create
                    // scrolls to. There is no field under it to mark: with
                    // nothing synced the module is this banner alone — which is
                    // also why it cannot be dismissed. Closing it would leave
                    // the module empty and the form blocked with nothing saying
                    // why.
                    <div data-form-blocker>
                      <AlertBanner status="warning" orientation="vertical">
                        No QuickBooks vendors have been synced yet. Run a sync in the QuickBooks Web Connector, then
                        create this tax rate.
                      </AlertBanner>
                    </div>
                  ) : (
                    // Production's create-form notice, worded for one rate. A
                    // tax item always syncs to QuickBooks Desktop — even when
                    // pricebook item sync is switched off — and it cannot be
                    // used on an invoice or estimate until it has.
                    !noticeDismissed && (
                      <AlertBanner status="info" orientation="vertical" onDismiss={() => setNoticeDismissed(true)}>
                        The tax rate won&apos;t be available for use during invoice or estimate creation until it&apos;s
                        been synced with QuickBooks
                      </AlertBanner>
                    )
                  )
                }
              >
                {/* No field with nothing to choose from (the node draws the
                    body slot hidden): an empty picker is a control that cannot
                    do anything. The banner above says what to do instead. */}
                {!noSyncedVendors && (
                  <Input label="QuickBooks tax collection agency">
                    <SelectField
                      value={vendorName}
                      open={vendorPop.open}
                      onClick={(event: MouseEvent<HTMLDivElement>) => vendorPop.toggle(event.currentTarget)}
                      isValid={!(showErrors && missingVendor)}
                    />
                  </Input>
                )}
              </FormModule>
            )}
          </FormModuleGroup>
        </div>
      </Dialog>

      {/* The agency list — "Options are the company's synced QuickBooks Desktop
          vendors, sorted by name from A to Z" (the Select List's annotation).
          The title only shows on the mobile drawer; the desktop card is a plain
          anchored list. The no-match answer is the node's own caption-only
          EmptyState, which names the object instead of the DS default. */}
      {!noSyncedVendors && (
        <SelectPopoverList
          pop={vendorPop}
          mobile={mobile}
          title="QuickBooks tax collection agency"
          searchable
          searchPlaceholder="Vendor..."
          noResultsState={<EmptyState caption="No matching vendors" />}
        >
          <SelectListItemGroup>
            {[...vendors]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((vendor) => (
                <SelectListItem
                  key={vendor.id}
                  label={vendor.name}
                  selected={vendor.id === vendorId}
                  onClick={() => {
                    setVendorId(vendor.id);
                    vendorPop.close();
                  }}
                />
              ))}
          </SelectListItemGroup>
        </SelectPopoverList>
      )}

      {/* The Labels picker, exactly as the "Labels" Select List file documents
          it: inline under the field on desktop, a drawer on mobile, a search
          header, create-from-search, and NO footer — every tick applies at
          once. (The side panel's module opens the DIALOG version instead; that
          one saves to a record, so it has Cancel / Save.) */}
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

// Re-exported so a consumer can type its handlers without reaching inside.
export type { NewTaxRate, NewTaxRateFormProps } from "./NewTaxRateForm.types";
