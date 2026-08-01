import { useState } from "react";

import Avatar from "../../components/Avatar/Avatar";
import AvatarClient from "../../components/Avatar/AvatarClient";
import AvatarInvoice from "../../components/Avatar/AvatarInvoice";
import AvatarJob from "../../components/Avatar/AvatarJob";
import AvatarJobSeries from "../../components/Avatar/AvatarJobSeries";
import AvatarLocation from "../../components/Avatar/AvatarLocation";
import AvatarPO from "../../components/Avatar/AvatarPO";
import AvatarUser from "../../components/Avatar/AvatarUser";
import Badge from "../../components/Badge/Badge";
import Button from "../../components/Button/Button";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import ListItem from "../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../components/ListItem/ListItemSlotIcon";
import Menu from "../../components/Menu/Menu";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import Prompt from "../../components/Prompt/Prompt";
import SelectList from "../../components/SelectList/SelectList";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import ValueDisplay from "../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../components/ValueDisplay/ValueDisplayGroup";
import { User, users } from "../../data/users";
import { toast } from "../../components/Toast/Toaster";
import BillingForm, { Billing, billingSummary } from "./BillingForm";
import NewLocationForm from "../../forms/NewLocationForm/NewLocationForm";
import { NewLocation } from "../../forms/NewLocationForm/NewLocationForm.types";
import { groupLocations, JobLocation, locationCaption, SERVICE_CLIENTS } from "./jobData";
import { displayStatus, JobState, STATUS_TS } from "./jobState";
import SchedulingForm, { durationLabel, Scheduling, scheduledForLabel } from "./SchedulingForm";
import StatusModule from "./StatusModule";
import { copyText, noop, slot, useAnchoredMenu } from "./shared";

import styles from "./DetailsPanel.module.scss";

// The "Details" content of the Job Details prototype (Figma "Details" Tab,
// node 23821-21309): 8 DisplayModules. Desktop: the right sidebar. Mobile:
// the content of the first ("Details") tab. Edit forms are intentionally NOT
// built — the pencil buttons are display-only (noop). All values are the
// Figma demo values.

interface DetailsPanelProps {
  /** Mobile presentation: contact menus open as drawers. */
  mobile?: boolean;
  /** Scheduling is owned by the shell (the avatar + Start/Cancel forms read it too). */
  scheduling: Scheduling;
  onSchedulingChange: (next: Scheduling) => void;
  /** The job lifecycle state — drives the Status module. */
  job: JobState;
  /** Cancelled job → editing restricted: every edit affordance is hidden. */
  locked?: boolean;
  /** The Service module's recall job — the Related "Recall to" row mirrors it. */
  recallTo?: string | null;
  /** The job's service location (owned by the shell — it clears the equipment on change). */
  location: JobLocation;
  onLocationChange: (next: JobLocation) => void;
  /** The location pool (shell state — the New-location form appends to it). */
  locations: JobLocation[];
  onAddLocation: (next: JobLocation) => void;
  /** Live equipment count — drives the change-location prompt's "Equipment" line. */
  equipmentCount: number;
}

/** The header pencil — an ordinary right-slot IconButton (no form yet). */
const EditButton = () => (
  <HoverTooltip text="Edit">
    <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit" onClick={noop} />
  </HoverTooltip>
);

// ---- Job contacts -----------------------------------------------------------

interface ContactRowProps {
  user: User;
  /** Row caption AND the menu's "Change …" item ("Job reporter" → "Change job reporter"). */
  role: string;
  email: string;
  phone: string;
  mobile: boolean;
  /** Removes the contact — its row becomes the role's empty state. */
  onRemove: () => void;
  /** Locked (cancelled job) → hide the edit (ellipsis) menu. */
  locked?: boolean;
}

const ContactRow = ({ user, role, email, phone, mobile, onRemove, locked = false }: ContactRowProps) => {
  const menu = useAnchoredMenu(!mobile, "end");
  // Locked (cancelled job): the menu stays, but the editing actions (Change /
  // Remove) drop out — only the copy actions remain.
  const menuBody = (
    <>
      <MenuItemGroup>
        {!locked && (
          <MenuItem label={`Change ${role.toLowerCase()}`} slotLeft={slot("arrows-rotate")} onClick={menu.close} />
        )}
        <MenuItem
          label="Copy email address"
          caption={email}
          slotLeft={slot("copy")}
          onClick={() => {
            menu.close();
            void copyText(email, "Email address");
          }}
        />
        <MenuItem
          label="Copy phone number"
          caption={phone}
          slotLeft={slot("copy")}
          onClick={() => {
            menu.close();
            void copyText(phone, "Phone number");
          }}
        />
      </MenuItemGroup>
      {!locked && (
        <MenuItemGroup>
          <MenuItem
            label="Remove"
            slotLeft={slot("xmark")}
            onClick={() => {
              menu.close();
              onRemove();
              toast({ type: "success", title: `${role} removed` });
            }}
          />
        </MenuItemGroup>
      )}
    </>
  );

  return (
    <>
      <ListItem
        variant="titleCaptionReversed"
        title={user.name}
        caption={role}
        avatar={<AvatarUser size="xl" imageSrc={user.avatar} />}
        isClickable
        onClick={noop}
        slotRight={
          <>
            <HoverTooltip
              variant="slot"
              content={
                <span className={styles.contactTooltip}>
                  Send email
                  <br />
                  {email}
                </span>
              }
            >
              <IconButton
                icon="envelope"
                variant="ghost"
                size="md"
                aria-label="Send email"
                onClick={() => window.open(`mailto:${email}`)}
              />
            </HoverTooltip>
            <HoverTooltip
              variant="slot"
              content={
                <span className={styles.contactTooltip}>
                  Call
                  <br />
                  {phone}
                </span>
              }
            >
              <IconButton
                icon="phone"
                variant="ghost"
                size="md"
                aria-label="Call"
                onClick={() => window.open(`tel:${phone.replace(/[^+\d]/g, "")}`)}
              />
            </HoverTooltip>
            <IconButton
              icon="ellipsis"
              variant="ghost"
              size="md"
              aria-label="More actions"
              isPressed={menu.open}
              noDebounce
              onClick={menu.onActions}
            />
          </>
        }
      />
      {mobile ? (
        <Menu open={menu.open} onClose={menu.close} title={role} breakpoint="mobile">
          {menuBody}
        </Menu>
      ) : (
        menu.pos != null && (
          <div
            ref={menu.cardRef}
            className={styles.anchoredMenu}
            style={{ top: menu.pos.top, left: menu.pos.left, right: menu.pos.right }}
          >
            <Menu open={menu.open} onClose={menu.close} breakpoint="desktop">
              {menuBody}
            </Menu>
          </div>
        )
      )}
    </>
  );
};

// The role's empty state (Figma): dashed placeholder avatar + "No <role>" +
// an Add button (which restores the demo contact here).
const EmptyContactRow = ({ label, onAdd, locked = false }: { label: string; onAdd: () => void; locked?: boolean }) => (
  <div className={styles.emptyContact}>
    <Avatar type="user" content="placeholder" size="xl" />
    <span className={styles.emptyContactLabel}>{label}</span>
    {!locked && (
      <Button size="lg" variant="subtle" leftIcon="plus" onClick={onAdd}>
        Add
      </Button>
    )}
  </div>
);

// ---- Related ----------------------------------------------------------------

// Related rows: only "Recall to", mirroring the job picked in the Service
// module (Daniel, 2026-07-22: Belongs to / Converted into / Connected to /
// Recall removed; 2026-07-28: the "Created from" estimate removed too — the
// demo job has NO parent objects, so the Location module's edit rule makes
// sense). The whole module hides when no recall job is set.

const LABELS: { label: string; icon?: string; iconColor?: string }[] = [
  { label: "Hot side" },
  { label: "Emergency" },
  { label: "Inconvenient location", icon: "location-dot", iconColor: "var(--tomato-9)" },
  { label: "Urgent" },
  { label: "Standard labor" },
  { label: "Overtime", icon: "pig", iconColor: "var(--pink-9)" },
  { label: "Recall" },
];

// ---- the panel ---------------------------------------------------------------

export default function DetailsPanel({ mobile = false, scheduling, onSchedulingChange, job, locked = false, recallTo = null, location, onLocationChange, locations, onAddLocation, equipmentCount }: DetailsPanelProps) {
  const [hasReporter, setHasReporter] = useState(true);
  const [hasSupervisor, setHasSupervisor] = useState(true);

  // ---- location editing ----
  // The rule (Figma 21834-92725): the location is editable only while the job
  // was never started AND has no parent objects. The demo job's only possible
  // parent is a "Recall to" pick in the Service module.
  const locationEditable = !locked && !job.everStarted && recallTo == null;
  const [locationOpen, setLocationOpen] = useState(false);
  // The "Service clients" list — opened by the Locations list's "Add location"
  // (pick whom the new location belongs to). Closing it ends the flow (no
  // stacked dialogs, no return to the Locations list — Daniel, 2026-07-28).
  const [clientsOpen, setClientsOpen] = useState(false);
  // The New-location form — open while a target client is set. Entered from a
  // Locations-list group plus (client known) or a Service-clients pick.
  const [newLocationClient, setNewLocationClient] = useState<string | null>(null);
  // A different location was picked and data would be cleared — awaiting the
  // prompt's confirmation.
  const [pendingLocation, setPendingLocation] = useState<JobLocation | null>(null);

  // The pencil opens the edit form; Save writes back through onSchedulingChange.
  const [schedulingOpen, setSchedulingOpen] = useState(false);
  // Past due (an upcoming job whose time slipped) → the "Scheduled for" value
  // reads in the danger color.
  const pastDue = displayStatus(job, scheduling) === "pastDue";

  // Billing intention is editable (the pencil opens BillingForm; Save writes back).
  const [billing, setBilling] = useState<Billing>({ intention: "inheritLocation", clientId: null });
  const [billingOpen, setBillingOpen] = useState(false);
  const billingBiller = billingSummary(billing, location);

  // What a location change would clear — the prompt lists only what exists.
  const clearing = [
    ...(equipmentCount > 0 ? ["Equipment"] : []),
    ...(hasReporter ? ["Job reporter"] : []),
    ...(hasSupervisor ? ["Site supervisor"] : []),
  ];

  const applyLocation = (next: JobLocation) => {
    onLocationChange(next); // the shell clears the equipment
    setHasReporter(false);
    setHasSupervisor(false);
    // Billing resets to the default intention — silently on purpose: the
    // prompt does not mention billing (Daniel, 2026-07-28).
    setBilling({ intention: "inheritLocation", clientId: null });
    setPendingLocation(null);
  };

  // The list closes itself (single-select); picking the current location is a
  // no-op, a different one asks first — unless nothing would be cleared.
  const pickLocation = (next: JobLocation) => {
    if (next.id === location.id) return;
    if (clearing.length > 0) setPendingLocation(next);
    else applyLocation(next);
  };

  // A location created by the form joins the pool and becomes the job's
  // location through the SAME clearing rules as picking an existing one.
  const handleLocationCreated = (created: NewLocation) => {
    const jobLoc: JobLocation = {
      id: Math.max(...locations.map((l) => l.id)) + 1,
      client: newLocationClient ?? "",
      clientActive: true,
      // The location's own name is optional — fall back to its city.
      name: created.name !== "" ? created.name : created.city,
      address: `${created.street}${created.suite !== "" ? `, ${created.suite}` : ""}, ${created.city}, ${created.state} ${created.postal}`,
    };
    onAddLocation(jobLoc);
    pickLocation(jobLoc);
  };

  const schedulingUsers = scheduling.assignees
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is User => u != null);

  return (
    <div className={styles.panel}>
      {/* Location — editable via the pencil (opens the locations select list)
          only while the job was never started and has no parent objects. */}
      <DisplayModule
        title="Location"
        slotRight={
          locationEditable ? (
            <HoverTooltip text="Edit">
              <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit location" onClick={() => setLocationOpen(true)} />
            </HoverTooltip>
          ) : undefined
        }
        content={
          <div className={styles.listBody}>
            <ListItem
              variant="titleCaption"
              title={location.client}
              caption={locationCaption(location)}
              avatar={<AvatarLocation size="xl" />}
              slotRight={<ListItemSlotIcon icon="angle-right" />}
              isClickable
              onClick={noop}
            />
            <div className={styles.mapButton}>
              <Button
                size="lg"
                variant="subtle"
                isFullWidth
                rightIcon="arrow-up-right"
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(location.address)}`, "_blank")}
              >
                Open in maps
              </Button>
            </div>
          </div>
        }
      />

      {/* The locations select list — desktop dialog / mobile drawer, locations
          grouped by client (Figma 24372-22116). The "Add location" actions are
          display-only (the Service-clients dialog is a separate design). */}
      <SelectList
        variant="dialog"
        breakpoint={mobile ? "mobile" : "desktop"}
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        title="Locations"
        searchable
        searchPlaceholder="Search by location or client name..."
        noResultsCaption="Try a different search or add a new location"
        footer={
          <SelectListFooter variant="menuItem">
            {/* Adding a location needs a client first — swap to the Service
                clients list (the per-client plus buttons stay display-only:
                their client is known, the New-location form is not built). */}
            <MenuItem
              label="Add location"
              slotLeft={slot("plus")}
              onClick={() => {
                setLocationOpen(false);
                setClientsOpen(true);
              }}
            />
          </SelectListFooter>
        }
      >
        {groupLocations(locations).map((g) => (
          <SelectListItemGroup
            key={g.client}
            label={
              <GroupLabel
                variant="primary"
                label={g.client}
                slotLeft={<AvatarClient size="sm" type="business" content="image" />}
                // An inactive client: "Inactive" caption, no add button, items disabled.
                caption={g.active ? undefined : "Inactive"}
                slotRight={
                  g.active ? (
                    <HoverTooltip text="Add location">
                      <IconButton
                        icon="plus"
                        variant="ghost"
                        size="md"
                        aria-label="Add location"
                        // The client is known here — skip the Service-clients step.
                        onClick={() => {
                          setLocationOpen(false);
                          setNewLocationClient(g.client);
                        }}
                      />
                    </HoverTooltip>
                  ) : undefined
                }
              />
            }
          >
            {g.locations.map((l) => (
              <SelectListItem
                key={l.id}
                variant="object"
                avatar={<AvatarLocation size="xl" />}
                label={l.address}
                caption={l.name}
                searchText={`${l.address} ${l.name} ${l.client}`}
                selected={l.id === location.id}
                disabled={!g.active}
                onClick={() => pickLocation(l)}
              />
            ))}
          </SelectListItemGroup>
        ))}
      </SelectList>

      {/* The "Service clients" select list (Figma 15550-43833): who owns the
          new location. The onward forms (New location / New client) are not
          built — picking an active client or "Add service client" just closes. */}
      <SelectList
        variant="dialog"
        breakpoint={mobile ? "mobile" : "desktop"}
        open={clientsOpen}
        onClose={() => setClientsOpen(false)}
        title="Service clients"
        caption="Select a client for the new location"
        searchable
        searchPlaceholder="Search by client name..."
        noResultsCaption="Try a different search or add a new service client"
        footer={
          <SelectListFooter variant="menuItem">
            <MenuItem label="Add service client" slotLeft={slot("plus")} onClick={() => setClientsOpen(false)} />
          </SelectListFooter>
        }
      >
        <SelectListItemGroup
          label={
            <GroupLabel
              variant="primary"
              label="Active"
              slotLeft={
                <Icon icon="circle-minus" pack="solid" size={14} container="square" rotate={90} className={styles.activeDot} />
              }
            />
          }
        >
          {SERVICE_CLIENTS.filter((c) => c.active).map((c) => (
            <SelectListItem
              key={c.id}
              variant="object"
              avatar={<AvatarClient size="xl" type="business" />}
              label={c.name}
              caption="Business · Commercial"
              onClick={() => {
                setClientsOpen(false);
                setNewLocationClient(c.name);
              }}
            />
          ))}
        </SelectListItemGroup>
        <SelectListItemGroup
          label={
            <GroupLabel
              variant="primary"
              label="Inactive"
              slotLeft={<Icon icon="ban" pack="solid" size={14} container="square" className={styles.inactiveDot} />}
            />
          }
        >
          {SERVICE_CLIENTS.filter((c) => !c.active).map((c) => (
            <SelectListItem
              key={c.id}
              variant="object"
              disabled
              avatar={<AvatarClient size="xl" type="business" />}
              label={c.name}
              caption="Business · Commercial"
              onClick={noop}
            />
          ))}
        </SelectListItemGroup>
      </SelectList>

      {/* The reusable New-location form (src/forms). Creating appends to the
          pool and selects the location via the same clearing rules. */}
      <NewLocationForm
        open={newLocationClient != null}
        onClose={() => setNewLocationClient(null)}
        client={newLocationClient ?? ""}
        onCreated={handleLocationCreated}
        breakpoint={mobile ? "mobile" : "desktop"}
      />

      {/* The change-location confirmation (Figma 23809-16984). Lists only the
          data that actually exists; skipped entirely when nothing would clear. */}
      <Prompt
        open={pendingLocation != null}
        title="Change location?"
        body={
          <div className={styles.clearPrompt}>
            <p>Changing the location will clear data that belongs to the current location.</p>
            <p>Will be cleared</p>
            <ul>
              {clearing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        }
        onCancel={() => setPendingLocation(null)}
        actionLabel="Change location"
        onAction={() => {
          if (pendingLocation != null) applyLocation(pendingLocation);
        }}
        breakpoint={mobile ? "mobile" : "desktop"}
      />

      {/* Status — content depends on the job's lifecycle state. */}
      <StatusModule job={job} scheduling={scheduling} />

      {/* Scheduling — editable via the pencil (opens SchedulingForm). */}
      <DisplayModule
        title="Scheduling"
        slotRight={
          locked ? undefined : (
            <HoverTooltip text="Edit">
              <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit scheduling" onClick={() => setSchedulingOpen(true)} />
            </HoverTooltip>
          )
        }
        content={
          <ValueDisplayGroup>
            <ValueDisplay
              label="Scheduled for"
              value={scheduledForLabel(scheduling)}
              valueColor={pastDue ? "var(--text-error)" : undefined}
            />
            <ValueDisplay label="Duration" value={durationLabel(scheduling.hours, scheduling.minutes)} />
            {schedulingUsers.length >= 2 ? (
              // 2+ assignees: a vertical avatar-group (Figma splits it below a
              // divider — ValueDisplayGroup handles that).
              <ValueDisplay
                label="Assignees"
                orientation="vertical"
                kind="avatarGroup"
                // More than 3 assignees → truncate to 3 with a "Show N more" (Figma).
                avatarLimit={3}
                items={schedulingUsers.map((u) => ({ content: "image", imageSrc: u.avatar, name: u.name }))}
              />
            ) : (
              <ValueDisplay
                label="Assignees"
                value={schedulingUsers[0]?.name}
                slotLeft={
                  schedulingUsers[0] != null ? <AvatarUser size="xs" imageSrc={schedulingUsers[0].avatar} /> : undefined
                }
              />
            )}
          </ValueDisplayGroup>
        }
      />
      <SchedulingForm
        open={schedulingOpen}
        onClose={() => setSchedulingOpen(false)}
        initial={scheduling}
        onSave={onSchedulingChange}
        mobile={mobile}
      />

      {/* Billing intention — editable via the pencil (opens BillingForm). */}
      <DisplayModule
        title="Billing intention"
        slotRight={
          locked ? undefined : (
            <HoverTooltip text="Edit">
              <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit billing intention" onClick={() => setBillingOpen(true)} />
            </HoverTooltip>
          )
        }
        content={
          <div className={styles.listBody}>
            <ListItem
              variant="titleCaption"
              title={billingBiller.name}
              caption={billingBiller.caption}
              // Location intention → a location avatar; client intention → a
              // client avatar (Figma: the module shows the resolved biller).
              avatar={
                billingBiller.kind === "location" ? (
                  <AvatarLocation size="xl" />
                ) : (
                  <AvatarClient size="xl" type="business" />
                )
              }
              slotRight={<ListItemSlotIcon icon="angle-right" />}
              isClickable
              onClick={noop}
            />
          </div>
        }
      />
      <BillingForm
        open={billingOpen}
        onClose={() => setBillingOpen(false)}
        initial={billing}
        onSave={setBilling}
        mobile={mobile}
      />

      {/* Job properties */}
      <DisplayModule
        title="Job properties"
        slotRight={locked ? undefined : <EditButton />}
        content={
          <ValueDisplayGroup>
            <ValueDisplay
              label="Job ID"
              value="JOB-10001"
              slotRight={
                <HoverTooltip text="Copy">
                  <IconButton
                    icon="copy"
                    variant="muted"
                    size="lg"
                    aria-label="Copy Job ID"
                    onClick={() => void copyText("JOB-10001", "Job ID")}
                  />
                </HoverTooltip>
              }
            />
            <ValueDisplay label="Source" value="ServiceChannel" slotLeft={<Avatar type="object" content="image" size="xs" />} />
            <ValueDisplay
              label="Source ID"
              value="123456789"
              slotRight={
                <HoverTooltip text="Copy">
                  <IconButton
                    icon="copy"
                    variant="muted"
                    size="lg"
                    aria-label="Copy Source ID"
                    onClick={() => void copyText("123456789", "Source ID")}
                  />
                </HoverTooltip>
              }
            />
            <ValueDisplay label="Branch" value="Headquarters" />
            <ValueDisplay label="Date received" value="January 1, 2026" />
            <ValueDisplay
              label="Received by"
              value={users[2].name}
              slotLeft={<AvatarUser size="xs" imageSrc={users[2].avatar} />}
            />
            <ValueDisplay label="Created at" value={STATUS_TS} />
            <ValueDisplay
              label="Created by"
              value={users[2].name}
              slotLeft={<AvatarUser size="xs" imageSrc={users[2].avatar} />}
            />
            <ValueDisplay label="Last modified" value={STATUS_TS} />
          </ValueDisplayGroup>
        }
      />

      {/* Job contacts */}
      <DisplayModule
        title="Job contacts"
        content={
          <div className={styles.listBody}>
            {hasReporter ? (
              <ContactRow
                user={users[5]}
                role="Job reporter"
                email="email@address.com"
                phone="(987) 654-3210"
                mobile={mobile}
                onRemove={() => setHasReporter(false)}
                locked={locked}
              />
            ) : (
              <EmptyContactRow label="No job reporter" onAdd={() => setHasReporter(true)} locked={locked} />
            )}
            {hasSupervisor ? (
              <ContactRow
                user={users[3]}
                role="Site supervisor"
                email="email@address.com"
                phone="(987) 654-3210"
                mobile={mobile}
                onRemove={() => setHasSupervisor(false)}
                locked={locked}
              />
            ) : (
              <EmptyContactRow label="No site supervisor" onAdd={() => setHasSupervisor(true)} locked={locked} />
            )}
          </div>
        }
      />

      {/* Labels */}
      <DisplayModule
        title="Labels"
        slotRight={locked ? undefined : <EditButton />}
        content={
          <div className={styles.chips}>
            {LABELS.map(({ label, icon, iconColor }) => (
              <Badge key={label} size="md" leftIcon={icon} leftIconPack="solid" leftIconColor={iconColor}>
                {label}
              </Badge>
            ))}
          </div>
        }
      />

      {/* Related — only the "Recall to" row (mirrors the Service module's
          pick); with no related objects the module shows the caption-only
          EmptyState (Figma 21136-58230). */}
      <DisplayModule
        title="Related"
        content={
          recallTo != null ? (
            <div className={styles.listBody}>
              <ListItem
                variant="titleCaptionReversed"
                title={recallTo}
                caption="Recall to"
                avatar={<AvatarJob size="xl" status="finalized" />}
                slotRight={<ListItemSlotIcon icon="angle-right" />}
                isClickable
                onClick={noop}
              />
            </div>
          ) : (
            <EmptyState caption="No related objects here yet" />
          )
        }
      />
    </div>
  );
}
