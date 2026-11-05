import AvatarLaborRate from "../../../../components/Avatar/AvatarLaborRate";
import { formatCurrency } from "../../../../app/listData";
import { LABOR_SUBTYPES } from "../../../../data/db";
import type { LaborLine } from "../../../../data/db";
import { laborAmount, serviceDates } from "../lineDisplay";

import LineCard, { Detail, LineCardProps } from "./LineCard";

// CONCEPT 4's labor rate card (Figma 28284-40933 hourly, 28284-40934 flat).
//
//   Header   hourly: "Price × Hours" under the Amount. Flat: the Amount alone.
//   Row 1    Hourly cost · Price · Hours. A flat line: Cost · Price, and its third
//            column stays empty.
//   Row 2    starts with Service date(s).

export default function LaborCard({ line, ...card }: LineCardProps & { line: LaborLine }) {
  const hourly = line.type === "hourly";
  const perHour = (n: number) => (hourly ? `${formatCurrency(n)}/hr` : formatCurrency(n));
  const dates = serviceDates(line).text;

  return (
    <LineCard
      {...card}
      avatar={<AvatarLaborRate size="xl" />}
      subtypes={LABOR_SUBTYPES}
      subtypeId={line.subtypeId}
      amount={formatCurrency(laborAmount(line))}
      amountCaption={hourly ? `${perHour(line.price)} × ${line.hours}` : undefined}
      numbers={
        <>
          {!card.isPublic && <Detail label={hourly ? "Hourly cost" : "Cost"} value={perHour(line.cost)} />}
          <Detail label="Price" value={perHour(line.price)} />
          {hourly && <Detail label="Hours" value={`${line.hours} hr`} />}
        </>
      }
      // A range across two years is wider than a column, and a cut date is no use: it wraps.
      lead={dates != null ? <Detail label="Service date(s)" value={dates} lines="wrap" /> : undefined}
      equipmentId={line.equipmentId}
      technicianId={line.technicianId}
      description={line.description}
    />
  );
}
