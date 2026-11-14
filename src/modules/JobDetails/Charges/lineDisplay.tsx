import AvatarUser from "../../../components/Avatar/AvatarUser";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import { formatDay } from "../../../app/listData";
import { equipmentById } from "../../../data/db";
import type { DiscountLine, Job, LaborLine, OtherLine, ProductLine } from "../../../data/db";
import { users } from "../../../data/users";
import { joinWithSeparator } from "../../../utils/textSeparator";

// How a charge line's values READ in the Job Details Charges segment (Figma
// 29380-42876, 2026-11-13). Copied from ../ChargesModule/lineDisplay.tsx when
// the concepts were frozen — the two copies are separate on purpose.

export const subtypeName = (list: { id: string; name: string }[], id: string | null | undefined) =>
  id == null ? undefined : list.find((row) => row.id === id)?.name;

/** Money keeps up to 3 decimals — the most a line's price can carry. */
export const round3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Every amount in the Charges segment (Daniel, 2026-11-13): min 2, max 3
 * decimals — the third only when it is not 0. "$150.00", "$12.345". A
 * negative amount gets the true minus sign (U+2212), like `formatCurrency`.
 */
export const formatAmount = (dollars: number): string =>
  round3(dollars)
    .toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 3 })
    .replace(/^-/, "−");

const sameDay = (a: string, b: string) => a.slice(0, 10) === b.slice(0, 10);

/** What a labour line bills: Price × Hours (hourly) or the Price. */
export const laborAmount = (labor: LaborLine) => (labor.type === "hourly" ? round3(labor.price * (labor.hours ?? 0)) : labor.price);

/**
 * "Jan 1, 2027" for one day; a range carries the year on BOTH dates,
 * "Jan 1, 2027 -> Jan 2, 2027" (Figma 29380-43083, Daniel 2026-11-13).
 */
export function serviceDates(labor: LaborLine): { plural: boolean; text?: string } {
  const { serviceStart: start, serviceEnd: end } = labor;
  if (start == null) return { plural: false };
  if (end == null || sameDay(start, end)) return { plural: false, text: formatDay(start) };
  return { plural: true, text: `${formatDay(start)} -> ${formatDay(end)}` };
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

/** What a product line bills: Price × Quantity. */
export const productAmount = (product: ProductLine) => round3(product.price * product.quantity);

/** What an other-charge line bills: Price × Quantity. */
export const otherAmount = (other: OtherLine) => round3(other.price * other.quantity);

/**
 * A positive discount as the negative number it reads as. Zero stays a plain 0
 * (not −0) so it reads "$0.00": zero has no sign (Daniel, 2026-11-03).
 */
export const negative = (n: number) => (n === 0 ? 0 : -n);

/**
 * What a line COST the company — the Profitability module (Figma 21823-86710,
 * Daniel 2026-11-14): Cost × Hours (hourly) or the Cost (flat) for labour,
 * Cost × Quantity for products and other charges. Discounts have no cost.
 */
export const laborCost = (labor: LaborLine) => (labor.type === "hourly" ? round3(labor.cost * (labor.hours ?? 0)) : labor.cost);
export const productCost = (product: ProductLine) => round3(product.cost * product.quantity);
export const otherCost = (other: OtherLine) => round3(other.cost * other.quantity);

/** What a discount line takes off: Discount × Quantity — negative. */
export const discountAmount = (discount: DiscountLine) => negative(round3(discount.discount * discount.quantity));
