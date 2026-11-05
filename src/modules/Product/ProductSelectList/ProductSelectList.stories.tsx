import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../../components/Button/Button";
import Toaster from "../../../components/Toast/Toaster";
import {
  COMPANY,
  INVENTORY_LOCATIONS,
  PRODUCT_ITEMS,
  PRODUCT_LABELS,
  PRODUCT_SUBTYPES,
  ProductItem,
  QUICKBOOKS_ACCOUNTS,
  QUICKBOOKS_ASSET_ACCOUNTS,
  QUICKBOOKS_COGS_ACCOUNTS,
  VENDORS,
} from "../../../data/db";
import { DeviceFrame } from "../../../stories/helpers";
import NewProductForm from "../NewProductForm/NewProductForm";
import { NewProduct } from "../NewProductForm/NewProductForm.types";

import ProductSelectList from "./ProductSelectList";

// The "Products" SelectList (Figma file qhebbfbPHDVnv8IF1EC7Zg, section
// 3137-6480) — the list a product is picked from. The rows are the demo
// database's confirmed products; type a name that is not there to see
// "No products match". "Add product" opens the "New product" form, and the
// product it creates shows in the list too.
const meta: Meta = {
  title: "Modules/Product/Select List",
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

/** A product the "New product" form created, as a pricebook row. */
const toProductItem = (product: NewProduct, index: number): ProductItem => ({
  id: `prod-new-${index}`,
  name: product.name,
  status: "active",
  isActive: true,
  subtypeId: product.subtypeId ?? null,
  summary: "",
  cost: product.cost,
  price: product.price,
  taxable: product.isTaxable,
  manufacturer: product.manufacturer,
  partNumber: product.partNumber,
  barcode: product.barcode || undefined,
  trackInventory: product.trackInventory,
  stock: null,
  quantity: null,
  quantityDesired: null,
  labelIds: [],
  lastModifiedAt: "2026-09-04T09:00:00",
});

const Demo = ({
  breakpoint,
  products = PRODUCT_ITEMS,
  canAdd = true,
}: {
  breakpoint: "desktop" | "mobile";
  products?: ProductItem[];
  /** The user may add products — the footer shows. */
  canAdd?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  const [picked, setPicked] = useState<ProductItem | null>(null);
  const [list, setList] = useState<ProductItem[]>(products);
  const [formOpen, setFormOpen] = useState(false);
  return (
    <>
      <Button size="lg" variant="subtle" onClick={() => setOpen(true)}>
        {picked == null ? "Pick a product" : picked.name}
      </Button>
      <ProductSelectList
        open={open}
        onClose={() => setOpen(false)}
        products={list}
        selectedId={picked?.id}
        onSelect={setPicked}
        onAddProduct={canAdd ? () => setFormOpen(true) : undefined}
        breakpoint={breakpoint}
      />
      <NewProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        subtypes={PRODUCT_SUBTYPES}
        requireSubtypes={COMPANY.requireSubtypes}
        useTaxes={COMPANY.useTaxes}
        defaultIsTaxable={COMPANY.pricebookDefaultTaxableProduct}
        vendors={VENDORS}
        inventory={{ locations: INVENTORY_LOCATIONS, defaultTrackInventory: COMPANY.defaultTrackInventory }}
        quickbooks={{
          revenueAccounts: QUICKBOOKS_ACCOUNTS,
          cogsAccounts: QUICKBOOKS_COGS_ACCOUNTS,
          assetAccounts: QUICKBOOKS_ASSET_ACCOUNTS,
          defaultCogsAccountId: COMPANY.quickbooksDefaultCogsAccountId,
          defaultAssetAccountId: COMPANY.quickbooksDefaultAssetAccountId,
        }}
        labelPool={PRODUCT_LABELS.map((label) => label.name)}
        existingNames={list.map((product) => product.name)}
        canCreateVendor
        onCreateVendor={() => undefined}
        onCreated={(product) => setList((prev) => [...prev, toProductItem(product, prev.length)])}
        breakpoint={breakpoint}
      />
      <Toaster breakpoint={breakpoint} />
    </>
  );
};

export const Desktop: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" />,
};

export const Mobile: Story = {
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo breakpoint="mobile" />
    </DeviceFrame>
  ),
};

/** No confirmed products yet — no search, "No products", and the footer to add one. */
export const NoProducts: Story = {
  name: "No Products",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" products={[]} />,
};

/** The same on mobile. */
export const NoProductsMobile: Story = {
  name: "No Products / Mobile",
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame statusBar homeIndicator>
      <Demo breakpoint="mobile" products={[]} />
    </DeviceFrame>
  ),
};

/** A user without the pricebook permission — no "Add product" footer. */
export const NoPermission: Story = {
  name: "No Permission",
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" canAdd={false} />,
};
