import { MouseEvent, useEffect, useState } from "react";

import Button from "../../../../components/Button/Button";
import Dialog from "../../../../components/Dialog/Dialog";
import InputGroup from "../../../../components/Fields/InputGroup/InputGroup";
import SelectField from "../../../../components/Fields/SelectField/SelectField";
import TextField from "../../../../components/Fields/TextField/TextField";
import Input from "../../../../components/Input/Input";
import PopoverFooter from "../../../../components/Popover/PopoverFooter";
import SelectListItem from "../../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../../components/SelectList/SelectListItemGroup";
import { toast } from "../../../../components/Toast/Toaster";
import { ProductItem } from "../../../../data/db";
import { DimensionUnit, WeightUnit } from "../../../../data/db/types";
import useIsDesktop from "../../../../hooks/useIsDesktop";
import { SelectPopoverList, useSelectPopover } from "../../../shared/selectPopover";
import {
  decimalText,
  DIMENSION_UNITS,
  dimensionsHelpText,
  isBlank,
  isImageUrl,
  isMeasureText,
  MAX_IMAGE_URL,
  missingDimensionsError,
  NO_SUGGESTIONS,
  numberOf,
  overLimitError,
  WEIGHT_UNITS,
} from "../../NewProductForm/productRules";
import { ProductDetails } from "../ProductPanel.types";

import styles from "../ProductPanel.module.scss";

// The product's "Details" edit form (Figma "Edit" 3225-65002: Desktop
// 3225-65003, Mobile 3225-65005) — a default Dialog titled "Details",
// pre-filled. Three optional fields, the same rules the archived "Create"
// form had (field docs 3225-64198 / 3225-64228 / 3225-64203):
//
//   Image URL    "https://" before the value; 200 characters, counted while
//                typing; "Invalid URL" judged when the field loses the focus;
//                the url keyboard; autocorrect and capitalisation off.
//   Dimensions   Length · Width · Height + the unit ("in" by default, the
//                tag shown). All three or none: a partial row says what is
//                missing ("Enter Width and Height") — judged on Save. The
//                help text rewrites itself from the values.
//   Weight       the value + the unit ("oz" by default).
//
// Each measurement: digits and a dot, 4 decimals, 6 digits, no minus, the
// decimal keyboard. A unit is saved only with its values (production pairs
// them). Save "validates the fields, applies the changes, closes the Dialog,
// triggers the Toast" ('"Details" module updated').

const SCHEME = /^https?:\/\//i;

interface Draft {
  imageUrl: string;
  length: string;
  width: string;
  height: string;
  dimensionUnit: DimensionUnit;
  weight: string;
  weightUnit: WeightUnit;
}

const text = (value: number | undefined) => (value == null ? "" : String(value));

const draftOf = (product: ProductItem): Draft => ({
  // The field shows "https://" itself, so the stored scheme is not repeated.
  imageUrl: (product.imageUrl ?? "").replace(/^https:\/\//i, ""),
  length: text(product.length),
  width: text(product.width),
  height: text(product.height),
  dimensionUnit: product.dimensionUnit ?? "in",
  weight: text(product.weight),
  weightUnit: product.weightUnit ?? "oz",
});

interface EditDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  product: ProductItem;
  /** Return `false` to say the save FAILED: the error toast shows and the form stays open. */
  onSave: (edits: ProductDetails) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function EditDetailsDialog({ open, onClose, product, onSave, breakpoint = "auto" }: EditDetailsDialogProps) {
  const mobile = !useIsDesktop(breakpoint);
  const [initial, setInitial] = useState<Draft>(() => draftOf(product));
  const [draft, setDraft] = useState<Draft>(initial);
  const [urlChecked, setUrlChecked] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const dimensionUnitPop = useSelectPopover(mobile, "belowEnd");
  const weightUnitPop = useSelectPopover(mobile, "belowEnd");

  // Re-read the product every time the form opens.
  useEffect(() => {
    if (!open) return;
    const next = draftOf(product);
    setInitial(next);
    setDraft(next);
    setUrlChecked(false);
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product]);

  const set = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));
  const measureChange = (key: "length" | "width" | "height" | "weight") => (event: { target: { value: string } }) => {
    const next = decimalText(event.target.value);
    if (isMeasureText(next)) set({ [key]: next });
  };

  const urlTooLong = overLimitError(draft.imageUrl, MAX_IMAGE_URL);
  const urlInvalid = !isImageUrl(draft.imageUrl);
  const dimensionsError = missingDimensionsError(draft.length, draft.width, draft.height);
  const anyDimension = [draft.length, draft.width, draft.height].some((value) => !isBlank(value));
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((key) => draft[key] !== initial[key]);

  const save = async () => {
    if (urlTooLong != null || urlInvalid || dimensionsError != null) {
      setUrlChecked(urlInvalid);
      setShowErrors(true);
      return;
    }
    const url = draft.imageUrl.trim();
    const edits: ProductDetails = {
      imageUrl: url === "" ? undefined : SCHEME.test(url) ? url : `https://${url}`,
      length: anyDimension ? numberOf(draft.length) : undefined,
      width: anyDimension ? numberOf(draft.width) : undefined,
      height: anyDimension ? numberOf(draft.height) : undefined,
      dimensionUnit: anyDimension ? draft.dimensionUnit : undefined,
      weight: isBlank(draft.weight) ? undefined : numberOf(draft.weight),
      weightUnit: isBlank(draft.weight) ? undefined : draft.weightUnit,
    };
    if ((await onSave(edits)) === false) {
      toast({
        type: "error",
        variant: "detailed",
        title: 'Couldn\'t update "Details" module',
        caption: "Something went wrong. Please try again.",
      });
      return;
    }
    toast({ type: "success", title: '"Details" module updated' });
    onClose();
  };

  const unitList = <T extends string>(
    pop: ReturnType<typeof useSelectPopover>,
    title: string,
    units: { value: T; name: string; tag: string }[],
    value: T,
    onPick: (value: T) => void,
  ) => (
    <SelectPopoverList pop={pop} mobile={mobile} title={title}>
      <SelectListItemGroup>
        {units.map((unit) => (
          <SelectListItem
            key={unit.value}
            label={unit.name}
            tag={unit.tag}
            selected={unit.value === value}
            onClick={() => {
              onPick(unit.value);
              pop.close();
            }}
          />
        ))}
      </SelectListItemGroup>
    </SelectPopoverList>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="Details"
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
          <Input label="Image URL" labelCondition="optional">
            <TextField
              value={draft.imageUrl}
              onChange={(event) => set({ imageUrl: event.target.value })}
              // "Validates when the field loses the focus."
              onBlur={() => setUrlChecked(!isImageUrl(draft.imageUrl))}
              keyboard="url"
              {...NO_SUGGESTIONS}
              prefix="https://"
              isValid={urlTooLong == null && !urlChecked}
              errorMessage={urlTooLong ?? "Invalid URL"}
            />
          </Input>

          <Input
            label="Dimensions"
            labelCondition="optional"
            helpText={dimensionsHelpText(draft.length, draft.width, draft.height, draft.dimensionUnit)}
          >
            <InputGroup isValid={!(showErrors && dimensionsError != null)} errorMessage={dimensionsError}>
              <TextField value={draft.length} onChange={measureChange("length")} keyboard="decimal" placeholder="Length" />
              <TextField value={draft.width} onChange={measureChange("width")} keyboard="decimal" placeholder="Width" />
              <TextField value={draft.height} onChange={measureChange("height")} keyboard="decimal" placeholder="Height" />
              <SelectField
                value={DIMENSION_UNITS.find((unit) => unit.value === draft.dimensionUnit)?.tag}
                fitContent
                open={dimensionUnitPop.open}
                onClick={(event: MouseEvent<HTMLDivElement>) => dimensionUnitPop.toggle(event.currentTarget)}
              />
            </InputGroup>
          </Input>

          <Input label="Weight" labelCondition="optional">
            <InputGroup>
              <TextField value={draft.weight} onChange={measureChange("weight")} keyboard="decimal" />
              <SelectField
                value={WEIGHT_UNITS.find((unit) => unit.value === draft.weightUnit)?.tag}
                fitContent
                open={weightUnitPop.open}
                onClick={(event: MouseEvent<HTMLDivElement>) => weightUnitPop.toggle(event.currentTarget)}
              />
            </InputGroup>
          </Input>
        </div>
      </Dialog>

      {unitList(dimensionUnitPop, "Dimensions unit", DIMENSION_UNITS, draft.dimensionUnit, (dimensionUnit) => set({ dimensionUnit }))}
      {unitList(weightUnitPop, "Weight unit", WEIGHT_UNITS, draft.weightUnit, (weightUnit) => set({ weightUnit }))}
    </>
  );
}
