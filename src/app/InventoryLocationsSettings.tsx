import { useEffect, useState } from "react";

import Avatar from "../components/Avatar/Avatar";
import Button from "../components/Button/Button";
import Dialog from "../components/Dialog/Dialog";
import TextField from "../components/Fields/TextField/TextField";
import Input from "../components/Input/Input";
import ItemGroup from "../components/ItemGroup/ItemGroup";
import ListItem from "../components/ListItem/ListItem";
import PopoverFooter from "../components/Popover/PopoverFooter";
import ToggleItem from "../components/Toggle/ToggleItem";
import { InventoryLocation } from "../data/db";
import { LOCATION_TYPE_ICON, locationTitle } from "../modules/Product/NewProductForm/InventoryLevelsField";
import { joinWithSeparator } from "../utils/textSeparator";

import ChoiceField from "./ChoiceField";
import { useCompanySettings } from "./store/CompanySettingsStore";

import styles from "./DemoSettingsPage.module.scss";

// The "Inventory locations" list of the Demo settings page (Daniel,
// 2026-11-16): every location the company has, active and inactive, and the
// means to add and edit them — so the Demo can show a company with no active
// location (the product form's locked Stock type) or with many.
//
// In production Roopairs staff create locations in Django; a user never can.
// A location is DEACTIVATED, never removed, as in production: product stock
// and job lines point at it, so this list has no remove button.

type LocationType = InventoryLocation["type"];

const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: "truck", label: "Truck" },
  { value: "warehouse", label: "Warehouse" },
  { value: "dropPoint", label: "Drop-point" },
];

const typeLabel = (type: LocationType) => LOCATION_TYPES.find((entry) => entry.value === type)?.label ?? type;

/** Add (no `location`) or edit one location. */
function LocationDialog({
  open,
  location,
  takenNames,
  mobile,
  onClose,
  onSave,
}: {
  open: boolean;
  location?: InventoryLocation;
  /** The OTHER locations' names — a name must be unique. */
  takenNames: string[];
  mobile: boolean;
  onClose: () => void;
  onSave: (values: Omit<InventoryLocation, "id">) => void;
}) {
  const [name, setName] = useState("");
  // A new location opens as a truck — the most common kind.
  const [type, setType] = useState<LocationType>("truck");
  const [plateNumber, setPlateNumber] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(location?.name ?? "");
    setType(location?.type ?? "truck");
    setPlateNumber(location?.plateNumber ?? "");
    setAddress(location?.address ?? "");
    setIsActive(location?.isActive ?? true);
    setSubmitted(false);
  }, [open, location]);

  const trimmed = name.trim();
  const nameError =
    trimmed === ""
      ? "Enter name"
      : takenNames.some((taken) => taken.toLowerCase() === trimmed.toLowerCase())
        ? "This location already exists"
        : undefined;
  const dirty =
    trimmed !== (location?.name ?? "") ||
    type !== (location?.type ?? "truck") ||
    plateNumber.trim() !== (location?.plateNumber ?? "") ||
    address.trim() !== (location?.address ?? "") ||
    isActive !== (location?.isActive ?? true);

  const save = () => {
    if (nameError != null) {
      setSubmitted(true);
      return;
    }
    onSave({
      name: trimmed,
      type,
      // Only a truck carries a licence plate.
      plateNumber: type === "truck" && plateNumber.trim() !== "" ? plateNumber.trim() : undefined,
      address: address.trim() === "" ? undefined : address.trim(),
      isActive,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={location == null ? "New inventory location" : "Edit inventory location"}
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={dirty}
      footer={
        <PopoverFooter
          slotLeft={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={save}>
            {location == null ? "Add" : "Save"}
          </Button>
        </PopoverFooter>
      }
    >
      <Input label="Name">
        <TextField
          value={name}
          onChange={(event) => setName(event.target.value)}
          isValid={!(submitted && nameError != null)}
          errorMessage={nameError}
        />
      </Input>
      <ChoiceField
        label="Type"
        value={type}
        options={LOCATION_TYPES}
        onChange={(next) => next != null && setType(next)}
        mobile={mobile}
      />
      {type === "truck" && (
        <Input label="Plate number" labelCondition="optional" helpText="Shown before the name">
          <TextField value={plateNumber} onChange={(event) => setPlateNumber(event.target.value)} />
        </Input>
      )}
      <Input label="Address" labelCondition="optional">
        <TextField value={address} onChange={(event) => setAddress(event.target.value)} />
      </Input>
      <ToggleItem
        label="Active"
        caption="Off: no new stock or job line can use this location"
        checked={isActive}
        onChange={(event) => setIsActive(event.target.checked)}
      />
    </Dialog>
  );
}

export default function InventoryLocationsSettings({ mobile }: { mobile: boolean }) {
  const { settings, update } = useCompanySettings();
  const locations = settings.inventoryLocations;
  // The dialog's target: null = adding, a location = editing it. Kept after
  // the dialog closes, so its title does not flip while it animates out.
  const [open, setOpen] = useState(false);
  const [editing, setEditingTarget] = useState<InventoryLocation | null>(null);
  const setEditing = (target: InventoryLocation | null) => {
    setEditingTarget(target);
    setOpen(true);
  };

  const save = (values: Omit<InventoryLocation, "id">) => {
    if (editing == null) {
      const id = `inv-${Date.now().toString(36)}`;
      update({ inventoryLocations: [...locations, { id, ...values }] });
    } else {
      update({
        inventoryLocations: locations.map((row) => (row.id === editing.id ? { id: row.id, ...values } : row)),
      });
    }
  };

  // Active first, then A–Z — the way a picker would offer them.
  const rows = [...locations].sort(
    (a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name),
  );

  return (
    <div className={styles.statusList}>
      <ItemGroup>
        {rows.map((location) => (
          <ListItem
            key={location.id}
            variant="titleCaption"
            title={locationTitle(location)}
            caption={joinWithSeparator(typeLabel(location.type), location.isActive ? undefined : "Inactive", location.address)}
            avatar={
              <Avatar size="xl" shape="square" content="icon" icon={LOCATION_TYPE_ICON[location.type]} iconPack="solid" />
            }
            isClickable
            onClick={() => setEditing(location)}
          />
        ))}
      </ItemGroup>
      <Button size="lg" variant="subtle" leftIcon="plus" onClick={() => setEditing(null)}>
        Add location
      </Button>
      <LocationDialog
        open={open}
        location={editing ?? undefined}
        takenNames={locations.filter((row) => row.id !== editing?.id).map((row) => row.name)}
        mobile={mobile}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </div>
  );
}
