import { MouseEvent, useEffect, useRef, useState } from "react";

import Avatar from "../../../../components/Avatar/Avatar";
import SelectField from "../../../../components/Fields/SelectField/SelectField";
import { Icon } from "../../../../components/Icon/Icon";
import Input from "../../../../components/Input/Input";
import SelectListItem from "../../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../../components/SelectList/SelectListItemGroup";
import { activeInventoryLocations, COMPANY, onHandAt, PRODUCT_SUBTYPES } from "../../../../data/db";
import type { ProductItem, ProductLine } from "../../../../data/db";
import { LOCATION_TYPE_ICON, locationTitle } from "../../../Product/NewProductForm/InventoryLevelsField";
import { isBlank, numberOf, quantity } from "../../../Product/NewProductForm/productRules";
import { SubtypeField } from "../../../shared/pricebookFields";
import { SelectPopoverList, useSelectPopover } from "../../../shared/selectPopover";

import { costMismatchHelp, MoneyInput, moneyText, numberText, NumberInput } from "./lineFormParts";

// A product line's INPUTS, built once. The one-dialog form (./ProductLineForm)
// and the side panel's per-module dialogs (../LinePanels/ProductLinePanel) group
// them differently — the inputs and their rules are the same everywhere.
//
//   Inventory location  only for a product marked "Inventory". Required with 2
//                       or more locations; with one, the system picks it and
//                       the field is read-only ("The only location
//                       available"). No other default. Its list: active
//                       locations only, A → Z, with a search — an inline card
//                       on desktop, a drawer titled "Inventory locations".
//   Cost / Price        the "New labor rate" form's money fields; both
//                       required. The Cost help text and "Less than cost" as on
//                       the labor rate form — the "Click here" link has no
//                       product side panel to open yet.
//   Quantity            required, more than 0; empty by default. On a tracked
//                       product it warns, when the field loses the focus, if the
//                       location's "on hand" would drop below zero — "Only X
//                       left in [location]. Adding Y will take the stock below
//                       zero." On an existing line only the ADDED amount counts:
//                       the saved quantity has already left the stock.

export interface ProductValues {
  subtypeId: string | null;
  locationId?: string;
  cost: string;
  price: string;
  quantity: string;
  description: string;
  equipmentId?: string;
  technicianId?: number;
}

/** The one location a tracked product can only come from, when there is just one. */
const loneLocation = (product: ProductItem) => {
  const locations = activeInventoryLocations();
  return product.trackInventory && locations.length === 1 ? locations[0] : undefined;
};

/** What the inputs open with — the line's values, or the product as a template. */
export const productValuesOf = (product: ProductItem, line: ProductLine | null | undefined): ProductValues =>
  line != null
    ? {
        subtypeId: line.subtypeId,
        locationId: line.inventoryLocationId,
        cost: moneyText(line.cost),
        price: moneyText(line.price),
        quantity: numberText(line.quantity),
        description: line.description,
        equipmentId: line.equipmentId,
        technicianId: line.technicianId,
      }
    : {
        subtypeId: product.subtypeId ?? null,
        // "Default: none. The one exception is the single location the system picks."
        locationId: loneLocation(product)?.id,
        cost: moneyText(product.cost),
        price: moneyText(product.price),
        quantity: "",
        description: product.summary,
      };

/** The line the inputs describe. */
export const productLineOf = (product: ProductItem, values: ProductValues): ProductLine => ({
  manufacturer: product.manufacturer,
  partNumber: product.partNumber,
  subtypeId: values.subtypeId,
  inventoryLocationId: product.trackInventory ? values.locationId : undefined,
  cost: numberOf(values.cost),
  price: numberOf(values.price),
  quantity: numberOf(values.quantity),
  equipmentId: values.equipmentId,
  technicianId: values.technicianId,
  description: values.description.trim(),
});

/** What blocks each group of inputs from saving. */
export function productProblems(product: ProductItem, values: ProductValues) {
  const missingLocation = product.trackInventory && values.locationId == null;
  const missingCost = isBlank(values.cost);
  const missingPrice = isBlank(values.price);
  const missingQuantity = isBlank(values.quantity);
  const zeroQuantity = !missingQuantity && numberOf(values.quantity) <= 0;
  return {
    missingLocation,
    missingCost,
    missingPrice,
    missingQuantity,
    zeroQuantity,
    general: missingLocation,
    pricing: missingCost || missingPrice || missingQuantity || zeroQuantity,
  };
}

interface FieldsProps {
  product: ProductItem;
  values: ProductValues;
  set: (patch: Partial<ProductValues>) => void;
  /** The submit button was pressed — the missing-value errors show. */
  showErrors: boolean;
}

/** Subtype + Inventory location. */
export function ProductGeneralFields({
  product,
  values,
  set,
  showErrors,
  mobile,
  hasSubtypes = true,
}: FieldsProps & {
  mobile: boolean;
  /** False: the company does not use subtypes, so the field is not drawn. */
  hasSubtypes?: boolean;
}) {
  const locationPop = useSelectPopover(mobile);
  const locations = activeInventoryLocations();
  const lone = loneLocation(product);
  const location = locations.find((row) => row.id === values.locationId);
  const locationIcon = (type: keyof typeof LOCATION_TYPE_ICON) => <Icon icon={LOCATION_TYPE_ICON[type]} />;

  return (
    <>
      <SubtypeField
        subtypes={hasSubtypes ? PRODUCT_SUBTYPES : []}
        required={COMPANY.requireSubtypes}
        value={values.subtypeId}
        onChange={(subtypeId) => set({ subtypeId })}
        showErrors={showErrors}
        mobile={mobile}
      />

      {product.trackInventory &&
        (lone != null ? (
          // "Read-only when there is only one option on the list."
          <Input label="Inventory location" helpText="The only location available">
            <SelectField value={locationTitle(lone)} slotLeft={locationIcon(lone.type)} readOnly />
          </Input>
        ) : (
          <>
            <Input label="Inventory location">
              <SelectField
                value={location != null ? locationTitle(location) : undefined}
                slotLeft={location != null ? locationIcon(location.type) : undefined}
                open={locationPop.open}
                onClick={(event: MouseEvent<HTMLDivElement>) => locationPop.toggle(event.currentTarget)}
                isValid={!(showErrors && productProblems(product, values).missingLocation)}
              />
            </Input>
            <SelectPopoverList
              pop={locationPop}
              mobile={mobile}
              title="Inventory locations"
              searchable
              searchPlaceholder="Inventory location..."
              noResultsCaption="No locations match"
              state={locations.length === 0 ? "empty" : "default"}
              emptyState={{ caption: "No locations" }}
            >
              <SelectListItemGroup>
                {locations.map((row) => (
                  <SelectListItem
                    key={row.id}
                    variant="object"
                    label={locationTitle(row)}
                    caption={row.address}
                    searchText={`${row.plateNumber ?? ""} ${row.name}`}
                    avatar={<Avatar size="xl" shape="square" content="icon" icon={LOCATION_TYPE_ICON[row.type]} iconPack="solid" />}
                    selected={row.id === values.locationId}
                    onClick={() => {
                      set({ locationId: row.id });
                      locationPop.close();
                    }}
                  />
                ))}
              </SelectListItemGroup>
            </SelectPopoverList>
          </>
        ))}
    </>
  );
}

interface PricingFieldsProps extends FieldsProps {
  /** The line being edited — its saved quantity has already left the stock. */
  line?: ProductLine | null;
  /** The user typed in Cost since the inputs opened. */
  costChanged: boolean;
  onCostChanged: () => void;
}

/** Cost + Price + Quantity, with the stock warning. */
export function ProductPricingFields({ product, line, values, set, showErrors, costChanged, onCostChanged }: PricingFieldsProps) {
  const problems = productProblems(product, values);
  const costMismatch = costChanged && !problems.missingCost && numberOf(values.cost) !== product.cost;
  const belowCost = !problems.missingCost && !problems.missingPrice && numberOf(values.price) < numberOf(values.cost);

  // The stock check — run when Quantity loses the focus, and again when the
  // location changes under a typed quantity.
  const [stockWarning, setStockWarning] = useState<string | undefined>(undefined);
  const checkStock = () => {
    const typed = numberOf(values.quantity);
    const at = activeInventoryLocations().find((row) => row.id === values.locationId);
    if (!product.trackInventory || at == null || isBlank(values.quantity) || typed <= 0) return setStockWarning(undefined);
    const adding = line != null && line.inventoryLocationId === at.id ? typed - line.quantity : typed;
    const onHand = onHandAt(product.id, at.id);
    setStockWarning(
      adding > 0 && onHand - adding < 0
        ? `Only ${quantity(onHand)} left in ${locationTitle(at)}. Adding ${quantity(adding)} will take the stock below zero.`
        : undefined,
    );
  };
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    checkStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.locationId]);

  return (
    <>
      <MoneyInput
        label="Cost"
        value={values.cost}
        onChange={(cost) => {
          if (cost !== values.cost) onCostChanged();
          set({ cost });
        }}
        isValid={!(showErrors && problems.missingCost)}
        helpText={costMismatch ? costMismatchHelp() : undefined}
        helpTextStatus="info"
      />

      <MoneyInput
        label="Price"
        value={values.price}
        onChange={(price) => set({ price })}
        isValid={!(showErrors && problems.missingPrice)}
        helpText={belowCost ? "Less than cost" : undefined}
        helpTextStatus="warning"
      />

      <NumberInput
        label="Quantity"
        value={values.quantity}
        onChange={(next) => set({ quantity: next })}
        onBlur={checkStock}
        isValid={!(showErrors && (problems.missingQuantity || problems.zeroQuantity))}
        errorMessage={problems.zeroQuantity ? "Must be greater than 0" : undefined}
        helpText={stockWarning}
        helpTextStatus="warning"
      />
    </>
  );
}
