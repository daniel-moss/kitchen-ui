import { MouseEvent as ReactMouseEvent } from "react";

import AvatarEstimate from "../../../components/Avatar/AvatarEstimate";
import AvatarInvoice from "../../../components/Avatar/AvatarInvoice";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import ItemTextBlock from "../../../components/ItemText/ItemText/ItemTextBlock";
import ItemGroup from "../../../components/ItemGroup/ItemGroup";
import ListItem from "../../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../../components/ListItem/ListItemSlotIcon";
import Menu from "../../../components/Menu/Menu";
import MenuItem from "../../../components/Menu/MenuItem";
import MenuItemGroup from "../../../components/Menu/MenuItemGroup";
import DrawerHeader from "../../../components/Popover/DrawerHeader";
import PopoverHeaderContent from "../../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../../components/Popover/PopoverHeaderText";
import { useAnchoredMenu } from "../../shared/anchoredMenu";
import { reminderChannels, reminderTag } from "../contactData";
import { PanelContact, ReminderChannels, ReminderKind } from "../ContactPanel.types";

import styles from "../ContactPanel.module.scss";

// The "Reminders" module (Figma section 17015-21120) — client and location
// contacts only; a job's own contact has none (the module's annotation). Two
// rows, Estimates and Invoices, each tagged with the channels that are on
// ("Off" / "Email" / "SMS" / "Email, SMS"). A row opens a small menu of two
// switches; a flip saves AT ONCE — there is no form — and toasts.

const ROWS: { kind: ReminderKind; title: string }[] = [
  { kind: "estimate", title: "Estimates" },
  { kind: "invoice", title: "Invoices" },
];

const avatarFor = (kind: ReminderKind) => (kind === "estimate" ? <AvatarEstimate size="xl" /> : <AvatarInvoice size="xl" />);

interface ReminderRowProps {
  kind: ReminderKind;
  title: string;
  contact: PanelContact;
  mobile: boolean;
  onChange: (kind: ReminderKind, channels: ReminderChannels) => void;
  canEdit: boolean;
}

function ReminderRow({ kind, title, contact, mobile, onChange, canEdit }: ReminderRowProps) {
  // Desktop: the card hangs under the ROW, right edges aligned, 4px below
  // (Notifications Menu / Desktop, 23884-5612); the row stays pressed meanwhile.
  const menu = useAnchoredMenu(!mobile, "end");
  const channels = reminderChannels(contact, kind);
  const hasEmail = contact.email != null && contact.email !== "";
  const hasPhone = contact.phone != null && contact.phone !== "";

  const tag = <ItemTextBlock align="right" variant="tag" tag={reminderTag(channels)} />;

  // "No Channel" (24087-4242): a method the contact lacks is OFF and cannot be
  // switched — the toggle dims, the row goes inert, and the caption says what
  // to add.
  const menuBody = (
    <MenuItemGroup>
      <MenuItem
        label="Email"
        caption={hasEmail ? undefined : "Add email address"}
        toggle
        checked={channels.email}
        toggleDisabled={!hasEmail}
        onCheckedChange={(email) => onChange(kind, { ...channels, email })}
      />
      <MenuItem
        label="SMS"
        caption={hasPhone ? undefined : "Add phone number"}
        toggle
        checked={channels.sms}
        toggleDisabled={!hasPhone}
        onCheckedChange={(sms) => onChange(kind, { ...channels, sms })}
      />
    </MenuItemGroup>
  );

  // An inactive client's contact cannot change reminders: the rows are plain,
  // with no chevron (Deactivated, 23906-3326).
  if (!canEdit) return <ListItem title={title} avatar={avatarFor(kind)} right={tag} />;

  return (
    <>
      <ListItem
        title={title}
        avatar={avatarFor(kind)}
        right={tag}
        isClickable
        isPressed={menu.open}
        // The anchored-menu hook takes the trigger from the click; the row is
        // the trigger here, so its click stands in for a button's.
        onClick={(event) => menu.onActions(event as unknown as ReactMouseEvent<HTMLButtonElement>)}
        slotRight={<ListItemSlotIcon icon="angle-right" />}
      />
      {mobile ? (
        <Menu
          open={menu.open}
          onClose={menu.close}
          // Title only — "Estimates" / "Invoices" (24076-22117).
          drawerHeader={
            <DrawerHeader>
              <PopoverHeaderContent>
                <PopoverHeaderText variant="title" title={title} />
              </PopoverHeaderContent>
            </DrawerHeader>
          }
          breakpoint="mobile"
        >
          {menuBody}
        </Menu>
      ) : (
        menu.pos != null && (
          <div ref={menu.cardRef} className={styles.anchoredMenu} style={{ top: menu.pos.top, left: menu.pos.left, right: menu.pos.right }}>
            <Menu open={menu.open} onClose={menu.close} breakpoint="desktop">
              {menuBody}
            </Menu>
          </div>
        )
      )}
    </>
  );
}

interface RemindersModuleProps {
  contact: PanelContact;
  mobile: boolean;
  onChange: (kind: ReminderKind, channels: ReminderChannels) => void;
  isLoading?: boolean;
  /** False = rows only show the state (an inactive client's contact). */
  canEdit?: boolean;
}

export default function RemindersModule({ contact, mobile, onChange, isLoading = false, canEdit = true }: RemindersModuleProps) {
  return (
    <DisplayModule
      title="Reminders"
      bodyPadded={false}
      content={
        <ItemGroup>
          {ROWS.map(({ kind, title }) =>
            isLoading ? (
              // Loading keeps the object avatar — the type is known (23815-13132).
              <ListItem key={kind} title="" avatar={avatarFor(kind)} isLoading />
            ) : (
              <ReminderRow key={kind} kind={kind} title={title} contact={contact} mobile={mobile} onChange={onChange} canEdit={canEdit} />
            ),
          )}
        </ItemGroup>
      }
    />
  );
}
