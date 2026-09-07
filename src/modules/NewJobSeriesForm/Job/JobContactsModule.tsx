import { MouseEvent, ReactNode } from "react";

import AvatarUser from "../../../components/Avatar/AvatarUser";
import Card from "../../../components/Card/Card";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import FormModule from "../../../components/FormModule/FormModule";
import GroupLabel from "../../../components/GroupLabel/GroupLabel";
import { Icon } from "../../../components/Icon/Icon";
import IconButton from "../../../components/IconButton/IconButton";
import Input from "../../../components/Input/Input";
import ListItem from "../../../components/ListItem/ListItem";
import MenuItem from "../../../components/Menu/MenuItem";
import SelectListFooter from "../../../components/SelectList/SelectListFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import { clientById, clientContactsOf, locationById, locationContactsOf } from "../../../data/db";
import { ContactRecord } from "../../../data/db/types";
import { TEXT_SEPARATOR } from "../../../utils/textSeparator";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

import { JobContactsModuleProps, SelectedContact } from "./JobContactsModule.types";
import styles from "./JobContactsModule.module.scss";

// The "Job Contacts" module of the "New Job" form (Figma 19088-101057): two
// optional contact picks. The lists group contacts by owner — Service client,
// Service location, and (job reporter only, when billing differs) Billing
// client — primary contact first (crown), the rest A→Z. The "+" add-contact
// buttons and the "Add job contact" footer open the New Contact forms, which
// live in another design file — deferred, so they are no-ops. The selected
// CARD is the interactive surface (Contact side panel — no-op); a contact
// missing BOTH phone and email gets the warning treatment.

const initials = (name?: string) =>
  (name ?? "")
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2) || "?";

const contactAvatar = (contact: SelectedContact, size: "xs" | "xl") =>
  contact.avatar ? (
    <AvatarUser size={size} imageSrc={contact.avatar} isPrimary={contact.isPrimary} />
  ) : (
    <AvatarUser size={size} content="letters" characters={initials(contact.name)} isPrimary={contact.isPrimary} />
  );

const hasIssues = (contact: SelectedContact) => !contact.phone && !contact.email;

const placeholder = (text: string): ReactNode => <span className={styles.placeholderText}>{text}</span>;

/** "phone · email" with the copy-doc placeholders. */
const contactCaption = (contact: SelectedContact): ReactNode => (
  <>
    {contact.phone ?? placeholder("No Phone number")}
    {TEXT_SEPARATOR}
    {contact.email ?? placeholder("No Email address")}
  </>
);

/** Primary contact on top, the rest A→Z (the dev notes). */
const sortContacts = (rows: ContactRecord[], primaryId?: string): SelectedContact[] =>
  [...rows]
    .sort((a, b) =>
      a.id === primaryId ? -1 : b.id === primaryId ? 1 : (a.name ?? "").localeCompare(b.name ?? ""),
    )
    .map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      avatar: row.avatar,
      isPrimary: row.id === primaryId,
    }));

interface ContactGroup {
  label: string;
  contacts: SelectedContact[];
}

function ContactField({
  label,
  value,
  onChange,
  groups,
  mobile,
}: {
  label: string;
  value: SelectedContact | null;
  onChange: (contact: SelectedContact | null) => void;
  groups: ContactGroup[];
  mobile: boolean;
}) {
  // The contact fields sit low in the form — the list opens ABOVE the field
  // (Daniel, 2026-09-08).
  const pop = useSelectPopover(mobile, "above");
  const issues = value ? hasIssues(value) : false;

  return (
    <>
      <div className={styles.stack}>
        <Input label={label} labelCondition="optional">
          <SelectField
            value={value?.name}
            slotLeft={value ? contactAvatar(value, "xs") : undefined}
            open={pop.open}
            onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
          />
        </Input>
        {value && (
          <Card
            padding={4}
            onClick={() => {}}
            status={issues ? "warning" : undefined}
            banner={issues ? { children: "Some details require your attention!", ctaLabel: "Review" } : undefined}
          >
            <ListItem
              variant="titleCaption"
              title={value.name ?? placeholder("No name")}
              caption={contactCaption(value)}
              avatar={contactAvatar(value, "xl")}
              slotRight={
                <HoverTooltip text="Remove">
                  <IconButton
                    icon="xmark"
                    variant="muted"
                    size="md"
                    aria-label={`Remove ${value.name ?? "contact"}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onChange(null);
                    }}
                  />
                </HoverTooltip>
              }
            />
          </Card>
        )}
      </div>

      <SelectPopoverList
        pop={pop}
        mobile={mobile}
        title={label}
        searchable
        searchPlaceholder="Contact..."
        noResultsCaption="Try a different search or add a new contact"
        footer={
          <SelectListFooter>
            {/* "New ephemeral contact" form — another design file, deferred. */}
            <MenuItem
              label="Add job contact"
              slotLeft={<Icon icon="plus" pack="regular" size={14} container="square" />}
              onClick={() => {}}
            />
          </SelectListFooter>
        }
      >
        {groups.map((group, index) => (
          <SelectListItemGroup
            key={group.label}
            emptyCaption="No contacts here yet"
            divider={index < groups.length - 1}
            label={
              <GroupLabel
                variant="primary"
                label={group.label}
                slotRight={
                  <HoverTooltip text="Add contact">
                    {/* The New Contact forms live in another file — deferred. */}
                    <IconButton
                      icon="plus"
                      variant="ghost"
                      size="md"
                      aria-label={`Add ${group.label} contact`}
                      onClick={() => {}}
                    />
                  </HoverTooltip>
                }
              />
            }
          >
            {group.contacts.map((contact) => (
              <SelectListItem
                key={contact.id}
                variant="object"
                label={contact.name ?? placeholder("No name")}
                caption={contactCaption(contact)}
                avatar={contactAvatar(contact, "xl")}
                searchText={[contact.name, contact.phone, contact.email].filter(Boolean).join(" ")}
                selected={value?.id != null && value.id === contact.id}
                onClick={() => onChange(contact)}
              />
            ))}
          </SelectListItemGroup>
        ))}
      </SelectPopoverList>
    </>
  );
}

export default function JobContactsModule({
  value,
  onChange,
  locationId,
  clientId,
  billingClientId,
  mobile,
}: JobContactsModuleProps) {
  const client = clientId ? clientById(clientId) : undefined;
  const location = locationId ? locationById(locationId) : undefined;
  const billingClient = billingClientId && billingClientId !== clientId ? clientById(billingClientId) : undefined;

  const clientGroup: ContactGroup = {
    label: "Service client",
    contacts: clientId ? sortContacts(clientContactsOf(clientId), client?.primaryContactId) : [],
  };
  const locationGroup: ContactGroup = {
    label: "Service location",
    contacts: locationId ? sortContacts(locationContactsOf(locationId), location?.primaryContactId) : [],
  };
  // Billing-client contacts join the JOB REPORTER list only, and only when
  // the payer differs from the service client (the dev notes).
  const billingGroup: ContactGroup | null = billingClient
    ? { label: "Billing client", contacts: sortContacts(clientContactsOf(billingClient.id), billingClient.primaryContactId) }
    : null;

  const reporterGroups = billingGroup ? [clientGroup, locationGroup, billingGroup] : [clientGroup, locationGroup];
  const supervisorGroups = [clientGroup, locationGroup];

  return (
    <FormModule title="Job contacts">
      <div className={styles.fields}>
        <ContactField
          label="Job reporter"
          value={value.reporter}
          onChange={(contact) => onChange({ ...value, reporter: contact })}
          groups={reporterGroups}
          mobile={mobile}
        />
        <ContactField
          label="Site supervisor"
          value={value.siteSupervisor}
          onChange={(contact) => onChange({ ...value, siteSupervisor: contact })}
          groups={supervisorGroups}
          mobile={mobile}
        />
      </div>
    </FormModule>
  );
}
