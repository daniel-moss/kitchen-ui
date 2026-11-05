import AvatarDiscount from "../../../../components/Avatar/AvatarDiscount";
import { formatCurrency } from "../../../../app/listData";
import { DISCOUNT_SUBTYPES } from "../../../../data/db";
import type { DiscountLine } from "../../../../data/db";
import { discountAmount, negative } from "../lineDisplay";

import LineCard, { Detail, LineCardProps } from "./LineCard";

// CONCEPT 4's discount card (Figma 28284-40943). A discount has no cost, so its rows
// have two columns, not three.
//
//   Header   "Discount × Quantity" under the Amount, both with the minus sign. Zero
//            has no sign, and reads "$0.00".
//   Row 1    Discount · Quantity.
//   Row 2    Equipment and Technician only, when they are set.

export default function DiscountCard({ line, ...card }: LineCardProps & { line: DiscountLine }) {
  const perUnit = formatCurrency(negative(line.discount));

  return (
    <LineCard
      {...card}
      columns={2}
      avatar={<AvatarDiscount size="xl" />}
      subtypes={DISCOUNT_SUBTYPES}
      subtypeId={line.subtypeId}
      amount={formatCurrency(discountAmount(line))}
      amountCaption={`${perUnit} × ${line.quantity}`}
      numbers={
        <>
          <Detail label="Discount" value={perUnit} />
          <Detail label="Quantity" value={String(line.quantity)} />
        </>
      }
      equipmentId={line.equipmentId}
      technicianId={line.technicianId}
      description={line.description}
    />
  );
}
