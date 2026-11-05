import AvatarOther from "../../../../components/Avatar/AvatarOther";
import { formatCurrency } from "../../../../app/listData";
import { OTHER_SUBTYPES } from "../../../../data/db";
import type { OtherLine } from "../../../../data/db";
import { otherAmount } from "../lineDisplay";

import LineCard, { Detail, LineCardProps } from "./LineCard";

// CONCEPT 4's other charge card (Figma 28284-40940).
//
//   Header   "Price × Quantity" under the Amount.
//   Row 1    Unit cost · Price · Quantity.
//   Row 2    Equipment and Technician only, when they are set.

export default function OtherCard({ line, ...card }: LineCardProps & { line: OtherLine }) {
  return (
    <LineCard
      {...card}
      avatar={<AvatarOther size="xl" />}
      subtypes={OTHER_SUBTYPES}
      subtypeId={line.subtypeId}
      amount={formatCurrency(otherAmount(line))}
      amountCaption={`${formatCurrency(line.price)} × ${line.quantity}`}
      numbers={
        <>
          {!card.isPublic && <Detail label="Unit cost" value={formatCurrency(line.cost)} />}
          <Detail label="Price" value={formatCurrency(line.price)} />
          <Detail label="Quantity" value={String(line.quantity)} />
        </>
      }
      equipmentId={line.equipmentId}
      technicianId={line.technicianId}
      description={line.description}
    />
  );
}
