import { MouseEvent, ReactNode, useState } from "react";

import AvatarEquipment from "../../../components/Avatar/AvatarEquipment";
import AvatarWarning from "../../../components/Avatar/AvatarWarning";
import Button from "../../../components/Button/Button";
import CheckboxItem from "../../../components/Checkbox/CheckboxItem";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import EmptyState from "../../../components/EmptyState/EmptyState";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import FormModule from "../../../components/FormModule/FormModule";
import { Icon } from "../../../components/Icon/Icon";
import IconButton from "../../../components/IconButton/IconButton";
import Input from "../../../components/Input/Input";
import ItemGroup from "../../../components/ItemGroup/ItemGroup";
import ListItem from "../../../components/ListItem/ListItem";
import MenuItem from "../../../components/Menu/MenuItem";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import SelectListFooter from "../../../components/SelectList/SelectListFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import { EQUIPMENT_LABELS, equipmentOf } from "../../../data/db";
import { Equipment } from "../../../data/db/types";
import { TEXT_SEPARATOR } from "../../../utils/textSeparator";
import NewEquipmentForm from "../../NewEquipmentForm/NewEquipmentForm";
import { NewEquipment } from "../../NewEquipmentForm/NewEquipmentForm.types";
import DismissCancelButton from "../../shared/DismissCancelButton";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

import { EquipmentModuleProps } from "./EquipmentModule.types";
import styles from "./EquipmentModule.module.scss";

// The "Equipment" module of the "New Job" form (Figma 17189-78592). On top,
// the "Make equipment required" card checkbox: it makes the "Equipment" step
// of the "Complete job" form required (unchecked by default) — picking
// equipment NOW stays optional either way, which is what its caption says.
// Below it, an optional multi-select over the picked LOCATION's equipment;
// the picks list below the field with a Remove (×) per row. Row copy follows
// the ListItem Template doc: "Name · Manufacturer" / "Serial: X · Model: Y",
// with "No <value>" placeholders and the WARNING avatar when manufacturer,
// model or serial is missing. Rows are clickable no-ops (they would open the
// Equipment side panel — out of scope), like the Similar-jobs rows.
//
// The list, by presentation (the 2026-10-26 Figma update):
// - desktop card: picks apply as you tick; the footer is the "Add equipment"
//   MenuItem.
// - mobile drawer: picks are a DRAFT — Cancel / "Add equipment" / "Add N" in
//   the footer, and only "Add N" applies them. Leaving with changed ticks
//   asks "Discard changes?" (Daniel, 2026-10-26: standard Dialog behaviour,
//   always on — never wait for Figma to draw it). With no equipment at all there
//   is nothing to pick, so the footer is the "Add equipment" MenuItem alone.
// Both: "No equipment" / "No equipment match" are caption-only EmptyStates.

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

export default function EquipmentModule({
  value,
  onChange,
  isEquipmentRequired,
  onEquipmentRequiredChange,
  locationId,
  locationLabel,
  mobile,
}: EquipmentModuleProps) {
  const pop = useSelectPopover(mobile);
  const [createOpen, setCreateOpen] = useState(false);

  const options = [
    ...(locationId ? equipmentOf(locationId) : []),
    ...sessionEquipment.filter((row) => row.locationId === (locationId ?? "created")),
  ].sort((a, b) => a.displayName.localeCompare(b.displayName));
  const selected = options.filter((row) => value.includes(row.id));

  // The mobile drawer's draft, seeded on the closed→open transition DURING
  // render (not in an effect) so SelectList's "selected on top" snapshot sees
  // it — the LabelsSelectList pattern.
  const [draft, setDraft] = useState<string[]>(value);
  const [wasOpen, setWasOpen] = useState(pop.open);
  if (pop.open !== wasOpen) {
    setWasOpen(pop.open);
    if (pop.open) setDraft(value);
  }
  const selection = mobile ? draft : value;
  // Changed ticks make every way out of the drawer (Cancel, ×, scrim, swipe)
  // ask "Discard changes?" first — the standard Dialog behaviour.
  const isDirty = mobile && (draft.length !== value.length || draft.some((id) => !value.includes(id)));

  const toggle = (id: string) => {
    const next = selection.includes(id) ? selection.filter((v) => v !== id) : [...selection, id];
    if (mobile) setDraft(next);
    else onChange(next);
  };

  const remove = (id: string) => onChange(value.filter((v) => v !== id));

  // "Add equipment" leaves the list for the New-equipment form. On mobile the
  // ticks made so far are applied first, so they are not lost on the way.
  const openCreate = () => {
    if (mobile) onChange(draft);
    pop.close();
    setCreateOpen(true);
  };

  const applyDraft = () => {
    onChange(draft);
    pop.close();
  };

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
      type: created.type || undefined,
      physicalLocation: created.area || undefined,
      installationDate: created.installDate?.toISOString().slice(0, 10),
      ownership: (created.ownership || "Unknown") as Equipment["ownership"],
      // The form hands back label NAMES; only the ones that exist in the db's
      // EQUIPMENT_LABELS become ids (a label invented in the form is not a row).
      labelIds: EQUIPMENT_LABELS.filter((label) => created.labels.includes(label.name)).map((label) => label.id),
    };
    sessionEquipment.push(row);
    onChange([...value, row.id]);
  };

  return (
    <>
      <FormModule title="Equipment">
        <CheckboxItem
          variant="card"
          label="Make equipment required"
          caption="At least one piece of equipment will be required to complete the job. You don’t have to add it now."
          checked={isEquipmentRequired}
          onChange={(event) => onEquipmentRequiredChange(event.target.checked)}
        />
        <div className={styles.stack}>
          <Input label="Equipment" labelCondition="optional">
            <SelectField
              multiSelect
              count={value.length}
              value={selected.length === 1 ? selected[0].displayName : undefined}
              multiSelectLabel="Pieces of equipment"
              onClearSelection={() => onChange([])}
              open={pop.open}
              onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
            />
          </Input>
          {selected.length > 0 && (
            <DisplayModule
              variant="bodyOnly"
              bodyPadded={false}
              // A pick with issues (missing manufacturer / model / serial)
              // turns the module into the warning treatment — ring +
              // non-dismissible banner. It never blocks the next step.
              status={selected.some(hasIssues) ? "warning" : "none"}
              banner={selected.some(hasIssues) ? { children: "Key details are missing" } : undefined}
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
                            onClick={() => remove(row.id)}
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
        confirmOnDismiss={isDirty}
        noResultsState={<EmptyState caption="No equipment match" />}
        state={options.length === 0 ? "empty" : "default"}
        emptyState={{ caption: "No equipment" }}
        footer={
          mobile && options.length > 0 ? (
            <PopoverFooter slotLeft={<DismissCancelButton />}>
              <Button size="lg" variant="ghost" leftIcon="plus" onClick={openCreate}>
                Add equipment
              </Button>
              <Button size="lg" variant="solid" onClick={applyDraft}>
                {`Add ${draft.length}`}
              </Button>
            </PopoverFooter>
          ) : (
            <SelectListFooter>
              <MenuItem
                label="Add equipment"
                slotLeft={<Icon icon="plus" pack="regular" size={14} container="square" />}
                onClick={openCreate}
              />
            </SelectListFooter>
          )
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
              selected={selection.includes(row.id)}
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
