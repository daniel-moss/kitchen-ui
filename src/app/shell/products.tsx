import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  activeInventoryLocations,
  COMPANY,
  PRODUCT_LABELS,
  PRODUCT_SUBTYPES,
  QUICKBOOKS_ACCOUNTS,
  QUICKBOOKS_ASSET_ACCOUNTS,
  QUICKBOOKS_COGS_ACCOUNTS,
  QUICKBOOKS_VENDORS,
} from "../../data/db";
import { Breakpoint } from "../../hooks/useIsDesktop";
import NewProductForm from "../../modules/Product/NewProductForm/NewProductForm";
import ProductPanel from "../../modules/Product/SidePanel/ProductPanel";
import { useAppStore, useProduct } from "../store/AppStore";
import { createListPanelContext, useListPanel, usePanelState } from "./listPanel";
import { pricebookHistoryRows } from "../../modules/shared/pricebookHistory";
import { openHistoryRow } from "./pricebookHistory";

// ONE "New product" form for the whole app — the arrangement shell/taxRates.tsx
// and shell/laborRates.tsx set up, for the same reason: the form is an overlay
// that portals to <body>, and its entry points are far apart in the tree.
//
//   the Products list's "New" button, and the Create menu's Pricebook item →
//   Product (rendered by the sidebar on desktop and by the bottom bar on
//   mobile).
//
// ONE "Product" side panel too (wired 2026-11-17; the "Inventory levels"
// tab joined 2026-11-18 and saves through the store's `setInventoryLevel`): a row
// click on the Products list opens it, and so does Create — the form's
// "opens the SidePanel" on the product it just made. The panel reads and
// writes the store, so an edit shows in the list behind it.
//
// CREATE SAVES (Daniel, 2026-10-17, once the Inventory module was built): the
// form hands its product to the store's `createProduct`, closes, and shows
// the "Product created" toast; the new row appears in the Products list.

const NewProductContext = createContext<() => void>(() => {});
const OpenProductContext = createContext<(id: string) => void>(() => {});
const ProductListPanelContext = createListPanelContext();

/** Opens the app's "New product" form. Safe to call from anywhere in the app. */
export const useNewProduct = () => useContext(NewProductContext);

/** Opens the "Product" side panel on one product. */
export const useOpenProduct = () => useContext(OpenProductContext);

/** The Product list's side of the panel — the open row, opening from a row, closing. */
export const useProductListPanel = () => useListPanel(ProductListPanelContext);

const LABEL_POOL = PRODUCT_LABELS.map((label) => label.name);

/** The name → id map a save from the Labels picker is written back through. */
const labelIdsOf = (names: string[]) =>
  PRODUCT_LABELS.filter((label) => names.includes(label.name)).map(
    (label) => label.id,
  );

// Functions, not constants: the "Demo settings" page changes COMPANY at run time.
/**
 * The company's inventory setup — the Stock type exists only with the feature
 * on. The locations are the LIVE list the Demo settings page edits.
 */
const inventorySetup = () =>
  COMPANY.featureInventoryEnabled
    ? {
        locations: COMPANY.inventoryLocations,
        defaultTrackInventory: COMPANY.defaultTrackInventory,
      }
    : undefined;
/** The Accounting module: QuickBooks Desktop on the Detailed Split scheme only. */
const quickbooksSetup = () =>
  COMPANY.accountingIntegration === "quickbooksDesktop" &&
  COMPANY.quickbooksLineItemScheme === "splitDetailed"
    ? {
        revenueAccounts: QUICKBOOKS_ACCOUNTS,
        cogsAccounts: QUICKBOOKS_COGS_ACCOUNTS,
        assetAccounts: QUICKBOOKS_ASSET_ACCOUNTS,
        defaultCogsAccountId: COMPANY.quickbooksDefaultCogsAccountId,
        defaultAssetAccountId: COMPANY.quickbooksDefaultAssetAccountId,
      }
    : undefined;

export function ProductsProvider({
  breakpoint = "auto",
  children,
}: {
  breakpoint?: Breakpoint;
  children: ReactNode;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const { panelId, fromList, open: openPanel, close: closePanel, listPanel } = usePanelState();
  const createdId = useRef<string | null>(null);
  const {
    products,
    createProduct,
    updateProduct,
    deleteProduct,
    inventoryLevelsOf,
    setInventoryLevel,
    vendorCostsOf,
    setVendorCosts,
    historySources,
  } = useAppStore();

  // Stable, so a memoised consumer (the list's top bar) does not re-render on
  // every app render.
  const openForm = useCallback(() => setFormOpen(true), []);
  const closeForm = useCallback(() => setFormOpen(false), []);

  // Read from the store every render, so the panel shows what the list shows.
  // It goes undefined when the product is deleted, which closes the panel.
  const product = useProduct(panelId);
  // Memoised: the panel keeps a working copy and re-seeds it when this changes.
  const productLevels = useMemo(
    () => (panelId == null ? [] : inventoryLevelsOf(panelId)),
    [panelId, inventoryLevelsOf],
  );
  // The History tab reads the jobs and charge lines as they are in this session.
  const historyRows = useMemo(
    () => (panelId == null ? [] : pricebookHistoryRows((line) => line.productId === panelId, historySources)),
    [panelId, historySources],
  );
  const productCosts = useMemo(
    () => (panelId == null ? [] : vendorCostsOf(panelId)),
    [panelId, vendorCostsOf],
  );

  return (
    <NewProductContext.Provider value={openForm}>
      <OpenProductContext.Provider value={openPanel}>
        <ProductListPanelContext.Provider value={listPanel}>
        {children}

        <NewProductForm
          open={formOpen}
          onClose={closeForm}
          subtypes={PRODUCT_SUBTYPES}
          requireSubtypes={COMPANY.requireSubtypes}
          useTaxes={COMPANY.useTaxes}
          defaultIsTaxable={COMPANY.pricebookDefaultTaxableProduct}
          inventory={inventorySetup()}
          quickbooks={quickbooksSetup()}
          // The duplicate-name check. Production's uniqueness spans every
          // pricebook item of the company; the app only has these products, so
          // that is what it can offer.
          existingNames={products.map((item) => item.name)}
          onCreated={(input) => {
            // Remembered for onOpenCreated: only the store knows the new id.
            createdId.current = createProduct(input);
          }}
          // Create "opens the SidePanel" on the product it just made.
          onOpenCreated={() => {
            if (createdId.current != null) openPanel(createdId.current);
          }}
          breakpoint={breakpoint}
        />

        {product != null && (
          <ProductPanel
            open={panelId != null}
            onClose={closePanel}
            // Opened from its list: non-modal, the list stays usable.
            isModal={!fromList}
            product={product}
            labelPool={LABEL_POOL}
            existingNames={products.map((row) => row.name)}
            registeredBarcodes={Object.fromEntries(
              products
                .filter((row) => row.id !== product.id && row.barcode)
                .map((row) => [row.barcode!, row.name]),
            )}
            requireSubtypes={COMPANY.requireSubtypes}
            useTaxes={COMPANY.useTaxes}
            hasInventory={COMPANY.featureInventoryEnabled}
            // Every ACTIVE location of the live Demo settings list.
            inventoryLocations={activeInventoryLocations()}
            inventoryLevels={productLevels}
            onSaveInventoryLevel={(locationId, level) =>
              setInventoryLevel(product.id, {
                productId: product.id,
                locationId,
                ...level,
              })
            }
            onSaveGeneral={(edits) => updateProduct(product.id, edits)}
            vendorCosts={productCosts}
            onSaveVendorCosts={(costs, pricing) =>
              setVendorCosts(product.id, costs, {
                ...pricing,
                preferredVendorId: costs.find((cost) => cost.isPreferred)?.vendorId,
              })
            }
            onSavePricing={(edits) =>
              updateProduct(product.id, {
                ...edits,
                // The cost typed under Manual is what a later switch back restores.
                ...(edits.costStrategy === "manual" ? { manualCost: edits.cost } : {}),
              })
            }
            onSaveDetails={(edits) => updateProduct(product.id, edits)}
            historyRows={historyRows}
            onOpenHistory={openHistoryRow}
            // The "Accounting" tab: QuickBooks Desktop + "Detailed Split" only.
            hasQuickbooksAccounting={quickbooksSetup() != null}
            accountLists={{
              revenue: QUICKBOOKS_ACCOUNTS,
              cogs: QUICKBOOKS_COGS_ACCOUNTS,
              asset: QUICKBOOKS_ASSET_ACCOUNTS,
              vendors: QUICKBOOKS_VENDORS,
              defaultCogsId: COMPANY.quickbooksDefaultCogsAccountId,
              defaultAssetId: COMPANY.quickbooksDefaultAssetAccountId,
            }}
            onSaveAccounting={(edits) =>
              updateProduct(product.id, {
                quickbooksAccountId: edits.revenueAccountId,
                quickbooksCogsAccountId: edits.cogsAccountId,
                quickbooksAssetAccountId: edits.assetAccountId,
              })
            }
            onSaveLabels={(labels) =>
              updateProduct(product.id, { labelIds: labelIdsOf(labels) })
            }
            onSaveDescription={(summary) =>
              updateProduct(product.id, { summary })
            }
            onSaveNotes={(notes) => updateProduct(product.id, { notes })}
            onDeactivate={() => updateProduct(product.id, { isActive: false })}
            onReactivate={() => updateProduct(product.id, { isActive: true })}
            onConfirm={() => updateProduct(product.id, { status: "active" })}
            onDelete={() => {
              deleteProduct(product.id);
              closePanel();
            }}
            breakpoint={breakpoint}
          />
        )}
        </ProductListPanelContext.Provider>
      </OpenProductContext.Provider>
    </NewProductContext.Provider>
  );
}
