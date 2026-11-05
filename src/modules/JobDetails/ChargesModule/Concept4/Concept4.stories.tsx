import type { Meta, StoryObj } from "@storybook/react";

import Concept4 from "./Concept4";
import { LABOR_ITEMS } from "../../../../data/db";
import type { Charge } from "../../../../data/db";
import { conceptMeta, Frame, JOB, JOB_CHARGES, JOB_DISCOUNTS } from "../conceptStories";

// CONCEPT 4 — line items as Cards (Figma 28284-40930). The variants show what a card leaves out: a value that is not set is not
// drawn, and the rest close up.
const meta: Meta = {
  title: "Modules/Job/Details/Modules/Charges/Concept 4",
  ...conceptMeta,
};

export default meta;
type Story = StoryObj;

const laborLines = JOB_CHARGES.find((group) => group.key === "labor")?.items ?? [];
/** The diagnostic line: a subtype and a long description, no equipment or technician. */
const DIAGNOSTIC_LINE = laborLines[0];
/** The work line: no subtype picked. */
const WORK_LINE = laborLines[1];
/** Every value filled in. */
const FULL_LINE: Charge = { ...WORK_LINE, id: "full", labor: { ...WORK_LINE.labor!, subtypeId: DIAGNOSTIC_LINE.labor!.subtypeId } };
const FLAT_LINE: Charge = { ...FULL_LINE, id: "flat", labor: { ...FULL_LINE.labor!, type: "flat", price: 450, cost: 220, hours: undefined } };
const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_LINE: Charge = {
  ...FULL_LINE,
  id: "range",
  labor: { ...FULL_LINE.labor!, serviceEnd: new Date(new Date(FULL_LINE.labor!.serviceStart!).getTime() + DAY_MS).toISOString() },
};
const NO_DESCRIPTION_LINE: Charge = { ...FULL_LINE, id: "no-description", labor: { ...FULL_LINE.labor!, description: "" } };

const PRODUCT_LINES = (JOB_CHARGES.find((group) => group.key === "products")?.items ?? []).filter((charge) => charge.product != null);
/** A product tracked in inventory, so its form asks for a location too. */
const INVENTORY_PRODUCT = PRODUCT_LINES.find((charge) => charge.product!.inventoryLocationId != null)!;
/** A product not tracked in inventory. */
const PLAIN_PRODUCT = PRODUCT_LINES.find((charge) => charge.product!.inventoryLocationId == null)!;
const productWith = (base: Charge, id: string, patch: Partial<NonNullable<Charge["product"]>>): Charge => ({ ...base, id, product: { ...base.product!, ...patch } });

const OTHER_LINES = (JOB_CHARGES.find((group) => group.key === "other")?.items ?? []).filter((charge) => charge.other != null);
const DISCOUNT_LINES = JOB_DISCOUNTS.filter((charge) => charge.discount != null);
/** The same lines with every value filled in. */
const ATTRIBUTION = { equipmentId: WORK_LINE.labor!.equipmentId, technicianId: WORK_LINE.labor!.technicianId };
const FULL_OTHER: Charge = { ...OTHER_LINES[0], id: "full-other", other: { ...OTHER_LINES[0].other!, ...ATTRIBUTION } };
const FULL_DISCOUNT: Charge = { ...DISCOUNT_LINES[0], id: "full-discount", discount: { ...DISCOUNT_LINES[0].discount!, ...ATTRIBUTION } };
/** Every group, as the module shows them. */
const ALL_GROUPS = { labor: [FULL_LINE], products: [INVENTORY_PRODUCT], other: [FULL_OTHER], discounts: [FULL_DISCOUNT] };

/** A line billed from a pricebook rate, for the several-cards story. */
const lineFrom = (id: string, rateId: string, hours: number, attributed: boolean): Charge => {
  const rate = LABOR_ITEMS.find((row) => row.id === rateId)!;
  const hourly = rate.unitType === "hourly";
  return {
    ...WORK_LINE,
    id,
    title: rate.name,
    laborRateId: rate.id,
    labor: {
      ...WORK_LINE.labor!,
      type: hourly ? "hourly" : "flat",
      subtypeId: rate.subtypeId ?? null,
      cost: rate.cost,
      price: rate.rate,
      hours: hourly ? hours : undefined,
      equipmentId: attributed ? WORK_LINE.labor!.equipmentId : undefined,
      technicianId: attributed ? WORK_LINE.labor!.technicianId : undefined,
      description: rate.description,
    },
  };
};

/** Every value filled in. One card, so no grip. */
export const Desktop: Story = {
  render: () => (
    <Frame>
      <Concept4 job={JOB} {...ALL_GROUPS} />
    </Frame>
  ),
};

/** The same, at the mobile width. */
export const Mobile: Story = {
  render: () => (
    <Frame mobile>
      <Concept4 job={JOB} {...ALL_GROUPS} mobile />
    </Frame>
  ),
};

/** A flat rate: the Amount alone on the right, "Cost", and the third column empty. */
export const Flat: Story = {
  render: () => (
    <Frame>
      <Concept4 job={JOB} labor={[FLAT_LINE]} />
    </Frame>
  ),
};

/** Service date(s) as a range: start and end are different days. */
export const DateRange: Story = {
  name: "Date Range",
  render: () => (
    <Frame>
      <Concept4 job={JOB} labor={[RANGE_LINE]} />
    </Frame>
  ),
};

/** The company uses subtypes, but none is picked: the placeholder. */
export const NoSubtypeSelected: Story = {
  name: "No Subtype Selected",
  render: () => (
    <Frame>
      <Concept4 job={JOB} labor={[WORK_LINE]} />
    </Frame>
  ),
};

/** The company does not use subtypes: the name alone in the header. */
export const NoSubtypes: Story = {
  name: "No Subtypes",
  render: () => (
    <Frame>
      <Concept4 job={JOB} labor={[FULL_LINE]} hasSubtypes={false} />
    </Frame>
  ),
};

/** No selection: Equipment and Technician are not drawn. */
export const NoEquipmentOrTechnician: Story = {
  name: "No Equipment or Technician",
  render: () => (
    <Frame>
      <Concept4 job={JOB} labor={[DIAGNOSTIC_LINE]} />
    </Frame>
  ),
};

/** No description: the section goes, with its divider. */
export const NoDescription: Story = {
  name: "No Description",
  render: () => (
    <Frame>
      <Concept4 job={JOB} labor={[NO_DESCRIPTION_LINE]} />
    </Frame>
  ),
};

/** No lines yet: the plus is the way in. */
export const Empty: Story = {
  render: () => (
    <Frame>
      <Concept4 job={JOB} labor={[]} products={[]} other={[]} discounts={[]} />
    </Frame>
  ),
};

/** The customer's view: no Cost or Subtype, no plus, no grip, and nothing opens. */
export const PublicView: Story = {
  name: "Public View",
  render: () => (
    <Frame>
      <Concept4 job={JOB} labor={[FULL_LINE, FLAT_LINE]} products={PRODUCT_LINES} other={OTHER_LINES} discounts={DISCOUNT_LINES} isPublic />
    </Frame>
  ),
};

const SEVERAL_LINES = [
  DIAGNOSTIC_LINE,
  FULL_LINE,
  lineFrom("overtime", "overtime-labor", 2, true),
  lineFrom("travel", "travel-labor", 1.5, false),
  lineFrom("call-out", "emergency-call-out", 1, true),
];

/** Five lines together: the grips show, and the group's total adds them up. */
export const SeveralCards: Story = {
  name: "Several Cards",
  render: () => (
    <Frame>
      <Concept4 job={JOB} labor={SEVERAL_LINES} />
    </Frame>
  ),
};

/** The same five lines at the mobile width. */
export const SeveralCardsMobile: Story = {
  name: "Several Cards / Mobile",
  render: () => (
    <Frame mobile>
      <Concept4 job={JOB} labor={SEVERAL_LINES} mobile />
    </Frame>
  ),
};

/** Products: two cards, so the grips show. */
export const Products: Story = {
  render: () => (
    <Frame>
      <Concept4 job={JOB} products={PRODUCT_LINES} />
    </Frame>
  ),
};

/** The same at the mobile width. */
export const ProductsMobile: Story = {
  name: "Products / Mobile",
  render: () => (
    <Frame mobile>
      <Concept4 job={JOB} products={PRODUCT_LINES} mobile />
    </Frame>
  ),
};

/** Not tracked in inventory: no Inventory location, and the rest close up. */
export const ProductNotInventory: Story = {
  name: "Products / Not Inventory",
  render: () => (
    <Frame>
      <Concept4 job={JOB} products={[PLAIN_PRODUCT]} />
    </Frame>
  ),
};

/** The company uses subtypes, but none is picked: the placeholder. */
export const ProductNoSubtypeSelected: Story = {
  name: "Products / No Subtype Selected",
  render: () => (
    <Frame>
      <Concept4 job={JOB} products={[productWith(INVENTORY_PRODUCT, "no-subtype", { subtypeId: null })]} />
    </Frame>
  ),
};

/** No selection: Equipment and Technician are not drawn. */
export const ProductNoEquipmentOrTechnician: Story = {
  name: "Products / No Equipment or Technician",
  render: () => (
    <Frame>
      <Concept4 job={JOB} products={[productWith(INVENTORY_PRODUCT, "no-attribution", { equipmentId: undefined, technicianId: undefined })]} />
    </Frame>
  ),
};

/** Not inventory and no selection: the second row goes. */
export const ProductNumbersOnly: Story = {
  name: "Products / Numbers Only",
  render: () => (
    <Frame>
      <Concept4 job={JOB} products={[productWith(PLAIN_PRODUCT, "numbers-only", { equipmentId: undefined, technicianId: undefined, description: "" })]} />
    </Frame>
  ),
};

/** Other charges: Equipment and Technician only in the second row. */
export const OtherCharges: Story = {
  name: "Other Charges",
  render: () => (
    <Frame>
      <Concept4 job={JOB} other={[FULL_OTHER]} />
    </Frame>
  ),
};

/** The same at the mobile width. */
export const OtherChargesMobile: Story = {
  name: "Other Charges / Mobile",
  render: () => (
    <Frame mobile>
      <Concept4 job={JOB} other={[FULL_OTHER]} mobile />
    </Frame>
  ),
};

/** No subtype picked and no selection: the placeholder, and no second row. */
export const OtherChargeMissingValues: Story = {
  name: "Other Charges / No Subtype or Attribution",
  render: () => (
    <Frame>
      <Concept4
        job={JOB}
        other={[{ ...FULL_OTHER, id: "other-missing", other: { ...FULL_OTHER.other!, subtypeId: null, equipmentId: undefined, technicianId: undefined } }]}
      />
    </Frame>
  ),
};

/** Discounts: two columns, the minus sign everywhere. */
export const Discounts: Story = {
  render: () => (
    <Frame>
      <Concept4 job={JOB} discounts={[FULL_DISCOUNT]} />
    </Frame>
  ),
};

/** The same at the mobile width. */
export const DiscountsMobile: Story = {
  name: "Discounts / Mobile",
  render: () => (
    <Frame mobile>
      <Concept4 job={JOB} discounts={[FULL_DISCOUNT]} mobile />
    </Frame>
  ),
};

/** No subtype picked and no selection: the placeholder, and no second row. */
export const DiscountMissingValues: Story = {
  name: "Discounts / No Subtype or Attribution",
  render: () => (
    <Frame>
      <Concept4
        job={JOB}
        discounts={[{ ...FULL_DISCOUNT, id: "discount-missing", discount: { ...FULL_DISCOUNT.discount!, subtypeId: null, equipmentId: undefined, technicianId: undefined } }]}
      />
    </Frame>
  ),
};

/** A zero discount is allowed, and zero has no sign. */
export const DiscountZero: Story = {
  name: "Discounts / Zero",
  render: () => (
    <Frame>
      <Concept4 job={JOB} discounts={[{ ...FULL_DISCOUNT, id: "discount-zero", discount: { ...FULL_DISCOUNT.discount!, discount: 0 } }]} />
    </Frame>
  ),
};
