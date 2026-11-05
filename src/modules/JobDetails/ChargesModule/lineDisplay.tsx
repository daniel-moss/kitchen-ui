import AvatarUser from "../../../components/Avatar/AvatarUser";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import { formatDay } from "../../../app/listData";
import { equipmentById } from "../../../data/db";
import type { DiscountLine, Job, LaborLine, OtherLine, ProductLine } from "../../../data/db";
import { users } from "../../../data/users";
import { joinWithSeparator } from "../../../utils/textSeparator";

// How a charge line's values READ — shared by the concepts' rows
// (./chargeLines) and the line side panel (./LinePanels), so both always show
// the same words and numbers.

export const subtypeName = (list: { id: string; name: string }[], id: string | null | undefined) =>
  id == null ? undefined : list.find((row) => row.id === id)?.name;

export const round2 = (n: number) => Math.round(n * 100) / 100;
const sameDay = (a: string, b: string) => a.slice(0, 10) === b.slice(0, 10);

/** What a labour line bills: Price × Hours (hourly, rounded to cents) or the Price. */
export const laborAmount = (labor: LaborLine) => (labor.type === "hourly" ? round2(labor.price * (labor.hours ?? 0)) : labor.price);

/**
 * "Jan 1, 2027" for one day. A range carries the year on the end date only when
 * both days are in the same year, "Jan 1 -> Jan 2, 2027" (Daniel, 2026-11-05);
 * else on both, "Dec 31, 2026 -> Jan 1, 2027".
 */
export function serviceDates(labor: LaborLine): { plural: boolean; text?: string } {
  const { serviceStart: start, serviceEnd: end } = labor;
  if (start == null) return { plural: false };
  if (end == null || sameDay(start, end)) return { plural: false, text: formatDay(start) };
  const sameYear = new Date(start).getFullYear() === new Date(end).getFullYear();
  const from = sameYear ? formatDay(start).replace(/, \d+$/, "") : formatDay(start);
  return { plural: true, text: `${from} -> ${formatDay(end)}` };
}

/** "Walk-in Cooler · True Manufacturing" — the line's attributed equipment. */
const equipmentText = (id: string | undefined) => {
  const equipment = id != null ? equipmentById(id) : undefined;
  return equipment != null ? joinWithSeparator(equipment.displayName, equipment.manufacturer) : undefined;
};

/** The Equipment + Technician rows — each only when the job has any to attribute. */
export function AttributionRows({ job, equipmentId, technicianId }: { job: Job; equipmentId?: string; technicianId?: number }) {
  const tech = technicianId != null ? users.find((user) => user.id === technicianId) : undefined;
  return (
    <>
      {(job.equipmentIds?.length ?? 0) > 0 && <ValueDisplay label="Equipment" value={equipmentText(equipmentId)} />}
      {(job.assigneeIds?.length ?? 0) > 0 && (
        <ValueDisplay label="Technician" value={tech?.name} slotLeft={tech != null ? <AvatarUser size="xs" imageSrc={tech.avatar} /> : undefined} />
      )}
    </>
  );
}

/** What a product line bills: Price × Quantity, rounded to cents. */
export const productAmount = (product: ProductLine) => round2(product.price * product.quantity);

/** What an other-charge line bills: Price × Quantity, rounded to cents. */
export const otherAmount = (other: OtherLine) => round2(other.price * other.quantity);

/**
 * A positive discount as the negative number it reads as. Zero stays a plain 0
 * (not −0) so it reads "$0.00": zero has no sign (Daniel, 2026-11-03).
 */
export const negative = (n: number) => (n === 0 ? 0 : -n);

/** What a discount line takes off: Discount × Quantity, rounded to cents — negative. */
export const discountAmount = (discount: DiscountLine) => negative(round2(discount.discount * discount.quantity));
