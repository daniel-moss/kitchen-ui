import { useState } from "react";

import AvatarEquipment from "../../components/Avatar/AvatarEquipment";
import AvatarFile from "../../components/Avatar/AvatarFile";
import { AvatarFileType } from "../../components/Avatar/AvatarFile.types";
import Counter from "../../components/Counter/Counter";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import LinkButton from "../../components/LinkButton/LinkButton";
import ListItem from "../../components/ListItem/ListItem";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import Menu from "../../components/Menu/Menu";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import { toast } from "../../components/Toast/Toaster";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import ValueDisplay from "../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../components/ValueDisplay/ValueDisplayGroup";
import { JOB_REASON_FOR_CALL, JOB_RECALL_TO, JOB_SERVICE, JOB_TECH_INSTRUCTIONS, JOB_TYPE } from "./jobData";
import ServiceForm from "./ServiceForm";
import { noop, slot, useAnchoredMenu } from "./shared";

import styles from "./ServicePanel.module.scss";

// ---- demo data --------------------------------------------------------------

interface JobFile {
  id: number;
  name: string;
  type: AvatarFileType;
}
const PUBLIC_FILES: JobFile[] = [
  { id: 1, name: "Image.png", type: "image" },
  { id: 2, name: "Document.pdf", type: "pdf" },
  { id: 3, name: "Video.mp4", type: "video" },
];
const PRIVATE_FILES: JobFile[] = [
  { id: 4, name: "Spreadsheet.xls", type: "spreadsheet" },
  { id: 5, name: "Document.doc", type: "word" },
];

const FILE_META = "Added on Jan 1, 2025 by Lorne R.";
const EQUIPMENT_TITLE = "Air Handler • American Range";

// ---- small header buttons ---------------------------------------------------

const AddButton = ({ label }: { label: string }) => (
  <HoverTooltip text={label}>
    <IconButton icon="plus" variant="ghost" size="md" aria-label={label} onClick={noop} />
  </HoverTooltip>
);
// The file overflow menu is a later flow — display-only.
const FileMenuButton = () => <IconButton icon="ellipsis" variant="ghost" size="md" aria-label="More actions" onClick={noop} />;

// A draggable file row (grip on the left, overflow on the right). The group
// clones this wrapper with isDragging/disabled for the lifted copy, so both
// must be forwarded to the ListItem for the drag card look.
const FileRow = ({ file, isDragging, disabled }: { file: JobFile; isDragging?: boolean; disabled?: boolean }) => (
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
    slotRight={<FileMenuButton />}
  />
);

// The equipment row + its Preview / Remove context menu (Figma node 21760-11304).
// Remove hides the row (→ the module's "No equipment here yet" empty state) and
// toasts (Figma 24137-16824).
const EquipmentRow = ({ mobile, onRemove }: { mobile: boolean; onRemove: () => void }) => {
  const menu = useAnchoredMenu(!mobile, "end");

  const body = (
    <>
      <MenuItemGroup>
        <MenuItem label="Preview" slotLeft={slot("eye")} onClick={menu.close} />
      </MenuItemGroup>
      <MenuItemGroup>
        <MenuItem
          label="Remove"
          slotLeft={slot("xmark")}
          onClick={() => {
            menu.close();
            onRemove();
            toast({ type: "success", title: `"${EQUIPMENT_TITLE}" removed` });
          }}
        />
      </MenuItemGroup>
    </>
  );

  return (
    <>
      <ListItem
        variant="titleCaption"
        title={EQUIPMENT_TITLE}
        caption="Model: 01234 • Serial: 56789"
        avatar={<AvatarEquipment size="xl" />}
        isClickable
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
      {mobile ? (
        <Menu open={menu.open} onClose={menu.close} title={EQUIPMENT_TITLE} breakpoint="mobile">
          {body}
        </Menu>
      ) : (
        menu.pos != null && (
          <div ref={menu.cardRef} className={styles.anchoredMenu} style={{ top: menu.pos.top, left: menu.pos.left, right: menu.pos.right }}>
            <Menu open={menu.open} onClose={menu.close} breakpoint="desktop">
              {body}
            </Menu>
          </div>
        )
      )}
    </>
  );
};

// ---- the panel --------------------------------------------------------------

// Moves an item within an array (the ItemGroup drag-reorder callback shape).
const move = <T,>(setArr: React.Dispatch<React.SetStateAction<T[]>>) => (from: number, to: number) =>
  setArr((prev) => {
    const next = [...prev];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  });

// The "Service" tab content (Figma node 23823-24622): Service value group (edit
// via the pencil → ServiceForm), Equipment list (row menu), and Files (Public /
// Private, drag-reorderable).
export default function ServicePanel({ mobile = false }: { mobile?: boolean }) {
  const [publicFiles, setPublicFiles] = useState(PUBLIC_FILES);
  const [privateFiles, setPrivateFiles] = useState(PRIVATE_FILES);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [hasEquipment, setHasEquipment] = useState(true);

  return (
    <div className={styles.panel}>
      {/* Service — editable via the pencil (opens ServiceForm). */}
      <DisplayModule
        title="Service"
        slotRight={
          <HoverTooltip text="Edit">
            <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit service" onClick={() => setServiceOpen(true)} />
          </HoverTooltip>
        }
        content={
          <ValueDisplayGroup>
            <ValueDisplay label="Type" value={JOB_TYPE} />
            <ValueDisplay
              label="Recall to"
              kind="linkButton"
              link={
                <LinkButton rightIcon="arrow-up-right" onClick={noop}>
                  {JOB_RECALL_TO}
                </LinkButton>
              }
            />
            <ValueDisplay label="Service" value={JOB_SERVICE} />
            <ValueDisplay
              label="Priority"
              value="Medium"
              slotLeft={<Icon icon="duotone-solid-priority-medium" pack="custom-duotone" size={14} />}
            />
            <ValueDisplay label="Reason for call" orientation="vertical" value={JOB_REASON_FOR_CALL} />
            <ValueDisplay label="Tech instructions" orientation="vertical" value={JOB_TECH_INSTRUCTIONS} />
          </ValueDisplayGroup>
        }
      />
      <ServiceForm open={serviceOpen} onClose={() => setServiceOpen(false)} mobile={mobile} />

      {/* Equipment — removing the only item shows the empty state (Figma 21760-11307). */}
      <DisplayModule
        title="Equipment"
        titleSlotRight={hasEquipment ? <Counter value={1} /> : undefined}
        slotRight={<AddButton label="Add equipment" />}
        content={
          hasEquipment ? (
            <div className={styles.listBody}>
              <ItemGroup>
                <EquipmentRow mobile={mobile} onRemove={() => setHasEquipment(false)} />
              </ItemGroup>
            </div>
          ) : (
            <EmptyState caption="No equipment here yet" />
          )
        }
      />

      {/* Files — Public / Private groups, each drag-reorderable */}
      <DisplayModule
        title="Files"
        titleSlotRight={<Counter value={5} />}
        slotRight={<AddButton label="Add files" />}
        content={
          <div className={styles.listBody}>
            <ItemGroup
              label={<GroupLabel variant="primary" slotLeft={<Icon icon="globe" size={14} />} label="Public" />}
              onReorder={move(setPublicFiles)}
              divider
            >
              {publicFiles.map((f) => (
                <FileRow key={f.id} file={f} />
              ))}
            </ItemGroup>
            <ItemGroup
              label={<GroupLabel variant="primary" slotLeft={<Icon icon="lock" size={14} />} label="Private" />}
              onReorder={move(setPrivateFiles)}
            >
              {privateFiles.map((f) => (
                <FileRow key={f.id} file={f} />
              ))}
            </ItemGroup>
          </div>
        }
      />
    </div>
  );
}
