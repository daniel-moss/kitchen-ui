import { MouseEvent, useEffect, useState } from "react";

import Avatar from "../../components/Avatar/Avatar";
import AvatarUser from "../../components/Avatar/AvatarUser";
import Button from "../../components/Button/Button";
import CheckboxGroup from "../../components/Checkbox/CheckboxGroup";
import CheckboxItem from "../../components/Checkbox/CheckboxItem";
import { CheckboxItemVariant } from "../../components/Checkbox/CheckboxItem.types";
import Dialog from "../../components/Dialog/Dialog";
import { Divider } from "../../components/Divider/Divider";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import Input from "../../components/Input/Input";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import ListItem from "../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../components/ListItem/ListItemSlotIcon";
import MenuItem from "../../components/Menu/MenuItem";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import { SelectPopover, SelectPopoverList, useSelectPopover } from "../../forms/shared/selectPopover";
import {
  ContactChannel,
  ContactGroup,
  JobContact,
  SERVICE_CLIENT_CONTACTS,
  SERVICE_LOCATION_CONTACTS,
  channelCaption,
  channelValue,
} from "./contacts";
import { copyText, noop, slot } from "./shared";

import styles from "./SendSummaryForm.module.scss";

// ---------------------------------------------------------------------------
// "Send job summary" — the Dialog that opens right after the job is completed
// (Figma section 24576-152451). It shares the summary's public link and sends
// it to the client's contacts through two channels: text message and e-mail.
// Each channel picks its OWN contacts from the SAME list — only the contact
// detail shown changes (phone for text, e-mail for e-mail).
// ---------------------------------------------------------------------------

/** The demo summary link (the Figma value, node 24577-160191). */
const SUMMARY_LINK = "https://staging.app.roopairs.com/jobs/7kgJNvK/G8ANyHeUSK-zIy5Zgxqs_oH7uyQbpDHwyogS_z0tLTw/";

/** The message the field starts with (Figma 24633-7694). */
const DEFAULT_MESSAGE = "Thank you for trusting us with your equipment.";

// The contacts the summary can go to: the service client's and the service
// location's. One list, shown twice — the reporter picker's "Billing client"
// group does not belong here.
const CONTACT_GROUPS: ContactGroup[] = [
  { label: "Service client", addLabel: "Add contact", contacts: SERVICE_CLIENT_CONTACTS },
  { label: "Service location", addLabel: "Add contact", contacts: SERVICE_LOCATION_CONTACTS },
];

// Pool order, so ticking a contact never shuffles the rows already listed.
const ALL_CONTACTS: JobContact[] = CONTACT_GROUPS.flatMap((g) => g.contacts);

const contactsOf = (ids: number[]) => ALL_CONTACTS.filter((c) => ids.includes(c.id));

const CHANNEL_COPY: Record<ContactChannel, { label: string; icon: string; searchPlaceholder: string }> = {
  text: {
    label: "Send via Text message",
    icon: "message",
    searchPlaceholder: "Search by contact name or phone number...",
  },
  email: {
    label: "Send via Email",
    icon: "at",
    searchPlaceholder: "Search by contact name or email address...",
  },
};

// ---- link container (Figma doc 24577-160737) -------------------------------
// NOT a DS component — a local button that toggles between one truncated line
// and the full wrapped link (flagged to Daniel).
function LinkContainer({ link }: { link: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      type="button"
      className={styles.linkBox}
      aria-expanded={expanded}
      aria-label={expanded ? "Collapse the summary link" : "Show the full summary link"}
      onClick={() => setExpanded((v) => !v)}
    >
      <span className={`${styles.linkText} ${expanded ? styles.linkExpanded : styles.linkCollapsed}`}>{link}</span>
      <span className={styles.linkIcon}>
        <Icon icon={expanded ? "caret-down" : "caret-left"} pack="solid" size={12} />
      </span>
    </button>
  );
}

// ---- one delivery channel --------------------------------------------------
interface ChannelCardProps {
  channel: ContactChannel;
  /** The channel's contacts picker — owned by the form (see the note there). */
  pop: SelectPopover;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** The picked contacts' ids — this channel's own selection. */
  picks: number[];
  onPicksChange: (next: number[]) => void;
  /** Send was pressed with this channel on but no contacts picked. */
  noContacts: boolean;
  /** @internal Injected by CheckboxGroup — forwarded to the CheckboxItem. */
  variant?: CheckboxItemVariant;
  /** @internal The card's own error, or the group's when it is invalid. */
  error?: boolean;
}

function ChannelCard({ channel, pop, checked, onCheckedChange, picks, onPicksChange, noContacts, variant, error }: ChannelCardProps) {
  const copy = CHANNEL_COPY[channel];
  const picked = contactsOf(picks);

  // THE LAYOUT-FREEZE RULE: the rows grow BELOW the trigger, so they would push
  // the field down and the open card would drift away from it. The field's own
  // counter is NOT frozen — it does not change size.
  const listed = pop.freeze(picked);

  return (
    <CheckboxItem
      variant={variant}
      label={copy.label}
      icon={copy.icon}
      iconPack="regular"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      error={error}
      // The field carries the 16px inset itself, so the Divider below it can
      // run edge to edge (Figma 24577-161118).
      contentPadded={false}
      content={
        <>
          <div className={styles.channelField}>
            <SelectField
              multiSelect
              count={picks.length}
              // One contact → their name; several → the counter + this copy.
              value={picked.length === 1 ? picked[0].name : undefined}
              multiSelectLabel="Contacts selected"
              onClearSelection={() => onPicksChange([])}
              isValid={!noContacts}
              errorMessage="Choose Contacts"
              open={pop.open}
              onClick={(e: MouseEvent<HTMLDivElement>) => pop.toggle(e.currentTarget)}
            />
          </div>

          {/* The picked contacts. One missing this channel's detail is marked
              with the amber warning avatar + caption (Figma 24577-161815). The
              row would open the contact side panel — not built, so noop. */}
          {listed.length > 0 && (
            <>
              <Divider />
              <ItemGroup>
                {listed.map((c) => {
                  const missing = channelValue(c, channel) == null;
                  return (
                    <ListItem
                      key={c.id}
                      variant="titleCaption"
                      title={c.name}
                      caption={channelCaption(c, channel)}
                      captionLines={1}
                      captionClassName={missing ? styles.warningCaption : undefined}
                      avatar={
                        missing ? (
                          <Avatar
                            type="object"
                            content="icon"
                            icon="warning"
                            size="xl"
                            backgroundColor="var(--amber-a3)"
                            iconColor="var(--amber-10)"
                          />
                        ) : (
                          <AvatarUser size="xl" imageSrc={c.avatar} />
                        )
                      }
                      slotRight={<ListItemSlotIcon icon="angle-right" />}
                      isClickable
                      onClick={noop}
                    />
                  );
                })}
              </ItemGroup>
            </>
          )}
        </>
      }
    />
  );
}

// ---- the contacts picker ---------------------------------------------------
// One list for both channels (Figma 24577-161859 / 24577-162622) — only the
// caption changes, showing the channel's own contact detail. A contact who
// lacks it stays selectable; the picked row then carries the warning.
function ContactsList({
  channel,
  pop,
  picks,
  onToggle,
  mobile,
}: {
  channel: ContactChannel;
  pop: SelectPopover;
  picks: number[];
  onToggle: (id: number) => void;
  mobile: boolean;
}) {
  return (
    <SelectPopoverList
      pop={pop}
      mobile={mobile}
      title="Contacts"
      // Two groups, so the DS leaves them as they are — no "selected on top".
      multiSelect
      searchable
      searchPlaceholder={CHANNEL_COPY[channel].searchPlaceholder}
      noResultsCaption="Try a different search or add a new contact"
      footer={
        <SelectListFooter>
          <MenuItem label="Add contact" slotLeft={slot("plus")} onClick={noop} />
        </SelectListFooter>
      }
    >
      {CONTACT_GROUPS.map((g) => (
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
          {g.contacts.map((c, i) => {
            const value = channelValue(c, channel);
            return (
              <SelectListItem
                key={c.id}
                variant="object"
                multiSelect
                // The group's FIRST contact is its primary one — the crown.
                avatar={<AvatarUser size="xl" imageSrc={c.avatar} isPrimary={i === 0} />}
                label={c.name}
                caption={value ?? <span className={styles.missingCaption}>{channelCaption(c, channel)}</span>}
                searchText={`${c.name} ${value ?? ""}`}
                selected={picks.includes(c.id)}
                onClick={() => onToggle(c.id)}
              />
            );
          })}
        </SelectListItemGroup>
      ))}
    </SelectPopoverList>
  );
}

interface SendSummaryFormProps {
  open: boolean;
  onClose: () => void;
  mobile?: boolean;
}

export default function SendSummaryForm({ open, onClose, mobile = false }: SendSummaryFormProps) {
  const [channels, setChannels] = useState<Record<ContactChannel, boolean>>({ text: false, email: false });
  const [picks, setPicks] = useState<Record<ContactChannel, number[]>>({ text: [], email: [] });
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [showErrors, setShowErrors] = useState(false);

  // One picker per channel. They live HERE, not inside ChannelCard: CheckboxGroup
  // clones its children (variant / error), so a card must be exactly one element
  // — the lists are its siblings.
  const textPop = useSelectPopover(mobile);
  const emailPop = useSelectPopover(mobile);
  const pops: Record<ContactChannel, SelectPopover> = { text: textPop, email: emailPop };

  // A fresh open starts over.
  useEffect(() => {
    if (!open) return;
    setChannels({ text: false, email: false });
    setPicks({ text: [], email: [] });
    setMessage(DEFAULT_MESSAGE);
    setShowErrors(false);
  }, [open]);

  const setChannel = (channel: ContactChannel, checked: boolean) =>
    setChannels((prev) => ({ ...prev, [channel]: checked }));
  const togglePick = (channel: ContactChannel, id: number) =>
    setPicks((prev) => ({
      ...prev,
      [channel]: prev[channel].includes(id) ? prev[channel].filter((p) => p !== id) : [...prev[channel], id],
    }));

  // No contacts at all, versus a picked contact this channel cannot reach.
  const noContacts = (channel: ContactChannel) => showErrors && channels[channel] && picks[channel].length === 0;
  const hasGap = (channel: ContactChannel) =>
    contactsOf(picks[channel]).some((c) => channelValue(c, channel) == null);
  const cardError = (channel: ContactChannel) =>
    showErrors && channels[channel] && (picks[channel].length === 0 || hasGap(channel));

  const noMethod = !channels.text && !channels.email;

  const handleCopy = () => copyText(SUMMARY_LINK, "Summary link", "Summary link copied", "Could not copy summary link");

  const handleSend = () => {
    const ready = (c: ContactChannel) => !channels[c] || (picks[c].length > 0 && !hasGap(c));
    if (noMethod || !ready("text") || !ready("email")) {
      setShowErrors(true);
      return;
    }
    toast({ type: "success", title: "Summary sent" });
    onClose();
  };

  const channelCard = (channel: ContactChannel) => (
    <ChannelCard
      channel={channel}
      pop={pops[channel]}
      checked={channels[channel]}
      onCheckedChange={(c) => setChannel(channel, c)}
      picks={picks[channel]}
      onPicksChange={(next) => setPicks((prev) => ({ ...prev, [channel]: next }))}
      noContacts={noContacts(channel)}
      error={cardError(channel)}
    />
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Send job summary"
      breakpoint={mobile ? "mobile" : "desktop"}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="ghost" leftIcon="link" onClick={handleCopy}>
            Copy link
          </Button>
          <Button size="lg" variant="solid" leftIcon="paper-plane" onClick={handleSend}>
            Send
          </Button>
        </PopoverFooter>
      }
    >
      {/* The summary link + its copy button (Figma 24577-160189). */}
      <div className={styles.linkRow}>
        <LinkContainer link={SUMMARY_LINK} />
        <HoverTooltip text="Copy link">
          <IconButton icon="link" variant="ghost" size="lg" aria-label="Copy link" onClick={handleCopy} />
        </HoverTooltip>
      </div>

      {/* Delivery method — at least one channel is required (Figma 24578-163475). */}
      <Input label="Delivery method">
        <CheckboxGroup isValid={!(showErrors && noMethod)} errorMessage="Choose at least one delivery method">
          {channelCard("text")}
          {channelCard("email")}
        </CheckboxGroup>
      </Input>

      <Input label="Message to client" labelCondition="optional">
        <TextArea value={message} onChange={(e) => setMessage(e.target.value)} />
      </Input>

      {/* The pickers — siblings of the group, one per channel. */}
      <ContactsList channel="text" pop={textPop} picks={picks.text} onToggle={(id) => togglePick("text", id)} mobile={mobile} />
      <ContactsList channel="email" pop={emailPop} picks={picks.email} onToggle={(id) => togglePick("email", id)} mobile={mobile} />
    </Dialog>
  );
}
