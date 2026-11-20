import { useEffect, useState } from "react";

import Avatar from "../components/Avatar/Avatar";
import Button from "../components/Button/Button";
import Dialog from "../components/Dialog/Dialog";
import TextArea from "../components/Fields/TextArea/TextArea";
import TextField from "../components/Fields/TextField/TextField";
import Input from "../components/Input/Input";
import ItemGroup from "../components/ItemGroup/ItemGroup";
import ListItem from "../components/ListItem/ListItem";
import PopoverFooter from "../components/Popover/PopoverFooter";
import Prompt from "../components/Prompt/Prompt";
import ToggleItem from "../components/Toggle/ToggleItem";
import { InventoryLocation } from "../data/db";
import { LOCATION_TYPE_ICON, locationTitle } from "../modules/Product/InventoryLevel/InventoryLevelCard";
import { NO_SUGGESTIONS, overLimitError } from "../modules/Product/NewProductForm/productRules";
import { joinWithSeparator } from "../utils/textSeparator";

import ChoiceField from "./ChoiceField";
import { useCompanySettings } from "./store/CompanySettingsStore";

import styles from "./DemoSettingsPage.module.scss";

// The "Inventory locations" list of the Demo settings page (Daniel,
// 2026-11-16; delete + the Django fields 2026-11-19): every location the
// company has, active and inactive — add, edit, activate / deactivate and
// delete — so the Demo can show a company with no active location, or many.
//
// In production Roopairs staff do this in the Django admin; a user never can.
// The dialog carries what that admin carries (apps/inventory InventoryLocation):
//
//   Type           Warehouse · Drop-point · Truck
//   Name           required, 50 characters, unique in the company
//   Active         off = deactivated: kept, but offered nowhere new
//   Licence plate  trucks only, 10 characters
//   Address        Street · Apartment, suite, etc. · City · State/Province ·
//                  Postal code · Country — all optional here (see the type)
//   Notes          free text
//
// DELETE: production removes the location's stock levels with it (CASCADE)
// and refuses while a purchase order points at it (PROTECT). The demo has no
// such block, so it only warns.

type LocationType = InventoryLocation["type"];
type LocationValues = Omit<InventoryLocation, "id">;

const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: "truck", label: "Truck" },
  { value: "warehouse", label: "Warehouse" },
  { value: "dropPoint", label: "Drop-point" },
];

const MAX_NAME = 50;
const MAX_PLATE = 10;
const MAX_PART = 100;
const MAX_POSTAL = 20;

const typeLabel = (type: LocationType) => LOCATION_TYPES.find((entry) => entry.value === type)?.label ?? type;

const ADDRESS_PARTS = ["street", "unit", "city", "state", "postalCode", "country"] as const;
type AddressPart = (typeof ADDRESS_PARTS)[number];
type Address = Record<AddressPart, string>;

// Settings saved before 2026-11-19 carry only the one-line `address`: it
// opens in Street address, so a save never loses it.
const hasParts = (location?: InventoryLocation) =>
  location != null && ADDRESS_PARTS.some((part) => (location[part] ?? "") !== "");

const addressOf = (location?: InventoryLocation): Address => ({
  street: location?.street ?? (hasParts(location) ? "" : (location?.address ?? "")),
  unit: location?.unit ?? "",
  city: location?.city ?? "",
  state: location?.state ?? "",
  postalCode: location?.postalCode ?? "",
  country: location?.country ?? "",
});

/**
 * The one-line address — "1450 Industrial Way, Suite 4, San Leandro, CA
 * 94577, United States": state and postal code share a part, every empty part
 * is skipped. Undefined when nothing is filled.
 */
const formatAddress = (address: Address) => {
  const stateAndPostal = [address.state, address.postalCode].filter(Boolean).join(" ");
  const line = [address.street, address.unit, address.city, stateAndPostal, address.country].filter(Boolean).join(", ");
  return line === "" ? undefined : line;
};

const orUndefined = (value: string) => (value.trim() === "" ? undefined : value.trim());

/** Add (no `location`) or edit one location. */
function LocationDialog({
  open,
  location,
  takenNames,
  mobile,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  location?: InventoryLocation;
  /** The OTHER locations' names — a name must be unique. */
  takenNames: string[];
  mobile: boolean;
  onClose: () => void;
  onSave: (values: LocationValues) => void;
  /** Only when editing. */
  onDelete: () => void;
}) {
  const [name, setName] = useState("");
  // A new location opens as a truck — the most common kind.
  const [type, setType] = useState<LocationType>("truck");
  const [plateNumber, setPlateNumber] = useState("");
  const [address, setAddress] = useState<Address>(addressOf());
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(location?.name ?? "");
    setType(location?.type ?? "truck");
    setPlateNumber(location?.plateNumber ?? "");
    setAddress(addressOf(location));
    setNotes(location?.notes ?? "");
    setIsActive(location?.isActive ?? true);
    setSubmitted(false);
  }, [open, location]);

  const trimmed = name.trim();
  // Missing / taken show after a Save; a text over its limit turns red at once.
  const nameError =
    trimmed === ""
      ? "Enter name"
      : takenNames.some((taken) => taken.toLowerCase() === trimmed.toLowerCase())
        ? "This location already exists"
        : undefined;
  const nameTooLong = overLimitError(name, MAX_NAME);
  const plateTooLong = type === "truck" ? overLimitError(plateNumber, MAX_PLATE) : undefined;
  const partTooLong = (part: AddressPart) => overLimitError(address[part], part === "postalCode" ? MAX_POSTAL : MAX_PART);
  const blocked =
    nameError != null || nameTooLong != null || plateTooLong != null || ADDRESS_PARTS.some((part) => partTooLong(part) != null);

  const initialAddress = addressOf(location);
  const dirty =
    trimmed !== (location?.name ?? "") ||
    type !== (location?.type ?? "truck") ||
    plateNumber.trim() !== (location?.plateNumber ?? "") ||
    ADDRESS_PARTS.some((part) => address[part].trim() !== initialAddress[part]) ||
    notes.trim() !== (location?.notes ?? "") ||
    isActive !== (location?.isActive ?? true);

  const save = () => {
    if (blocked) {
      setSubmitted(true);
      return;
    }
    const parts = Object.fromEntries(ADDRESS_PARTS.map((part) => [part, address[part].trim()])) as Address;
    onSave({
      name: trimmed,
      type,
      // Only a truck carries a licence plate.
      plateNumber: type === "truck" ? orUndefined(plateNumber) : undefined,
      street: orUndefined(parts.street),
      unit: orUndefined(parts.unit),
      city: orUndefined(parts.city),
      state: orUndefined(parts.state),
      postalCode: orUndefined(parts.postalCode),
      country: orUndefined(parts.country),
      address: formatAddress(parts),
      notes: orUndefined(notes),
      isActive,
    });
    onClose();
  };

  const part = (key: AddressPart, label: string) => (
    <Input label={label} labelCondition="optional">
      <TextField
        value={address[key]}
        onChange={(event) => setAddress({ ...address, [key]: event.target.value })}
        {...NO_SUGGESTIONS}
        isValid={partTooLong(key) == null}
        errorMessage={partTooLong(key)}
      />
    </Input>
  );

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
            location != null ? (
              <Button size="lg" variant="danger" leftIcon="trash-can" onClick={onDelete}>
                Delete
              </Button>
            ) : (
              <Button size="lg" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            )
          }
        >
          {location != null && (
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button size="lg" variant="solid" onClick={save}>
            {location == null ? "Add" : "Save"}
          </Button>
        </PopoverFooter>
      }
    >
      <ChoiceField
        label="Type"
        value={type}
        options={LOCATION_TYPES}
        onChange={(next) => next != null && setType(next)}
        mobile={mobile}
      />
      <Input label="Name">
        <TextField
          value={name}
          onChange={(event) => setName(event.target.value)}
          {...NO_SUGGESTIONS}
          isValid={nameTooLong == null && !(submitted && nameError != null)}
          errorMessage={nameTooLong ?? nameError}
        />
      </Input>
      {type === "truck" && (
        <Input label="Licence plate" labelCondition="optional" helpText="Shown before the name">
          <TextField
            value={plateNumber}
            onChange={(event) => setPlateNumber(event.target.value)}
            {...NO_SUGGESTIONS}
            isValid={plateTooLong == null}
            errorMessage={plateTooLong}
          />
        </Input>
      )}
      <ToggleItem
        label="Active"
        caption="Off: no new stock or job line can use this location"
        checked={isActive}
        onChange={(event) => setIsActive(event.target.checked)}
      />
      {part("street", "Street address")}
      {part("unit", "Apartment, suite, etc.")}
      <div className={styles.fieldRow}>
        {part("city", "City")}
        {part("state", "State/Province")}
      </div>
      <div className={styles.fieldRow}>
        {part("postalCode", "Postal code")}
        {part("country", "Country")}
      </div>
      <Input label="Notes" labelCondition="optional">
        <TextArea value={notes} onChange={(event) => setNotes(event.target.value)} />
      </Input>
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
  const [deleting, setDeleting] = useState(false);
  const setEditing = (target: InventoryLocation | null) => {
    setEditingTarget(target);
    setOpen(true);
  };

  const remove = () => {
    if (editing != null) update({ inventoryLocations: locations.filter((row) => row.id !== editing.id) });
    setDeleting(false);
    setOpen(false);
  };

  const save = (values: LocationValues) => {
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
        onDelete={() => setDeleting(true)}
      />
      <Prompt
        open={deleting}
        title="Delete inventory location?"
        body={`${editing?.name ?? "This location"} and every product's stock at it will be deleted. To keep them, deactivate the location instead.`}
        actionLabel="Delete"
        actionVariant="danger"
        actionIcon="trash-can"
        onAction={remove}
        onCancel={() => setDeleting(false)}
        breakpoint={mobile ? "mobile" : "desktop"}
      />
    </div>
  );
}
