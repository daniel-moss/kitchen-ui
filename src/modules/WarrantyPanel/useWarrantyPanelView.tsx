import { ReactNode, useEffect, useState } from "react";

import AvatarWarranty from "../../components/Avatar/AvatarWarranty";
import IconButton from "../../components/IconButton/IconButton";
import Menu from "../../components/Menu/Menu";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import DrawerHeader from "../../components/Popover/DrawerHeader";
import PopoverHeaderContent from "../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../components/Popover/PopoverHeaderText";
import Prompt from "../../components/Prompt/Prompt";
import { toast } from "../../components/Toast/Toaster";
import { Warranty, warrantyStateOf } from "../../data/db";
import useIsDesktop from "../../hooks/useIsDesktop";
import { useAnchoredMenu } from "../shared/anchoredMenu";
import EditNotesDialog from "../shared/EditNotesDialog";
import { slot } from "../shared/helpers";
import NotesModule from "../shared/NotesModule";

import EditGeneralDetailsDialog from "./forms/EditGeneralDetailsDialog";
import GeneralDetailsModule from "./modules/GeneralDetailsModule";
import { WarrantyEdits, WarrantyPanelActions } from "./WarrantyPanel.types";

import styles from "./WarrantyPanel.module.scss";

// EVERYTHING a warranty shows inside a side panel, minus the SidePanel itself:
// the header pieces, the two display modules, both edit forms, the context menu
// and the delete Prompt.
//
// It is a hook and not a component because of the SidePanel rule: a link inside
// a panel never opens a SECOND panel — the host swaps the ONE panel's `title` /
// `avatar` / `children` and adds `onBack`. Header props cannot come out of a
// child element, so the pieces are returned instead and the host spreads them.
// Two hosts use it:
//   WarrantyPanel  — the standalone panel (its own SidePanel),
//   EquipmentPanel — the Warranties tab, which swaps its own panel's content
//                    when a row is clicked.

export interface WarrantyPanelView {
  /** SidePanel `title` — the warranty's name (it truncates to one line). */
  title: string;
  /** SidePanel `avatar` — AvatarWarranty xl with the status corner icon. */
  avatar: ReactNode;
  /** SidePanel `headerActions` — the context-menu button (none while loading). */
  headerActions: ReactNode;
  /** SidePanel children — the two display modules. */
  body: ReactNode;
  /**
   * The menu card, both edit dialogs and the delete Prompt. Render these
   * OUTSIDE the SidePanel — each one portals itself, and the desktop menu card
   * must not live inside the panel's scroll area.
   */
  overlays: ReactNode;
}

interface UseWarrantyPanelViewOptions extends WarrantyPanelActions {
  /** The warranty to show. null = the host is showing something else. */
  warranty: Warranty | null;
  /**
   * Whether this view is the one on screen. Going false closes everything the
   * view opened, so a menu or form cannot survive a swap back to the host.
   */
  active: boolean;
  isLoading?: boolean;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export function useWarrantyPanelView({
  warranty,
  active,
  onSaveDetails,
  onSaveNotes,
  onDelete,
  isLoading = false,
  breakpoint = "auto",
}: UseWarrantyPanelViewOptions): WarrantyPanelView {
  const mobile = !useIsDesktop(breakpoint);

  const [editingDetails, setEditingDetails] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const menu = useAnchoredMenu(!mobile, "end");

  // The view's WORKING COPY of the record. The host stays the source of truth —
  // every save still calls its handler — but the view applies the edit itself
  // too, so a form never looks like it did nothing just because a host has not
  // wired that one handler yet (the Equipment panel's rule).
  const [record, setRecord] = useState(warranty);
  useEffect(() => setRecord(warranty), [warranty]);

  // Leaving the view (swapped away, or the panel closed) closes everything it
  // opened — a menu left open would reappear on the way back.
  useEffect(() => {
    if (active) return;
    menu.close();
    setEditingDetails(false);
    setEditingNotes(false);
    setDeleting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const saveDetails = async (edits: WarrantyEdits) => {
    if ((await onSaveDetails?.(edits)) === false) return false;
    setRecord((prev) => (prev == null ? prev : { ...prev, ...edits }));
  };

  const saveNotes = async (notes: string) => {
    if ((await onSaveNotes?.(notes)) === false) return false;
    setRecord((prev) => (prev == null ? prev : { ...prev, details: notes === "" ? undefined : notes }));
  };

  const remove = async () => {
    if (record == null) return;
    setDeleting(false);
    // "Delete — 1. Deletes the warranty  2. Triggers the toast" (the Prompt's
    // Delete annotation, node 21807-1804).
    if ((await onDelete?.(record)) === false) {
      toast({
        type: "error",
        variant: "detailed",
        title: "Could not delete the warranty",
        caption: "Something went wrong. Please try again.",
      });
      return;
    }
    toast({ type: "success", variant: "detailed", title: "Warranty deleted", caption: record.name });
  };

  if (record == null) {
    return { title: "", avatar: null, headerActions: undefined, body: null, overlays: null };
  }

  // ONE item: a danger "Delete" with the trash-can icon (node 21936-9254).
  const menuBody = (
    <MenuItemGroup>
      <MenuItem
        danger
        label="Delete"
        slotLeft={slot("trash-can")}
        onClick={() => {
          menu.close();
          setDeleting(true);
        }}
      />
    </MenuItemGroup>
  );

  return {
    // "Format: [warranty_name]; Truncates, if doesn't fit 1 line" (the title's
    // annotation) — PopoverHeaderText truncates on its own.
    title: record.name,
    // No status while loading: the dates have not arrived, so the corner icon
    // would be a guess (the Loading frame sets status="none").
    avatar: <AvatarWarranty size="xl" status={isLoading ? "none" : warrantyStateOf(record)} />,
    // While loading there is nothing to act on yet, so the context menu is
    // hidden — the Loading frame draws the header with actions=false.
    headerActions: isLoading ? undefined : (
      <IconButton
        icon="ellipsis"
        variant="ghost"
        size="md"
        aria-label="More actions"
        isPressed={menu.open}
        noDebounce
        onClick={menu.onActions}
      />
    ),
    body: (
      <>
        <GeneralDetailsModule warranty={record} onEdit={() => setEditingDetails(true)} isLoading={isLoading} />
        <NotesModule notes={record.details} onEdit={() => setEditingNotes(true)} isLoading={isLoading} />
      </>
    ),
    overlays: (
      <>
        {mobile ? (
          <Menu
            open={menu.open}
            onClose={menu.close}
            // The drawer repeats the warranty's name — title only, no avatar
            // (node 21936-8607).
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
            <div ref={menu.cardRef} className={styles.anchoredMenu} style={{ top: menu.pos.top, left: menu.pos.left, right: menu.pos.right }}>
              <Menu open={menu.open} onClose={menu.close} breakpoint="desktop">
                {menuBody}
              </Menu>
            </div>
          )
        )}

        <EditGeneralDetailsDialog
          open={editingDetails}
          onClose={() => setEditingDetails(false)}
          warranty={record}
          onSave={saveDetails}
          breakpoint={breakpoint}
        />
        <EditNotesDialog
          open={editingNotes}
          onClose={() => setEditingNotes(false)}
          notes={record.details}
          onSave={saveNotes}
          title="Warranty notes"
          optional
          breakpoint={breakpoint}
        />

        <Prompt
          open={deleting}
          title="Delete warranty?"
          body={`Warranty ${record.name} will be permanently deleted. This action can not be undone.`}
          actionLabel="Delete"
          actionVariant="danger"
          actionIcon="trash-can"
          onAction={remove}
          onCancel={() => setDeleting(false)}
          breakpoint={breakpoint}
        />
      </>
    ),
  };
}
