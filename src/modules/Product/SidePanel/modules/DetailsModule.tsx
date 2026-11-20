import DisplayModule from "../../../../components/DisplayModule/DisplayModule";
import IconButton from "../../../../components/IconButton/IconButton";
import HoverTooltip from "../../../../components/Tooltip/HoverTooltip";
import ValueDisplay from "../../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../../components/ValueDisplay/ValueDisplayGroup";
import { ProductItem } from "../../../../data/db";
import { copyText } from "../../../shared/helpers";
import { DIMENSION_UNITS, WEIGHT_UNITS } from "../../NewProductForm/productRules";

// The Product panel's "Details" module (Figma 3225-64197, Overview
// 3225-64940), between Pricing and Labels. Five label–value pairs:
//
//   Image URL   a LINK on one line with an ellipsis, no tooltip (Daniel,
//               2026-11-20) — it opens the picture in a new tab — and a Copy
//               button while it is set ('"Image URL" copied' / 'Couldn't copy
//               "Image URL"'). "No Image URL".
//   Length      "10.5 in" — the value and the unit TAG the form shows
//   Width       ("ton", not production's "st"). "No Length" / "No Width" /
//   Height      "No Height".
//   Weight      "31.5 lb". "No Weight".
//
// The empty values are ValueDisplay's own "No [Label]" placeholder.

/** "10.5 in", or undefined — the unit's tag, as the form's unit field shows it. */
const measure = (value: number | undefined, tag: string | undefined) =>
  value == null || tag == null ? undefined : `${value} ${tag}`;

interface DetailsModuleProps {
  product: ProductItem;
  onEdit: () => void;
  /** Hidden while the product is inactive, or without the edit permission. */
  canEdit?: boolean;
  isLoading?: boolean;
}

export default function DetailsModule({ product, onEdit, canEdit = true, isLoading = false }: DetailsModuleProps) {
  const dimensionTag = DIMENSION_UNITS.find((unit) => unit.value === product.dimensionUnit)?.tag;
  const weightTag = WEIGHT_UNITS.find((unit) => unit.value === product.weightUnit)?.tag;
  const imageUrl = product.imageUrl || undefined;

  return (
    <DisplayModule
      title="Details"
      slotRight={
        isLoading || !canEdit ? undefined : (
          <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit details" onClick={onEdit} />
        )
      }
      content={
        <ValueDisplayGroup>
          <ValueDisplay
            label="Image URL"
            value={imageUrl}
            href={imageUrl}
            isTruncated
            isLoading={isLoading}
            // Copying is reading, so it stays without the edit permission.
            slotRight={
              isLoading || imageUrl == null ? undefined : (
                <HoverTooltip text="Copy">
                  <IconButton
                    icon="copy"
                    variant="muted"
                    size="lg"
                    aria-label="Copy image URL"
                    onClick={() => copyText(imageUrl, "Image URL", undefined, 'Couldn\'t copy "Image URL"')}
                  />
                </HoverTooltip>
              )
            }
          />
          <ValueDisplay label="Length" value={measure(product.length, dimensionTag)} isLoading={isLoading} />
          <ValueDisplay label="Width" value={measure(product.width, dimensionTag)} isLoading={isLoading} />
          <ValueDisplay label="Height" value={measure(product.height, dimensionTag)} isLoading={isLoading} />
          <ValueDisplay label="Weight" value={measure(product.weight, weightTag)} isLoading={isLoading} />
        </ValueDisplayGroup>
      }
    />
  );
}
