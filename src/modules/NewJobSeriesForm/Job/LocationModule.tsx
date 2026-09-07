import { MouseEvent, useState } from "react";

import AlertBanner from "../../../components/AlertBanner/AlertBanner";
import AvatarClient from "../../../components/Avatar/AvatarClient";
import AvatarLocation from "../../../components/Avatar/AvatarLocation";
import Card from "../../../components/Card/Card";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import FormModule from "../../../components/FormModule/FormModule";
import GroupLabel from "../../../components/GroupLabel/GroupLabel";
import { Icon } from "../../../components/Icon/Icon";
import IconButton from "../../../components/IconButton/IconButton";
import ListItem from "../../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../../components/ListItem/ListItemSlotIcon";
import MenuItem from "../../../components/Menu/MenuItem";
import Prompt from "../../../components/Prompt/Prompt";
import SelectList from "../../../components/SelectList/SelectList";
import SelectListFooter from "../../../components/SelectList/SelectListFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import { clientById, LOCATIONS } from "../../../data/db";
import { Client } from "../../../data/db/types";
import { joinWithSeparator } from "../../../utils/textSeparator";
import NewLocationForm from "../../NewLocationForm/NewLocationForm";
import { NewLocation } from "../../NewLocationForm/NewLocationForm.types";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

import { LocationModuleProps, SelectedLocation } from "./LocationModule.types";
import { clientIssues, clientsSorted, locationAddress, locationLine, locationsSorted } from "./newJobData";
import styles from "./LocationModule.module.scss";

// The "Location" module of the "New Job" form (Figma 15504-55246): the
// service-location picker. The SelectList groups locations by client (active
// clients first, A→Z; inactive clients disabled), each group header carries a
// "+" that opens the NewLocationForm for that client, and the footer's "Add
// location" first asks WHICH client via the Service-client dialog list.
// The selected location shows as a Card under the field; a client with
// issues (credit limit reached / billing address missing) turns it into the
// warning Card. The "Review" CTA and the card row will open the Location
// side panel — that panel doesn't exist in Kitchen UI yet, so both are
// non-interactive for now (Daniel, 2026-09-07).

const TIP =
  "Always pick the end-client location, no matter who called or is footing the bill for this work. " +
  "Don't worry - you'll get to add those third-party billers and whoever called it in later on!";

// Dismissing the tip hides it FOREVER (Daniel, 2026-09-07) — it is a lasting
// user choice, not form data. Module scope survives step switches (the module
// unmounts between steps) and form reopens; a page reload starts fresh, which
// is right for user-testing sessions.
let tipDismissedForever = false;

export default function LocationModule({ value, onChange, wouldClear = [], isValid = true, mobile }: LocationModuleProps) {
  const [tipDismissed, setTipDismissed] = useState(tipDismissedForever);
  const pop = useSelectPopover(mobile);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [newLocationClient, setNewLocationClient] = useState<Client | null>(null);
  const [pending, setPending] = useState<SelectedLocation | null>(null);

  const clients = clientsSorted();
  const valueClient = value?.clientId ? clientById(value.clientId) : undefined;
  const issues = valueClient ? clientIssues(valueClient) : [];

  // The Prompt is the LAST step of changing a location — and only when the
  // change would clear filled fields. Otherwise the pick applies silently.
  const requestChange = (next: SelectedLocation) => {
    if (value && wouldClear.length > 0 && next.id !== value.id) setPending(next);
    else onChange(next);
  };

  const openNewLocation = (client: Client) => {
    pop.close();
    setClientPickerOpen(false);
    setNewLocationClient(client);
  };

  // A location created in the flow is selected automatically (the dev notes).
  const handleCreated = (created: NewLocation) => {
    const client = newLocationClient;
    if (!client) return;
    requestChange({
      name: created.name || undefined,
      address: locationAddress({
        street: created.street || undefined,
        unit: created.suite || undefined,
        city: created.city || undefined,
        state: created.state || undefined,
        postalCode: created.postal || undefined,
      }),
      clientId: client.id,
      clientName: client.name,
    });
  };

  const selectedCard = value && (
    <Card
      padding={4}
      status={issues.length > 0 ? "warning" : undefined}
      banner={
        issues.length > 0
          ? { children: "Some details require your attention!", ctaLabel: "Review" }
          : undefined
      }
    >
      {/* The 2026-09-07 card treatment (Location module ONLY — Billing keeps
          the old row): client name + client avatar; the caption is the
          location NAME, or the full address for a nameless location. It
          wraps. Demo clients carry no logo, so AvatarClient falls back to
          its building icon. */}
      <ListItem
        variant="titleCaption"
        title={value.clientName}
        caption={value.name ?? value.address}
        captionLines="wrap"
        avatar={<AvatarClient size="xl" />}
        slotRight={<ListItemSlotIcon icon="angle-right" />}
      />
    </Card>
  );

  return (
    <>
      <FormModule
        title="Location"
        caption="Select the location where the equipment needing service is installed"
        titleHintContent={tipDismissed ? TIP : undefined}
        banner={
          !tipDismissed && (
            <AlertBanner
              type="card"
              orientation="vertical"
              status="info"
              onDismiss={() => {
                tipDismissedForever = true;
                setTipDismissed(true);
              }}
            >
              {TIP}
            </AlertBanner>
          )
        }
      >
        <div className={styles.stack}>
          <SelectField
            value={value ? locationLine(value.name, value.address) : undefined}
            open={pop.open}
            isValid={isValid}
            errorMessage="Choose Location"
            onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
          />
          {selectedCard}
        </div>
      </FormModule>

      {/* The "Location" SelectList (Figma 15514-58317): service clients only. */}
      <SelectPopoverList
        pop={pop}
        mobile={mobile}
        title="Location"
        searchable={LOCATIONS.length > 0}
        searchPlaceholder="Location or client..."
        noResultsCaption="Try a different search or add a new location"
        state={LOCATIONS.length === 0 ? "empty" : "default"}
        emptyState={{
          icon: "location-dot",
          title: "No locations here yet",
          caption: "Add a location to see it here",
          actionLabel: "Add location",
          onAction: () => {
            pop.close();
            setClientPickerOpen(true);
          },
        }}
        footer={
          LOCATIONS.length > 0 ? (
            <SelectListFooter>
              <MenuItem
                label="Add location"
                slotLeft={<Icon icon="plus" pack="regular" size={14} container="square" />}
                onClick={() => {
                  pop.close();
                  setClientPickerOpen(true);
                }}
              />
            </SelectListFooter>
          ) : undefined
        }
      >
        {clients.map((client) => {
          const rows = locationsSorted(client.id);
          if (rows.length === 0) return null;
          return (
            <SelectListItemGroup
              key={client.id}
              label={
                <GroupLabel
                  variant="primary"
                  label={client.name}
                  slotLeft={<AvatarClient size="sm" />}
                  caption={client.isActive ? undefined : "Inactive"}
                  slotRight={
                    client.isActive ? (
                      <HoverTooltip text="Add location">
                        <IconButton
                          icon="plus"
                          variant="ghost"
                          size="md"
                          aria-label={`Add location for ${client.name}`}
                          onClick={() => openNewLocation(client)}
                        />
                      </HoverTooltip>
                    ) : undefined
                  }
                />
              }
            >
              {rows.map((location) => (
                <SelectListItem
                  key={location.id}
                  variant="object"
                  // A nameless location shows the documented placeholder
                  // (ListItem Template doc, 27171-15212). The address always
                  // exists — it is required on creation (Daniel, 2026-09-07).
                  label={locationAddress(location)}
                  caption={location.name ?? <span className={styles.placeholderText}>No Location name</span>}
                  avatar={<AvatarLocation size="xl" />}
                  searchText={`${client.name} ${location.name ?? ""} ${locationAddress(location)}`}
                  disabled={!client.isActive}
                  selected={value?.id === location.id}
                  onClick={() =>
                    requestChange({
                      id: location.id,
                      name: location.name,
                      address: locationAddress(location),
                      clientId: client.id,
                      clientName: client.name,
                    })
                  }
                />
              ))}
            </SelectListItemGroup>
          );
        })}
      </SelectPopoverList>

      {/* The "Service client" list (Figma 15550-43833) — picks WHO the new
          location belongs to. "Add service client" is deferred with the New
          Client form (out of the current scope). */}
      <SelectList
        variant={mobile ? "drawer" : "dialog"}
        title="Service client"
        caption="Select a client for a new location"
        open={clientPickerOpen}
        onClose={() => setClientPickerOpen(false)}
        searchable
        searchPlaceholder="Client..."
        footer={
          <SelectListFooter>
            <MenuItem label="Add service client" slotLeft={<Icon icon="plus" pack="regular" size={14} container="square" />} onClick={() => {}} />
          </SelectListFooter>
        }
      >
        <SelectListItemGroup
          label={
            <GroupLabel
              variant="primary"
              label="Active"
              slotLeft={
                <Icon icon="circle-minus" pack="solid" size={14} container="square" rotate={90} className={styles.activeIcon} />
              }
            />
          }
        >
          {clients
            .filter((client) => client.isActive)
            .map((client) => (
              <SelectListItem
                key={client.id}
                variant="object"
                label={client.name}
                caption={joinWithSeparator(client.clientType, client.industryType)}
                avatar={<AvatarClient size="xl" />}
                searchText={client.name}
                onClick={() => openNewLocation(client)}
              />
            ))}
        </SelectListItemGroup>
        <SelectListItemGroup
          label={
            <GroupLabel
              variant="primary"
              label="Inactive"
              slotLeft={<Icon icon="ban" pack="solid" size={14} container="square" className={styles.inactiveIcon} />}
            />
          }
          divider={false}
        >
          {clients
            .filter((client) => !client.isActive)
            .map((client) => (
              <SelectListItem
                key={client.id}
                variant="object"
                label={client.name}
                caption={joinWithSeparator(client.clientType, client.industryType)}
                avatar={<AvatarClient size="xl" />}
                searchText={client.name}
                disabled
              />
            ))}
        </SelectListItemGroup>
      </SelectList>

      <NewLocationForm
        open={newLocationClient != null}
        onClose={() => setNewLocationClient(null)}
        client={newLocationClient?.name ?? ""}
        onCreated={handleCreated}
        breakpoint={mobile ? "mobile" : "desktop"}
      />

      <Prompt
        open={pending != null}
        title="Change location?"
        body={
          <>
            Changing the location will clear data that belongs to the current location.
            <span className={styles.promptListTitle}>Will be cleared</span>
            <span className={styles.promptList}>
              {wouldClear.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </span>
          </>
        }
        cancelLabel="Cancel"
        actionLabel="Change location"
        onCancel={() => setPending(null)}
        onAction={() => {
          if (pending) onChange(pending);
          setPending(null);
        }}
      />
    </>
  );
}
