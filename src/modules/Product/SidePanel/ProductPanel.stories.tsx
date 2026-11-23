import { ReactNode, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../../components/Button/Button";
import Toaster from "../../../components/Toast/Toaster";
import { INVENTORY_LOCATIONS, InventoryLevel, PRODUCT_ITEMS, PRODUCT_LABELS, ProductItem, productItemById, VENDORS } from "../../../data/db";
import { InventoryLocation } from "../../../data/db/types";
import { cap, DeviceFrame, noop } from "../../../stories/helpers";
import { createdByOf } from "../../LaborRatePanel/laborRateData";
import InfoModule from "../../shared/InfoModule";
import InventoryLevelCard, { EMPTY_STOCK, StockFigures } from "../InventoryLevel/InventoryLevelCard";
import { NewProductVendorCost } from "../NewProductForm/NewProductForm.types";

import DetailsModule from "./modules/DetailsModule";
import GeneralModule from "./modules/GeneralModule";
import PricingModule from "./modules/PricingModule";
import { productStatusOf } from "./productData";
import ProductPanel from "./ProductPanel";
import { ProductPanelTab, ProductPermissions } from "./ProductPanel.types";
import { vendorCostRowsOf } from "./vendorCostRules";

// The "Product" side panel (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "↳ Product" → Side Panel → "Details" 3167-22730, "Inventory Levels"
// 3187-37507, "Vendor Costs" 3200-51187). Details, Inventory levels and Vendor
// costs are built; the other two tabs are drawn with an empty body.
//
// Demo products out of the database, each one a case the panel draws:
//   prod-r404a               ACTIVE: every module filled, a barcode, three
//                            vendor costs (Min vendor cost), internal notes.
//   prod-rev-fan-motor       REVIEW — minted by the system: no creator, no
//                            subtype, no manufacturer.
//   prod-legacy-ballast      INACTIVE — read-only, with Reactivate.
//   prod-defrost-timer       Fixed markup ($74.00).
//   prod-ice-water-pump      Percent markup (150.00%).
//   prod-condenser-fan-blade imported from QuickBooks Desktop.
//   prod-shelf-kit           "Unknown" creator (an onboarding load).
const meta: Meta = {
  title: "Modules/Pricebook Items/Product/Side Panel",
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const ACTIVE = productItemById("prod-r404a")!;
const REVIEW = productItemById("prod-rev-fan-motor")!;
const INACTIVE = productItemById("prod-legacy-ballast")!;
const FIXED_MARKUP = productItemById("prod-defrost-timer")!;
const PERCENT_MARKUP = productItemById("prod-ice-water-pump")!;
const IMPORTED = productItemById("prod-condenser-fan-blade")!;
const UNKNOWN_CREATOR = productItemById("prod-shelf-kit")!;

const LABEL_POOL = PRODUCT_LABELS.map((label) => label.name);

/** Not stocked anywhere — every warehouse row is 0, no target. */
const NOT_STOCKED = productItemById("prod-oven-door-spring")!;

/**
 * A big company — 30 active locations, the shape of the large customers in
 * production (one warehouse, two drop points, a fleet of trucks that type the
 * vehicle number into the name, and only some plates). The demo company has
 * 5, which is the "Up to 8" case.
 */
const TECHS = [
  "Mike Baker", "Ana Ortiz", "Dev Patel", "Sam Okafor", "Lena Fischer", "Chris Wong", "Maria Silva", "Tom Reyes",
  "Jade Kim", "Omar Haddad", "Ivy Turner", "Ben Carter", "Rosa Diaz", "Noah Becker", "Ella Brooks", "Luis Moreno",
  "Kai Nakamura", "Zoe Adams", "Raj Mehta", "Nina Petrova", "Paul Grant", "Hana Sato", "Eli Ward", "Mia Lopez",
  "Owen Hart", "Lily Chen",
];
const MANY_LOCATIONS: InventoryLocation[] = [
  ...INVENTORY_LOCATIONS.filter((location) => location.isActive && location.type !== "truck"),
  { id: "big-returns", name: "Returns", type: "dropPoint", isActive: true },
  ...TECHS.map((tech, index) => ({
    id: `big-truck-${index}`,
    name: `${String(index + 1).padStart(2, "0")} | ${tech.toUpperCase()} V#${118 + index}`,
    type: "truck" as const,
    plateNumber: index % 5 === 0 ? `${7 + (index % 3)}KXT${210 + index}` : undefined,
    isActive: true,
  })),
];
/** The R-404A at the big company: 5 stocked locations, one per state, the rest not stocked. */
const MANY_LEVELS: InventoryLevel[] = [
  { productId: "prod-r404a", locationId: "inv-warehouse", onHand: 6, onOrder: 4, target: 12, alertAt: 4, binLocation: "Gas cage" },
  { productId: "prod-r404a", locationId: "big-truck-0", onHand: 2, target: 2, binLocation: "Rear shelf" },
  { productId: "prod-r404a", locationId: "big-truck-3", onHand: 1, target: 2, alertAt: 1, binLocation: "Rear shelf" },
  { productId: "prod-r404a", locationId: "big-truck-7", onHand: -1, onOrder: 1, target: 2, alertAt: 1, binLocation: "" },
  { productId: "prod-r404a", locationId: "big-truck-12", onHand: 1, binLocation: "Cab" },
];

/** A Manual-cost product with two vendor costs — deleting one never moves the cost. */
const MANUAL_COSTS = productItemById("prod-evap-fan-motor")!;
/** No vendor costs at all. */
const NO_COSTS = productItemById("prod-oven-door-spring")!;
/**
 * Ten vendor costs — above 8, so the tab shows its search. One is from an
 * INACTIVE vendor (production keeps those), and every active vendor is taken,
 * so "Add vendor cost" opens a list with "No active vendors".
 */
const MANY_COSTS: NewProductVendorCost[] = VENDORS.filter((vendor) => vendor.isActive)
  .concat(VENDORS.filter((vendor) => !vendor.isActive).slice(0, 1))
  .map((vendor, index) => ({
    vendorId: vendor.id,
    cost: 270 + index * 7.5,
    partNumber: `${vendor.id.slice(0, 3).toUpperCase()}-404A-${24 + index}`,
    isPreferred: vendor.id === "sequoia-hvac",
  }));

/** A module on its own, at the width it has inside the panel, with a caption per variation. */
const ModuleColumn = ({ items, render }: { items: [string, ProductItem][]; render: (record: ProductItem) => ReactNode }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 368 }}>
    {items.map(([caption, record]) => (
      <div key={caption} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={cap}>{caption}</span>
        {render(record)}
      </div>
    ))}
  </div>
);

/** The name → id map the Labels picker's result is written back through. */
const labelIdsOf = (names: string[]): string[] =>
  PRODUCT_LABELS.filter((label) => names.includes(label.name)).map((label) => label.id);

const Demo = ({
  record,
  breakpoint,
  isLoading,
  requireSubtypes = false,
  permissions,
  fails = false,
  initialTab,
  locations,
  levels,
  costs,
}: {
  record: ProductItem;
  breakpoint: "desktop" | "mobile";
  isLoading?: boolean;
  /** The company requires a subtype — a product without one then warns. */
  requireSubtypes?: boolean;
  permissions?: ProductPermissions;
  /** Every action reports failure — the designed error toasts. */
  fails?: boolean;
  initialTab?: ProductPanelTab;
  /** The company's active locations. Default: the demo company's. */
  locations?: InventoryLocation[];
  levels?: InventoryLevel[];
  /** The product's vendor costs. Default: the demo database. */
  costs?: NewProductVendorCost[];
}) => {
  // The caller is the source of truth, so every save lands here.
  const [product, setProduct] = useState<ProductItem>(record);
  const [open, setOpen] = useState(true);
  const [vendorCosts, setVendorCosts] = useState(() => costs ?? vendorCostRowsOf(record));

  const edit = (changes: Partial<ProductItem>) => (fails ? false : void setProduct((prev) => ({ ...prev, ...changes })));

  return (
    <>
      <Button size="lg" variant="subtle" onClick={() => setOpen(true)}>
        Open product
      </Button>
      <ProductPanel
        open={open}
        onClose={() => setOpen(false)}
        product={product}
        labelPool={LABEL_POOL}
        existingNames={PRODUCT_ITEMS.map((row) => row.name)}
        requireSubtypes={requireSubtypes}
        permissions={permissions}
        isLoading={isLoading}
        simulatedScanner
        breakpoint={breakpoint}
        onSaveGeneral={(edits) => edit(edits)}
        onSavePricing={(edits) => edit({ ...edits, ...(edits.costStrategy === "manual" ? { manualCost: edits.cost } : {}) })}
        vendorCosts={vendorCosts}
        onSaveVendorCosts={(next, pricing) => {
          if (fails) return false;
          setVendorCosts(next);
          setProduct((prev) => ({ ...prev, ...pricing, preferredVendorId: next.find((cost) => cost.isPreferred)?.vendorId }));
        }}
        onSaveDetails={(edits) => edit(edits)}
        onSaveAccounting={(edits) =>
          edit({
            quickbooksAccountId: edits.revenueAccountId,
            quickbooksCogsAccountId: edits.cogsAccountId,
            quickbooksAssetAccountId: edits.assetAccountId,
          })
        }
        onSaveLabels={(labels) => edit({ labelIds: labelIdsOf(labels) })}
        onSaveDescription={(summary) => edit({ summary })}
        onSaveNotes={(notes) => edit({ notes })}
        onDeactivate={() => edit({ isActive: false })}
        onReactivate={() => edit({ isActive: true })}
        onConfirm={() => edit({ status: "active" })}
        onDelete={() => (fails ? false : setOpen(false))}
        onSaveInventoryLevel={() => (fails ? false : undefined)}
        initialTab={initialTab}
        inventoryLocations={locations}
        inventoryLevels={levels}
      />
      <Toaster breakpoint={breakpoint} />
    </>
  );
};

export const Desktop: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" />,
};

export const Mobile: Story = {
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo record={ACTIVE} breakpoint="mobile" />
    </DeviceFrame>
  ),
};

/**
 * An unvetted product: the amber Review status, no context menu, a footer with
 * Delete + Confirm. The system minted it, so it has no creator and no subtype —
 * with subtypes required, General warns and Confirm waits for one.
 */
export const Review: Story = {
  name: '"Review" Status',
  parameters: { layout: "centered" },
  render: () => <Demo record={REVIEW} breakpoint="desktop" requireSubtypes />,
};

/** Inactive: read-only. The pens and the context menu are gone; the footer offers Reactivate. */
export const Inactive: Story = {
  name: '"Inactive" Status',
  parameters: { layout: "centered" },
  render: () => <Demo record={INACTIVE} breakpoint="desktop" />,
};

/**
 * The "General" module on its own (node 3167-22852): a product with every
 * value, and one with the "No [Label]" placeholders (frames 3167-27612 …
 * 3167-32921).
 */
export const General: Story = {
  name: '"General" Module',
  parameters: { layout: "centered" },
  render: () => (
    <ModuleColumn
      items={[
        ["Every value", ACTIVE],
        ["Empty values — Non-inventory", REVIEW],
      ]}
      render={(record) => <GeneralModule product={record} onEdit={noop} />}
    />
  ),
};

/**
 * The "Pricing" module on its own (node 3167-22895). A markup strategy adds
 * its own row above Price (frames 3167-22906 / 3167-22917).
 */
export const Pricing: Story = {
  name: '"Pricing" Module',
  parameters: { layout: "centered" },
  render: () => (
    <ModuleColumn
      items={[
        ["Min vendor cost · Manual price", ACTIVE],
        ["Fixed markup", FIXED_MARKUP],
        ["Percent markup", PERCENT_MARKUP],
      ]}
      render={(record) => <PricingModule product={record} onEdit={noop} />}
    />
  ),
};

/**
 * The "Details" module on its own (node 3225-64940): every value filled (with
 * the Copy button on the Image URL), and every value empty.
 */
export const Details: Story = {
  name: '"Details" Module',
  parameters: { layout: "centered" },
  render: () => (
    <ModuleColumn
      items={[
        ["Filled", ACTIVE],
        ["Empty", NO_COSTS],
      ]}
      render={(record) => <DetailsModule product={record} onEdit={noop} />}
    />
  ),
};

/**
 * The shared "Info" module (node 3173-33601), in its three "Created by" cases:
 * a known user, a QuickBooks Desktop import, and "Unknown" — plus the three
 * statuses.
 */
export const Info: Story = {
  name: '"Info" Module',
  parameters: { layout: "centered" },
  render: () => (
    <ModuleColumn
      items={[
        ["Known user · Active", ACTIVE],
        ["Imported from QuickBooks Desktop", IMPORTED],
        ["Unknown creator", UNKNOWN_CREATOR],
        ["Review — minted by the system", REVIEW],
        ["Inactive", INACTIVE],
      ]}
      render={(record) => (
        <InfoModule
          status={productStatusOf(record)}
          createdBy={createdByOf(record)}
          createdAt={record.createdAt}
          lastModifiedAt={record.lastModifiedAt}
        />
      )}
    />
  ),
};

/** A user with none of the three pricebook permissions: every pen, the menu and both Review actions disappear. */
export const NoPermissions: Story = {
  name: "No Permissions",
  parameters: { layout: "centered" },
  render: () => <Demo record={REVIEW} breakpoint="desktop" permissions={{ edit: false, deactivate: false, remove: false }} />,
};

/** Every module body renders skeletons and every action button is hidden (frame 3167-22807). */
export const Loading: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" isLoading />,
};

/** Every save and action reports failure — the designed "Couldn't …" toasts. */
export const ActionsFail: Story = {
  name: "Actions Fail",
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" fails />,
};

// ---- the "Inventory levels" tab (Figma 3187-37507) ---------------------------

/**
 * A company with MORE than 8 locations: the search field, the stocked
 * locations sorted Depleted → Low → Limited → Full → no target, and the
 * collapsed "Not stocked" group. Type "v#12" to search across both parts.
 */
export const InventoryLevels: Story = {
  name: '"Inventory Levels" Tab',
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" initialTab="inventoryLevels" locations={MANY_LOCATIONS} levels={MANY_LEVELS} />,
};

export const InventoryLevelsMobile: Story = {
  name: '"Inventory Levels" Tab — Mobile',
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo record={ACTIVE} breakpoint="mobile" initialTab="inventoryLevels" locations={MANY_LOCATIONS} levels={MANY_LEVELS} />
    </DeviceFrame>
  ),
};

/** The demo company's 5 locations: ONE list, no group, no search. */
export const InventoryUpToEight: Story = {
  name: '"Inventory Levels" — Up To 8 Locations',
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" initialTab="inventoryLevels" />,
};

/** Stocked nowhere: the group would hold everything, so it is one A–Z list (search stays above 8). */
export const InventoryNoStocked: Story = {
  name: '"Inventory Levels" — No Stocked Locations',
  parameters: { layout: "centered" },
  render: () => <Demo record={NOT_STOCKED} breakpoint="desktop" initialTab="inventoryLevels" locations={MANY_LOCATIONS} levels={[]} />,
};

/** The company has no active location (staff make them in Django): the EmptyState. */
export const InventoryNoLocations: Story = {
  name: '"Inventory Levels" — No Active Locations',
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" initialTab="inventoryLevels" locations={[]} />,
};

export const InventoryLoading: Story = {
  name: '"Inventory Levels" — Loading',
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" initialTab="inventoryLevels" isLoading />,
};

/** Every save reports failure — "Couldn't update inventory level", the form stays open. */
export const InventorySaveFails: Story = {
  name: '"Inventory Levels" — Save Fails',
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" initialTab="inventoryLevels" fails />,
};

const CARD_CASES: [string, InventoryLocation, StockFigures][] = [
  ["Truck · Full · plate", INVENTORY_LOCATIONS[1], { onHand: 24, onOrder: 4, target: 20, binLocation: "Shelf" }],
  ["Warehouse · Full · no bin", INVENTORY_LOCATIONS[0], { onHand: 24, onOrder: 0, target: 20, binLocation: "" }],
  ["Drop-point · Full", INVENTORY_LOCATIONS[4], { onHand: 24, onOrder: 0, target: 20, binLocation: "" }],
  ["Limited", INVENTORY_LOCATIONS[3], { onHand: 15, onOrder: 2, target: 20, alertAt: 5, binLocation: "Shelf" }],
  ["Low", INVENTORY_LOCATIONS[3], { onHand: 2, onOrder: 1, target: 20, alertAt: 5, binLocation: "Shelf" }],
  ["Depleted — negative on hand", INVENTORY_LOCATIONS[3], { onHand: -5, onOrder: 2, target: 20, binLocation: "Shelf" }],
  ["No target", INVENTORY_LOCATIONS[3], { onHand: 10, onOrder: 4, binLocation: "Shelf" }],
  ["No target — on hand ≤ 0", INVENTORY_LOCATIONS[3], { onHand: -3, onOrder: 4, binLocation: "Shelf" }],
  ["Not stocked", INVENTORY_LOCATIONS[3], EMPTY_STOCK],
];

/** The "Inventory Location" Card on its own (node 3200-48993): types, stock levels, no values. */
export const InventoryCard: Story = {
  name: '"Inventory Location" Card',
  parameters: { layout: "centered" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 368 }}>
      {CARD_CASES.map(([caption, location, level]) => (
        <div key={caption} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={cap}>{caption}</span>
          <InventoryLevelCard level={level} location={location} onClick={noop} />
        </div>
      ))}
    </div>
  ),
};

// ---- "Vendor costs" tab (Figma 3200-51187) ----------------------------------

/**
 * The R-404A: three vendor costs under "Min vendor cost". The preferred vendor
 * (Peninsula) sits on top, the rest A → Z. Deleting a vendor shows the Prompt
 * that fits — the cost changes, the cost stays, or (the last one) the strategy
 * moves to Manual and the cost back to the last manual cost, $250.00.
 */
export const VendorCosts: Story = {
  name: "Vendor Costs",
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" initialTab="vendorCosts" />,
};

export const VendorCostsMobile: Story = {
  name: "Vendor Costs / Mobile",
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo record={ACTIVE} breakpoint="mobile" initialTab="vendorCosts" />
    </DeviceFrame>
  ),
};

/** "Manual" cost: deleting a vendor cost never moves the product's cost — the purchase order Prompt. */
export const VendorCostsManual: Story = {
  name: 'Vendor Costs / "Manual" Cost',
  parameters: { layout: "centered" },
  render: () => <Demo record={MANUAL_COSTS} breakpoint="desktop" initialTab="vendorCosts" />,
};

/** More than 8 vendor costs: the search appears. It matches the vendor name, results A → Z. */
export const VendorCostsSearch: Story = {
  name: "Vendor Costs / Search",
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" initialTab="vendorCosts" costs={MANY_COSTS} />,
};

/** No vendor costs: the centered EmptyState with its own "Add vendor cost". */
export const VendorCostsEmpty: Story = {
  name: "Vendor Costs / Empty",
  parameters: { layout: "centered" },
  render: () => <Demo record={NO_COSTS} breakpoint="desktop" initialTab="vendorCosts" />,
};

/** Without the edit permission: no "Add vendor cost", no ⋯ menu, and the cards do not respond. */
export const VendorCostsNoPermission: Story = {
  name: "Vendor Costs / No Edit Permissions",
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" initialTab="vendorCosts" permissions={{ edit: false }} />,
};

export const VendorCostsEmptyNoPermission: Story = {
  name: "Vendor Costs / Empty / No Edit Permissions",
  parameters: { layout: "centered" },
  render: () => <Demo record={NO_COSTS} breakpoint="desktop" initialTab="vendorCosts" permissions={{ edit: false }} />,
};

export const VendorCostsLoading: Story = {
  name: "Vendor Costs / Loading",
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" initialTab="vendorCosts" isLoading />,
};

/** Every save and delete fails: the error toasts, and the Dialog stays open with its values. */
export const VendorCostsSaveFails: Story = {
  name: "Vendor Costs / Save Fails",
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" initialTab="vendorCosts" fails />,
};

// ---- "Accounting" + "History" tabs (Figma "↳ Shared Tabs" 3225-69016) -------

/** The R-404A: an Inventory product, so all three accounts; synced. */
export const AccountingTab: Story = {
  name: "Accounting",
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" initialTab="accounting" />,
};

export const AccountingMobile: Story = {
  name: "Accounting / Mobile",
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo record={ACTIVE} breakpoint="mobile" initialTab="accounting" />
    </DeviceFrame>
  ),
};

/** No revenue account — loaded before QuickBooks was connected: the "Warning" state, and the tab warns too. */
export const AccountingWarning: Story = {
  name: "Accounting / Warning",
  parameters: { layout: "centered" },
  render: () => <Demo record={UNKNOWN_CREATOR} breakpoint="desktop" initialTab="accounting" />,
};

/** Review: no revenue account (the system minted it) and no sync rows; Confirm waits for the account. */
export const AccountingReview: Story = {
  name: 'Accounting / "Review" Status',
  parameters: { layout: "centered" },
  render: () => <Demo record={REVIEW} breakpoint="desktop" initialTab="accounting" />,
};

export const AccountingLoading: Story = {
  name: "Accounting / Loading",
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" initialTab="accounting" isLoading />,
};

/** The jobs and invoices this product was billed on. */
export const HistoryTab: Story = {
  name: "History",
  parameters: { layout: "centered" },
  render: () => <Demo record={ACTIVE} breakpoint="desktop" initialTab="history" />,
};
