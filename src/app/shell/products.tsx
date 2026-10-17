import { ReactNode, createContext, useCallback, useContext, useState } from "react";

import {
  COMPANY,
  INVENTORY_LOCATIONS,
  PRODUCT_LABELS,
  PRODUCT_SUBTYPES,
  QUICKBOOKS_ACCOUNTS,
  QUICKBOOKS_ASSET_ACCOUNTS,
  QUICKBOOKS_COGS_ACCOUNTS,
  VENDORS,
} from "../../data/db";
import { Breakpoint } from "../../hooks/useIsDesktop";
import NewProductForm from "../../modules/Product/NewProductForm/NewProductForm";
import { useAppStore } from "../store/AppStore";
import { noop } from "../../stories/helpers";

// ONE "New product" form for the whole app — the arrangement shell/taxRates.tsx
// and shell/laborRates.tsx set up, for the same reason: the form is an overlay
// that portals to <body>, and its entry points are far apart in the tree.
//
//   the Products list's "New" button, and the Create menu's Pricebook item →
//   Product (rendered by the sidebar on desktop and by the bottom bar on
//   mobile).
//
// There is no "Product" side panel yet, so a row click still does nothing and
// this provider has no `useOpenProduct` twin.
//
// CREATE SAVES (Daniel, 2026-10-17, once the Inventory module was built): the
// form hands its product to the store's `createProduct`, closes, and shows
// the "Product created" toast; the new row appears in the Products list.
// Create's annotation ends on the new product's side panel — that panel does
// not exist yet, so the user simply stays where they were.

const NewProductContext = createContext<() => void>(() => {});

/** Opens the app's "New product" form. Safe to call from anywhere in the app. */
export const useNewProduct = () => useContext(NewProductContext);

const LABEL_POOL = PRODUCT_LABELS.map((label) => label.name);
/** The company's inventory setup — the Inventory module exists only with the feature on. */
const INVENTORY = COMPANY.featureInventoryEnabled
  ? { locations: INVENTORY_LOCATIONS, defaultTrackInventory: COMPANY.defaultTrackInventory }
  : undefined;
/** The Accounting module: QuickBooks Desktop on the Detailed Split scheme only. */
const QUICKBOOKS =
  COMPANY.accountingIntegration === "quickbooksDesktop" && COMPANY.quickbooksLineItemScheme === "splitDetailed"
    ? {
        revenueAccounts: QUICKBOOKS_ACCOUNTS,
        cogsAccounts: QUICKBOOKS_COGS_ACCOUNTS,
        assetAccounts: QUICKBOOKS_ASSET_ACCOUNTS,
        defaultCogsAccountId: COMPANY.quickbooksDefaultCogsAccountId,
        defaultAssetAccountId: COMPANY.quickbooksDefaultAssetAccountId,
      }
    : undefined;

export function ProductsProvider({ breakpoint = "auto", children }: { breakpoint?: Breakpoint; children: ReactNode }) {
  const [formOpen, setFormOpen] = useState(false);
  const { products, createProduct } = useAppStore();

  // Stable, so a memoised consumer (the list's top bar) does not re-render on
  // every app render.
  const openForm = useCallback(() => setFormOpen(true), []);
  const closeForm = useCallback(() => setFormOpen(false), []);

  return (
    <NewProductContext.Provider value={openForm}>
      {children}

      <NewProductForm
        open={formOpen}
        onClose={closeForm}
        subtypes={PRODUCT_SUBTYPES}
        requireSubtypes={COMPANY.requireSubtypes}
        useTaxes={COMPANY.useTaxes}
        defaultIsTaxable={COMPANY.pricebookDefaultTaxableProduct}
        // Every vendor — the form offers the active ones and shows the
        // inactive ones disabled.
        vendors={VENDORS}
        inventory={INVENTORY}
        quickbooks={QUICKBOOKS}
        // The viewer is an admin, so the vendor list's "Add vendor" footer row
        // is there — but the "New vendor" form is not built, so the row does
        // nothing, like every unbuilt row in the Create menu. FLAGGED.
        canCreateVendor
        onCreateVendor={noop}
        labelPool={LABEL_POOL}
        // The duplicate-name and duplicate-barcode checks. Production's
        // uniqueness spans every pricebook item of the company; the app only
        // has these products, so that is what it can offer.
        existingNames={products.map((item) => item.name)}
        existingBarcodes={Object.fromEntries(
          products.filter((item) => item.barcode).map((item) => [item.barcode as string, item.name]),
        )}
        onCreated={(product) => {
          createProduct(product);
        }}
        breakpoint={breakpoint}
      />
    </NewProductContext.Provider>
  );
}
