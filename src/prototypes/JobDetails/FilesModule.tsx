import { useState } from "react";

import AvatarFile from "../../components/Avatar/AvatarFile";
import { AvatarFileType } from "../../components/Avatar/AvatarFile.types";
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
import { toast } from "../../components/Toast/Toaster";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";

import { noop, slot, useAnchoredMenu } from "./shared";

import styles from "./ServicePanel.module.scss";

// ---- demo data --------------------------------------------------------------

interface JobFile {
  id: number;
  name: string;
  type: AvatarFileType;
  size: string;
}
const INITIAL_PUBLIC: JobFile[] = [
  { id: 1, name: "Image.png", type: "image", size: "2 MB" },
  { id: 2, name: "Document.pdf", type: "pdf", size: "4 MB" },
  { id: 3, name: "Video.mp4", type: "video", size: "18 MB" },
];
const INITIAL_PRIVATE: JobFile[] = [
  { id: 4, name: "Spreadsheet.xls", type: "spreadsheet", size: "1 MB" },
  { id: 5, name: "Document.doc", type: "word", size: "3 MB" },
  { id: 6, name: "Audio.wav", type: "audio", size: "5 MB" },
];

const FILE_META = "Added on Jan 1, 2025 by Lorne R.";
// The upload cap (Figma "Files" doc): the info banner shows at ≥80%, the warning
// banner + disabled add at 100%.
const MAX_FILES = 25;

type FileView = "list" | "cards";
type Visibility = "public" | "private";

// AvatarFileType → CardFile fileType (1:1 except the placeholder).
const cardType = (t: AvatarFileType): FileType => (t === "imagePlaceholder" ? "image" : (t as FileType));

// Move an item within its array (the ItemGroup drag-reorder callback shape).
const reorder = (setArr: React.Dispatch<React.SetStateAction<JobFile[]>>) => (from: number, to: number) =>
  setArr((prev) => {
    const next = [...prev];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  });

// ---- one file: a list row OR a card, plus its Public/Private context menu ----
// The group clones this wrapper for the lifted drag copy — list injects
// isDragging/disabled, cards injects `dragging` — so both must forward.
const FileEntry = ({
  file,
  visibility,
  view,
  mobile,
  isDragging,
  dragging,
  disabled,
  onToggleVisibility,
  onDelete,
}: {
  file: JobFile;
  visibility: Visibility;
  view: FileView;
  mobile: boolean;
  isDragging?: boolean;
  dragging?: boolean;
  disabled?: boolean;
  onToggleVisibility: (file: JobFile) => void;
  onDelete: (file: JobFile) => void;
}) => {
  const menu = useAnchoredMenu(!mobile);

  // Private → "Make public"; Public → "Make private" (Figma file menus).
  const menuBody = (
    <>
      <MenuItemGroup>
        <MenuItem label="Preview" slotLeft={slot("eye")} onClick={menu.close} />
        {visibility === "private" ? (
          <MenuItem
            label="Make public"
            caption="Visible to your client"
            slotLeft={slot("globe")}
            onClick={() => {
              menu.close();
              onToggleVisibility(file);
            }}
          />
        ) : (
          <MenuItem
            label="Make private"
            caption="Visible to team members only"
            slotLeft={slot("lock")}
            onClick={() => {
              menu.close();
              onToggleVisibility(file);
            }}
          />
        )}
        <MenuItem label="Download" tag={file.size} slotLeft={slot("download")} onClick={menu.close} />
      </MenuItemGroup>
      <MenuItemGroup>
        <MenuItem
          danger
          label="Delete"
          slotLeft={slot("trash-can")}
          onClick={() => {
            menu.close();
            onDelete(file);
          }}
        />
      </MenuItemGroup>
    </>
  );

  const trigger =
    view === "cards" ? (
      <CardFile name={file.name} fileType={cardType(file.type)} dragging={dragging} menuOpen={menu.open} onClick={noop} onMenuClick={menu.onActions} />
    ) : (
      <ListItem
        variant="titleCaption"
        title={file.name}
        caption={FILE_META}
        avatar={<AvatarFile size="xl" type={file.type} />}
        isClickable
        isDraggable
        isDragging={isDragging}
        disabled={disabled}
        onClick={noop}
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
              <PopoverHeaderContent avatar={<AvatarFile size="xl" type={file.type} />}>
                <PopoverHeaderText variant="titleCaption" title={file.name} caption={FILE_META} />
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
    </>
  );
};

// The "Files" display module (Figma "Files" Display Module doc): list / cards
// view toggle, Public / Private groups (drag-reorderable), per-file Public /
// Private context menus, empty states, and the file-limit info / warning banner
// (with the add button disabled + a hint at 100%).
export default function FilesModule({ mobile = false }: { mobile?: boolean }) {
  const [publicFiles, setPublicFiles] = useState(INITIAL_PUBLIC);
  const [privateFiles, setPrivateFiles] = useState(INITIAL_PRIVATE);
  const [view, setView] = useState<FileView>("list");

  const count = publicFiles.length + privateFiles.length;
  // Uniform card width across the whole module: size every group's cards to the
  // fullest group, so a 4-card group and a 2-card group match (Daniel).
  const maxCardCount = Math.max(publicFiles.length, privateFiles.length);
  const full = count >= MAX_FILES;
  const approaching = !full && count >= Math.ceil(MAX_FILES * 0.8);
  const percent = Math.round((count / MAX_FILES) * 100);

  const makePublic = (file: JobFile) => {
    setPrivateFiles((p) => p.filter((f) => f.id !== file.id));
    setPublicFiles((p) => [...p, file]);
    toast({ type: "neutral", icon: "globe", title: `"${file.name}" is now public` });
  };
  const makePrivate = (file: JobFile) => {
    setPublicFiles((p) => p.filter((f) => f.id !== file.id));
    setPrivateFiles((p) => [...p, file]);
    toast({ type: "neutral", icon: "lock", title: `"${file.name}" is now private` });
  };
  const deleteFile = (file: JobFile) => {
    setPublicFiles((p) => p.filter((f) => f.id !== file.id));
    setPrivateFiles((p) => p.filter((f) => f.id !== file.id));
    toast({ type: "neutral", icon: "trash-can", title: `"${file.name}" deleted` });
  };

  // One Public / Private group: its files (list or cards), or an empty state.
  const group = (
    files: JobFile[],
    visibility: Visibility,
    setArr: React.Dispatch<React.SetStateAction<JobFile[]>>,
    icon: string,
    label: string,
    emptyText: string,
    divider: boolean,
  ) => (
    <ItemGroup
      // Empty groups render as a plain list so the empty state is full-width.
      view={files.length > 0 ? view : "list"}
      cardCountBasis={maxCardCount}
      label={<GroupLabel variant="primary" slotLeft={<Icon icon={icon} size={14} container="square" />} label={label} />}
      divider={divider}
      onReorder={files.length > 0 ? reorder(setArr) : undefined}
    >
      {files.length > 0 ? (
        files.map((f) => (
          <FileEntry
            key={f.id}
            file={f}
            visibility={visibility}
            view={view}
            mobile={mobile}
            onToggleVisibility={visibility === "private" ? makePublic : makePrivate}
            onDelete={deleteFile}
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
        {group(publicFiles, "public", setPublicFiles, "globe", "Public", "No public files here yet", true)}
        {group(privateFiles, "private", setPrivateFiles, "lock", "Private", "No private files here yet", false)}
      </div>
    );

  return (
    <DisplayModule
      title="Files"
      titleSlotRight={<Counter value={count} />}
      status={full ? "warning" : approaching ? "info" : "none"}
      banner={
        full
          ? { children: `You've used ${count} of ${MAX_FILES} files (100%). Delete files to continue uploading.` }
          : approaching
            ? { children: `You've used ${count} of ${MAX_FILES} files (${percent}%). You're approaching the file limit.` }
            : undefined
      }
      slotRight={
        <>
          <TabGroup size="md" value={view} onChange={(v) => setView(v as FileView)}>
            <TabItem value="list" icon="list" iconOnly>
              List view
            </TabItem>
            <TabItem value="cards" icon="grid-2" iconOnly>
              Cards view
            </TabItem>
          </TabGroup>
          {full ? (
            <HoverHint
              state="warning"
              position="bottom"
              align="end"
              title={`You've reached the ${MAX_FILES}-file limit`}
              caption="Delete files to upload more"
            >
              <IconButton icon="plus" variant="ghost" size="md" aria-label="Add files" isDisabled onClick={noop} />
            </HoverHint>
          ) : (
            <HoverTooltip text="Add files">
              <IconButton icon="plus" variant="ghost" size="md" aria-label="Add files" onClick={noop} />
            </HoverTooltip>
          )}
        </>
      }
      content={content}
    />
  );
}
