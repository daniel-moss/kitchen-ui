import { useEffect, useMemo, useRef, useState } from "react";

import AvatarEquipment from "../../components/Avatar/AvatarEquipment";
import Prompt from "../../components/Prompt/Prompt";
import SidePanel from "../../components/SidePanel/SidePanel";
import SidePanelNavigation from "../../components/SidePanel/SidePanelNavigation";
import TabItem from "../../components/Tabs/TabItem";
import { toast } from "../../components/Toast/Toaster";
import useControllableState from "../../hooks/useControllableState";
import useIsDesktop from "../../hooks/useIsDesktop";
import FilesModule from "../FilesModule/FilesModule";
import { ModuleFile } from "../FilesModule/FilesModule.types";
import NewWarrantyForm from "../NewWarrantyForm/NewWarrantyForm";
import { NewWarranty } from "../NewWarrantyForm/NewWarrantyForm.types";
// The Notes module and its edit dialog are SHARED with the Warranty side panel
// (promoted 2026-09-28) — both panels draw the same module.
import EditNotesDialog from "../shared/EditNotesDialog";
import LabelsSelectList from "../shared/LabelsSelectList";
import NotesModule from "../shared/NotesModule";
// The Warranties tab swaps THIS panel's content for the warranty view — it
// does not open a second panel (the SidePanel rule).
import { useWarrantyPanelView } from "../WarrantyPanel/useWarrantyPanelView";

import { WarrantyRow, equipmentPanelData, warrantyRow } from "./equipmentData";
import EditGeneralDetailsDialog from "./forms/EditGeneralDetailsDialog";
import GeneralDetailsModule, { hasMissingKeyDetails } from "./modules/GeneralDetailsModule";
import HistoryModule from "./modules/HistoryModule";
import LabelsModule from "./modules/LabelsModule";
import LocationModule from "./modules/LocationModule";
import WarrantiesModule from "./modules/WarrantiesModule";
import { EquipmentPanelProps, EquipmentPanelTab } from "./EquipmentPanel.types";
import { EQUIPMENT_LABELS, Warranty, warrantyCoverageOf } from "../../data/db";

import styles from "./EquipmentPanel.module.scss";

// The "Equipment" side panel (Figma file yee2IMsxPF0E4verwgQrm6, page
// "👍 Validated"). ONE module for every equipment object: the shell, its four
// tabs and the seven display modules inside them. The equipment record is a
// prop, so nothing here is specific to one piece of equipment.
//
// Tabs: Details (General details · Location · Labels · Notes) · Warranties ·
// Files (the shared FilesModule) · History.

export default function EquipmentPanel({
  open,
  onClose,
  equipment,
  tab,
  defaultTab = "details",
  onTabChange,
  onSaveDetails,
  onSaveLabels,
  onSaveNotes,
  onOpenLocation,
  onOpenWarranty,
  onAddWarranty,
  onCreateWarranty,
  onDeleteWarranty,
  onSaveWarrantyDetails,
  onSaveWarrantyNotes,
  onOpenHistoryObject,
  defaultHistoryFilter,
  isLoading = false,
  state = "content",
  onRetry,
  breakpoint = "auto",
}: EquipmentPanelProps) {
  const mobile = !useIsDesktop(breakpoint);
  const [active, setActive] = useControllableState<EquipmentPanelTab>(tab, defaultTab, onTabChange);

  const [editingDetails, setEditingDetails] = useState(false);
  const [editingLabels, setEditingLabels] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [addingWarranty, setAddingWarranty] = useState(false);
  const [deleting, setDeleting] = useState<WarrantyRow | null>(null);
  // The warranty whose view has REPLACED this panel's content, by id. A link
  // inside a side panel never opens a SECOND panel (the SidePanel rule): the
  // panel keeps the stack, swaps its own header + body, and shows the back
  // arrow. One level is all this panel has, so an id is the whole stack.
  const [openWarrantyId, setOpenWarrantyId] = useState<string | null>(null);
  // The warranty the form just created, so its toast's "Preview" CTA can open
  // THAT one (the CTA fires after the form has closed).
  const createdWarranty = useRef<Warranty | null>(null);

  // The panel's WORKING COPY of the record. The caller stays the source of
  // truth — every save still calls its handler — but the panel applies the
  // edit itself too, so a form never looks like it did nothing just because a
  // caller has not wired that one handler yet (Daniel hit exactly that on the
  // Labels form, 2026-09-28).
  const [record, setRecord] = useState(equipment);
  useEffect(() => {
    setRecord(equipment);
    // A new equipment starts at ITS top level, never on the warranty the
    // previous one was showing.
    setOpenWarrantyId(null);
  }, [equipment]);

  const data = useMemo(() => equipmentPanelData(record), [record]);
  const coverage = useMemo(() => warrantyCoverageOf(record.id), [record.id]);

  // The Details tab carries the warranty and file COUNTS, so while IT loads
  // there is nothing to count yet; every other tab already has them. A count
  // of ZERO shows no counter at all (Daniel, 2026-09-28).
  const countsKnown = !isLoading || active !== "details";
  const tabCounter = (count: number) => (countsKnown && count > 0 ? count : undefined);
  const warningState = !isLoading && hasMissingKeyDetails(record);

  // The tab's warranties — the RECORDS, so opening one can hand the whole
  // warranty to its view. Seeded from the equipment and kept here so the "New
  // warranty" form has somewhere to put what it creates — the same working-copy
  // rule the files below and the record above follow.
  const [warranties, setWarranties] = useState(data.warranties);
  useEffect(() => setWarranties(data.warranties), [data.warranties]);
  const warrantyRows = useMemo(() => warranties.map(warrantyRow), [warranties]);
  const openWarranty = warranties.find((row) => row.id === openWarrantyId) ?? null;

  // The tab's files. Seeded from the record and kept here so the "Add files"
  // form (which the shared Files module owns) has somewhere to put what it
  // uploads; re-seeded whenever the equipment changes.
  const [files, setFiles] = useState(data.files);
  useEffect(() => setFiles(data.files), [data.files]);
  const fileCount = files.length;

  const toggleFileVisibility = (file: ModuleFile) => {
    const now = file.visibility === "private" ? "public" : "private";
    setFiles((prev) => prev.map((row) => (row.id === file.id ? { ...row, visibility: now } : row)));
    toast({ type: "neutral", icon: now === "public" ? "globe" : "lock", title: `"${file.name}" is now ${now}` });
  };

  const deleteFile = (file: ModuleFile) => {
    setFiles((prev) => prev.filter((row) => row.id !== file.id));
    toast({ type: "neutral", icon: "trash-can", title: `"${file.name}" deleted` });
  };

  const reorderFiles = (visibility: ModuleFile["visibility"], from: number, to: number) =>
    setFiles((prev) => {
      const group = prev.filter((file) => file.visibility === visibility);
      const moved = [...group];
      const [item] = moved.splice(from, 1);
      moved.splice(to, 0, item);
      let next = 0;
      return prev.map((file) => (file.visibility === visibility ? moved[next++] : file));
    });

  const dropWarranty = (id: string) => setWarranties((prev) => prev.filter((row) => row.id !== id));

  const deleteWarranty = () => {
    if (deleting == null) return;
    dropWarranty(deleting.id);
    onDeleteWarranty?.(deleting);
    toast({ type: "success", variant: "detailed", title: "Warranty deleted", caption: deleting.name });
    setDeleting(null);
  };

  // The "New warranty" form hands back its values; the panel turns them into a
  // db-shaped record and adds it. The form shows its own "Warranty created"
  // toast, whose "Preview" CTA opens the new one.
  const createWarranty = (warranty: NewWarranty) => {
    const created: Warranty = {
      id: `WAR-${Date.now()}`,
      equipmentId: record.id,
      name: warranty.name,
      startDate: warranty.startDate.toISOString().slice(0, 10),
      endDate: warranty.endDate == null ? undefined : warranty.endDate.toISOString().slice(0, 10),
      details: warranty.notes === "" ? undefined : warranty.notes,
    };
    setWarranties((prev) => [...prev, created]);
    createdWarranty.current = created;
    onCreateWarranty?.(warranty);
  };

  // Opening a warranty REPLACES this panel's content (it does not stack a
  // second panel) and still reports the intent to the caller.
  const openWarrantyView = (warranty: Warranty) => {
    setOpenWarrantyId(warranty.id);
    onOpenWarranty?.(warrantyRow(warranty));
  };

  // The warranty view, rendered inside THIS panel. The hook runs on every
  // render (hooks cannot be conditional); with no warranty open it returns
  // empty pieces and nothing changes.
  const warrantyView = useWarrantyPanelView({
    warranty: openWarranty,
    active: open && openWarranty != null,
    isLoading,
    breakpoint,
    onSaveDetails: (edits) => {
      if (openWarranty == null) return;
      setWarranties((prev) => prev.map((row) => (row.id === openWarranty.id ? { ...row, ...edits } : row)));
      return onSaveWarrantyDetails?.(openWarranty, edits);
    },
    onSaveNotes: (notes) => {
      if (openWarranty == null) return;
      const details = notes === "" ? undefined : notes;
      setWarranties((prev) => prev.map((row) => (row.id === openWarranty.id ? { ...row, details } : row)));
      return onSaveWarrantyNotes?.(openWarranty, notes);
    },
    onDelete: (warranty) => {
      // The object is gone, so the panel goes back to the list it came from.
      dropWarranty(warranty.id);
      setOpenWarrantyId(null);
      return onDeleteWarranty?.(warrantyRow(warranty));
    },
  });

  const nav = (
    <SidePanelNavigation value={active} onChange={(value) => setActive(value as EquipmentPanelTab)}>
      <TabItem
        value="details"
        // "SidePanel also corresponds the warning state" — the Details tab
        // turns amber while a key detail is missing (node 21958-9105).
        warning={warningState}
        icon={warningState ? "triangle-exclamation" : undefined}
        iconPack="solid"
      >
        Details
      </TabItem>
      <TabItem value="warranties" counter={tabCounter(warranties.length)}>
        Warranties
      </TabItem>
      <TabItem value="files" counter={tabCounter(fileCount)}>
        Files
      </TabItem>
      <TabItem value="history">History</TabItem>
    </SidePanelNavigation>
  );

  return (
    <>
      {/* ONE panel, two levels of content. A warranty REPLACES the equipment's
          header and body and adds the back arrow — it never stacks a second
          panel (the SidePanel rule). The Warranty view has no navigation and
          no caption, so both drop while it is showing. */}
      <SidePanel
        open={open}
        onClose={onClose}
        onBack={openWarranty != null ? () => setOpenWarrantyId(null) : undefined}
        title={openWarranty != null ? warrantyView.title : record.displayName}
        // The header caption is the manufacturer; with none it falls back to
        // the "No Manufacturer" placeholder in --text-placeholder, like every
        // other absent value (node 21976-10317, whose annotation pins `fills`).
        caption={openWarranty != null ? undefined : (record.manufacturer ?? "No Manufacturer")}
        captionClassName={record.manufacturer == null ? styles.placeholderCaption : undefined}
        avatar={openWarranty != null ? warrantyView.avatar : <AvatarEquipment size="xl" />}
        headerActions={openWarranty != null ? warrantyView.headerActions : undefined}
        nav={openWarranty != null ? undefined : nav}
        state={state}
        onRetry={onRetry}
        breakpoint={breakpoint}
      >
        {openWarranty != null && warrantyView.body}

        {openWarranty == null && active === "details" && (
          <>
            <GeneralDetailsModule equipment={record} coverage={coverage} onEdit={() => setEditingDetails(true)} isLoading={isLoading} />
            <LocationModule
              clientName={data.clientName}
              locationCaption={data.locationCaption}
              onOpen={() => onOpenLocation?.()}
              isLoading={isLoading}
            />
            <LabelsModule labels={data.labels} onEdit={() => setEditingLabels(true)} isLoading={isLoading} />
            <NotesModule notes={record.notes} onEdit={() => setEditingNotes(true)} isLoading={isLoading} />
          </>
        )}

        {openWarranty == null && active === "warranties" && (
          <WarrantiesModule
            warranties={warrantyRows}
            mobile={mobile}
            isLoading={isLoading}
            loadingCount={warrantyRows.length}
            onAdd={() => {
              setAddingWarranty(true);
              onAddWarranty?.();
            }}
            // A row (and its menu's "Preview") swaps this panel's content.
            onOpen={(row) => {
              const found = warranties.find((warranty) => warranty.id === row.id);
              if (found != null) openWarrantyView(found);
            }}
            onDelete={setDeleting}
          />
        )}

        {openWarranty == null && active === "files" && (
          <FilesModule
            files={files}
            mobile={mobile}
            // No list/cards toggle in a 400px panel (node 21979-7536).
            onReorder={reorderFiles}
            onToggleVisibility={toggleFileVisibility}
            onDelete={deleteFile}
            onPreview={() => {}}
            onFilesAdded={(added) => setFiles((prev) => [...prev, ...added])}
          />
        )}

        {openWarranty == null && active === "history" && (
          <HistoryModule
            rows={data.history}
            mobile={mobile}
            isLoading={isLoading}
            defaultFilter={defaultHistoryFilter}
            onOpen={(row) => onOpenHistoryObject?.(row)}
          />
        )}
      </SidePanel>

      {/* The warranty view's menu, forms and Prompt — outside the panel, like
          every other overlay here. */}
      {warrantyView.overlays}

      <EditGeneralDetailsDialog
        open={editingDetails}
        onClose={() => setEditingDetails(false)}
        equipment={record}
        onSave={(edits) => {
          setRecord((prev) => ({ ...prev, ...edits }));
          onSaveDetails?.(edits);
        }}
        breakpoint={breakpoint}
      />
      {/* The SHARED Labels picker (2026-09-28) — the same one Job Details
          opens from its own "Labels" module. */}
      <LabelsSelectList
        open={editingLabels}
        onClose={() => setEditingLabels(false)}
        labels={data.labels}
        pool={EQUIPMENT_LABELS.map((label) => label.name)}
        onSave={(labels) => {
          setRecord((prev) => ({ ...prev, labelIds: EQUIPMENT_LABELS.filter((label) => labels.includes(label.name)).map((label) => label.id) }));
          onSaveLabels?.(labels);
          toast({ type: "success", title: '"Labels" updated' });
          setEditingLabels(false);
        }}
        breakpoint={breakpoint}
      />
      <EditNotesDialog
        open={editingNotes}
        onClose={() => setEditingNotes(false)}
        notes={record.notes}
        onSave={(notes) => {
          setRecord((prev) => ({ ...prev, notes: notes === "" ? undefined : notes }));
          onSaveNotes?.(notes);
        }}
        breakpoint={breakpoint}
      />

      <NewWarrantyForm
        open={addingWarranty}
        onClose={() => setAddingWarranty(false)}
        equipmentName={record.displayName}
        onCreated={createWarranty}
        // "Preview" opens the warranty just created — the same content swap a
        // list row does.
        onPreview={() => {
          if (createdWarranty.current != null) openWarrantyView(createdWarranty.current);
        }}
        breakpoint={breakpoint}
      />

      <Prompt
        open={deleting != null}
        title="Delete warranty?"
        body={`Warranty ${deleting?.name ?? ""} will be permanently deleted. This action can not be undone.`}
        actionLabel="Delete"
        actionVariant="danger"
        onAction={deleteWarranty}
        onCancel={() => setDeleting(null)}
        breakpoint={breakpoint}
      />
    </>
  );
}

// Re-exported so a consumer can type its handlers without reaching inside.
export type { EquipmentPanelProps, EquipmentPanelTab } from "./EquipmentPanel.types";
export type { HistoryRow, WarrantyRow } from "./equipmentData";
