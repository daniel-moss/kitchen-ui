import { useEffect, useState } from "react";

import AvatarTaxRate from "../../../components/Avatar/AvatarTaxRate";
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
import { TaxRateItem } from "../../../data/db";
import useIsDesktop from "../../../hooks/useIsDesktop";
import { createdByOf } from "../../LaborRatePanel/laborRateData";
import AccountingModule from "../../shared/AccountingModule";
import { useAnchoredMenu } from "../../shared/anchoredMenu";
import EditAccountingDialog, { AccountingEdits } from "../../shared/EditAccountingDialog";
import EditNotesDialog from "../../shared/EditNotesDialog";
import { slot } from "../../shared/helpers";
import InfoModule from "../../shared/InfoModule";
import LabelsModule from "../../shared/LabelsModule";
import LabelsSelectList from "../../shared/LabelsSelectList";
import NotesModule from "../../shared/NotesModule";

import EditGeneralDialog from "./forms/EditGeneralDialog";
import EditPricingDialog from "./forms/EditPricingDialog";
import GeneralModule from "./modules/GeneralModule";
import PricingModule from "./modules/PricingModule";
import { accountingOf, labelNamesOf, missingRequiredOf, taxRateStatusOf } from "./taxRateData";
import { TaxRateGeneral, TaxRatePanelProps, TaxRatePanelTab, TaxRatePricing } from "./TaxRatePanel.types";

import styles from "./TaxRatePanel.module.scss";

// The "Tax rate" side panel (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "↳ Tax Rate" → Side Panel 3254-80299), rebuilt 2026-11-23 to the other
// pricebook panels: the modules are the pricebook's "↳ Shared Modules", the
// Accounting tab "↳ Shared Tabs", and the Review / Inactive states, Deactivate
// / Reactivate / Confirm / Delete the "Shared Behavior" page.
//
// TWO TABS — no History: a tax rate is never a line item, and production's
// invoices keep only a COPY of its name and percent, with no link back to it
// (Daniel, 2026-11-23).
//   Details     General (Name only — a tax rate has no subtype) · Pricing
//               (Percentage) · Labels · Description · Internal notes · Info.
//   Accounting  the shared "Accounting" module in its tax rate mode — "Tax
//               collection agency" — for QuickBooks Desktop WHATEVER the
//               line-item setting. A missing agency is its "Warning" and turns
//               the tab amber.
//
// THE THREE STATES, production's `is_active` + `confirmed` folded into one:
//   Active    pens everywhere, an ellipsis menu holding Deactivate, no footer.
//   Review    every module editable; the footer's Delete + Confirm, Confirm
//             disabled until the agency is there. Accounting drops its sync
//             rows.
//   Inactive  read-only, no menu; the footer offers Reactivate.

export default function TaxRatePanel({
  open,
  onClose,
  rate,
  labelPool = [],
  existingNames = [],
  hasQuickbooksAccounting = true,
  permissions = {},
  onBack,
  onSaveGeneral,
  onSavePricing,
  onSaveAccounting,
  onSaveLabels,
  onSaveDescription,
  onSaveNotes,
  onDeactivate,
  onReactivate,
  onConfirm,
  onDelete,
  isLoading = false,
  state = "content",
  onRetry,
  breakpoint = "auto",
}: TaxRatePanelProps) {
  const mobile = !useIsDesktop(breakpoint);

  const [editingGeneral, setEditingGeneral] = useState(false);
  const [editingPricing, setEditingPricing] = useState(false);
  const [editingAccounting, setEditingAccounting] = useState(false);
  const [pickingLabels, setPickingLabels] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<TaxRatePanelTab>("details");

  const menu = useAnchoredMenu(!mobile, "end");

  // The panel's WORKING COPY of the record. The caller stays the source of
  // truth — every save still calls its handler — but the panel applies the edit
  // itself too, so a form never looks like it did nothing just because a host
  // has not wired that one handler yet (the Equipment panel's rule).
  const [record, setRecord] = useState(rate);
  useEffect(() => setRecord(rate), [rate]);
  // A different tax rate starts on Details, like every opening.
  useEffect(() => setTab("details"), [rate.id]);

  // Labels are held by NAME: the picker can create one, which has no id yet.
  const [labels, setLabels] = useState<string[]>(() => labelNamesOf(rate));
  useEffect(() => setLabels(labelNamesOf(rate)), [rate]);

  // Closing the panel closes everything it opened.
  useEffect(() => {
    if (open) return;
    menu.close();
    setEditingGeneral(false);
    setEditingPricing(false);
    setEditingAccounting(false);
    setPickingLabels(false);
    setEditingDescription(false);
    setEditingNotes(false);
    setDeactivating(false);
    setDeleting(false);
    setTab("details");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const status = taxRateStatusOf(record);
  const inReview = status === "review";
  const inactive = status === "inactive";

  const canEdit = permissions.edit !== false;
  const canDeactivate = permissions.deactivate !== false;
  const canDelete = permissions.remove !== false;
  // The pens. Only an inactive tax rate is read-only.
  const canEditModules = canEdit && !inactive;

  const missing = missingRequiredOf(record, { hasAccounting: hasQuickbooksAccounting });

  // The ellipsis exists only in the Active state: Review and Inactive each have
  // their own way out in the footer.
  const showMenu = !isLoading && !inReview && !inactive && canDeactivate;

  const saveGeneral = async (edits: TaxRateGeneral) => {
    if ((await onSaveGeneral?.(edits)) === false) return false;
    setRecord((prev) => ({ ...prev, ...edits }));
  };

  const savePricing = async (edits: TaxRatePricing) => {
    if ((await onSavePricing?.(edits)) === false) return false;
    setRecord((prev) => ({ ...prev, ...edits }));
  };

  const saveAccounting = async ({ taxAgencyVendorId }: AccountingEdits) => {
    if (taxAgencyVendorId == null) return false;
    if ((await onSaveAccounting?.(taxAgencyVendorId)) === false) return false;
    setRecord((prev) => ({ ...prev, quickbooksVendorId: taxAgencyVendorId }));
  };

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

  // The Description is production's `summary_template` (the db's `summary`).
  const saveDescription = async (summary: string) => {
    if ((await onSaveDescription?.(summary)) === false) return false;
    setRecord((prev) => ({ ...prev, summary }));
  };

  const saveNotes = async (notes: string) => {
    if ((await onSaveNotes?.(notes)) === false) return false;
    setRecord((prev) => ({ ...prev, notes }));
  };

  // The four whole-record actions. Each one applies locally, then toasts — the
  // success ones are `detailed` with the tax rate's name as the caption.
  const runAction = async (
    action: (() => void | boolean | Promise<void | boolean>) | undefined,
    apply: (prev: TaxRateItem) => TaxRateItem,
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
    return runAction(
      onDeactivate,
      (prev) => ({ ...prev, isActive: false }),
      "Tax rate deactivated",
      "Couldn't deactivate the tax rate",
    );
  };

  const reactivate = () =>
    runAction(onReactivate, (prev) => ({ ...prev, isActive: true }), "Tax rate reactivated", "Couldn't reactivate the tax rate");

  const confirm = () =>
    runAction(onConfirm, (prev) => ({ ...prev, status: "active" }), "Tax rate confirmed", "Couldn't confirm the tax rate");

  const remove = () => {
    setDeleting(false);
    return runAction(onDelete, (prev) => prev, "Tax rate deleted", "Couldn't delete the tax rate");
  };

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
        // No status while loading: the record has not arrived yet.
        avatar={<AvatarTaxRate size="xl" status={isLoading ? "none" : status} />}
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
          <SidePanelNavigation value={tab} onChange={(value) => setTab(value as TaxRatePanelTab)}>
            <TabItem value="details">
              Details
            </TabItem>
            {hasQuickbooksAccounting && (
              <TabItem value="accounting" warning={!isLoading && missing.account}>
                Accounting
              </TabItem>
            )}
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
                <Button
                  size="lg"
                  variant="solid"
                  leftIcon="circle-check"
                  // "Stays disabled until all required values provided."
                  isDisabled={missing.account}
                  onClick={confirm}
                >
                  Confirm
                </Button>
              ) : undefined}
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
                rate={record}
                onEdit={() => setEditingGeneral(true)}
                canEdit={canEditModules}
                isLoading={isLoading}
              />

              <PricingModule
                rate={record}
                onEdit={() => setEditingPricing(true)}
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

              {/* Production's `summary_template`. */}
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

          {tab === "accounting" && hasQuickbooksAccounting && (
            <AccountingModule
              accounting={accountingOf(record)}
              isTaxRate
              onEdit={() => setEditingAccounting(true)}
              canEdit={canEditModules}
              hideSyncStatus={inReview}
              isLoading={isLoading}
            />
          )}

        </>
      </SidePanel>

      {/* Everything that portals itself lives OUTSIDE the panel — the desktop
          menu card must not sit inside the panel's scroll area. */}
      {mobile ? (
        <Menu
          open={menu.open}
          onClose={menu.close}
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

      {/* Every edit dialog is titled after its MODULE — the panel behind it
          already names the tax rate. */}
      <EditGeneralDialog
        open={editingGeneral}
        onClose={() => setEditingGeneral(false)}
        rate={record}
        existingNames={existingNames}
        onSave={saveGeneral}
        breakpoint={breakpoint}
      />
      <EditPricingDialog
        open={editingPricing}
        onClose={() => setEditingPricing(false)}
        rate={record}
        onSave={savePricing}
        breakpoint={breakpoint}
      />
      <EditAccountingDialog
        open={editingAccounting}
        onClose={() => setEditingAccounting(false)}
        itemNoun="tax rate"
        isTaxRate
        accounting={accountingOf(record)}
        onSave={saveAccounting}
        breakpoint={breakpoint}
      />
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
        titleHintContent="Copied to the line item when this tax rate is added, and customers see it"
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
        title="Deactivate tax rate?"
        body={`Are you sure you want to deactivate ${record.name}?`}
        actionLabel="Deactivate"
        actionVariant="danger"
        actionIcon="ban"
        onAction={deactivate}
        onCancel={() => setDeactivating(false)}
        breakpoint={breakpoint}
      />
      {/* Only a Review item can be deleted: production refuses to delete a
          confirmed one. */}
      <Prompt
        open={deleting}
        title="Delete tax rate?"
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

// Re-exported so a consumer can type its handlers without reaching inside.
export type { TaxRateGeneral, TaxRatePanelProps, TaxRatePermissions, TaxRatePricing } from "./TaxRatePanel.types";
