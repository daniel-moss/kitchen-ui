import { useEffect, useRef, useState } from "react";

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
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import Menu from "../../components/Menu/Menu";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import DrawerHeader from "../../components/Popover/DrawerHeader";
import PopoverHeaderContent from "../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../components/Popover/PopoverHeaderText";
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
import {
  BILLING_CLIENT_CONTACTS,
  ContactGroup,
  contactCaption,
  INITIAL_REPORTER,
  INITIAL_SUPERVISOR,
  JobContact,
  SERVICE_CLIENT_CONTACTS,
  SERVICE_LOCATION_CONTACTS,
} from "./contacts";
import NewLocationForm from "../../modules/NewLocationForm/NewLocationForm";
import { NewLocation } from "../../modules/NewLocationForm/NewLocationForm.types";
import { groupLocations, JobLocation, locationCaption, SERVICE_CLIENTS } from "./jobData";
import JobPropertiesForm, { JobProperties, JobSource, MODULE_DATE, sourceAvatar, sourceRequiresId } from "./JobPropertiesForm";
import { displayStatus, formatStatusTimestamp, JobState, STATUS_TS } from "./jobState";
import SchedulingForm, { durationLabel, Scheduling, scheduledForLabel } from "./SchedulingForm";
import AssigneesForm from "./AssigneesForm";
import ListItemTextRight from "../../components/ListItem/ListItemTextRight";
import { categoryIcon, formatHrMin } from "./TimesheetPanel";
import StatusModule from "./StatusModule";
import { copyText, noop, slot, useAnchoredMenu } from "./shared";

import styles from "./DetailsPanel.module.scss";
import { TEXT_SEPARATOR } from "../../utils/textSeparator";

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
  /** The job’s assignees — their own module (and own state) since 2026-08-05. */
  assignees: number[];
  onAssigneesChange: (ids: number[]) => void;
  /** Per-assignee time: their logged total and, while checked in, their status. */
  assigneeStats?: Record<number, { trackedSec: number; status?: string }>;
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
  /** The Job-properties values (shell state — the edit form writes them). */
  jobProperties: JobProperties;
  onJobPropertiesChange: (next: JobProperties) => void;
  /** The workspace's job sources (shell state — the New-source form appends). */
  jobSources: JobSource[];
  onCreateJobSource: (source: JobSource) => void;
  /** When the job last changed — the module's "Last modified" row. */
  lastModified: Date;
  /** Stamps "Last modified" for edits this panel owns (contacts). */
  onJobChange: () => void;
  /**
   * A job-contact edit — the Activity tab logs it (Figma 24487-43383).
   * `before`/`after` null = the slot was empty, which picks the added /
   * updated / removed copy. NOT called when a location change clears the
   * contacts: that action already has its own log (Daniel, 2026-08-03).
   */
  onContactChange: (role: string, before: JobContact | null, after: JobContact | null) => void;
  /** A label edit — the Activity tab logs what was put on and taken off. */
  onLabelsChange: (added: string[], removed: string[]) => void;
  /** Billing intention (shell state — it writes the activity log on save). */
  billing: Billing;
  onBillingChange: (next: Billing) => void;
}

/** Job IDs already in the demo workspace — typing one shows the Job-properties
 *  form's "Job with this ID already exists" error (node 23810-16779). */
const TAKEN_JOB_IDS = ["JOB-1209", "JOB-1195", "JOB-1187", "JOB-1176", "JOB-1164"];

/** The header pencil — an ordinary right-slot IconButton. Without `onClick`
 *  the module has no form yet and the button is display-only. */
const EditButton = ({ label = "Edit", onClick = noop }: { label?: string; onClick?: () => void }) => (
  <HoverTooltip text="Edit">
    <IconButton icon="pen" variant="ghost" size="md" aria-label={label} onClick={onClick} />
  </HoverTooltip>
);

// ---- Job contacts -----------------------------------------------------------

interface ContactRowProps {
  contact: JobContact;
  /** Row caption AND the menu's "Change …" item ("Job reporter" → "Change job reporter"). */
  role: string;
  mobile: boolean;
  /** Opens the contact select list for this role. */
  onChange: () => void;
  /** Removes the contact — its row becomes the role's empty state. */
  onRemove: () => void;
  /** Locked (cancelled job) → hide the edit (ellipsis) menu. */
  locked?: boolean;
}

const ContactRow = ({ contact, role, mobile, onChange, onRemove, locked = false }: ContactRowProps) => {
  const menu = useAnchoredMenu(!mobile);
  const { email, phone } = contact;
  // Locked (cancelled job): the menu stays, but the editing actions (Change /
  // Remove) drop out — only the copy actions remain.
  // THREE groups (Figma 21742-59757 / 21758-23070): "Change …" stands alone,
  // then the two copy actions, then Remove.
  const menuBody = (
    <>
      {!locked && (
        <MenuItemGroup>
          <MenuItem
            label={`Change ${role.toLowerCase()}`}
            slotLeft={slot("arrows-rotate")}
            onClick={() => {
              menu.close();
              onChange();
            }}
          />
        </MenuItemGroup>
      )}
      {/* A contact may lack one of the two details — then its copy action is
          not offered at all (the data gained optional phone/e-mail with the
          Send-summary form, 2026-08-07). */}
      <MenuItemGroup>
        {email != null && (
          <MenuItem
            label="Copy email address"
            caption={email}
            slotLeft={slot("copy")}
            onClick={() => {
              menu.close();
              // These toasts drop the quotes the ID ones use (node 21758-23044).
              void copyText(email, "Email address", "Email address copied");
            }}
          />
        )}
        {phone != null && (
          <MenuItem
            label="Copy phone number"
            caption={phone}
            slotLeft={slot("copy")}
            onClick={() => {
              menu.close();
              void copyText(phone, "Phone number", "Phone number copied");
            }}
          />
        )}
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
        title={contact.name}
        caption={role}
        avatar={<AvatarUser size="xl" imageSrc={contact.avatar} />}
        isClickable
        onClick={noop}
        slotRight={
          <>
            {email != null && (
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
            )}
            {phone != null && (
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
            )}
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
        // The mobile drawer header carries the contact itself (Figma
        // 21136-58214 / 21758-23072): xl avatar + the ROLE as the caption
        // above the contact's name. Desktop keeps the plain card, no header.
        <Menu
          open={menu.open}
          onClose={menu.close}
          breakpoint="mobile"
          drawerHeader={
            <DrawerHeader>
              <PopoverHeaderContent avatar={<AvatarUser size="xl" imageSrc={contact.avatar} />}>
                <PopoverHeaderText variant="titleCaptionReversed" title={contact.name} caption={role} />
              </PopoverHeaderContent>
            </DrawerHeader>
          }
        >
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
    <AvatarUser content="placeholder" size="xl" />
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

// ---- Labels ------------------------------------------------------------------

interface JobLabel {
  label: string;
  icon?: string;
  iconColor?: string;
}

// The workspace's label pool. The first seven are the ones the demo job wears
// (Figma module 21136-58217); the rest are the picker's list from the edit form
// (23863-17958).
// FLAG: that list reads like a CLIENT label set ("Pending onboarding",
// "Suspended", "Trial") rather than job labels — it looks carried over from
// another form, but it IS what the node lists, so it is what the picker offers.
const LABEL_POOL: JobLabel[] = [
  { label: "Hot side" },
  { label: "Emergency" },
  { label: "Inconvenient location", icon: "location-dot", iconColor: "var(--tomato-9)" },
  { label: "Urgent" },
  { label: "Standard labor" },
  { label: "Overtime", icon: "pig", iconColor: "var(--pink-9)" },
  { label: "Recall" },
  { label: "Complicated" },
  { label: "Easy to maintain" },
  { label: "Hard to install" },
  { label: "Kitchen" },
  { label: "Contracted" },
  { label: "Inactive" },
  { label: "Pending onboarding" },
  { label: "Premium" },
  { label: "Suspended" },
  { label: "Standard" },
  { label: "Third-party billing" },
  { label: "Trial" },
  { label: "Walk-in / One-time" },
  { label: "Warranty-covered" },
];

const INITIAL_LABELS = LABEL_POOL.slice(0, 7).map((l) => l.label);

// ---- the panel ---------------------------------------------------------------

export default function DetailsPanel({ mobile = false, scheduling, onSchedulingChange, assignees, onAssigneesChange, assigneeStats, job, locked = false, recallTo = null, location, onLocationChange, locations, onAddLocation, equipmentCount, jobProperties, onJobPropertiesChange, jobSources, onCreateJobSource, lastModified, onJobChange, onContactChange, onLabelsChange, billing, onBillingChange }: DetailsPanelProps) {
  // ---- job contacts ----
  const [reporter, setReporter] = useState<JobContact | null>(INITIAL_REPORTER);
  const [supervisor, setSupervisor] = useState<JobContact | null>(INITIAL_SUPERVISOR);
  // Contacts belong to the job too, so ANY contact edit stamps "Last modified"
  // (the mount pass must not — nothing changed yet).
  const contactsMounted = useRef(false);
  useEffect(() => {
    if (!contactsMounted.current) {
      contactsMounted.current = true;
      return;
    }
    onJobChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reporter, supervisor]);

  // The contact select list (Figma 24485-40395 / 24485-40467). ONE list for
  // both roles — they differ only in the title. `pickerRole` is never reset,
  // so the title stays put while the list animates out.
  const [pickerRole, setPickerRole] = useState<"reporter" | "supervisor">("reporter");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerLabel = pickerRole === "reporter" ? "Job reporter" : "Site supervisor";
  const pickedContact = pickerRole === "reporter" ? reporter : supervisor;

  const openPicker = (role: "reporter" | "supervisor") => {
    setPickerRole(role);
    setPickerOpen(true);
  };

  // Single-select: SelectList closes itself. Picking the contact that is
  // already in the role changes nothing, so it shows no toast either.
  const pickContact = (c: JobContact) => {
    if (pickedContact?.id === c.id) return;
    if (pickerRole === "reporter") setReporter(c);
    else setSupervisor(c);
    onContactChange(pickerLabel, pickedContact, c);
    toast({ type: "success", title: `${pickerLabel} updated` });
  };

  // The list is grouped by where the contact comes from. The billing group is
  // for the JOB REPORTER only (Daniel, 2026-08-03 — the site supervisor is on
  // site, so a billing contact makes no sense there), and only when the
  // billing client is a DIFFERENT client than the service client (Figma
  // behavior note on node 24485-40395).
  const showBillingGroup =
    pickerRole === "reporter" && billing.intention === "differentClient" && billing.clientId != null;
  // Every group's plus reads "Add contact" (Daniel, 2026-08-04) — the Figma
  // annotations name the FORM each one opens ("Add client contact" / "Add
  // location contact"), which is more than the tooltip needs to say.
  const contactGroups: ContactGroup[] = [
    { label: "Service client", addLabel: "Add contact", contacts: SERVICE_CLIENT_CONTACTS },
    { label: "Service location", addLabel: "Add contact", contacts: SERVICE_LOCATION_CONTACTS },
    ...(showBillingGroup ? [{ label: "Billing client", addLabel: "Add contact", contacts: BILLING_CLIENT_CONTACTS }] : []),
  ];

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
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  // Past due (an upcoming job whose time slipped) → the "Scheduled for" value
  // reads in the danger color.
  const pastDue = displayStatus(job, scheduling) === "pastDue";

  // Billing intention is editable (the pencil opens BillingForm; Save writes
  // back through the shell, which logs the change).
  const [billingOpen, setBillingOpen] = useState(false);
  const billingBiller = billingSummary(billing, location);

  // ---- labels ----
  // The edit form is a multi-select SelectList (Figma 23863-17937), NOT a
  // dialog with a field: desktop card / mobile drawer, searchable, the picked
  // labels pinned in their own group on top (SelectList does that itself),
  // Cancel + Save in an action-bar footer. Picks are a DRAFT until Save.
  const [labels, setLabels] = useState<string[]>(INITIAL_LABELS);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [labelDraft, setLabelDraft] = useState<string[]>(INITIAL_LABELS);
  // The module renders in POOL order, not pick order, so ticking a label does
  // not shuffle the badges that are already there.
  const shownLabels = LABEL_POOL.filter((l) => labels.includes(l.label));

  const openLabels = () => {
    setLabelDraft(labels);
    setLabelsOpen(true);
  };
  const toggleLabel = (name: string) =>
    setLabelDraft((prev) => (prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]));

  const saveLabels = () => {
    const added = labelDraft.filter((l) => !labels.includes(l));
    const removed = labels.filter((l) => !labelDraft.includes(l));
    setLabelsOpen(false);
    if (added.length === 0 && removed.length === 0) return;
    setLabels(labelDraft);
    onLabelsChange(added, removed);
    onJobChange();
    toast({ type: "success", title: '"Labels" module updated' });
  };

  // The Job-properties edit form (Figma 21136-58187).
  const [jobPropertiesOpen, setJobPropertiesOpen] = useState(false);
  const receivedByUser = users.find((u) => u.id === jobProperties.receivedBy);

  // What a location change would clear — the prompt lists only what exists.
  const clearing = [
    ...(equipmentCount > 0 ? ["Equipment"] : []),
    ...(reporter != null ? ["Job reporter"] : []),
    ...(supervisor != null ? ["Site supervisor"] : []),
  ];

  const applyLocation = (next: JobLocation) => {
    // The shell clears the equipment AND resets the billing intention — the
    // latter silently on purpose: the prompt does not mention billing
    // (Daniel, 2026-07-28), so it must not write an activity log either.
    onLocationChange(next);
    setReporter(null);
    setSupervisor(null);
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

  const schedulingUsers = assignees
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
              caption={c.caption}
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
              caption={c.caption}
              onClick={noop}
            />
          ))}
        </SelectListItemGroup>
      </SelectList>

      {/* The reusable New-location form (src/modules). Creating appends to the
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

      {/* Assignees — its own module since 2026-08-05 (Figma 24522-63729). Each
          row shows the tech's total tracked time, and their current status in
          red while they are checked in. */}
      <DisplayModule
        title="Assignees"
        slotRight={
          locked ? undefined : (
            <HoverTooltip text="Edit">
              <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit assignees" onClick={() => setAssigneesOpen(true)} />
            </HoverTooltip>
          )
        }
        content={
          <div className={styles.listBody}>
            <ItemGroup truncateAfter={4}>
              {schedulingUsers.length === 0 ? (
                <ListItem
                  variant="title"
                  title="No assignees"
                  titleClassName={styles.placeholderText}
                  avatar={<AvatarUser size="xl" content="placeholder" />}
                />
              ) : (
                schedulingUsers.map((u) => {
                  const stat = assigneeStats?.[u.id];
                  const tracked = stat?.trackedSec ?? 0;
                  // Anything that rounds to under a minute reads "0 min", not
                  // formatHrMin's "0 hr" (node 24522-64672), and keeps the gray
                  // placeholder. Testing `tracked === 0` was not enough: a
                  // just-started session already has a few seconds on it and
                  // still rounds to zero.
                  const trackedLabel = formatHrMin(tracked);
                  const noneTracked = trackedLabel === "0 hr";
                  return (
                    <ListItem
                      key={u.id}
                      variant={stat?.status != null ? "titleCaption" : "title"}
                      title={u.name}
                      avatar={<AvatarUser size="xl" imageSrc={u.avatar} />}
                      // Checked in → the status under the name, in red with its
                      // own icon (Figma 24522-64690).
                      caption={stat?.status}
                      captionClassName={stat?.status != null ? styles.assigneeStatus : undefined}
                      // The slot's icon color is the caller's call (the DS
                      // leaves it undetermined), so it needs the red class too.
                      captionSlotLeft={stat?.status != null ? <Icon icon={categoryIcon(stat.status)} size={14} className={styles.assigneeStatus} /> : undefined}
                      // Caption over value (Figma 24522-64635): "Total tracked"
                      // then the running total — placeholder gray at zero.
                      right={
                        <ListItemTextRight
                          variant="titleCaptionReversed"
                          caption="Total tracked"
                          title={noneTracked ? "0 min" : trackedLabel}
                          className={noneTracked ? styles.zeroTracked : undefined}
                        />
                      }
                    />
                  );
                })
              )}
            </ItemGroup>
          </div>
        }
      />
      <AssigneesForm
        open={assigneesOpen}
        onClose={() => setAssigneesOpen(false)}
        value={assignees}
        onSave={onAssigneesChange}
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
        onSave={onBillingChange}
        mobile={mobile}
      />

      {/* Job properties (Figma 21136-58170) — the pencil opens the edit form.
          "Source ID" only shows when the source asks for one (node annotation
          "Only shown, if exists"); Created at / by and Last modified are
          system values and are not in the form. */}
      <DisplayModule
        title="Job properties"
        slotRight={locked ? undefined : <EditButton label="Edit job properties" onClick={() => setJobPropertiesOpen(true)} />}
        content={
          <ValueDisplayGroup>
            <ValueDisplay
              label="Job ID"
              value={jobProperties.jobId}
              slotRight={
                <HoverTooltip text="Copy">
                  <IconButton
                    icon="copy"
                    variant="muted"
                    size="lg"
                    aria-label="Copy Job ID"
                    onClick={() => void copyText(jobProperties.jobId, "Job ID")}
                  />
                </HoverTooltip>
              }
            />
            <ValueDisplay
              label="Source"
              value={jobProperties.source}
              // Integrations carry a logo; "Direct" and created sources do not.
              slotLeft={sourceAvatar(jobSources, jobProperties.source)}
            />
            {sourceRequiresId(jobSources, jobProperties.source) && (
              <ValueDisplay
                label="Source ID"
                value={jobProperties.sourceId}
                slotRight={
                  <HoverTooltip text="Copy">
                    <IconButton
                      icon="copy"
                      variant="muted"
                      size="lg"
                      aria-label="Copy Source ID"
                      onClick={() => void copyText(jobProperties.sourceId, "Source ID")}
                    />
                  </HoverTooltip>
                }
              />
            )}
            <ValueDisplay label="Branch" value={jobProperties.branch} />
            <ValueDisplay
              label="Date received"
              value={jobProperties.dateReceived != null ? MODULE_DATE.format(jobProperties.dateReceived) : undefined}
            />
            <ValueDisplay
              label="Received by"
              value={receivedByUser?.name}
              slotLeft={receivedByUser != null ? <AvatarUser size="xs" imageSrc={receivedByUser.avatar} /> : undefined}
            />
            <ValueDisplay label="Created at" value={STATUS_TS} />
            <ValueDisplay
              label="Created by"
              value={users[2].name}
              slotLeft={<AvatarUser size="xs" imageSrc={users[2].avatar} />}
            />
            <ValueDisplay label="Last modified" value={formatStatusTimestamp(lastModified)} />
          </ValueDisplayGroup>
        }
      />
      <JobPropertiesForm
        open={jobPropertiesOpen}
        onClose={() => setJobPropertiesOpen(false)}
        initial={jobProperties}
        onSave={onJobPropertiesChange}
        sources={jobSources}
        onCreateSource={onCreateJobSource}
        takenJobIds={TAKEN_JOB_IDS}
        mobile={mobile}
      />

      {/* Job contacts */}
      <DisplayModule
        title="Job contacts"
        content={
          <div className={styles.listBody}>
            {reporter != null ? (
              <ContactRow
                contact={reporter}
                role="Job reporter"
                mobile={mobile}
                onChange={() => openPicker("reporter")}
                onRemove={() => {
                  setReporter(null);
                  onContactChange("Job reporter", reporter, null);
                }}
                locked={locked}
              />
            ) : (
              <EmptyContactRow label="No job reporter" onAdd={() => openPicker("reporter")} locked={locked} />
            )}
            {supervisor != null ? (
              <ContactRow
                contact={supervisor}
                role="Site supervisor"
                mobile={mobile}
                onChange={() => openPicker("supervisor")}
                onRemove={() => {
                  setSupervisor(null);
                  onContactChange("Site supervisor", supervisor, null);
                }}
                locked={locked}
              />
            ) : (
              <EmptyContactRow label="No site supervisor" onAdd={() => openPicker("supervisor")} locked={locked} />
            )}
          </div>
        }
      />

      {/* The contact select list, opened by "Change …" in a contact's menu and
          by the empty row's "Add" button. ONE list for both roles (Figma
          24485-40395 / 24485-40467 are identical apart from the title):
          desktop dialog / mobile drawer, searchable, single-select.
          Every "Add … contact" action is DISPLAY-ONLY — the New-contact forms
          live in their own Figma file and are not built yet. */}
      <SelectList
        variant="dialog"
        breakpoint={mobile ? "mobile" : "desktop"}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={pickerLabel}
        searchable
        searchPlaceholder="Search by contact name, phone or email..."
        noResultsCaption="Try a different search or add a new contact"
        emptyState={{
          icon: "user",
          title: "No contacts here yet",
          caption: "Add a contact to see it here",
          actionLabel: "Add contact",
        }}
        footer={
          <SelectListFooter variant="menuItem">
            <MenuItem label="Add job contact" slotLeft={slot("plus")} onClick={noop} />
          </SelectListFooter>
        }
      >
        {contactGroups.map((g) => (
          <SelectListItemGroup
            key={g.label}
            emptyCaption="No contacts here yet"
            label={
              <GroupLabel
                variant="primary"
                label={g.label}
                slotRight={
                  <HoverTooltip text={g.addLabel}>
                    <IconButton icon="plus" variant="ghost" size="md" aria-label={g.addLabel} onClick={noop} />
                  </HoverTooltip>
                }
              />
            }
          >
            {g.contacts.map((c, i) => (
              <SelectListItem
                key={c.id}
                variant="object"
                // The group's FIRST contact is its primary one — the crown.
                avatar={<AvatarUser size="xl" imageSrc={c.avatar} isPrimary={i === 0} />}
                label={c.name}
                caption={contactCaption(c)}
                searchText={`${c.name} ${c.phone ?? ""} ${c.email ?? ""}`}
                selected={pickedContact?.id === c.id}
                onClick={() => pickContact(c)}
              />
            ))}
          </SelectListItemGroup>
        ))}
      </SelectList>

      {/* Labels (Figma 21136-58216): the chips, or the caption-only empty state
          when the job wears none. */}
      <DisplayModule
        title="Labels"
        slotRight={locked ? undefined : <EditButton label="Edit labels" onClick={openLabels} />}
        content={
          shownLabels.length > 0 ? (
            <div className={styles.chips}>
              {shownLabels.map(({ label, icon, iconColor }) => (
                <Badge key={label} size="md" leftIcon={icon} leftIconPack="solid" leftIconColor={iconColor}>
                  {label}
                </Badge>
              ))}
            </div>
          ) : (
            // The design's module body has NO padding here — EmptyState's own
            // 32px is the only padding (node 21136-58219).
            <div className={styles.emptyBody}>
              <EmptyState caption="No labels here yet" />
            </div>
          )
        }
      />

      {/* The Labels edit form (Figma 23863-17937) — desktop dialog / mobile
          drawer. Picks stage in a draft; Cancel drops them, Save applies. */}
      <SelectList
        variant="dialog"
        breakpoint={mobile ? "mobile" : "desktop"}
        open={labelsOpen}
        onClose={() => setLabelsOpen(false)}
        title="Labels"
        multiSelect
        searchable
        searchPlaceholder="Search by label..."
        footer={
          <SelectListFooter
            variant="actionBar"
            leadingButton={
              <Button size="lg" variant="ghost" onClick={() => setLabelsOpen(false)}>
                Cancel
              </Button>
            }
          >
            <Button size="lg" variant="solid" onClick={saveLabels}>
              Save
            </Button>
          </SelectListFooter>
        }
      >
        <SelectListItemGroup>
          {LABEL_POOL.map((l) => (
            <SelectListItem
              key={l.label}
              label={l.label}
              multiSelect
              selected={labelDraft.includes(l.label)}
              onClick={() => toggleLabel(l.label)}
            />
          ))}
        </SelectListItemGroup>
      </SelectList>

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
