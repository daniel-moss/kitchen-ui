import { MouseEvent, ReactNode, useState } from "react";

import AvatarEquipment from "../../../components/Avatar/AvatarEquipment";
import AvatarWarning from "../../../components/Avatar/AvatarWarning";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import FormModule from "../../../components/FormModule/FormModule";
import { Icon } from "../../../components/Icon/Icon";
import IconButton from "../../../components/IconButton/IconButton";
import ItemGroup from "../../../components/ItemGroup/ItemGroup";
import ListItem from "../../../components/ListItem/ListItem";
import MenuItem from "../../../components/Menu/MenuItem";
import SelectListFooter from "../../../components/SelectList/SelectListFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import { equipmentOf } from "../../../data/db";
import { Equipment } from "../../../data/db/types";
import { TEXT_SEPARATOR } from "../../../utils/textSeparator";
import NewEquipmentForm from "../../NewEquipmentForm/NewEquipmentForm";
import { NewEquipment } from "../../NewEquipmentForm/NewEquipmentForm.types";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

import { EquipmentModuleProps } from "./EquipmentModule.types";
import styles from "./EquipmentModule.module.scss";

// The "Equipment" module of the "New Job" form (Figma 17189-78592). Optional
// multi-select over the picked LOCATION's equipment; the picks list below the
// field with a Remove (×) per row. Row copy follows the ListItem Template
// doc: "Name · Manufacturer" / "Serial: X · Model: Y", with "No <value>"
// placeholders and the WARNING avatar when manufacturer, model or serial is
// missing. Rows are clickable no-ops (they would open the Equipment side
// panel — out of scope), like the Similar-jobs rows.

// Equipment created in the flow, per location — module scope.
const sessionEquipment: Equipment[] = [];

/** Resolve a picked equipment row (db or session) — e.g. for required forms. */
export const equipmentRowOf = (id: string): Equipment | undefined =>
  sessionEquipment.find((row) => row.id === id);

const placeholder = (text: string): ReactNode => <span className={styles.placeholderText}>{text}</span>;

const hasIssues = (row: Equipment) => !row.manufacturer || !row.modelNumber || !row.serialNumber;

const equipmentTitle = (row: Equipment): ReactNode => (
  <>
    {row.displayName}
    {TEXT_SEPARATOR}
    {row.manufacturer ?? placeholder("No Manufacturer")}
  </>
);

const equipmentCaption = (row: Equipment): ReactNode => (
  <>
    {row.serialNumber ? `Serial: ${row.serialNumber}` : placeholder("No Serial number")}
    {TEXT_SEPARATOR}
    {row.modelNumber ? `Model: ${row.modelNumber}` : placeholder("No Model number")}
  </>
);

const equipmentAvatar = (row: Equipment) =>
  hasIssues(row) ? <AvatarWarning size="xl" /> : <AvatarEquipment size="xl" />;

const searchText = (row: Equipment) =>
  [row.displayName, row.manufacturer, row.modelNumber, row.serialNumber].filter(Boolean).join(" ");

export default function EquipmentModule({ value, onChange, locationId, locationLabel, mobile }: EquipmentModuleProps) {
  const pop = useSelectPopover(mobile);
  const [createOpen, setCreateOpen] = useState(false);

  const options = [
    ...(locationId ? equipmentOf(locationId) : []),
    ...sessionEquipment.filter((row) => row.locationId === (locationId ?? "created")),
  ].sort((a, b) => a.displayName.localeCompare(b.displayName));
  const selected = options.filter((row) => value.includes(row.id));

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  // A piece created in the flow joins the location's pool and is selected
  // (the dev notes).
  const handleCreated = (created: NewEquipment) => {
    const row: Equipment = {
      id: `created-${Date.now()}`,
      locationId: locationId ?? "created",
      displayName: created.name,
      category: created.category as Equipment["category"],
      manufacturer: created.manufacturer || undefined,
      modelNumber: created.model || undefined,
      serialNumber: created.serial || undefined,
      physicalLocation: created.area || undefined,
      installationDate: created.installDate?.toISOString().slice(0, 10),
      ownership: (created.ownership || "Unknown") as Equipment["ownership"],
    };
    sessionEquipment.push(row);
    onChange([...value, row.id]);
  };

  return (
    <>
      <FormModule title="Equipment" titleCondition="optional">
        <div className={styles.stack}>
          <SelectField
            multiSelect
            count={value.length}
            value={selected.length === 1 ? selected[0].displayName : undefined}
            multiSelectLabel="Pieces of equipment"
            onClearSelection={() => onChange([])}
            open={pop.open}
            onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
          />
          {selected.length > 0 && (
            <DisplayModule
              variant="bodyOnly"
              bodyPadded={false}
              // The 2026-09-08 update (node 24162-34057): a pick with issues
              // (missing manufacturer / model / serial) turns the module into
              // the warning treatment — ring + non-dismissible banner.
              status={selected.some(hasIssues) ? "warning" : "none"}
              banner={
                selected.some(hasIssues) ? { children: "Some details require your attention!" } : undefined
              }
              content={
                <ItemGroup>
                  {selected.map((row) => (
                    <ListItem
                      key={row.id}
                      variant="titleCaption"
                      title={equipmentTitle(row)}
                      caption={equipmentCaption(row)}
                      avatar={equipmentAvatar(row)}
                      isClickable
                      onClick={() => {}}
                      slotRight={
                        <HoverTooltip text="Remove">
                          <IconButton
                            icon="close"
                            variant="muted"
                            size="md"
                            aria-label={`Remove ${row.displayName}`}
                            onClick={() => toggle(row.id)}
                          />
                        </HoverTooltip>
                      }
                    />
                  ))}
                </ItemGroup>
              }
            />
          )}
        </div>
      </FormModule>

      {/* The Equipment list (Figma 17189-78623): the location's pool, A→Z. */}
      <SelectPopoverList
        pop={pop}
        mobile={mobile}
        title="Equipment"
        multiSelect
        searchable={options.length > 0}
        searchPlaceholder="Equipment..."
        noResultsCaption="Try a different search or add a new equipment"
        state={options.length === 0 ? "empty" : "default"}
        emptyState={{
          icon: "cube",
          title: "No equipment here yet",
          caption: "Add equipment to see it here",
          actionLabel: "Add equipment",
          onAction: () => {
            pop.close();
            setCreateOpen(true);
          },
        }}
        footer={
          options.length > 0 ? (
            <SelectListFooter>
              <MenuItem
                label="Add equipment"
                slotLeft={<Icon icon="plus" pack="regular" size={14} container="square" />}
                onClick={() => {
                  pop.close();
                  setCreateOpen(true);
                }}
              />
            </SelectListFooter>
          ) : undefined
        }
      >
        <SelectListItemGroup>
          {options.map((row) => (
            <SelectListItem
              key={row.id}
              variant="object"
              multiSelect
              label={equipmentTitle(row)}
              caption={equipmentCaption(row)}
              avatar={equipmentAvatar(row)}
              searchText={searchText(row)}
              selected={value.includes(row.id)}
              onClick={() => toggle(row.id)}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      <NewEquipmentForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        location={locationLabel ?? ""}
        onCreated={handleCreated}
        breakpoint={mobile ? "mobile" : "desktop"}
      />
    </>
  );
}
