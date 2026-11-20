import { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";

import AvatarProduct from "../../../components/Avatar/AvatarProduct";
import Button from "../../../components/Button/Button";
import IconButton from "../../../components/IconButton/IconButton";
import Menu from "../../../components/Menu/Menu";
import MenuItem from "../../../components/Menu/MenuItem";
import MenuItemGroup from "../../../components/Menu/MenuItemGroup";
import DrawerHeader from "../../../components/Popover/DrawerHeader";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import PopoverHeaderContent from "../../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../../components/Popover/PopoverHeaderText";
import Prompt from "../../../components/Prompt/Prompt";
import SidePanel from "../../../components/SidePanel/SidePanel";
import SidePanelNavigation from "../../../components/SidePanel/SidePanelNavigation";
import TabItem from "../../../components/Tabs/TabItem";
import { toast } from "../../../components/Toast/Toaster";
import { activeInventoryLocations, inventoryLevelsOf, PRODUCT_SUBTYPES, ProductItem, VENDORS } from "../../../data/db";
import useIsDesktop from "../../../hooks/useIsDesktop";
import { createdByOf } from "../../LaborRatePanel/laborRateData";
import HistoryModule from "../../EquipmentPanel/modules/HistoryModule";
import AccountingModule from "../../shared/AccountingModule";
import { useAnchoredMenu } from "../../shared/anchoredMenu";
import EditAccountingDialog, { AccountingEdits } from "../../shared/EditAccountingDialog";
import EditNotesDialog from "../../shared/EditNotesDialog";
import { slot } from "../../shared/helpers";
import InfoModule from "../../shared/InfoModule";
import LabelsModule from "../../shared/LabelsModule";
import LabelsSelectList from "../../shared/LabelsSelectList";
import NotesModule from "../../shared/NotesModule";

import { EMPTY_STOCK, StockFigures } from "../InventoryLevel/InventoryLevelCard";
import ActiveInactiveList from "../NewProductForm/ActiveInactiveList";
import { NewProductVendorCost } from "../NewProductForm/NewProductForm.types";
import { vendorPickerOptions } from "../NewProductForm/VendorCostField";

import EditDetailsDialog from "./forms/EditDetailsDialog";
import EditGeneralDialog from "./forms/EditGeneralDialog";
import EditInventoryLevelDialog from "./forms/EditInventoryLevelDialog";
import EditPricingDialog from "./forms/EditPricingDialog";
import EditVendorCostDialog from "./forms/EditVendorCostDialog";
import DetailsModule from "./modules/DetailsModule";
import GeneralModule from "./modules/GeneralModule";
import InventoryLevelsTab from "./modules/InventoryLevelsTab";
import PricingModule from "./modules/PricingModule";
import VendorCostsTab from "./modules/VendorCostsTab";
import { accountingOf, barcodeOwnersExcept, labelNamesOf, missingRequiredOf, productHistoryRows, productStatusOf } from "./productData";
import { ProductDetails, ProductGeneral, ProductPanelProps, ProductPanelTab, ProductPricing } from "./ProductPanel.types";

import { deleteOutcome, pricingAfter, vendorCostRowsOf, withPreferred } from "./vendorCostRules";

import styles from "./ProductPanel.module.scss";

// The "Product" side panel (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "↳ Product" → Side Panel; the header, its context menu and the Labels /
// Description / Internal notes / Info modules are pricebook-wide, on the
// "Shared Behavior" and "Shared Modules" pages). ONE module for every
// product; the record is a prop.
//
// FIVE TABS (node 3167-22768): Details · Vendor costs · Inventory levels ·
// Accounting · History. Built so far:
//
//   Details            General · Pricing · Details (2026-11-20, Figma
//                      3225-64197) · Labels · Description · Internal notes ·
//                      Info (2026-11-17)
//   Inventory levels   every active location's card (2026-11-18, Figma
//                      3187-37507) — see InventoryLevelsTab. ONLY for an
//                      Inventory product: a Non-inventory one has no tab.
//   Vendor costs       one card per vendor (2026-11-19, Figma 3200-51187) —
//                      see VendorCostsTab and vendorCostRules. The footer's
//                      "Add vendor cost" opens the Vendors list, then the
//                      vendor cost Dialog; a card's ⋯ menu holds Edit and
//                      Delete (one of three delete Prompts).
//
//   Accounting         the SHARED pricebook Accounting module (2026-11-20,
//                      Figma "Shared Tabs" 3091-22787) — only on QuickBooks
//                      Desktop with "Detailed Split"; the two inventory
//                      accounts only for an Inventory product.
//   History            the SHARED pricebook History (3091-28563): the jobs and
//                      invoices this product was billed on.
//
// The three states follow the Labor rate panel (shared behaviour):
//   Active    pens everywhere, the ellipsis menu holding Deactivate.
//   Review    no menu; the footer offers Delete + Confirm, and Confirm waits
//             for a required subtype.
//   Inactive  read-only — no pens, no menu, the footer offers Reactivate. The
//             copy buttons stay: reading is not editing.

export default function ProductPanel({
  open,
  onClose,
  product,
  labelPool = [],
  existingNames = [],
  registeredBarcodes,
  vendorCosts,
  vendors,
  requireSubtypes = false,
  hasQuickbooksAccounting = true,
  accountLists,
  useTaxes = true,
  hasInventory = true,
  permissions = {},
  onBack,
  initialTab = "details",
  onSaveGeneral,
  onSavePricing,
  onSaveDetails,
  onSaveLabels,
  onSaveDescription,
  onSaveNotes,
  onDeactivate,
  onReactivate,
  onConfirm,
  onDelete,
  onSaveInventoryLevel,
  onSaveVendorCosts,
  onSaveAccounting,
  onOpenHistory,
  historyRows,
  inventoryLocations,
  inventoryLevels,
  simulatedScanner = false,
  isLoading = false,
  state = "content",
  onRetry,
  breakpoint = "auto",
}: ProductPanelProps) {
  const mobile = !useIsDesktop(breakpoint);

  const [editingGeneral, setEditingGeneral] = useState(false);
  const [editingPricing, setEditingPricing] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [editingAccounting, setEditingAccounting] = useState(false);
  const [pickingLabels, setPickingLabels] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<ProductPanelTab>(initialTab);
  // The location being edited stays set while its Dialog animates out, so the
  // title does not blank mid-close; `levelOpen` is what opens and closes it.
  const [editingLevel, setEditingLevel] = useState<string | null>(null);
  const [levelOpen, setLevelOpen] = useState(false);
  const editLevel = (locationId: string) => {
    setEditingLevel(locationId);
    setLevelOpen(true);
  };

  const menu = useAnchoredMenu(!mobile, "end");

  // The panel's WORKING COPY of the record: every save still calls the
  // caller's handler, but the panel applies the edit too, so a form never
  // looks like it did nothing (the Equipment / Labor rate panels' rule).
  const [record, setRecord] = useState(product);
  useEffect(() => setRecord(product), [product]);
  // A different product starts on Details (or `initialTab`), like every opening.
  useEffect(() => setTab(initialTab), [product.id, initialTab]);

  // Labels are held by NAME: the picker can create one, which has no id yet.
  const [labels, setLabels] = useState<string[]>(() => labelNamesOf(product));
  useEffect(() => setLabels(labelNamesOf(product)), [product]);

  // The demo database stands in when the caller passes nothing.
  const barcodes = useMemo(() => registeredBarcodes ?? barcodeOwnersExcept(record.id), [registeredBarcodes, record.id]);

  // The "Vendor costs" tab: the product's vendor costs as a working copy. The
  // Pricing form's three vendor strategies read the same list.
  const vendorList = vendors ?? VENDORS;
  const nameOf = useCallback((vendorId: string) => vendorList.find((vendor) => vendor.id === vendorId)?.name ?? vendorId, [vendorList]);
  // The database fallback re-seeds only for ANOTHER product: the record itself
  // changes on every save, and must not wipe the tab's edits.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const seedCosts = useMemo(() => vendorCosts ?? vendorCostRowsOf(product), [vendorCosts, product.id]);
  const [costRows, setCostRows] = useState(seedCosts);
  useEffect(() => setCostRows(seedCosts), [seedCosts]);
  const costs = useMemo(() => costRows.map((row) => row.cost), [costRows]);

  // The vendor cost Dialog (edit or add), its ⋯ menu and the delete Prompt.
  // Each keeps its subject while it animates out, like the level Dialog.
  const [editingCost, setEditingCost] = useState<{ cost: NewProductVendorCost; isNew: boolean } | null>(null);
  const [costOpen, setCostOpen] = useState(false);
  const [pickingVendor, setPickingVendor] = useState(false);
  // Worked out when the Prompt OPENS, so its copy holds still while it fades out.
  const [deletingCost, setDeletingCost] = useState<ReturnType<typeof deleteOutcome> | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const costMenu = useAnchoredMenu(!mobile, "end");
  const [menuVendor, setMenuVendor] = useState<string | null>(null);

  // The "Inventory levels" tab: the company's active locations (read LIVE —
  // the Demo settings page edits them) and the product's level at each, as a
  // working copy like the record.
  const locations = inventoryLocations ?? activeInventoryLocations();
  const seedLevels = useMemo(() => {
    const byLocation: Record<string, StockFigures> = {};
    for (const level of inventoryLevels ?? inventoryLevelsOf(product.id)) {
      byLocation[level.locationId] = {
        onHand: level.onHand,
        onOrder: level.onOrder ?? 0,
        target: level.target,
        alertAt: level.target != null ? level.alertAt : undefined,
        binLocation: level.binLocation ?? "",
      };
    }
    return byLocation;
  }, [inventoryLevels, product.id]);
  const [levels, setLevels] = useState(seedLevels);
  useEffect(() => setLevels(seedLevels), [seedLevels]);

  // Closing the panel closes everything it opened.
  useEffect(() => {
    if (open) return;
    menu.close();
    setEditingGeneral(false);
    setEditingPricing(false);
    setEditingDetails(false);
    setEditingAccounting(false);
    setPickingLabels(false);
    setEditingDescription(false);
    setEditingNotes(false);
    setDeactivating(false);
    setDeleting(false);
    setLevelOpen(false);
    setCostOpen(false);
    setPickingVendor(false);
    setDeleteOpen(false);
    costMenu.close();
    setTab(initialTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const status = productStatusOf(record);
  const inReview = status === "review";
  const inactive = status === "inactive";

  const canEdit = permissions.edit !== false;
  const canDeactivate = permissions.deactivate !== false;
  const canDelete = permissions.remove !== false;
  const canEditModules = canEdit && !inactive;

  const missing = missingRequiredOf(record, { requireSubtypes, hasAccounting: hasQuickbooksAccounting });
  // Inventory products carry the two inventory accounts too.
  const showInventoryAccounts = hasInventory && record.trackInventory;
  const history = useMemo(() => historyRows ?? productHistoryRows(record.id), [historyRows, record.id]);

  // "The tab is only shown if a product is marked Inventory" — and a company
  // without the feature has no Inventory products to show it for.
  const showInventoryTab = hasInventory && record.trackInventory;
  // Hiding the tab NEVER touches the levels (Daniel, 2026-11-19): switching to
  // Non-inventory and back shows every location's data as it was.
  // Switching the product to Non-inventory while on the tab lands on Details.
  useEffect(() => {
    if (!showInventoryTab && tab === "inventoryLevels") setTab("details");
    if (!hasQuickbooksAccounting && tab === "accounting") setTab("details");
  }, [showInventoryTab, hasQuickbooksAccounting, tab]);

  // The ellipsis exists only in the Active state.
  const showMenu = !isLoading && !inReview && !inactive && canDeactivate;

  const saveGeneral = async (edits: ProductGeneral) => {
    if ((await onSaveGeneral?.(edits)) === false) return false;
    setRecord((prev) => ({ ...prev, ...edits }));
  };

  const savePricing = async (edits: ProductPricing) => {
    if ((await onSavePricing?.(edits)) === false) return false;
    // A cost typed under Manual is the one a later switch back to Manual restores.
    setRecord((prev) => ({ ...prev, ...edits, ...(edits.costStrategy === "manual" ? { manualCost: edits.cost } : {}) }));
  };

  const saveAccounting = async (edits: AccountingEdits) => {
    if ((await onSaveAccounting?.(edits)) === false) return false;
    setRecord((prev) => ({
      ...prev,
      quickbooksAccountId: edits.revenueAccountId,
      quickbooksCogsAccountId: edits.cogsAccountId,
      quickbooksAssetAccountId: edits.assetAccountId,
    }));
  };

  const saveDetails = async (edits: ProductDetails) => {
    if ((await onSaveDetails?.(edits)) === false) return false;
    setRecord((prev) => ({ ...prev, ...edits }));
  };

  // Every vendor cost change goes through here: the caller gets the whole list
  // and the Pricing module it leads to (a vendor strategy re-derives the cost).
  const commitCosts = async (next: NewProductVendorCost[], pricing: ProductPricing) => {
    if ((await onSaveVendorCosts?.(next, pricing)) === false) return false;
    setCostRows(next);
    setRecord((prev) => ({ ...prev, ...pricing, preferredVendorId: next.find((row) => row.isPreferred)?.vendorId }));
  };

  const editCost = (vendorId: string) => {
    const cost = costRows.find((row) => row.vendorId === vendorId);
    if (cost == null) return;
    setEditingCost({ cost, isNew: false });
    setCostOpen(true);
  };

  // A vendor picked from the list opens the same Dialog, empty. The first
  // vendor cost is the preferred one.
  const addCost = (vendorId: string) => {
    setEditingCost({ cost: { vendorId, cost: 0, partNumber: "", isPreferred: costRows.length === 0 }, isNew: true });
    setCostOpen(true);
  };

  const saveVendorCost = (saved: NewProductVendorCost) => {
    let next = editingCost?.isNew ? [...costRows, saved] : costRows.map((row) => (row.vendorId === saved.vendorId ? saved : row));
    if (saved.isPreferred) next = next.map((row) => ({ ...row, isPreferred: row.vendorId === saved.vendorId }));
    next = withPreferred(next, nameOf);
    return commitCosts(next, pricingAfter(record, next));
  };

  const deleteCost = async () => {
    setDeleteOpen(false);
    if (deletingCost == null) return;
    if ((await commitCosts(deletingCost.next, deletingCost.pricing)) === false) {
      toast({ type: "error", variant: "detailed", title: "Couldn't delete vendor cost", caption: "Something went wrong. Please try again." });
      return;
    }
    toast({ type: "success", title: "Vendor cost deleted" });
  };

  const openCostMenu = (vendorId: string, event: MouseEvent<HTMLButtonElement>) => {
    setMenuVendor(vendorId);
    costMenu.onActions(event);
  };

  const costMenuBody = (
    <>
      <MenuItemGroup>
        <MenuItem
          label="Edit"
          slotLeft={slot("pen")}
          onClick={() => {
            costMenu.close();
            if (menuVendor != null) editCost(menuVendor);
          }}
        />
      </MenuItemGroup>
      <MenuItemGroup>
        <MenuItem
          danger
          label="Delete"
          slotLeft={slot("trash-can")}
          onClick={() => {
            costMenu.close();
            if (menuVendor == null) return;
            setDeletingCost(deleteOutcome(record, costRows, menuVendor, nameOf));
            setDeleteOpen(true);
          }}
        />
      </MenuItemGroup>
    </>
  );

  const saveLabels = async (picked: string[]) => {
    setPickingLabels(false);
    if ((await onSaveLabels?.(picked)) === false) {
      toast({
        type: "error",
        variant: "detailed",
        title: 'Couldn\'t update "Labels" module',
        caption: "Something went wrong. Please try again.",
      });
      return;
    }
    setLabels(picked);
    toast({ type: "success", title: '"Labels" module updated' });
  };

  const saveInventoryLevel = async (level: StockFigures) => {
    if (editingLevel == null) return;
    if ((await onSaveInventoryLevel?.(editingLevel, level)) === false) return false;
    setLevels((prev) => ({ ...prev, [editingLevel]: level }));
  };

  const saveDescription = async (summary: string) => {
    if ((await onSaveDescription?.(summary)) === false) return false;
    setRecord((prev) => ({ ...prev, summary }));
  };

  const saveNotes = async (notes: string) => {
    if ((await onSaveNotes?.(notes)) === false) return false;
    setRecord((prev) => ({ ...prev, notes }));
  };

  // The four whole-record actions: apply locally, then toast — the success
  // ones `detailed`, with the product's name as the caption.
  const runAction = async (
    action: (() => void | boolean | Promise<void | boolean>) | undefined,
    apply: (prev: ProductItem) => ProductItem,
    successTitle: string,
    errorTitle: string,
  ) => {
    if ((await action?.()) === false) {
      toast({ type: "error", variant: "detailed", title: errorTitle, caption: "Something went wrong. Please try again." });
      return;
    }
    setRecord(apply);
    toast({ type: "success", variant: "detailed", title: successTitle, caption: record.name });
  };

  const deactivate = () => {
    setDeactivating(false);
    return runAction(onDeactivate, (prev) => ({ ...prev, isActive: false }), "Product deactivated", "Couldn't deactivate the product");
  };

  const reactivate = () =>
    runAction(onReactivate, (prev) => ({ ...prev, isActive: true }), "Product reactivated", "Couldn't reactivate the product");

  const confirm = () =>
    runAction(onConfirm, (prev) => ({ ...prev, status: "active" }), "Product confirmed", "Couldn't confirm the product");

  const remove = () => {
    setDeleting(false);
    return runAction(onDelete, (prev) => prev, "Product deleted", "Couldn't delete the product");
  };

  // ONE item: a danger "Deactivate" with the ban icon (the shared header doc).
  const menuBody = (
    <MenuItemGroup>
      <MenuItem
        danger
        label="Deactivate"
        slotLeft={slot("ban")}
        onClick={() => {
          menu.close();
          setDeactivating(true);
        }}
      />
    </MenuItemGroup>
  );

  return (
    <>
      <SidePanel
        open={open}
        onClose={onClose}
        onBack={onBack}
        title={record.name}
        // No status while loading — the Loading frame sets status="none".
        avatar={<AvatarProduct size="xl" content="icon" status={isLoading ? "none" : status} />}
        headerActions={
          showMenu ? (
            <IconButton
              icon="ellipsis"
              variant="ghost"
              size="md"
              aria-label="More actions"
              isPressed={menu.open}
              noDebounce
              onClick={menu.onActions}
            />
          ) : undefined
        }
        nav={
          <SidePanelNavigation value={tab} onChange={(value) => setTab(value as ProductPanelTab)}>
            <TabItem value="details" warning={!isLoading && missing.subtype}>
              Details
            </TabItem>
            {/* Vendor costs before Inventory levels (Daniel, 2026-11-20). */}
            <TabItem value="vendorCosts">Vendor costs</TabItem>
            {showInventoryTab && <TabItem value="inventoryLevels">Inventory levels</TabItem>}
            {hasQuickbooksAccounting && (
              <TabItem value="accounting" warning={!isLoading && missing.account}>
                Accounting
              </TabItem>
            )}
            <TabItem value="history">History</TabItem>
          </SidePanelNavigation>
        }
        footer={
          !isLoading && inactive && canDeactivate ? (
            <PopoverFooter stretch>
              <Button size="lg" variant="solid" leftIcon="refresh" onClick={reactivate}>
                Reactivate
              </Button>
            </PopoverFooter>
          ) : !isLoading && inReview && (canDelete || canEdit) ? (
            <PopoverFooter stretch>
              {canDelete ? (
                <Button size="lg" variant="danger" leftIcon="trash-can" onClick={() => setDeleting(true)}>
                  Delete
                </Button>
              ) : undefined}
              {canEdit ? (
                <Button size="lg" variant="solid" leftIcon="circle-check" isDisabled={missing.subtype || missing.account} onClick={confirm}>
                  Confirm
                </Button>
              ) : undefined}
            </PopoverFooter>
          ) : !isLoading && tab === "vendorCosts" && canEditModules && costRows.length > 0 ? (
            // "Add vendor cost" — only with edit permission, and only beside a
            // list: the empty state carries its own button.
            <PopoverFooter stretch>
              <Button size="lg" variant="ghost" leftIcon="plus" onClick={() => setPickingVendor(true)}>
                Add vendor cost
              </Button>
            </PopoverFooter>
          ) : undefined
        }
        state={state}
        onRetry={onRetry}
        breakpoint={breakpoint}
      >
        <>
          {tab === "details" && (
            <>
              <GeneralModule
                product={record}
                onEdit={() => setEditingGeneral(true)}
                canEdit={canEditModules}
                hasSubtypes={PRODUCT_SUBTYPES.length > 0}
                hasInventory={hasInventory}
                missingSubtype={missing.subtype}
                isLoading={isLoading}
              />

              <PricingModule
                product={record}
                onEdit={() => setEditingPricing(true)}
                canEdit={canEditModules}
                useTaxes={useTaxes}
                isLoading={isLoading}
              />

              <DetailsModule
                product={record}
                onEdit={() => setEditingDetails(true)}
                canEdit={canEditModules}
                isLoading={isLoading}
              />

              <LabelsModule
                labels={labels}
                emptyCaption="No labels"
                onEdit={() => setPickingLabels(true)}
                canEdit={canEditModules}
                isLoading={isLoading}
              />

              {/* Production's `summary_template` — the summary every line item
                  made from this product starts with. */}
              <NotesModule
                title="Description"
                emptyCaption="No description"
                copyErrorTitle={'Couldn\'t copy "Description"'}
                notes={record.summary}
                onEdit={() => setEditingDescription(true)}
                canEdit={canEditModules}
                isLoading={isLoading}
              />

              <NotesModule
                title="Internal notes"
                emptyCaption="No internal notes"
                copyErrorTitle={'Couldn\'t copy "Internal notes"'}
                notes={record.notes}
                onEdit={() => setEditingNotes(true)}
                canEdit={canEditModules}
                isLoading={isLoading}
              />

              <InfoModule
                status={status}
                createdBy={createdByOf(record)}
                createdAt={record.createdAt}
                lastModifiedAt={record.lastModifiedAt}
                isLoading={isLoading}
              />
            </>
          )}

          {tab === "inventoryLevels" && showInventoryTab && (
            <InventoryLevelsTab
              // A different product starts with a fresh search and a closed group.
              key={record.id}
              locations={locations}
              levels={levels}
              onEdit={canEditModules ? editLevel : undefined}
              isLoading={isLoading}
            />
          )}

          {tab === "accounting" && hasQuickbooksAccounting && (
            <AccountingModule
              accounting={accountingOf(record)}
              showInventoryAccounts={showInventoryAccounts}
              accounts={accountLists}
              onEdit={() => setEditingAccounting(true)}
              canEdit={canEditModules}
              hideSyncStatus={inReview}
              isLoading={isLoading}
            />
          )}

          {tab === "history" && (
            <HistoryModule
              rows={history}
              kinds={["job", "invoice"]}
              mobile={mobile}
              onOpen={(row) => onOpenHistory?.(row)}
              isLoading={isLoading}
            />
          )}

          {tab === "vendorCosts" && (
            <VendorCostsTab
              key={record.id}
              costs={costRows}
              nameOf={nameOf}
              onEdit={canEditModules ? editCost : undefined}
              onMenu={canEditModules ? openCostMenu : undefined}
              menuVendorId={costMenu.open ? menuVendor : null}
              onAdd={canEditModules ? () => setPickingVendor(true) : undefined}
              noPermission={!canEdit}
              isLoading={isLoading}
            />
          )}
        </>
      </SidePanel>

      {/* Everything that portals itself lives OUTSIDE the panel. */}
      {mobile ? (
        <Menu
          open={menu.open}
          onClose={menu.close}
          // The drawer repeats the product's name — title only, no avatar.
          drawerHeader={
            <DrawerHeader>
              <PopoverHeaderContent>
                <PopoverHeaderText variant="title" title={record.name} />
              </PopoverHeaderContent>
            </DrawerHeader>
          }
          breakpoint="mobile"
        >
          {menuBody}
        </Menu>
      ) : (
        menu.pos != null && (
          <div
            ref={menu.cardRef}
            className={styles.anchoredMenu}
            style={{ top: menu.pos.top, left: menu.pos.left, right: menu.pos.right }}
          >
            <Menu open={menu.open} onClose={menu.close} breakpoint="desktop">
              {menuBody}
            </Menu>
          </div>
        )
      )}

      {/* A vendor cost card's ⋯ menu: Edit · Delete. The drawer is titled after the vendor. */}
      {mobile ? (
        <Menu
          open={costMenu.open}
          onClose={costMenu.close}
          drawerHeader={
            <DrawerHeader>
              <PopoverHeaderContent>
                <PopoverHeaderText variant="title" title={menuVendor != null ? nameOf(menuVendor) : ""} />
              </PopoverHeaderContent>
            </DrawerHeader>
          }
          breakpoint="mobile"
        >
          {costMenuBody}
        </Menu>
      ) : (
        costMenu.pos != null && (
          <div
            ref={costMenu.cardRef}
            className={styles.anchoredMenu}
            style={{ top: costMenu.pos.top, left: costMenu.pos.left, right: costMenu.pos.right }}
          >
            <Menu open={costMenu.open} onClose={costMenu.close} breakpoint="desktop">
              {costMenuBody}
            </Menu>
          </div>
        )
      )}

      {/* Every edit dialog is titled after its MODULE. */}
      <EditGeneralDialog
        open={editingGeneral}
        onClose={() => setEditingGeneral(false)}
        product={record}
        existingNames={existingNames}
        registeredBarcodes={barcodes}
        requireSubtypes={requireSubtypes}
        hasInventory={hasInventory}
        simulatedScanner={simulatedScanner}
        onSave={saveGeneral}
        breakpoint={breakpoint}
      />
      <EditPricingDialog
        open={editingPricing}
        onClose={() => setEditingPricing(false)}
        product={record}
        vendorCosts={costs}
        useTaxes={useTaxes}
        onSave={savePricing}
        breakpoint={breakpoint}
      />
      <EditInventoryLevelDialog
        open={levelOpen}
        onClose={() => setLevelOpen(false)}
        location={locations.find((location) => location.id === editingLevel)}
        level={(editingLevel != null && levels[editingLevel]) || EMPTY_STOCK}
        onSave={saveInventoryLevel}
        breakpoint={breakpoint}
      />
      <ActiveInactiveList
        open={pickingVendor}
        onClose={() => setPickingVendor(false)}
        mobile={mobile}
        title="Vendors"
        searchPlaceholder="Vendor..."
        noun="vendors"
        {...vendorPickerOptions(
          vendorList,
          costRows.map((row) => row.vendorId),
        )}
        onPick={addCost}
        emptySuffix=". Ask an admin to add a vendor."
      />
      <EditAccountingDialog
        open={editingAccounting}
        onClose={() => setEditingAccounting(false)}
        itemNoun="product"
        accounting={accountingOf(record)}
        showInventoryAccounts={showInventoryAccounts}
        accounts={accountLists}
        onSave={saveAccounting}
        breakpoint={breakpoint}
      />
      <EditDetailsDialog
        open={editingDetails}
        onClose={() => setEditingDetails(false)}
        product={record}
        onSave={saveDetails}
        breakpoint={breakpoint}
      />
      {editingCost != null && (
        <EditVendorCostDialog
          open={costOpen}
          onClose={() => setCostOpen(false)}
          vendorName={nameOf(editingCost.cost.vendorId)}
          cost={editingCost.cost}
          isNew={editingCost.isNew}
          onSave={saveVendorCost}
          breakpoint={breakpoint}
        />
      )}
      <LabelsSelectList
        open={pickingLabels}
        onClose={() => setPickingLabels(false)}
        labels={labels}
        pool={labelPool}
        title="Labels"
        onSave={saveLabels}
        breakpoint={breakpoint}
      />
      <EditNotesDialog
        open={editingDescription}
        onClose={() => setEditingDescription(false)}
        notes={record.summary}
        onSave={saveDescription}
        title="Description"
        titleHintContent="Copied to the line item when this product is added, and customers see it"
        fieldLabel="Description"
        showFieldLabel={false}
        toastSubject={'"Description" module'}
        errorTitle={'Couldn\'t update "Description" module'}
        breakpoint={breakpoint}
      />
      <EditNotesDialog
        open={editingNotes}
        onClose={() => setEditingNotes(false)}
        notes={record.notes}
        onSave={saveNotes}
        title="Internal notes"
        titleHintContent="Only your team sees this, and it never goes on a line item"
        fieldLabel="Internal notes"
        showFieldLabel={false}
        toastSubject={'"Internal notes" module'}
        errorTitle={'Couldn\'t update "Internal notes" module'}
        breakpoint={breakpoint}
      />

      <Prompt
        open={deactivating}
        title="Deactivate product?"
        body={`Are you sure you want to deactivate ${record.name}?`}
        actionLabel="Deactivate"
        actionVariant="danger"
        actionIcon="ban"
        onAction={deactivate}
        onCancel={() => setDeactivating(false)}
        breakpoint={breakpoint}
      />
      <Prompt
        open={deleteOpen}
        title={deletingCost?.title ?? ""}
        body={deletingCost?.body ?? ""}
        actionLabel="Delete"
        actionVariant="danger"
        actionIcon="trash-can"
        onAction={deleteCost}
        onCancel={() => setDeleteOpen(false)}
        breakpoint={breakpoint}
      />
      <Prompt
        open={deleting}
        title="Delete product?"
        body={`Are you sure you want to delete ${record.name}?`}
        actionLabel="Delete"
        actionVariant="danger"
        actionIcon="trash-can"
        onAction={remove}
        onCancel={() => setDeleting(false)}
        breakpoint={breakpoint}
      />
    </>
  );
}

export type { ProductDetails, ProductGeneral, ProductPanelProps, ProductPermissions, ProductPricing } from "./ProductPanel.types";
