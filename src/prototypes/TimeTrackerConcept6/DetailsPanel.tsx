import { useState } from "react";

import Avatar from "../../components/Avatar/Avatar";
import AvatarClient from "../../components/Avatar/AvatarClient";
import AvatarEstimate from "../../components/Avatar/AvatarEstimate";
import AvatarInvoice from "../../components/Avatar/AvatarInvoice";
import AvatarJob from "../../components/Avatar/AvatarJob";
import AvatarJobSeries from "../../components/Avatar/AvatarJobSeries";
import AvatarLocation from "../../components/Avatar/AvatarLocation";
import AvatarPO from "../../components/Avatar/AvatarPO";
import AvatarUser from "../../components/Avatar/AvatarUser";
import Badge from "../../components/Badge/Badge";
import Button from "../../components/Button/Button";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import IconButton from "../../components/IconButton/IconButton";
import ListItem from "../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../components/ListItem/ListItemSlotIcon";
import Menu from "../../components/Menu/Menu";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import ValueDisplay from "../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../components/ValueDisplay/ValueDisplayGroup";
import { User, users } from "../../data/users";
import { toast } from "../../components/Toast/Toaster";
import BillingForm, { Billing, billingSummary, SERVICE_LOCATION } from "./BillingForm";
import { JOB_RECALL_TO } from "./jobData";
import { displayStatus, JobState } from "./jobState";
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

const RELATED: { caption: string; title: string; avatar: React.ReactNode }[] = [
  { caption: "Belongs to", title: "JS-10001", avatar: <AvatarJobSeries size="xl" status="open" /> },
  { caption: "Created from", title: "EST-10001", avatar: <AvatarEstimate size="xl" status="jobbed" /> },
  { caption: "Converted into", title: "INV-10001", avatar: <AvatarInvoice size="xl" status="outstanding" /> },
  { caption: "Connected to", title: "PO-10001", avatar: <AvatarPO size="xl" status="sent" /> },
  { caption: "Recall to", title: JOB_RECALL_TO, avatar: <AvatarJob size="xl" status="finalized" /> },
  { caption: "Recall", title: "JOB-10001", avatar: <AvatarJob size="xl" status="finalized" /> },
];

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

export default function DetailsPanel({ mobile = false, scheduling, onSchedulingChange, job, locked = false }: DetailsPanelProps) {
  const [hasReporter, setHasReporter] = useState(true);
  const [hasSupervisor, setHasSupervisor] = useState(true);

  // The pencil opens the edit form; Save writes back through onSchedulingChange.
  const [schedulingOpen, setSchedulingOpen] = useState(false);
  // Past due (an upcoming job whose time slipped) → the "Scheduled for" value
  // reads in the danger color.
  const pastDue = displayStatus(job, scheduling) === "pastDue";

  // Billing intention is editable (the pencil opens BillingForm; Save writes back).
  const [billing, setBilling] = useState<Billing>({ intention: "inheritLocation", clientId: null });
  const [billingOpen, setBillingOpen] = useState(false);
  const billingBiller = billingSummary(billing);

  const schedulingUsers = scheduling.assignees
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is User => u != null);

  return (
    <div className={styles.panel}>
      {/* Location */}
      <DisplayModule
        title="Location"
        content={
          <div className={styles.listBody}>
            <ListItem
              variant="titleCaption"
              title={SERVICE_LOCATION.name}
              caption={SERVICE_LOCATION.caption}
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
                onClick={() => window.open("https://maps.google.com/?q=123+Main+Street,+San+Francisco,+CA+94105", "_blank")}
              >
                Open in maps
              </Button>
            </div>
          </div>
        }
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
                kind="avatarStack"
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
                    variant="ghost"
                    size="sm"
                    aria-label="Copy Job ID"
                    onClick={() => void copyText("JOB-10001", "Job ID")}
                  />
                </HoverTooltip>
              }
            />
            <ValueDisplay label="Source" value="ServiceChannel" slotLeft={<Avatar shape="square" content="image" size="xs" />} />
            <ValueDisplay
              label="Source ID"
              value="123456789"
              slotRight={
                <HoverTooltip text="Copy">
                  <IconButton
                    icon="copy"
                    variant="ghost"
                    size="sm"
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
            <ValueDisplay label="Created at" value="Jan 1 at 12:00 PM" />
            <ValueDisplay
              label="Created by"
              value={users[2].name}
              slotLeft={<AvatarUser size="xs" imageSrc={users[2].avatar} />}
            />
            <ValueDisplay label="Last modified" value="Jan 1 at 12:00 PM" />
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

      {/* Related */}
      <DisplayModule
        title="Related"
        content={
          <div className={styles.listBody}>
            {RELATED.map((row) => (
              <ListItem
                key={`${row.caption}-${row.title}`}
                variant="titleCaptionReversed"
                title={row.title}
                caption={row.caption}
                avatar={row.avatar}
                slotRight={<ListItemSlotIcon icon="angle-right" />}
                isClickable
                onClick={noop}
              />
            ))}
          </div>
        }
      />
    </div>
  );
}
