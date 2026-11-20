import { useEffect, useState } from "react";

import clsx from "clsx";

import Button from "../../../../components/Button/Button";
import Dialog from "../../../../components/Dialog/Dialog";
import TextField from "../../../../components/Fields/TextField/TextField";
import IconButton from "../../../../components/IconButton/IconButton";
import Input from "../../../../components/Input/Input";
import PopoverFooter from "../../../../components/Popover/PopoverFooter";
import RadioGroup from "../../../../components/Radio/RadioGroup";
import RadioItem from "../../../../components/Radio/RadioItem";
import { toast } from "../../../../components/Toast/Toaster";
import HoverTooltip from "../../../../components/Tooltip/HoverTooltip";
import { PRODUCT_SUBTYPES, ProductItem } from "../../../../data/db";
import useIsDesktop from "../../../../hooks/useIsDesktop";
import { NameField, nameIssues, SubtypeField, subtypeRules } from "../../../shared/pricebookFields";
import { MAX_BARCODE, MAX_TEXT, NO_SUGGESTIONS, overLimitError, stripControlCharacters } from "../../NewProductForm/productRules";
import ScanCodeDialog from "../../NewProductForm/ScanCodeDialog";
import { ProductGeneral } from "../ProductPanel.types";

import styles from "../ProductPanel.module.scss";

// The product's "General" edit form (Figma 3167-22881: Desktop 3167-22882,
// Mobile 3167-22887): a default Dialog titled "General" with every field of
// the module, pre-filled — an "Edit" form "shows every field that applies,
// required or optional".
//
//   Name                  the shared field (50 max, unique).
//   Subtype               the shared field — whenever the company has subtypes.
//   Manufacturer          optional, 100 max; one row with part # on desktop.
//   Manufacturer part #   optional, 100 max.
//   Barcode or QR code    optional, 255 max, unique per company — "Already
//                         registered to …" while typing; control characters
//                         are dropped. The scan button opens the "Scan code"
//                         dialog (3167-27874), the one the Create form had.
//   Stock type            "Only shown if the feature is enabled in a service
//                         company settings (Django)."
//
// Save "applies the changes, closes the Dialog, triggers the Toast"
// ('"General" module updated', 3167-22892).

interface EditGeneralDialogProps {
  open: boolean;
  onClose: () => void;
  product: ProductItem;
  existingNames?: string[];
  registeredBarcodes?: Record<string, string>;
  requireSubtypes?: boolean;
  hasInventory?: boolean;
  simulatedScanner?: boolean;
  /** Return `false` to say the save FAILED: the error toast shows and the form stays open. */
  onSave: (edits: ProductGeneral) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function EditGeneralDialog({
  open,
  onClose,
  product,
  existingNames = [],
  registeredBarcodes = {},
  requireSubtypes = false,
  hasInventory = true,
  simulatedScanner = false,
  onSave,
  breakpoint = "auto",
}: EditGeneralDialogProps) {
  const mobile = !useIsDesktop(breakpoint);
  const subtype = subtypeRules(PRODUCT_SUBTYPES, requireSubtypes);

  const [name, setName] = useState(product.name);
  const [subtypeId, setSubtypeId] = useState<string | null>(product.subtypeId);
  const [manufacturer, setManufacturer] = useState(product.manufacturer);
  const [partNumber, setPartNumber] = useState(product.partNumber);
  const [barcode, setBarcode] = useState(product.barcode ?? "");
  const [trackInventory, setTrackInventory] = useState(product.trackInventory);
  const [scanning, setScanning] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Re-read the record every time the form opens — the panel may have changed
  // underneath it. A lone required subtype is the value.
  useEffect(() => {
    if (!open) return;
    setName(product.name);
    setSubtypeId(subtype.lone?.id ?? product.subtypeId);
    setManufacturer(product.manufacturer);
    setPartNumber(product.partNumber);
    setBarcode(product.barcode ?? "");
    setTrackInventory(product.trackInventory);
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product]);

  const nameProblems = nameIssues(name, existingNames, product.name);
  const missingSubtype = subtype.required && subtypeId == null;
  const manufacturerTooLong = overLimitError(manufacturer, MAX_TEXT);
  const partNumberTooLong = overLimitError(partNumber, MAX_TEXT);
  const barcodeTooLong = overLimitError(barcode, MAX_BARCODE);
  const barcodeOwner = barcode.trim() === "" ? undefined : registeredBarcodes[barcode.trim()];

  const blocked =
    nameProblems.missing ||
    nameProblems.tooLong != null ||
    nameProblems.duplicate ||
    missingSubtype ||
    manufacturerTooLong != null ||
    partNumberTooLong != null ||
    barcodeTooLong != null ||
    barcodeOwner != null;

  const dirty =
    name !== product.name ||
    subtypeId !== product.subtypeId ||
    manufacturer !== product.manufacturer ||
    partNumber !== product.partNumber ||
    barcode !== (product.barcode ?? "") ||
    trackInventory !== product.trackInventory;

  const save = async () => {
    if (blocked) {
      setShowErrors(true);
      return;
    }

    const edits: ProductGeneral = {
      name: name.trim(),
      subtypeId,
      manufacturer: manufacturer.trim(),
      partNumber: partNumber.trim(),
      barcode: barcode.trim() === "" ? undefined : barcode.trim(),
      trackInventory,
    };

    if ((await onSave(edits)) === false) {
      toast({
        type: "error",
        variant: "detailed",
        title: 'Couldn\'t update "General" module',
        caption: "Something went wrong. Please try again.",
      });
      return;
    }

    toast({ type: "success", title: '"General" module updated' });
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="General"
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
            <Button size="lg" variant="solid" onClick={save}>
              Save
            </Button>
          </PopoverFooter>
        }
      >
        <div className={styles.fields}>
          <NameField
            value={name}
            onChange={setName}
            existingNames={existingNames}
            ownName={product.name}
            itemLabel="Product"
            showErrors={showErrors}
          />

          <SubtypeField
            subtypes={PRODUCT_SUBTYPES}
            required={requireSubtypes}
            value={subtypeId}
            onChange={setSubtypeId}
            showErrors={showErrors}
            mobile={mobile}
          />

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

          {hasInventory && (
            <Input label="Stock type">
              <RadioGroup
                orientation="vertical"
                value={trackInventory ? "inventory" : "nonInventory"}
                onChange={(value) => setTrackInventory(value === "inventory")}
              >
                <RadioItem value="nonInventory" label="Non-inventory" caption="Stock isn't tracked" />
                <RadioItem
                  value="inventory"
                  label="Inventory"
                  caption="Stock is tracked at each location and updates with jobs and purchase orders"
                />
              </RadioGroup>
            </Input>
          )}
        </div>
      </Dialog>

      <ScanCodeDialog
        open={scanning}
        onClose={() => setScanning(false)}
        onRegister={(code) => {
          setBarcode(stripControlCharacters(code));
          setScanning(false);
        }}
        registered={registeredBarcodes}
        simulated={simulatedScanner}
        breakpoint={breakpoint}
      />
    </>
  );
}
