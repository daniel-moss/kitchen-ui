import { useEffect, useMemo, useState } from "react";

import AvatarOther from "../../../components/Avatar/AvatarOther";
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
import { ChargeItem, OTHER_SUBTYPES } from "../../../data/db";
import useIsDesktop from "../../../hooks/useIsDesktop";
import HistoryModule from "../../EquipmentPanel/modules/HistoryModule";
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
import { accountingOf, labelNamesOf, missingRequiredOf, otherChargeHistoryRows, otherChargeStatusOf } from "./otherChargeData";
import { OtherChargeGeneral, OtherChargePanelProps, OtherChargePanelTab, OtherChargePricing } from "./OtherChargePanel.types";

import styles from "./OtherChargePanel.module.scss";

// The "Other charge" side panel (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "↳ Other Charges" → Side Panel 3249-73484; the modules are the pricebook's
// "↳ Shared Modules", the tabs "↳ Shared Tabs", and the Review / Inactive
// states, Deactivate / Reactivate / Confirm / Delete the "Shared Behavior"
// page). The Labor rate panel's twin, without the labor-only "Type".
//
// THREE TABS:
//   Details     General · Pricing · Labels · Description · Internal notes · Info.
//   Accounting  the shared "Accounting" module — only for QuickBooks Desktop
//               with the "Detailed Split" setup. Revenue account only.
//   History     the Equipment panel's History module, jobs and invoices only.
// A tab whose module warns (a required subtype or revenue account missing)
// turns amber, so a disabled Confirm always has a visible reason.
//
// THE THREE STATES, production's `is_active` + `confirmed` folded into one:
//   Active    pens everywhere, an ellipsis menu holding Deactivate, no footer.
//   Review    every module editable; the footer's Delete + Confirm, Confirm
//             disabled until every required value is there. Accounting drops
//             its sync rows.
//   Inactive  read-only, no menu; the footer offers Reactivate. The copy
//             buttons stay — reading is not editing.

export default function OtherChargePanel({
  open,
  onClose,
  charge,
  labelPool = [],
  existingNames = [],
  requireSubtypes = false,
  useTaxes = true,
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
  onOpenHistory,
  historyRows,
  isLoading = false,
  state = "content",
  onRetry,
  breakpoint = "auto",
}: OtherChargePanelProps) {
  const mobile = !useIsDesktop(breakpoint);

  const [editingGeneral, setEditingGeneral] = useState(false);
  const [editingPricing, setEditingPricing] = useState(false);
  const [editingAccounting, setEditingAccounting] = useState(false);
  const [pickingLabels, setPickingLabels] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<OtherChargePanelTab>("details");

  const menu = useAnchoredMenu(!mobile, "end");

  // The panel's WORKING COPY of the record. The caller stays the source of
  // truth — every save still calls its handler — but the panel applies the edit
  // itself too, so a form never looks like it did nothing just because a host
  // has not wired that one handler yet (the Equipment panel's rule).
  const [record, setRecord] = useState(charge);
  useEffect(() => setRecord(charge), [charge]);
  // A different charge starts on Details, like every opening.
  useEffect(() => setTab("details"), [charge.id]);
  const history = useMemo(() => historyRows ?? otherChargeHistoryRows(record.id), [historyRows, record.id]);

  // Labels are held by NAME: the picker can create one, which has no id yet.
  const [labels, setLabels] = useState<string[]>(() => labelNamesOf(charge));
  useEffect(() => setLabels(labelNamesOf(charge)), [charge]);

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

  const status = otherChargeStatusOf(record);
  const inReview = status === "review";
  const inactive = status === "inactive";

  const canEdit = permissions.edit !== false;
  const canDeactivate = permissions.deactivate !== false;
  const canDelete = permissions.remove !== false;
  // The pens. Only an inactive charge is read-only.
  const canEditModules = canEdit && !inactive;

  const missing = missingRequiredOf(record, { requireSubtypes, hasAccounting: hasQuickbooksAccounting });

  // The ellipsis exists only in the Active state: Review and Inactive each have
  // their own way out in the footer.
  const showMenu = !isLoading && !inReview && !inactive && canDeactivate;

  const saveGeneral = async (edits: OtherChargeGeneral) => {
    if ((await onSaveGeneral?.(edits)) === false) return false;
    setRecord((prev) => ({ ...prev, ...edits }));
  };

  const savePricing = async (edits: OtherChargePricing) => {
    if ((await onSavePricing?.(edits)) === false) return false;
    setRecord((prev) => ({ ...prev, ...edits }));
  };

  const saveAccounting = async ({ revenueAccountId }: AccountingEdits) => {
    if (revenueAccountId == null) return false;
    if ((await onSaveAccounting?.(revenueAccountId)) === false) return false;
    setRecord((prev) => ({ ...prev, quickbooksAccountId: revenueAccountId }));
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
  // success ones are `detailed` with the charge's name as the caption.
  const runAction = async (
    action: (() => void | boolean | Promise<void | boolean>) | undefined,
    apply: (prev: ChargeItem) => ChargeItem,
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
      "Other charge deactivated",
      "Couldn't deactivate the other charge",
    );
  };

  const reactivate = () =>
    runAction(onReactivate, (prev) => ({ ...prev, isActive: true }), "Other charge reactivated", "Couldn't reactivate the other charge");

  const confirm = () =>
    runAction(onConfirm, (prev) => ({ ...prev, status: "active" }), "Other charge confirmed", "Couldn't confirm the other charge");

  const remove = () => {
    setDeleting(false);
    return runAction(onDelete, (prev) => prev, "Other charge deleted", "Couldn't delete the other charge");
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
        avatar={<AvatarOther size="xl" status={isLoading ? "none" : status} />}
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
          <SidePanelNavigation value={tab} onChange={(value) => setTab(value as OtherChargePanelTab)}>
            <TabItem value="details" warning={!isLoading && missing.subtype}>
              Details
            </TabItem>
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
                <Button
                  size="lg"
                  variant="solid"
                  leftIcon="circle-check"
                  // "Stays disabled until all required values provided."
                  isDisabled={missing.subtype || missing.account}
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
                charge={record}
                onEdit={() => setEditingGeneral(true)}
                canEdit={canEditModules}
                hasSubtypes={OTHER_SUBTYPES.length > 0}
                missingSubtype={missing.subtype}
                isLoading={isLoading}
              />

              <PricingModule
                charge={record}
                onEdit={() => setEditingPricing(true)}
                canEdit={canEditModules}
                useTaxes={useTaxes}
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
                  made from this charge starts with. */}
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
                notes={record.notes ?? ""}
                onEdit={() => setEditingNotes(true)}
                canEdit={canEditModules}
                isLoading={isLoading}
              />

              <InfoModule
                status={status}
                createdBy={createdByOf(record)}
                createdAt={record.createdAt ?? record.lastModifiedAt}
                lastModifiedAt={record.lastModifiedAt}
                isLoading={isLoading}
              />
            </>
          )}

          {tab === "accounting" && hasQuickbooksAccounting && (
            <AccountingModule
              accounting={accountingOf(record)}
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
          already names the charge. */}
      <EditGeneralDialog
        open={editingGeneral}
        onClose={() => setEditingGeneral(false)}
        charge={record}
        existingNames={existingNames}
        requireSubtypes={requireSubtypes}
        onSave={saveGeneral}
        breakpoint={breakpoint}
      />
      <EditPricingDialog
        open={editingPricing}
        onClose={() => setEditingPricing(false)}
        charge={record}
        useTaxes={useTaxes}
        onSave={savePricing}
        breakpoint={breakpoint}
      />
      <EditAccountingDialog
        open={editingAccounting}
        onClose={() => setEditingAccounting(false)}
        itemNoun="other charge"
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
        titleHintContent="Copied to the line item when this other charge is added, and customers see it"
        fieldLabel="Description"
        showFieldLabel={false}
        toastSubject={'"Description" module'}
        errorTitle={'Couldn\'t update "Description" module'}
        breakpoint={breakpoint}
      />
      <EditNotesDialog
        open={editingNotes}
        onClose={() => setEditingNotes(false)}
        notes={record.notes ?? ""}
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
        title="Deactivate other charge?"
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
        title="Delete other charge?"
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
export type { OtherChargeGeneral, OtherChargePanelProps, OtherChargePermissions, OtherChargePricing } from "./OtherChargePanel.types";
