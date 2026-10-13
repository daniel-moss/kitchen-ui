import { ReactNode, createContext, useCallback, useContext, useState } from "react";

import AlertBanner from "../../components/AlertBanner/AlertBanner";
import { COMPANY, PRODUCT_ITEMS, PRODUCT_LABELS, PRODUCT_SUBTYPES, VENDORS } from "../../data/db";
import { Breakpoint } from "../../hooks/useIsDesktop";
import NewProductForm from "../../modules/Product/NewProductForm/NewProductForm";
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
// NOTHING IS SAVED (Daniel, 2026-10-13: "It shouldn't be possible to save the
// product, though. Because we still haven't built Inventory part."). The form
// is missing its fifth module, so a product created now would be half made —
// Create is blocked and the banner says why. Removing `createBlockedReason`
// and adding a `createProduct` to the store is all it takes once Inventory is
// built.

const NewProductContext = createContext<() => void>(() => {});

/** Opens the app's "New product" form. Safe to call from anywhere in the app. */
export const useNewProduct = () => useContext(NewProductContext);

const LABEL_POOL = PRODUCT_LABELS.map((label) => label.name);
/** A cost can only be added for a vendor still in business. */
const ACTIVE_VENDORS = VENDORS.filter((vendor) => vendor.isActive);
/** The codes already registered, by code → the product that holds it. */
const TAKEN_BARCODES = Object.fromEntries(
  PRODUCT_ITEMS.filter((item) => item.barcode).map((item) => [item.barcode as string, item.name]),
);

export function ProductsProvider({ breakpoint = "auto", children }: { breakpoint?: Breakpoint; children: ReactNode }) {
  const [formOpen, setFormOpen] = useState(false);

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
        vendors={ACTIVE_VENDORS}
        // The viewer is an admin, so the vendor list's "Add vendor" footer row
        // is there — but the "New vendor" form is not built, so the row does
        // nothing, like every unbuilt row in the Create menu. FLAGGED.
        canCreateVendor
        onCreateVendor={noop}
        labelPool={LABEL_POOL}
        // The duplicate-name and duplicate-barcode checks. Production's
        // uniqueness spans every pricebook item of the company; the app only
        // has these products, so that is what it can offer.
        existingNames={PRODUCT_ITEMS.map((item) => item.name)}
        existingBarcodes={TAKEN_BARCODES}
        createBlockedReason={
          <AlertBanner status="info" orientation="vertical">
            A product can not be created yet — the Inventory section of this form is still being designed.
          </AlertBanner>
        }
        breakpoint={breakpoint}
      />
    </NewProductContext.Provider>
  );
}
