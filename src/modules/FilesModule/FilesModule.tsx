import { useState } from "react";

import AvatarFile from "../../components/Avatar/AvatarFile";
import CardFile from "../../components/Card/CardFile";
import { FileType } from "../../components/Card/CardFile.types";
import Counter from "../../components/Counter/Counter";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import HoverHint from "../../components/Hint/HoverHint";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import ListItem from "../../components/ListItem/ListItem";
import Menu from "../../components/Menu/Menu";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import DrawerHeader from "../../components/Popover/DrawerHeader";
import PopoverHeaderContent from "../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../components/Popover/PopoverHeaderText";
import Prompt from "../../components/Prompt/Prompt";
import Segment from "../../components/SegmentedControl/Segment";
import SegmentedControl from "../../components/SegmentedControl/SegmentedControl";
import { toast } from "../../components/Toast/Toaster";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import AddFilesForm from "../AddFilesForm/AddFilesForm";
import { ManagedFile, formatSize } from "../AddFilesForm/files";
import { COMPANY, TODAY } from "../../data/db";
import { users } from "../../data/users";
import { useAnchoredMenu } from "../shared/anchoredMenu";
import { noop, slot } from "../shared/helpers";

import {
  FilesModuleProps,
  FileVisibility,
  FileView,
  ModuleFile,
} from "./FilesModule.types";

import styles from "./FilesModule.module.scss";

// AvatarFileType → CardFile fileType (1:1 except the placeholder).
const cardType = (type: ModuleFile["type"]): FileType =>
  type === "imagePlaceholder" ? "image" : (type as FileType);

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "Added on Sep 28, 2026 by Lorne R." — the caption a new row gets. */
const addedCaption = (userId: number): string => {
  const user = users.find((row) => row.id === userId);
  const stamp = `${MONTHS[TODAY.getMonth()]} ${TODAY.getDate()}, ${TODAY.getFullYear()}`;
  return user == null
    ? `Added on ${stamp}`
    : `Added on ${stamp} by ${user.firstName} ${user.lastName.charAt(0)}.`;
};

/** What the "Add files" form produces → what this module lists. */
const toModuleFile = (file: ManagedFile, userId: number): ModuleFile => ({
  id: file.key,
  name: file.name,
  // The form's four kinds are all AvatarFile types too.
  type: file.type,
  size: formatSize(file.sizeBytes),
  visibility: file.visibility,
  meta: addedCaption(userId),
});

// ---- one file: a list row OR a card, plus its Public/Private context menu ----
// The group clones this wrapper for the lifted drag copy — list injects
// isDragging/disabled, cards injects `dragging` — so both must forward.
const FileEntry = ({
  file,
  view,
  mobile,
  isDragging,
  dragging,
  disabled,
  onToggleVisibility,
  onDelete,
  onPreview,
}: {
  file: ModuleFile;
  view: FileView;
  mobile: boolean;
  isDragging?: boolean;
  dragging?: boolean;
  disabled?: boolean;
  onToggleVisibility?: (file: ModuleFile) => void;
  onDelete?: (file: ModuleFile) => void;
  onPreview?: (file: ModuleFile) => void;
}) => {
  const menu = useAnchoredMenu(!mobile);
  const preview = () => onPreview?.(file);

  // Private → "Make public"; Public → "Make private" (Figma file menus).
  const menuBody = (
    <>
      <MenuItemGroup>
        <MenuItem
          label="Preview"
          slotLeft={slot("eye")}
          onClick={() => {
            menu.close();
            preview();
          }}
        />
        {file.visibility === "private" ? (
          <MenuItem
            label="Make public"
            caption="Visible to your client"
            slotLeft={slot("globe")}
            onClick={() => {
              menu.close();
              onToggleVisibility?.(file);
            }}
          />
        ) : (
          <MenuItem
            label="Make private"
            caption="Visible to team members only"
            slotLeft={slot("lock")}
            onClick={() => {
              menu.close();
              onToggleVisibility?.(file);
            }}
          />
        )}
        <MenuItem
          label="Download"
          tag={file.size}
          slotLeft={slot("download")}
          onClick={menu.close}
        />
      </MenuItemGroup>
      <MenuItemGroup>
        <MenuItem
          danger
          label="Delete"
          slotLeft={slot("trash-can")}
          onClick={() => {
            menu.close();
            onDelete?.(file);
          }}
        />
      </MenuItemGroup>
    </>
  );

  const trigger =
    view === "cards" ? (
      <CardFile
        name={file.name}
        fileType={cardType(file.type)}
        dragging={dragging}
        menuOpen={menu.open}
        onClick={preview}
        onMenuClick={menu.onActions}
      />
    ) : (
      <ListItem
        variant="titleCaption"
        title={file.name}
        caption={file.meta}
        avatar={<AvatarFile size="xl" type={file.type} />}
        isClickable
        isDraggable
        isDragging={isDragging}
        disabled={disabled}
        onClick={preview}
        slotRight={
          <IconButton
            icon="ellipsis"
            variant="ghost"
            size="md"
            aria-label="More actions"
            isPressed={menu.open}
            noDebounce
            onClick={menu.onActions}
          />
        }
      />
    );

  return (
    <>
      {trigger}
      {mobile ? (
        <Menu
          open={menu.open}
          onClose={menu.close}
          drawerHeader={
            <DrawerHeader>
              <PopoverHeaderContent
                avatar={<AvatarFile size="xl" type={file.type} />}
              >
                <PopoverHeaderText
                  variant="titleCaption"
                  title={file.name}
                  caption={file.meta}
                />
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
            style={{
              top: menu.pos.top,
              left: menu.pos.left,
              right: menu.pos.right,
            }}
          >
            <Menu open={menu.open} onClose={menu.close} breakpoint="desktop">
              {menuBody}
            </Menu>
          </div>
        )
      )}
    </>
  );
};

/**
 * The "Files" display module (Figma "Files" Display Module, file
 * C6rO8SKXF9OVZyO7mTgRtE): Public / Private groups of drag-reorderable files,
 * per-file context menus, empty states, and the upload-limit info / warning
 * banner with the add button disabled at 100%.
 *
 * Object-agnostic — every file, every mutation and the limit come in as props,
 * so a job, an equipment or a location all use this one module.
 */
export default function FilesModule({
  files,
  onReorder,
  onToggleVisibility,
  onDelete,
  onPreview,
  onFilesAdded,
  currentUserId = 1,
  // The banner's cap and the Add-files form's cap are the SAME company setting
  // — defaulting here stops a caller hardcoding one that drifts from the other.
  maxFiles = COMPANY.maxFileUploads,
  showViewToggle = false,
  defaultView = "list",
  isLoading = false,
  loadingCount = 5,
  mobile = false,
  className,
}: FilesModuleProps) {
  const [view, setView] = useState<FileView>(
    showViewToggle ? defaultView : "list",
  );
  const [adding, setAdding] = useState(false);
  // The file the Delete menu item asked about. Deleting a file ALWAYS confirms
  // first and reports afterwards (Figma 21807-1721 / 21807-1733), and the
  // module owns both halves so every object that holds files behaves the same
  // way without its consumer wiring anything (Daniel, 2026-10-06: "it's a
  // standard behaviour"). `onDelete` is called only after the confirmation.
  const [deleting, setDeleting] = useState<ModuleFile | null>(null);

  const confirmDelete = () => {
    if (deleting == null) return;
    onDelete?.(deleting);
    setDeleting(null);
    // The DETAILED toast: the deed in the title, the file it happened to in the
    // caption — so a long file name never crowds the message.
    toast({ type: "success", variant: "detailed", title: "File deleted", caption: deleting.name });
  };

  const publicFiles = files.filter((file) => file.visibility === "public");
  const privateFiles = files.filter((file) => file.visibility === "private");
  const count = files.length;
  /** What the title's counter shows — the loading count stands in for it. */
  const countShown = isLoading ? loadingCount : count;

  // Uniform card width across the whole module: size every group's cards to the
  // fullest group, so a 4-card group and a 2-card group match (Daniel).
  const maxCardCount = Math.max(publicFiles.length, privateFiles.length);
  const full = maxFiles != null && count >= maxFiles;
  const approaching =
    maxFiles != null && !full && count >= Math.ceil(maxFiles * 0.8);
  const percent = maxFiles == null ? 0 : Math.round((count / maxFiles) * 100);

  // One Public / Private group: its files (list or cards), or an empty state.
  const group = (
    groupFiles: ModuleFile[],
    visibility: FileVisibility,
    icon: string,
    label: string,
    emptyText: string,
    divider: boolean,
  ) => (
    <ItemGroup
      // Empty groups render as a plain list so the empty state is full-width.
      view={groupFiles.length > 0 ? view : "list"}
      cardCountBasis={maxCardCount}
      label={
        <GroupLabel
          variant="primary"
          slotLeft={<Icon icon={icon} size={14} container="square" />}
          label={label}
        />
      }
      divider={divider}
      onReorder={
        groupFiles.length > 0 && onReorder != null
          ? (from, to) => onReorder(visibility, from, to)
          : undefined
      }
    >
      {groupFiles.length > 0 ? (
        groupFiles.map((file) => (
          <FileEntry
            key={file.id}
            file={file}
            view={view}
            mobile={mobile}
            onToggleVisibility={onToggleVisibility}
            // The row's Delete ASKS; `onDelete` runs from the Prompt below.
            onDelete={onDelete == null ? undefined : setDeleting}
            onPreview={onPreview}
          />
        ))
      ) : (
        <EmptyState caption={emptyText} />
      )}
    </ItemGroup>
  );

  // Loading: ONE flat group of skeleton rows — no Public / Private labels, no
  // dividers, no row actions. The avatar stays the real generic AvatarFile
  // (node 22012-20559): a file row can only ever hold a file, so its avatar is
  // known before the name is.
  const loadingContent = (
    <div className={styles.listBody}>
      <ItemGroup>
        {Array.from({ length: loadingCount }, (unused, index) => (
          <ListItem key={index} variant="titleCaption" title="" caption="" avatar={<AvatarFile size="xl" />} isLoading />
        ))}
      </ItemGroup>
    </div>
  );

  const content = isLoading ? (
    loadingContent
  ) : count === 0 ? (
    <EmptyState caption="No files here yet" />
  ) : (
    <div className={styles.listBody}>
      {group(
        publicFiles,
        "public",
        "globe",
        "Public",
        "No public files here yet",
        true,
      )}
      {group(
        privateFiles,
        "private",
        "lock",
        "Private",
        "No private files here yet",
        false,
      )}
    </div>
  );

  const addButton = full ? (
    <HoverHint
      state="warning"
      position="bottom"
      align="end"
      title={`You've reached the ${maxFiles}-file limit`}
      caption="Delete files to upload more"
    >
      <IconButton
        icon="plus"
        variant="ghost"
        size="md"
        aria-label="Add files"
        isDisabled
        onClick={noop}
      />
    </HoverHint>
  ) : (
    <HoverTooltip text="Add files">
      <IconButton
        icon="plus"
        variant="ghost"
        size="md"
        aria-label="Add files"
        isDisabled={onFilesAdded == null}
        onClick={onFilesAdded == null ? noop : () => setAdding(true)}
      />
    </HoverTooltip>
  );

  return (
    <>
      <DisplayModule
        className={className}
        title="Files"
        // No counter at zero — the empty module has nothing to count. (The
        // Figma Files file still draws a stale 3 on its empty frame; the
        // Equipment panel's own Empty State node is the deliberate one.)
        // While loading the counter shows the count that is already known.
        titleSlotRight={countShown === 0 ? undefined : <Counter value={countShown} />}
        // The limit banner needs the real files, so it waits for them.
        status={isLoading ? "none" : full ? "warning" : approaching ? "info" : "none"}
        banner={
          isLoading
            ? undefined
            : full
            ? {
                children: `You've used ${count} of ${maxFiles} files (100%). Delete files to continue uploading.`,
              }
            : approaching
              ? {
                  children: `You've used ${count} of ${maxFiles} files (${percent}%). You're approaching the file limit.`,
                }
              : undefined
        }
        // Every header action waits for the files (the Loading node draws a
        // bare title + counter), like every other module in the panel.
        slotRight={
          isLoading ? undefined : showViewToggle ? (
            <>
              {/* Same files, another format — a switcher, not navigation, so
                  this is a SegmentedControl (Daniel, 2026-09-30).
                  The SELECTED segment's icon is SOLID (Daniel, 2026-10-06) —
                  the same "selected = solid glyph" rule the sidebar's active
                  item and the status menu items follow. */}
              <SegmentedControl size="md" value={view} onChange={(value) => setView(value as FileView)}>
                <Segment
                  value="list"
                  slotLeft={<Icon icon="list" size={14} pack={view === "list" ? "solid" : "regular"} />}
                  aria-label="List view"
                />
                <Segment
                  value="cards"
                  slotLeft={<Icon icon="grid-2" size={14} pack={view === "cards" ? "solid" : "regular"} />}
                  aria-label="Cards view"
                />
              </SegmentedControl>
              {addButton}
            </>
          ) : (
            addButton
          )
        }
        content={content}
      />

      {/* The shared "Add files" form — the module opens it itself, so every
          object that holds files gets the same flow (Daniel, 2026-09-28). */}
      <AddFilesForm
        open={adding}
        onClose={() => setAdding(false)}
        onUploaded={(uploaded) =>
          onFilesAdded?.(
            uploaded.map((file) => toModuleFile(file, currentUserId)),
          )
        }
        breakpoint={mobile ? "mobile" : "desktop"}
      />

      {/* "Delete file?" (Figma 21807-1721). The file NAME is the one strong
          word in the sentence, so it is a span rather than interpolated text. */}
      <Prompt
        open={deleting != null}
        title="Delete file?"
        body={
          <>
            File <span className={styles.promptName}>{deleting?.name ?? ""}</span> will be permanently deleted. This
            action can not be undone.
          </>
        }
        actionLabel="Delete"
        actionVariant="danger"
        actionIcon="trash-can"
        onAction={confirmDelete}
        onCancel={() => setDeleting(null)}
        breakpoint={mobile ? "mobile" : "desktop"}
      />
    </>
  );
}
