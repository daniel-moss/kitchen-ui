import { useEffect, useMemo, useState } from "react";

import AvatarLaborRate from "../../components/Avatar/AvatarLaborRate";
import Button from "../../components/Button/Button";
import IconButton from "../../components/IconButton/IconButton";
import Menu from "../../components/Menu/Menu";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import DrawerHeader from "../../components/Popover/DrawerHeader";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import PopoverHeaderContent from "../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../components/Popover/PopoverHeaderText";
import Prompt from "../../components/Prompt/Prompt";
import SidePanel from "../../components/SidePanel/SidePanel";
import SidePanelNavigation from "../../components/SidePanel/SidePanelNavigation";
import TabItem from "../../components/Tabs/TabItem";
import { toast } from "../../components/Toast/Toaster";
import { LABOR_LABELS, LaborItem } from "../../data/db";
import useIsDesktop from "../../hooks/useIsDesktop";
import HistoryModule from "../EquipmentPanel/modules/HistoryModule";
import { useAnchoredMenu } from "../shared/anchoredMenu";
import EditNotesDialog from "../shared/EditNotesDialog";
import { slot } from "../shared/helpers";
import LabelsModule from "../shared/LabelsModule";
import LabelsSelectList from "../shared/LabelsSelectList";
import NotesModule from "../shared/NotesModule";

import EditAccountingDialog from "./forms/EditAccountingDialog";
import EditGeneralDialog from "./forms/EditGeneralDialog";
import EditPricingDialog from "./forms/EditPricingDialog";
import AccountingModule from "./modules/AccountingModule";
import GeneralModule from "./modules/GeneralModule";
import PricingModule from "./modules/PricingModule";
import { laborRateHistoryRows, laborRateStatusOf, missingRequiredOf } from "./laborRateData";
import { LaborRateGeneral, LaborRatePanelProps, LaborRatePanelTab, LaborRatePricing } from "./LaborRatePanel.types";

import styles from "./LaborRatePanel.module.scss";

// The "Labor rate" side panel (Figma file qhebbfbPHDVnv8IF1EC7Zg, page "Labor
// Rate" → Side Panel; the Review state, Deactivate / Reactivate and the
// Labels / Description / Internal notes modules are pricebook-wide, on the
// "Shared Behavior" and "Shared Modules" pages). ONE module for every labor
// rate; the record is a prop, so nothing here is specific to one rate.
//
// THREE TABS (2026-10-21):
//   Details     General · Pricing · Labels · Description · Internal notes.
//   Accounting  the "Accounting" module — only for QuickBooks Desktop with the
//               "Detailed Split" setup, like the module itself.
//   History     the Equipment panel's History module, jobs and invoices only.
// A tab whose module warns (a required subtype or revenue account missing)
// turns amber, so a disabled Confirm always has a visible reason. The panel
// opens on Details. The footer — Review's Delete + Confirm, Inactive's
// Reactivate — is "shown on all tabs".
//
// THE THREE STATES, which are production's `is_active` + `confirmed` folded
// into one:
//   Active    the full panel: pens everywhere, an ellipsis menu holding
//             Deactivate, no footer.
//   Review    the item arrived unvetted — the system mints one from any
//             free-text line item a tech types. Every module is EDITABLE here
//             (Daniel, 2026-10-21), so the user can add what the item lacks;
//             Confirm "stays disabled until all required values provided" and
//             the General / Accounting "Warning" states say what is missing.
//             BACKEND NOTE: production sets `confirmed = true` on every save,
//             so a module save would confirm the item early — the devs are
//             changing that. The footer's Delete + Confirm are the two ways
//             out. Accounting drops its sync rows, and General its "Last
//             modified".
//   Inactive  read-only. Every pen disappears, the menu with them, and the
//             footer offers Reactivate (it replaced the warning banner,
//             2026-10-21). The two copy buttons stay — reading is not editing.
//
// Deactivating is NOT where production keeps it (an "Active Status" switch
// inside the edit form); this design makes it a menu action with a Prompt.
// Production also agrees on two things worth keeping: an item in Review cannot
// be deactivated (confirm it first), and Delete always asks first.

const labelNamesOf = (rate: LaborItem) =>
  rate.labelIds.map((id) => LABOR_LABELS.find((label) => label.id === id)?.name ?? id);

export default function LaborRatePanel({
  open,
  onClose,
  rate,
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
  onSaveSummary,
  onSaveNotes,
  onDeactivate,
  onReactivate,
  onConfirm,
  onDelete,
  onOpenHistory,
  isLoading = false,
  state = "content",
  onRetry,
  breakpoint = "auto",
}: LaborRatePanelProps) {
  const mobile = !useIsDesktop(breakpoint);

  const [editingGeneral, setEditingGeneral] = useState(false);
  const [editingPricing, setEditingPricing] = useState(false);
  const [editingAccounting, setEditingAccounting] = useState(false);
  const [pickingLabels, setPickingLabels] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<LaborRatePanelTab>("details");

  const menu = useAnchoredMenu(!mobile, "end");

  // The panel's WORKING COPY of the record. The caller stays the source of
  // truth — every save still calls its handler — but the panel applies the edit
  // itself too, so a form never looks like it did nothing just because a host
  // has not wired that one handler yet (the Equipment panel's rule).
  const [record, setRecord] = useState(rate);
  useEffect(() => setRecord(rate), [rate]);
  // A different rate starts on Details, like every opening.
  useEffect(() => setTab("details"), [rate.id]);
  const history = useMemo(() => laborRateHistoryRows(record.id), [record.id]);

  // Labels are held by NAME: the picker can create one, which has no id yet.
  const [labels, setLabels] = useState<string[]>(() => labelNamesOf(rate));
  useEffect(() => setLabels(labelNamesOf(rate)), [rate]);

  // Closing the panel closes everything it opened — a menu left open would
  // reappear on the way back.
  useEffect(() => {
    if (open) return;
    menu.close();
    setEditingGeneral(false);
    setEditingPricing(false);
    setEditingAccounting(false);
    setPickingLabels(false);
    setEditingSummary(false);
    setEditingNotes(false);
    setDeactivating(false);
    setDeleting(false);
    setTab("details");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const status = laborRateStatusOf(record);
  const inReview = status === "review";
  const inactive = status === "inactive";

  const canEdit = permissions.edit !== false;
  const canDeactivate = permissions.deactivate !== false;
  const canDelete = permissions.remove !== false;

  // The pens. Only an inactive rate is read-only ("Reactivate to edit
  // details").
  const canEditModules = canEdit && !inactive;

  // The required values the record lacks — the modules' "Warning" states, and
  // in Review what keeps Confirm disabled.
  const missing = missingRequiredOf(record, { requireSubtypes, hasAccounting: hasQuickbooksAccounting });

  // The ellipsis exists only in the Active state: Review and Inactive both say
  // "No context menu button", and each has its own way out in the footer.
  const showMenu = !isLoading && !inReview && !inactive && canDeactivate;

  const saveGeneral = async (edits: LaborRateGeneral) => {
    if ((await onSaveGeneral?.(edits)) === false) return false;
    setRecord((prev) => ({ ...prev, ...edits }));
  };

  const savePricing = async (edits: LaborRatePricing) => {
    if ((await onSavePricing?.(edits)) === false) return false;
    setRecord((prev) => ({ ...prev, ...edits }));
  };

  const saveAccounting = async (quickbooksAccountId: string) => {
    if ((await onSaveAccounting?.(quickbooksAccountId)) === false) return false;
    setRecord((prev) => ({ ...prev, quickbooksAccountId }));
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

  const saveSummary = async (summary: string) => {
    if ((await onSaveSummary?.(summary)) === false) return false;
    setRecord((prev) => ({ ...prev, summary }));
  };

  const saveNotes = async (notes: string) => {
    if ((await onSaveNotes?.(notes)) === false) return false;
    setRecord((prev) => ({ ...prev, notes }));
  };

  // The four whole-record actions. Each one applies locally, then toasts — the
  // success ones are `detailed` with the rate's name as the caption.
  //
  // The titles are the bare past participle ("Labor rate deactivated"), not
  // "is deactivated" (Daniel, 2026-10-08): a toast reports an event that just
  // finished, while "is …" describes a state — which is the Status row's job.
  const runAction = async (
    action: (() => void | boolean | Promise<void | boolean>) | undefined,
    apply: (prev: LaborItem) => LaborItem,
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
      "Labor rate deactivated",
      "Couldn't deactivate the labor rate",
    );
  };

  const reactivate = () =>
    runAction(onReactivate, (prev) => ({ ...prev, isActive: true }), "Labor rate reactivated", "Couldn't reactivate the labor rate");

  // "Confirms a pricebook item. The status changes to Active and the item
  // shows up on the Confirmed tab" (the Confirm button's annotation).
  const confirm = () =>
    runAction(onConfirm, (prev) => ({ ...prev, status: "active" }), "Labor rate confirmed", "Couldn't confirm the labor rate");

  const remove = () => {
    setDeleting(false);
    return runAction(onDelete, (prev) => prev, "Labor rate deleted", "Couldn't delete the labor rate");
  };

  // ONE item: a danger "Deactivate" with the ban icon (node 1-6333).
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
        // No status while loading: the record has not arrived, so the dot would
        // be a guess (the Loading frame sets status="none").
        avatar={<AvatarLaborRate size="xl" status={isLoading ? "none" : status} />}
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
          <SidePanelNavigation value={tab} onChange={(value) => setTab(value as LaborRatePanelTab)}>
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
          // Inactive: "Reactivate", for a user who may reactivate.
          !isLoading && inactive && canDeactivate ? (
            <PopoverFooter stretch>
              <Button size="lg" variant="solid" leftIcon="refresh" onClick={reactivate}>
                Reactivate
              </Button>
            </PopoverFooter>
          ) : // Review's two actions. They share the width (ActionBar
          // layout=fullWidth), Delete first — and each one can be missing on
          // its own, because production gates them on different permissions.
          !isLoading && inReview && (canDelete || canEdit) ? (
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
                rate={record}
                onEdit={() => setEditingGeneral(true)}
                canEdit={canEditModules}
                missingSubtype={missing.subtype}
                hideLastModified={inReview}
                isLoading={isLoading}
              />

              <PricingModule
                rate={record}
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

              {/* Both text modules keep their COPY button when editing is locked —
                  reading is not editing. */}
              {/* Production's `summary_template` — the summary every line item made
                  from this rate starts with. */}
              <NotesModule
                title="Description"
                emptyCaption="No description"
                copyErrorTitle={'Couldn\'t copy "Description"'}
                notes={record.summary}
                onEdit={() => setEditingSummary(true)}
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
            </>
          )}

          {tab === "accounting" && hasQuickbooksAccounting && (
            <AccountingModule
              rate={record}
              onEdit={() => setEditingAccounting(true)}
              canEdit={canEditModules}
              hideSyncStatus={inReview}
              isLoading={isLoading}
            />
          )}

          {/* "Only jobs and invoices" — otherwise the Equipment panel's
              History module as it is (its empty, loading and mobile states). */}
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
          // The drawer repeats the rate's name — title only, no avatar
          // (node 1-6339).
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

      {/* Every edit dialog is titled after its MODULE (Daniel, 2026-10-08) —
          the panel behind it already names the rate. */}
      <EditGeneralDialog
        open={editingGeneral}
        onClose={() => setEditingGeneral(false)}
        rate={record}
        existingNames={existingNames}
        requireSubtypes={requireSubtypes}
        onSave={saveGeneral}
        breakpoint={breakpoint}
      />
      <EditPricingDialog
        open={editingPricing}
        onClose={() => setEditingPricing(false)}
        rate={record}
        useTaxes={useTaxes}
        onSave={savePricing}
        breakpoint={breakpoint}
      />
      <EditAccountingDialog
        open={editingAccounting}
        onClose={() => setEditingAccounting(false)}
        rate={record}
        onSave={saveAccounting}
        breakpoint={breakpoint}
      />
      {/* The SHARED Labels picker — the dialog/drawer version with "Apply",
          because a panel module saves straight to the record. */}
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
        open={editingSummary}
        onClose={() => setEditingSummary(false)}
        notes={record.summary}
        onSave={saveSummary}
        title="Description"
        titleHintContent="Copied to the line item when this labor rate is added, and customers see it"
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
        title="Deactivate labor rate?"
        body={`Are you sure you want to deactivate ${record.name}?`}
        actionLabel="Deactivate"
        actionVariant="danger"
        actionIcon="ban"
        onAction={deactivate}
        onCancel={() => setDeactivating(false)}
        breakpoint={breakpoint}
      />
      {/* Delete asks first — which is also what production does today, through
          its own confirm modal. Only a Review item can be deleted: production
          refuses to delete a confirmed one. */}
      <Prompt
        open={deleting}
        title="Delete labor rate?"
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
export type { LaborRateGeneral, LaborRatePanelProps, LaborRatePermissions, LaborRatePricing } from "./LaborRatePanel.types";
