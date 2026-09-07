import { ReactNode, useState } from "react";

import AvatarFile from "../../components/Avatar/AvatarFile";
import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import TextArea from "../../components/Fields/TextArea/TextArea";
import TextField from "../../components/Fields/TextField/TextField";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import Input from "../../components/Input/Input";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import ListItem from "../../components/ListItem/ListItem";
import ListItemSlotProgress from "../../components/ListItem/ListItemSlotProgress";
import Menu from "../../components/Menu/Menu";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { toast } from "../../components/Toast/Toaster";
import { useAnchoredMenu } from "../shared/anchoredMenu";

import { formatSize, ManagedFile } from "./files";
import styles from "./FileList.module.scss";

// The grouped file list of the Add-Files functionality (Figma "Add Files",
// 21938-23643) — shared with the New Job form's Files module. Public / lock
// groups (only non-empty ones render, new files land in Public), static rows
// with the size + the ⋯ menu (a ProgressRing instead while uploading), and
// the Rename / Edit-description dialogs.

const fileVisibility = (visibility: "public" | "private") => visibility === "public";

const splitName = (name: string): { base: string; extension: string | null } => {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return { base: name, extension: null };
  return { base: name.slice(0, dot), extension: name.slice(dot) };
};

// ---- one row ----------------------------------------------------------------

const FileRow = ({
  file,
  mobile,
  onToggleVisibility,
  onRename,
  onEditDescription,
  onRemove,
}: {
  file: ManagedFile;
  mobile: boolean;
  onToggleVisibility: () => void;
  onRename: () => void;
  onEditDescription: () => void;
  onRemove: () => void;
}) => {
  const menu = useAnchoredMenu(!mobile);
  const isPrivate = file.visibility === "private";

  const item = (label: string, icon: string, onClick: () => void, caption?: string) => (
    <MenuItem
      label={label}
      caption={caption}
      slotLeft={<Icon icon={icon} container="square" />}
      onClick={() => {
        menu.close();
        onClick();
      }}
    />
  );

  const menuBody = (
    <>
      <MenuItemGroup>
        {isPrivate
          ? item("Make public", "globe", onToggleVisibility, "Visible to your client")
          : item("Make private", "lock", onToggleVisibility, "Visible to team members only")}
        {item("Rename", "pen", onRename)}
        {item("Edit description", "align-left", onEditDescription)}
      </MenuItemGroup>
      <MenuItemGroup>{item("Remove", "close", onRemove)}</MenuItemGroup>
    </>
  );

  const slotRight: ReactNode = (
    <>
      <span className={styles.size}>{formatSize(file.sizeBytes)}</span>
      {file.progress != null ? (
        <ListItemSlotProgress value={file.progress} ariaLabel="Upload progress" />
      ) : (
        <IconButton
          icon="ellipsis"
          variant="ghost"
          size="md"
          aria-label={`${file.name} actions`}
          isPressed={menu.open}
          noDebounce
          onClick={menu.onActions}
        />
      )}
    </>
  );

  return (
    <>
      {/* Static on purpose — "the item is non-interactive" (the dev notes). */}
      <ListItem
        variant="titleCaption"
        title={file.name}
        caption={file.description ?? <span className={styles.placeholderText}>No description</span>}
        avatar={<AvatarFile size="xl" type={file.type} />}
        slotRight={slotRight}
      />
      {mobile ? (
        <Menu open={menu.open} onClose={menu.close} breakpoint="mobile">
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

// ---- rename / description dialogs -------------------------------------------

const RenameFileForm = ({
  file,
  onClose,
  onRename,
  mobile,
}: {
  file: ManagedFile;
  onClose: () => void;
  onRename: (name: string) => void;
  mobile: boolean;
}) => {
  const { base, extension } = splitName(file.name);
  const [name, setName] = useState(base);
  const [showError, setShowError] = useState(false);
  const submit = () => {
    if (name.trim() === "") {
      setShowError(true);
      return;
    }
    onRename(`${name.trim()}${extension ?? ""}`);
    toast({ type: "success", title: '"Name" updated' });
    onClose();
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title="File name"
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={name !== base}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={submit}>
            Rename
          </Button>
        </PopoverFooter>
      }
    >
      <Input label="Name">
        <TextField
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setShowError(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
          suffix={extension ?? undefined}
          isValid={!(showError && name.trim() === "")}
        />
      </Input>
    </Dialog>
  );
};

const DescriptionForm = ({
  file,
  onClose,
  onSave,
  mobile,
}: {
  file: ManagedFile;
  onClose: () => void;
  onSave: (description: string) => void;
  mobile: boolean;
}) => {
  const [description, setDescription] = useState(file.description ?? "");
  const submit = () => {
    onSave(description.trim());
    // Follows the rename toast's field-label pattern.
    toast({ type: "success", title: '"Description" updated' });
    onClose();
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title="File description"
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={description !== (file.description ?? "")}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={submit}>
            Save
          </Button>
        </PopoverFooter>
      }
    >
      <Input label="Description" labelCondition="optional">
        <TextArea value={description} onChange={(event) => setDescription(event.target.value)} />
      </Input>
    </Dialog>
  );
};

// ---- the list ---------------------------------------------------------------

export interface FileListProps {
  files: ManagedFile[];
  onChange: (files: ManagedFile[]) => void;
  mobile: boolean;
}

export default function FileList({ files, onChange, mobile }: FileListProps) {
  const [renameTarget, setRenameTarget] = useState<ManagedFile | null>(null);
  const [descriptionTarget, setDescriptionTarget] = useState<ManagedFile | null>(null);

  const publicFiles = files.filter((file) => fileVisibility(file.visibility));
  const privateFiles = files.filter((file) => !fileVisibility(file.visibility));

  const patch = (key: string, changes: Partial<ManagedFile>) =>
    onChange(files.map((file) => (file.key === key ? { ...file, ...changes } : file)));

  const toggleVisibility = (file: ManagedFile) => {
    const toPrivate = file.visibility === "public";
    patch(file.key, { visibility: toPrivate ? "private" : "public" });
    toast({
      type: "success",
      variant: "detailed",
      title: toPrivate ? "File is now private" : "File is now public",
      caption: file.name,
    });
  };

  const group = (label: "Public" | "Private", rows: ManagedFile[], last: boolean) => {
    if (rows.length === 0) return null;
    return (
      <ItemGroup
        divider={!last}
        label={
          <GroupLabel
            variant="primary"
            slotLeft={<Icon icon={label === "Public" ? "globe" : "lock"} size={14} />}
            label={label}
          />
        }
      >
        {rows.map((file) => (
          <FileRow
            key={file.key}
            file={file}
            mobile={mobile}
            onToggleVisibility={() => toggleVisibility(file)}
            onRename={() => setRenameTarget(file)}
            onEditDescription={() => setDescriptionTarget(file)}
            onRemove={() => onChange(files.filter((row) => row.key !== file.key))}
          />
        ))}
      </ItemGroup>
    );
  };

  if (files.length === 0) return null;

  return (
    <>
      <DisplayModule
        variant="bodyOnly"
        bodyPadded={false}
        content={
          <div>
            {group("Public", publicFiles, privateFiles.length === 0)}
            {group("Private", privateFiles, true)}
          </div>
        }
      />
      {renameTarget != null && (
        <RenameFileForm
          key={renameTarget.key}
          file={renameTarget}
          onClose={() => setRenameTarget(null)}
          onRename={(name) => patch(renameTarget.key, { name })}
          mobile={mobile}
        />
      )}
      {descriptionTarget != null && (
        <DescriptionForm
          key={descriptionTarget.key}
          file={descriptionTarget}
          onClose={() => setDescriptionTarget(null)}
          onSave={(description) => patch(descriptionTarget.key, { description: description || undefined })}
          mobile={mobile}
        />
      )}
    </>
  );
}
