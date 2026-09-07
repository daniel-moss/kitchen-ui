import { useState } from "react";

import Counter from "../../components/Counter/Counter";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import LinkButton from "../../components/LinkButton/LinkButton";
import ListItem from "../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../components/ListItem/ListItemSlotIcon";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import ValueDisplay from "../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../components/ValueDisplay/ValueDisplayGroup";
import { NewEquipment } from "../../modules/NewEquipmentForm/NewEquipmentForm.types";
import { Equipment, EquipmentAvatar, equipmentCaptionText, equipmentTitle } from "./equipment";
import EquipmentForm, { EquipmentFormValues } from "./EquipmentForm";
import FilesModule from "./FilesModule";
import ServiceForm, { PRIORITIES, ServiceValues } from "./ServiceForm";
import { noop } from "./shared";

import styles from "./ServicePanel.module.scss";

// One equipment row. The whole row opens the Equipment side panel — a later
// flow, noop for now — and the angle icon says so (Daniel, 2026-08-03: the row
// menu is GONE, its Preview/Remove would conflict with the edit form, which is
// now the only place equipment is added or removed).
const EquipmentRow = ({ equipment }: { equipment: Equipment }) => (
  <ListItem
    variant="titleCaption"
    title={equipmentTitle(equipment)}
    caption={equipmentCaptionText(equipment)}
    avatar={<EquipmentAvatar equipment={equipment} />}
    isClickable
    onClick={noop}
    slotRight={<ListItemSlotIcon icon="angle-right" />}
  />
);

// ---- the panel --------------------------------------------------------------

// The "Service" tab content (Figma node 23823-24622): Service value group (edit
// via the pencil → ServiceForm), Equipment list (edit via the pencil →
// EquipmentForm), and Files (Public / Private, drag-reorderable).
export default function ServicePanel({
  mobile = false,
  serviceValues,
  onServiceChange,
  equipmentInvolved,
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
  /** The job's answer to "Is equipment involved?" — owned by useJobShell. */
  equipmentInvolved: EquipmentFormValues["involved"];
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
  const service = serviceValues;
  const priorityMeta = PRIORITIES.find((p) => p.value === service.priority);

  const jobEquipment = equipmentPool.filter((e) => equipmentIds.includes(e.id));

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
          "Equipment is not involved" with no Counter (21760-11307). The pencil
          opens the edit form, the only place equipment is picked. */}
      <DisplayModule
        title="Equipment"
        titleSlotRight={jobEquipment.length > 0 ? <Counter value={jobEquipment.length} /> : undefined}
        slotRight={
          <HoverTooltip text="Edit">
            <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit equipment" onClick={() => setEquipmentOpen(true)} />
          </HoverTooltip>
        }
        content={
          jobEquipment.length > 0 ? (
            <div className={styles.listBody}>
              <ItemGroup>
                {jobEquipment.map((e) => (
                  <EquipmentRow key={e.id} equipment={e} />
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

      <EquipmentForm
        open={equipmentOpen}
        onClose={() => setEquipmentOpen(false)}
        initial={{ involved: equipmentInvolved, equipmentIds }}
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
