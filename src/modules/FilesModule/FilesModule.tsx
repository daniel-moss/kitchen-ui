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
import TabGroup from "../../components/Tabs/TabGroup";
import TabItem from "../../components/Tabs/TabItem";
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
  mobile = false,
  className,
}: FilesModuleProps) {
  const [view, setView] = useState<FileView>(
    showViewToggle ? defaultView : "list",
  );
  const [adding, setAdding] = useState(false);

  const publicFiles = files.filter((file) => file.visibility === "public");
  const privateFiles = files.filter((file) => file.visibility === "private");
  const count = files.length;

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
            onDelete={onDelete}
            onPreview={onPreview}
          />
        ))
      ) : (
        <EmptyState caption={emptyText} />
      )}
    </ItemGroup>
  );

  const content =
    count === 0 ? (
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
        titleSlotRight={count === 0 ? undefined : <Counter value={count} />}
        status={full ? "warning" : approaching ? "info" : "none"}
        banner={
          full
            ? {
                children: `You've used ${count} of ${maxFiles} files (100%). Delete files to continue uploading.`,
              }
            : approaching
              ? {
                  children: `You've used ${count} of ${maxFiles} files (${percent}%). You're approaching the file limit.`,
                }
              : undefined
        }
        slotRight={
          showViewToggle ? (
            <>
              <TabGroup
                size="md"
                value={view}
                onChange={(value) => setView(value as FileView)}
              >
                <TabItem value="list" icon="list" iconOnly>
                  List view
                </TabItem>
                <TabItem value="cards" icon="grid-2" iconOnly>
                  Cards view
                </TabItem>
              </TabGroup>
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
    </>
  );
}
