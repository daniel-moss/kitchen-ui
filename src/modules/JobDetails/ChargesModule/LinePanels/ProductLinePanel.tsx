import { useState } from "react";

import AvatarProduct from "../../../../components/Avatar/AvatarProduct";
import { Icon } from "../../../../components/Icon/Icon";
import ValueDisplay from "../../../../components/ValueDisplay/ValueDisplay";
import { formatCurrency } from "../../../../app/listData";
import { INVENTORY_LOCATIONS, PRODUCT_SUBTYPES } from "../../../../data/db";
import type { Job, ProductItem, ProductLine } from "../../../../data/db";
import { Breakpoint } from "../../../../hooks/useIsDesktop";
import { joinWithSeparator } from "../../../../utils/textSeparator";
import { LOCATION_TYPE_ICON, locationTitle } from "../../../Product/NewProductForm/InventoryLevelsField";
import { ProductGeneralFields, productLineOf, ProductPricingFields, productProblems, ProductValues, productValuesOf } from "../LineForms/productFields";
import { productAmount, subtypeName } from "../lineDisplay";

import LinePanel, { LineSectionDialog } from "./LinePanel";

// The PRODUCT line's side panel (Figma 28009-18064). The header carries
// "Manufacturer · Part #" as its caption.
//   General  Subtype, Inventory (only a product marked "Inventory" has one).
//   Pricing  Cost, Price, Quantity, Amount — a plain row, like the labor rate's.

export interface ProductLinePanelProps {
  open: boolean;
  onClose: () => void;
  job: Job;
  /** The pricebook product the line came from. */
  product: ProductItem;
  /** The line's name. */
  title: string;
  line: ProductLine;
  /** A module's dialog saved. */
  onChange: (line: ProductLine) => void;
  /** "Delete" was confirmed. */
  onDelete: () => void;
  breakpoint?: Breakpoint;
}

export default function ProductLinePanel({ open, onClose, job, product, title, line, onChange, onDelete, breakpoint }: ProductLinePanelProps) {
  const [editingGeneral, setEditingGeneral] = useState(false);
  const [editingPricing, setEditingPricing] = useState(false);
  const location = INVENTORY_LOCATIONS.find((row) => row.id === line.inventoryLocationId);

  const dialogProps = {
    start: () => productValuesOf(product, line),
    onSave: (values: ProductValues) => onChange(productLineOf(product, values)),
    breakpoint,
  };

  return (
    <LinePanel
      open={open}
      onClose={onClose}
      job={job}
      title={title}
      caption={joinWithSeparator(line.manufacturer || "No Manufacturer", line.partNumber || "No Part #")}
      // The product's photo when it has one, like the Products list, else the icon.
      avatar={product.imageUrl ? <AvatarProduct size="xl" content="image" imageSrc={product.imageUrl} /> : <AvatarProduct size="xl" />}
      noun="product"
      general={
        <>
          <ValueDisplay label="Subtype" value={subtypeName(PRODUCT_SUBTYPES, line.subtypeId)} />
          {location != null && (
            <ValueDisplay label="Inventory" value={locationTitle(location)} slotLeft={<Icon icon={LOCATION_TYPE_ICON[location.type]} size={14} />} />
          )}
        </>
      }
      onEditGeneral={() => setEditingGeneral(true)}
      pricing={
        <>
          <ValueDisplay label="Cost" value={formatCurrency(line.cost)} />
          <ValueDisplay label="Price" value={formatCurrency(line.price)} />
          <ValueDisplay label="Quantity" value={String(line.quantity)} />
          <ValueDisplay label="Amount" value={formatCurrency(productAmount(line))} />
        </>
      }
      onEditPricing={() => setEditingPricing(true)}
      equipmentId={line.equipmentId}
      technicianId={line.technicianId}
      onAttributionChange={(attribution) => onChange({ ...line, ...attribution })}
      description={line.description}
      onDescriptionChange={(description) => onChange({ ...line, description })}
      onDelete={onDelete}
      breakpoint={breakpoint}
    >
      <LineSectionDialog<ProductValues>
        {...dialogProps}
        open={editingGeneral}
        onClose={() => setEditingGeneral(false)}
        title="General"
        isBlocked={(values) => productProblems(product, values).general}
      >
        {({ values, set, showErrors, mobile }) => <ProductGeneralFields product={product} values={values} set={set} showErrors={showErrors} mobile={mobile} />}
      </LineSectionDialog>
      <LineSectionDialog<ProductValues>
        {...dialogProps}
        open={editingPricing}
        onClose={() => setEditingPricing(false)}
        title="Pricing"
        isBlocked={(values) => productProblems(product, values).pricing}
      >
        {({ values, set, showErrors, costChanged, onCostChanged }) => (
          <ProductPricingFields
            product={product}
            line={line}
            values={values}
            set={set}
            showErrors={showErrors}
            costChanged={costChanged}
            onCostChanged={onCostChanged}
          />
        )}
      </LineSectionDialog>
    </LinePanel>
  );
}
