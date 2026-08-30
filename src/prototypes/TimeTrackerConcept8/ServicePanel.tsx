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
import DrawerHeader from "../../components/Popover/DrawerHeader";
import PopoverHeaderContent from "../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../components/Popover/PopoverHeaderText";
import SelectList from "../../components/SelectList/SelectList";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import ValueDisplay from "../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../components/ValueDisplay/ValueDisplayGroup";
import { JOB_REASON_FOR_CALL, JOB_RECALL_TO, JOB_SERVICE, JOB_TECH_INSTRUCTIONS, JOB_TYPE } from "./jobData";
import ServiceForm, { PRIORITIES, ServiceValues } from "./ServiceForm";
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

// The location's equipment pool (Figma 21760-11304 demo values + realistic
// kitchen items; the add list is sorted by equipment name A→Z per the design
// annotation). The job starts with two of them added.
interface Equipment {
  id: number;
  name: string;
  manufacturer: string;
  model: string;
  serial: string;
}
const EQUIPMENT_POOL: Equipment[] = [
  { id: 1, name: "Air Handler", manufacturer: "American Range", model: "01234", serial: "56789" },
  { id: 2, name: "Griddle", manufacturer: "American Range", model: "GR-2436", serial: "AR55102" },
  { id: 3, name: "Ice Machine", manufacturer: "Hoshizaki", model: "KM-660", serial: "HK43307" },
  { id: 4, name: "Oven", manufacturer: "Bosch", model: "HBL8451", serial: "BS90781" },
  { id: 5, name: "Walk-in Cooler", manufacturer: "True Manufacturing", model: "T-23F-2", serial: "TM88213" },
];
const INITIAL_JOB_EQUIPMENT = [1, 5]; // Air Handler + Walk-in Cooler

// The design's "・" separator (same char the recall rows use).
const equipmentLabel = (e: Equipment) => `${e.name} ・ ${e.manufacturer}`;
const equipmentCaption = (e: Equipment) => `Model: ${e.model} ・ Serial: ${e.serial}`;

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

// One equipment row + its Preview / Remove context menu. Remove sits in its
// OWN group (divider before it — Daniel's call, diverges from Figma
// 21760-41351 which shows one group). The row itself and Preview open the
// Equipment side panel — a later flow, noop for now. Remove takes the
// equipment off the job and shows the detailed toast (Figma 21760-41249).
const EquipmentRow = ({ equipment, mobile, onRemove }: { equipment: Equipment; mobile: boolean; onRemove: (e: Equipment) => void }) => {
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
            onRemove(equipment);
          }}
        />
      </MenuItemGroup>
    </>
  );

  return (
    <>
      <ListItem
        variant="titleCaption"
        title={equipmentLabel(equipment)}
        caption={equipmentCaption(equipment)}
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
        // The drawer's rich header (Figma 21760-41707): equipment avatar +
        // name ・ manufacturer title + model/serial caption.
        <Menu
          open={menu.open}
          onClose={menu.close}
          drawerHeader={
            <DrawerHeader>
              <PopoverHeaderContent avatar={<AvatarEquipment size="xl" />}>
                <PopoverHeaderText variant="titleCaption" title={equipmentLabel(equipment)} caption={equipmentCaption(equipment)} />
              </PopoverHeaderContent>
            </DrawerHeader>
          }
          breakpoint="mobile"
        >
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
export default function ServicePanel({
  mobile = false,
  serviceValues,
  onServiceChange,
  serviceLocked = false,
}: {
  mobile?: boolean;
  serviceValues: ServiceValues;
  onServiceChange: (next: ServiceValues) => void;
  /** Hides the Service module's edit pencil (Concept 8 tech view — only the
   *  office edits). Equipment and Files stay editable. Default false. */
  serviceLocked?: boolean;
}) {
  const [publicFiles, setPublicFiles] = useState(PUBLIC_FILES);
  const [privateFiles, setPrivateFiles] = useState(PRIVATE_FILES);
  const [serviceOpen, setServiceOpen] = useState(false);
  // The job's equipment (ids into the pool) + the add-equipment list.
  const [equipmentIds, setEquipmentIds] = useState<number[]>(INITIAL_JOB_EQUIPMENT);
  const [equipmentListOpen, setEquipmentListOpen] = useState(false);
  const service = serviceValues;
  const priorityMeta = PRIORITIES.find((p) => p.value === service.priority);

  const jobEquipment = EQUIPMENT_POOL.filter((e) => equipmentIds.includes(e.id));
  // Removing (row menu or unchecking in the list) shows the detailed toast
  // (Figma 21760-41249); adding has no designed toast — it is silent.
  const removeEquipment = (e: Equipment) => {
    setEquipmentIds((prev) => prev.filter((id) => id !== e.id));
    toast({ type: "success", variant: "detailed", title: "Equipment removed", caption: equipmentLabel(e) });
  };
  const addEquipment = (e: Equipment) => setEquipmentIds((prev) => [...prev, e.id]);

  return (
    <div className={styles.panel}>
      {/* Service — editable via the pencil (opens ServiceForm). */}
      <DisplayModule
        title="Service"
        slotRight={
          serviceLocked ? undefined : (
            <HoverTooltip text="Edit">
              <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit service" onClick={() => setServiceOpen(true)} />
            </HoverTooltip>
          )
        }
        content={
          <ValueDisplayGroup>
            <ValueDisplay label="Type" value={service.type === "recall" ? "Recall" : "New"} />
            {service.type === "recall" && (
              <ValueDisplay
                label="Recall to"
                kind="linkButton"
                link={
                  service.recallTo != null ? (
                    <LinkButton rightIcon="arrow-up-right" onClick={noop}>
                      {service.recallTo}
                    </LinkButton>
                  ) : undefined
                }
              />
            )}
            <ValueDisplay label="Service" value={service.service} />
            <ValueDisplay
              label="Priority"
              value={service.priority}
              slotLeft={
                <span style={priorityMeta?.color != null ? { color: priorityMeta.color, display: "inline-flex" } : { display: "inline-flex" }}>
                  <Icon icon={priorityMeta?.icon ?? "hyphen"} pack={priorityMeta?.pack ?? "regular"} size={14} container="square" />
                </span>
              }
            />
            <ValueDisplay label="Reason for call" orientation="vertical" value={service.reason} />
            <ValueDisplay label="Tech instructions" orientation="vertical" value={service.tech} />
          </ValueDisplayGroup>
        }
      />
      <ServiceForm open={serviceOpen} onClose={() => setServiceOpen(false)} initial={service} onSave={onServiceChange} mobile={mobile} />

      {/* Equipment (Figma 21760-11304) — a row per job equipment; empty →
          "No equipment here yet" with no Counter (21760-41170). The plus opens
          the add list. */}
      <DisplayModule
        title="Equipment"
        titleSlotRight={jobEquipment.length > 0 ? <Counter value={jobEquipment.length} /> : undefined}
        slotRight={
          <HoverTooltip text="Add equipment">
            <IconButton icon="plus" variant="ghost" size="md" aria-label="Add equipment" onClick={() => setEquipmentListOpen(true)} />
          </HoverTooltip>
        }
        content={
          jobEquipment.length > 0 ? (
            <div className={styles.listBody}>
              <ItemGroup>
                {jobEquipment.map((e) => (
                  <EquipmentRow key={e.id} equipment={e} mobile={mobile} onRemove={removeEquipment} />
                ))}
              </ItemGroup>
            </div>
          ) : (
            <EmptyState caption="No equipment here yet" />
          )
        }
      />

      {/* Add equipment (Figma 24244-21291): the location's equipment pool as a
          MULTI-select — checked = on the job. Checking adds (silently),
          unchecking removes (+ toast). The footer's "Add equipment" opens the
          New-equipment form — a later flow, noop for now. */}
      <SelectList
        variant={mobile ? "drawer" : "dialog"}
        breakpoint={mobile ? "mobile" : "desktop"}
        title="Equipment"
        open={equipmentListOpen}
        onClose={() => setEquipmentListOpen(false)}
        multiSelect
        searchable
        searchPlaceholder="Search by equipment name..."
        noResultsCaption="Try a different search or add a new equipment"
        footer={
          <SelectListFooter>
            <MenuItem label="Add equipment" slotLeft={slot("plus")} onClick={noop} />
          </SelectListFooter>
        }
      >
        <SelectListItemGroup>
          {[...EQUIPMENT_POOL]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((e) => {
              const selected = equipmentIds.includes(e.id);
              return (
                <SelectListItem
                  key={e.id}
                  variant="object"
                  multiSelect
                  label={equipmentLabel(e)}
                  caption={equipmentCaption(e)}
                  avatar={<AvatarEquipment size="xl" />}
                  selected={selected}
                  onClick={() => (selected ? removeEquipment(e) : addEquipment(e))}
                />
              );
            })}
        </SelectListItemGroup>
      </SelectList>

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
