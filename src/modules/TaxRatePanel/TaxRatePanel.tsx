import { useEffect, useState } from "react";

import AlertBanner from "../../components/AlertBanner/AlertBanner";
import AvatarTaxRate from "../../components/Avatar/AvatarTaxRate";
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
import { toast } from "../../components/Toast/Toaster";
import { TAX_RATE_LABELS, TaxRateItem } from "../../data/db";
import useIsDesktop from "../../hooks/useIsDesktop";
import { useAnchoredMenu } from "../shared/anchoredMenu";
import EditNotesDialog from "../shared/EditNotesDialog";
import { slot } from "../shared/helpers";
import LabelsModule from "../shared/LabelsModule";
import LabelsSelectList from "../shared/LabelsSelectList";
import NotesModule from "../shared/NotesModule";

import EditAccountingDialog from "./forms/EditAccountingDialog";
import EditGeneralDetailsDialog from "./forms/EditGeneralDetailsDialog";
import AccountingModule from "./modules/AccountingModule";
import GeneralDetailsModule from "./modules/GeneralDetailsModule";
import { taxRateStatusOf } from "./taxRateData";
import { TaxRateDetails, TaxRatePanelProps } from "./TaxRatePanel.types";

import styles from "./TaxRatePanel.module.scss";

// The "Tax rate" side panel (Figma file yX3dKkafSEmbX9K8EOwS08, page
// "👍 Validated"). ONE module for every tax rate; the record is a prop, so
// nothing here is specific to one rate.
//
// No navigation. Five display modules — General details · Accounting · Labels ·
// Summary template · Internal notes — and a footer that exists ONLY in Review.
//
// THE THREE STATES, which are production's `is_active` + `confirmed` folded
// into one:
//   Active    the full panel: pens everywhere, an ellipsis menu holding
//             Deactivate, no footer.
//   Review    the rate arrived unvetted (imported from QuickBooks, usually).
//             Pens stay — production lets you correct a rate before accepting
//             it — but the menu is gone and the footer offers Delete + Confirm.
//             The Accounting module also drops its sync row, which could only
//             say "Not synced" while the rate is unconfirmed.
//   Inactive  read-only. Every pen disappears, the menu with them, and a
//             warning banner offers Reactivate. The two copy buttons stay —
//             reading is not editing.
//
// Deactivating is NOT where production keeps it (an "Active Status" switch
// inside the edit form); this design makes it a menu action with a Prompt.
// Production also agrees on two things worth keeping: a rate in Review cannot
// be deactivated (confirm it first), and Delete always asks first.

const labelNamesOf = (rate: TaxRateItem) =>
  rate.labelIds.map((id) => TAX_RATE_LABELS.find((label) => label.id === id)?.name ?? id);

export default function TaxRatePanel({
  open,
  onClose,
  rate,
  labelPool = [],
  hasAccountingIntegration = true,
  permissions = {},
  onBack,
  onSaveDetails,
  onSaveAccounting,
  onSaveLabels,
  onSaveSummary,
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

  const [editingDetails, setEditingDetails] = useState(false);
  const [editingAccounting, setEditingAccounting] = useState(false);
  const [pickingLabels, setPickingLabels] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const menu = useAnchoredMenu(!mobile, "end");

  // The panel's WORKING COPY of the record. The caller stays the source of
  // truth — every save still calls its handler — but the panel applies the edit
  // itself too, so a form never looks like it did nothing just because a host
  // has not wired that one handler yet (the Equipment panel's rule).
  const [record, setRecord] = useState(rate);
  useEffect(() => setRecord(rate), [rate]);

  // Labels are held by NAME: the picker can create one, which has no id yet.
  const [labels, setLabels] = useState<string[]>(() => labelNamesOf(rate));
  useEffect(() => setLabels(labelNamesOf(rate)), [rate]);

  // Closing the panel closes everything it opened — a menu left open would
  // reappear on the way back.
  useEffect(() => {
    if (open) return;
    menu.close();
    setEditingDetails(false);
    setEditingAccounting(false);
    setPickingLabels(false);
    setEditingSummary(false);
    setEditingNotes(false);
    setDeactivating(false);
    setDeleting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const status = taxRateStatusOf(record);
  const inReview = status === "review";
  const inactive = status === "inactive";

  // An inactive rate is read-only ("This tax rate is inactive. Reactivate to
  // edit details") — production disables every field the same way.
  const canEdit = !inactive && permissions.edit !== false;
  const canDeactivate = permissions.deactivate !== false;
  const canDelete = permissions.remove !== false;

  // The ellipsis exists only in the Active state: Review and Inactive both say
  // "No context menu button", and each has its own way out — the footer and the
  // banner's link.
  const showMenu = !isLoading && !inReview && !inactive && canDeactivate;

  const saveDetails = async (edits: TaxRateDetails) => {
    if ((await onSaveDetails?.(edits)) === false) return false;
    setRecord((prev) => ({ ...prev, ...edits }));
  };

  const saveAccounting = async (quickbooksVendorId: string) => {
    if ((await onSaveAccounting?.(quickbooksVendorId)) === false) return false;
    setRecord((prev) => ({ ...prev, quickbooksVendorId }));
  };

  const saveLabels = async (picked: string[]) => {
    setPickingLabels(false);
    if ((await onSaveLabels?.(picked)) === false) {
      toast({
        type: "error",
        variant: "detailed",
        title: 'Could not update "Labels" module',
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
      "Tax rate is deactivated",
      "Could not deactivate the tax rate",
    );
  };

  const reactivate = () =>
    runAction(onReactivate, (prev) => ({ ...prev, isActive: true }), "Tax rate is reactivated", "Could not reactivate the tax rate");

  // "Accepts a tax rate. The status changes to Active and the item shows up on
  // the Confirmed tab" (the Confirm button's annotation).
  const confirm = () =>
    runAction(onConfirm, (prev) => ({ ...prev, status: "active" }), "Tax rate confirmed", "Could not confirm the tax rate");

  const remove = () => {
    setDeleting(false);
    return runAction(onDelete, (prev) => prev, "Tax rate deleted", "Could not delete the tax rate");
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
        footer={
          // Review's two actions. They share the width (ActionBar
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
                <Button size="lg" variant="solid" leftIcon="circle-check" onClick={confirm}>
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
          {/* The inactive banner. With no permission to reactivate there is
              nothing to offer, so it drops to the vertical orientation — a
              horizontal alert must have a CTA. */}
          {!isLoading && inactive &&
            (canDeactivate ? (
              <AlertBanner status="warning" ctaLabel="Reactivate" ctaOnClick={reactivate}>
                This tax rate is inactive. Reactivate to edit details.
              </AlertBanner>
            ) : (
              <AlertBanner status="warning" orientation="vertical">
                This tax rate is inactive. Reactivate to edit details.
              </AlertBanner>
            ))}

          <GeneralDetailsModule
            rate={record}
            onEdit={() => setEditingDetails(true)}
            canEdit={canEdit}
            isLoading={isLoading}
          />

          {hasAccountingIntegration && (
            <AccountingModule
              rate={record}
              onEdit={() => setEditingAccounting(true)}
              canEdit={canEdit}
              hideSyncStatus={inReview}
              isLoading={isLoading}
            />
          )}

          <LabelsModule labels={labels} onEdit={() => setPickingLabels(true)} canEdit={canEdit} isLoading={isLoading} />

          {/* Both text modules keep their COPY button when editing is locked —
              reading is not editing (the Deactivated frame keeps exactly those
              two buttons). */}
          <NotesModule
            title="Summary template"
            emptyCaption="No summary template here yet"
            notes={record.summary}
            onEdit={() => setEditingSummary(true)}
            canEdit={canEdit}
            isLoading={isLoading}
          />

          <NotesModule
            title="Internal notes"
            emptyCaption="No internal notes here yet"
            notes={record.notes}
            onEdit={() => setEditingNotes(true)}
            canEdit={canEdit}
            isLoading={isLoading}
          />
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

      <EditGeneralDetailsDialog
        open={editingDetails}
        onClose={() => setEditingDetails(false)}
        rate={record}
        onSave={saveDetails}
        breakpoint={breakpoint}
      />
      <EditAccountingDialog
        open={editingAccounting}
        onClose={() => setEditingAccounting(false)}
        rate={record}
        onSave={saveAccounting}
        breakpoint={breakpoint}
      />
      {/* The SHARED Labels picker — "Save" here, because a panel module saves
          straight to the record. */}
      <LabelsSelectList
        open={pickingLabels}
        onClose={() => setPickingLabels(false)}
        labels={labels}
        pool={labelPool}
        title="Tax rate labels"
        onSave={saveLabels}
        breakpoint={breakpoint}
      />
      <EditNotesDialog
        open={editingSummary}
        onClose={() => setEditingSummary(false)}
        notes={record.summary}
        onSave={saveSummary}
        title="Tax rate summary template"
        fieldLabel="Summary template"
        toastSubject={'"Summary template" module'}
        optional
        breakpoint={breakpoint}
      />
      <EditNotesDialog
        open={editingNotes}
        onClose={() => setEditingNotes(false)}
        notes={record.notes}
        onSave={saveNotes}
        title="Tax rate internal notes"
        fieldLabel="Internal notes"
        toastSubject={'"Internal notes" module'}
        optional
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
      {/* Delete asks first — which is also what production does today, through
          its own confirm modal. */}
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
export type { TaxRateDetails, TaxRatePanelProps, TaxRatePermissions } from "./TaxRatePanel.types";
