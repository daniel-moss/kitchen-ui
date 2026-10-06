import { MouseEvent, useEffect, useState } from "react";

import AlertBanner from "../../components/AlertBanner/AlertBanner";
import Badge from "../../components/Badge/Badge";
import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import TextField from "../../components/Fields/TextField/TextField";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import useIsDesktop from "../../hooks/useIsDesktop";
import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";

import { isRateText, rateIssue } from "./rateRules";
import { NewTaxRate, NewTaxRateFormProps } from "./NewTaxRateForm.types";

import styles from "./NewTaxRateForm.module.scss";

// The reusable "New tax rate" form (Figma file dxBs07gWILPa0dhg04fjDR, section
// 1-7817): a default Dialog titled "New tax rate" with up to six fields and a
// Create action.
//
// Name · Percentage · QuickBooks tax collection agency · Labels · Summary
// template · Internal notes.
//
// A tax rate is production's leanest pricebook item — no cost, no subtype, no
// taxability — so this form is the whole record. Two of the six are conditional
// on the company's accounting integration (see `quickbooksVendors`).
//
// NO FormModule: the form has no sections, so a section header repeating the
// dialog's own title would be redundant (Daniel's rule for the sibling panel
// forms, 2026-09-28). The fields are a plain list at the Dialog body's own 24px
// rhythm.

export default function NewTaxRateForm({
  open,
  onClose,
  labelPool = [],
  quickbooksVendors = [],
  onCreated,
  onPreview,
  breakpoint = "auto",
}: NewTaxRateFormProps) {
  const mobile = !useIsDesktop(breakpoint);

  // The company's integration decides whether the agency field and the sync
  // notice exist at all (both annotations: "Only shown for the companies with
  // QuickBooks integration").
  const hasQuickbooks = quickbooksVendors.length > 0;

  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
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
    setPool(labelPool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // The Validation frame's five states (node 1-7840). "Enter Name", "Enter
  // Percentage" and "Choose QuickBooks tax collection agency" are exactly what
  // TextField and SelectField derive from their Input labels, so only the two
  // percentage RULES need their own message.
  const missingName = name.trim() === "";
  const missingVendor = hasQuickbooks && vendorId == null;

  const issue = rateIssue(rate);
  const rateInvalid = issue !== undefined;
  const rateError = issue?.message;

  const dirty =
    name.trim() !== "" || rate.trim() !== "" || vendorId != null || labels.length > 0 || summary.trim() !== "" || notes.trim() !== "";

  // "Numerical value only" (the Percentage input's annotation): digits and at
  // most one decimal point. Everything else never reaches the state, so the
  // field cannot hold a value the rules above could not judge.
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
    const name = query.trim();
    if (name === "" || pool.includes(name)) return;
    setPool((prev) => [...prev, name]);
    setLabels((prev) => [...prev, name]);
  };

  const create = async () => {
    if (missingName || rateInvalid || missingVendor) {
      setShowErrors(true);
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

    if ((await onCreated?.(taxRate)) === false) {
      // The designed failure toast (node 1-7843). The form stays open with the
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

  const vendorName = quickbooksVendors.find((vendor) => vendor.id === vendorId)?.name;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="New tax rate"
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
            <Button size="lg" variant="solid" onClick={create}>
              Create
            </Button>
          </PopoverFooter>
        }
      >
        <>
          {/* Production's create-form notice, worded for one rate. A tax item
              always syncs to QuickBooks Desktop — even when pricebook item sync
              is switched off — and it cannot be used on an invoice or estimate
              until it has. */}
          {hasQuickbooks && !noticeDismissed && (
            <AlertBanner status="info" orientation="vertical" onDismiss={() => setNoticeDismissed(true)}>
              The tax rate won&apos;t be available for use during invoice or estimate creation until it&apos;s been synced with QuickBooks
            </AlertBanner>
          )}

          <Input label="Name">
            <TextField value={name} onChange={(event) => setName(event.target.value)} isValid={!(showErrors && missingName)} />
          </Input>

          <Input label="Percentage">
            <TextField
              value={rate}
              onChange={(event) => changeRate(event.target.value)}
              // The pad WITH a separator key — a percentage has decimals.
              keyboard="decimal"
              suffix="%"
              isValid={!(showErrors && rateInvalid)}
              errorMessage={rateError}
            />
          </Input>

          {hasQuickbooks && (
            <Input label="QuickBooks tax collection agency">
              <SelectField
                value={vendorName}
                open={vendorPop.open}
                onClick={(event: MouseEvent<HTMLDivElement>) => vendorPop.toggle(event.currentTarget)}
                isValid={!(showErrors && missingVendor)}
              />
            </Input>
          )}

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
              {/* The picked labels, as dismissible lg badges under the field
                  (the doc's "Selected Labels" frame). */}
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

          <Input
            label="Summary template"
            labelCondition="optional"
            labelHint
            labelHintContent={'Summary specific to this tax. E.g. "Standard sales tax on purchased parts in San Luis Obispo County".'}
          >
            <TextArea value={summary} onChange={(event) => setSummary(event.target.value)} onClear={() => setSummary("")} />
          </Input>

          <Input label="Internal notes" labelCondition="optional">
            <TextArea value={notes} onChange={(event) => setNotes(event.target.value)} onClear={() => setNotes("")} />
          </Input>
        </>
      </Dialog>

      {/* The agency list — "Options are the company's synced QuickBooks Desktop
          vendors, sorted by name from A to Z" (the Select List's annotation).
          The title only shows on the mobile drawer; the desktop card is a plain
          anchored list. */}
      <SelectPopoverList
        pop={vendorPop}
        mobile={mobile}
        title="QuickBooks tax collection agency"
        searchable
        searchPlaceholder="Vendor..."
      >
        <SelectListItemGroup>
          {[...quickbooksVendors]
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
