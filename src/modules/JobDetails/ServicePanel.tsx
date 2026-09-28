import { useState } from "react";

import Counter from "../../components/Counter/Counter";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
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
import { toast } from "../../components/Toast/Toaster";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import ValueDisplay from "../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../components/ValueDisplay/ValueDisplayGroup";
import EquipmentPanel from "../EquipmentPanel/EquipmentPanel";
import { NewEquipment } from "../NewEquipmentForm/NewEquipmentForm.types";
import { EQUIPMENT_LABELS, Equipment as EquipmentRecord, equipmentById, jobById } from "../../data/db";
import { useCurrentJobId } from "./currentJob";
import { Equipment, EquipmentAvatar, equipmentCaption, equipmentCaptionText, equipmentIncomplete, equipmentLabel, equipmentTitle } from "./equipment";
import EquipmentForm, { EquipmentFormValues } from "./EquipmentForm";
import FilesModule from "./FilesModule";
import ServiceForm, { PRIORITIES, ServiceValues } from "./ServiceForm";
import { noop, slot, useAnchoredMenu } from "./shared";

import styles from "./ServicePanel.module.scss";

// One equipment row: a clickable row that opens the "Equipment" side panel,
// with an ELLIPSIS context menu in its right slot (node 21760-41273 desktop /
// 21760-41511 mobile). Preview does the same thing the row click does; Remove
// takes the piece off the job.
//
// The menu came BACK on 2026-09-28. It had been dropped on 2026-08-03 because
// "Preview/Remove would conflict with the edit form, the only place equipment
// is added or removed" — the updated design settles that the other way: the
// form ADDS (its header button is a plus), and a row removes itself.
//
// NEITHER item is danger (`isDanger=false` on both nodes): removing a piece
// from a job does not delete the equipment, it only unlinks it.
const EquipmentRow = ({
  equipment,
  mobile,
  onOpen,
  onRemove,
}: {
  equipment: Equipment;
  mobile: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) => {
  const menu = useAnchoredMenu(!mobile);

  const menuBody = (
    <>
      <MenuItemGroup>
        <MenuItem
          label="Preview"
          slotLeft={slot("eye")}
          onClick={() => {
            menu.close();
            onOpen();
          }}
        />
      </MenuItemGroup>
      <MenuItemGroup>
        <MenuItem
          label="Remove"
          slotLeft={slot("xmark")}
          onClick={() => {
            menu.close();
            onRemove();
          }}
        />
      </MenuItemGroup>
    </>
  );

  return (
    <>
      <ListItem
        variant="titleCaption"
        title={equipmentTitle(equipment)}
        caption={equipmentCaptionText(equipment)}
        avatar={<EquipmentAvatar equipment={equipment} />}
        isClickable
        onClick={onOpen}
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
        <Menu
          open={menu.open}
          onClose={menu.close}
          // The drawer repeats the row: name + manufacturer over serial +
          // model (the header's two annotations).
          drawerHeader={
            <DrawerHeader>
              <PopoverHeaderContent avatar={<EquipmentAvatar equipment={equipment} />}>
                <PopoverHeaderText
                  variant="titleCaption"
                  title={equipmentLabel(equipment)}
                  caption={equipmentCaption(equipment)}
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

/**
 * The side panel reads a DATABASE equipment row. A piece created inside this
 * page (the New-equipment form) has no database row, so its values are mapped
 * onto the same shape — it still belongs to this job's location.
 */
const recordFor = (equipment: Equipment, locationId: string): EquipmentRecord =>
  equipmentById(equipment.id) ?? {
    id: equipment.id,
    locationId,
    displayName: equipment.name,
    category: (equipment.category ?? "Other") as EquipmentRecord["category"],
    type: equipment.type === "" ? undefined : equipment.type,
    manufacturer: equipment.manufacturer === "" ? undefined : equipment.manufacturer,
    modelNumber: equipment.model === "" ? undefined : equipment.model,
    serialNumber: equipment.serial === "" ? undefined : equipment.serial,
    physicalLocation: equipment.area === "" ? undefined : equipment.area,
    installationDate: equipment.installDate,
    ownership: (equipment.ownership === "" || equipment.ownership == null ? "Unknown" : equipment.ownership) as EquipmentRecord["ownership"],
    labelIds: [],
    notes: equipment.notes === "" ? undefined : equipment.notes,
  };

// ---- the panel --------------------------------------------------------------

// The "Service" tab content (Figma node 23823-24622): Service value group (edit
// via the pencil → ServiceForm), Equipment list (edit via the pencil →
// EquipmentForm), and Files (Public / Private, drag-reorderable).
export default function ServicePanel({
  mobile = false,
  serviceValues,
  onServiceChange,
  equipmentIds,
  onEquipmentSave,
  equipmentPool,
  onCreateEquipment,
  locationName,
  serviceLocked = false,
}: {
  mobile?: boolean;
  serviceValues: ServiceValues;
  onServiceChange: (next: ServiceValues) => void;
  /** The job's equipment (ids into the pool) — owned by useJobShell. */
  equipmentIds: string[];
  /** Commits the Equipment form: the answer + the job's equipment ids. */
  onEquipmentSave: (next: EquipmentFormValues) => void;
  /** The location's equipment — owned by useJobShell (the New-equipment form
   *  appends to it). */
  equipmentPool: Equipment[];
  /** Creates a piece in the location's pool and returns it; the Equipment form
   *  ticks it in its draft. */
  onCreateEquipment: (equipment: NewEquipment) => Equipment;
  /** The job's service location — the New-equipment form's header caption
   *  (equipment belongs to a location). */
  locationName: string;
  /** Hides the Service module's edit pencil (Concept 8 tech view — only the
   *  office edits). Equipment and Files stay editable. Default false. */
  serviceLocked?: boolean;
}) {
  const [serviceOpen, setServiceOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  // The piece the side panel shows, and whether it is open — kept SEPARATE on
  // purpose: dropping the record on close would unmount the panel in the same
  // commit and its slide-out would never play. The record stays until the next
  // row is opened (Daniel, 2026-09-28).
  const [previewed, setPreviewed] = useState<EquipmentRecord | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const openPanel = (record: EquipmentRecord) => {
    setPreviewed(record);
    setPanelOpen(true);
  };
  const jobId = useCurrentJobId();
  const service = serviceValues;
  const priorityMeta = PRIORITIES.find((p) => p.value === service.priority);

  const jobEquipment = equipmentPool.filter((e) => equipmentIds.includes(e.id));
  // "If at least one piece of equipment is missing key details, we show a
  // banner" (the Warning frame's annotation, node 24749-140737).
  const equipmentWarning = jobEquipment.some(equipmentIncomplete);

  // A row's "Remove" — the piece leaves the JOB, it is not deleted. It goes
  // through the same commit the form uses, so it lands in the activity log
  // once; the toast is the row's own (node 21760-41248). Its caption is the
  // piece's name + manufacturer, joined by the shared separator (the node
  // still draws the retired "・").
  const removeEquipment = (equipment: Equipment) => {
    onEquipmentSave({ equipmentIds: equipmentIds.filter((id) => id !== equipment.id) });
    toast({ type: "success", variant: "detailed", title: "Equipment removed", caption: equipmentLabel(equipment) });
  };

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
            <ValueDisplay
              label="Type"
              value={service.type === "recall" ? "Recall" : "New"}
              // Same icons as the edit form's Type cards (sparkle / clock-rotate-left).
              slotLeft={
                <Icon
                  icon={service.type === "recall" ? "clock-rotate-left" : "sparkle"}
                  pack="regular"
                  size={14}
                  container="square"
                />
              }
            />
            {/* Only when there IS a job to recall to — an empty "No Recall to"
                row says nothing (Daniel, 2026-09-28). */}
            {service.type === "recall" && service.recallTo != null && (
              <ValueDisplay
                label="Recall to"
                kind="linkButton"
                link={
                  <LinkButton rightIcon="arrow-up-right" onClick={noop}>
                    {service.recallTo}
                  </LinkButton>
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

      {/* Equipment (Figma 21760-11304, REBUILT 2026-09-28) — a row per job
          equipment; empty → "Equipment is not involved" with no Counter
          (21760-11307).

          The header button is a PLUS, not a pencil: the updated design has no
          "Edit" — adding is the action, and the form it opens is the Equipment
          SelectList (its annotation: "'Add' IconButton — opens the SelectList").

          A piece missing any of manufacturer / model / serial turns the module
          into its WARNING state: an AlertBanner reading "Some details require
          your attention!" (node 24749-140737). The rows already show the amber
          avatar and the "No Manufacturer" placeholders. */}
      <DisplayModule
        title="Equipment"
        titleSlotRight={jobEquipment.length > 0 ? <Counter value={jobEquipment.length} /> : undefined}
        status={equipmentWarning ? "warning" : "none"}
        banner={equipmentWarning ? { children: "Some details require your attention!" } : undefined}
        slotRight={
          <HoverTooltip text="Add equipment">
            <IconButton icon="plus" variant="ghost" size="md" aria-label="Add equipment" onClick={() => setEquipmentOpen(true)} />
          </HoverTooltip>
        }
        content={
          jobEquipment.length > 0 ? (
            <div className={styles.listBody}>
              <ItemGroup>
                {jobEquipment.map((e) => (
                  <EquipmentRow
                    key={e.id}
                    equipment={e}
                    mobile={mobile}
                    onOpen={() => openPanel(recordFor(e, jobById(jobId)?.locationId ?? ""))}
                    onRemove={() => removeEquipment(e)}
                  />
                ))}
              </ItemGroup>
            </div>
          ) : (
            // The node's module body has NO padding of its own — EmptyState's
            // 32px is the whole padding.
            <div className={styles.emptyBody}>
              <EmptyState caption="Equipment is not involved" />
            </div>
          )
        }
      />

      {/* The row's side panel. The equipment record is local state, so the
          panel's own edit forms show their result while it is open; writing
          back into the JOB's equipment list is the next step (flagged). */}
      {previewed != null && (
        <EquipmentPanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          equipment={previewed}
          breakpoint={mobile ? "mobile" : "desktop"}
          onSaveDetails={(edits) => setPreviewed((prev) => (prev == null ? prev : { ...prev, ...edits }))}
          onSaveLabels={(labels) =>
            setPreviewed((prev) =>
              prev == null ? prev : { ...prev, labelIds: EQUIPMENT_LABELS.filter((label) => labels.includes(label.name)).map((label) => label.id) },
            )
          }
          onSaveNotes={(notes) => setPreviewed((prev) => (prev == null ? prev : { ...prev, notes: notes === "" ? undefined : notes }))}
        />
      )}

      <EquipmentForm
        open={equipmentOpen}
        onClose={() => setEquipmentOpen(false)}
        initial={{ equipmentIds }}
        equipmentPool={equipmentPool}
        onSave={onEquipmentSave}
        onCreateEquipment={onCreateEquipment}
        locationName={locationName}
        mobile={mobile}
      />

      {/* Files — list/cards toggle, Public/Private groups, per-file menus,
          empty states, and the file-limit banner (Figma "Files" doc). */}
      <FilesModule mobile={mobile} />
    </div>
  );
}
