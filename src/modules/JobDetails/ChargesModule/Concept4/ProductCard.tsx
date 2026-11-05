import AvatarProduct from "../../../../components/Avatar/AvatarProduct";
import { Icon } from "../../../../components/Icon/Icon";
import { formatCurrency } from "../../../../app/listData";
import { INVENTORY_LOCATIONS, PRODUCT_SUBTYPES } from "../../../../data/db";
import type { ProductLine } from "../../../../data/db";
import { LOCATION_TYPE_ICON, locationTitle } from "../../../Product/NewProductForm/InventoryLevelsField";
import { productAmount } from "../lineDisplay";

import LineCard, { Detail, LineCardProps } from "./LineCard";

// CONCEPT 4's product card (Figma 28284-40937).
//
//   Header   "Price × Quantity" under the Amount.
//   Row 1    Unit cost · Price · Quantity.
//   Row 2    starts with Inventory location — only on a product tracked in inventory,
//            which always has one, so it needs no placeholder.

interface ProductCardProps extends LineCardProps {
  line: ProductLine;
  /** The product's photo. None: the type's icon. */
  photo?: string;
}

export default function ProductCard({ line, photo, ...card }: ProductCardProps) {
  const location = line.inventoryLocationId != null ? INVENTORY_LOCATIONS.find((row) => row.id === line.inventoryLocationId) : undefined;

  return (
    <LineCard
      {...card}
      avatar={photo != null ? <AvatarProduct size="xl" content="image" imageSrc={photo} /> : <AvatarProduct size="xl" />}
      subtypes={PRODUCT_SUBTYPES}
      subtypeId={line.subtypeId}
      amount={formatCurrency(productAmount(line))}
      amountCaption={`${formatCurrency(line.price)} × ${line.quantity}`}
      numbers={
        <>
          {!card.isPublic && <Detail label="Unit cost" value={formatCurrency(line.cost)} />}
          <Detail label="Price" value={formatCurrency(line.price)} />
          <Detail label="Quantity" value={String(line.quantity)} />
        </>
      }
      // A truck's plate + name is wider than a column, and a cut location is no use: it wraps.
      lead={
        location != null ? (
          <Detail label="Inventory location" value={locationTitle(location)} slotLeft={<Icon icon={LOCATION_TYPE_ICON[location.type]} size={14} />} lines="wrap" />
        ) : undefined
      }
      equipmentId={line.equipmentId}
      technicianId={line.technicianId}
      description={line.description}
    />
  );
}
