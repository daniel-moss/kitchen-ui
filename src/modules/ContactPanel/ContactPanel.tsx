import { useEffect, useState } from "react";

import AlertBanner from "../../components/AlertBanner/AlertBanner";
import AvatarUser from "../../components/Avatar/AvatarUser";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import Menu from "../../components/Menu/Menu";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import DrawerHeader from "../../components/Popover/DrawerHeader";
import PopoverHeaderContent from "../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../components/Popover/PopoverHeaderText";
import Prompt from "../../components/Prompt/Prompt";
import SidePanel from "../../components/SidePanel/SidePanel";
import { toast } from "../../components/Toast/Toaster";
import useIsDesktop from "../../hooks/useIsDesktop";
import { semanticIcons } from "../../styles/semanticIcons";
import { useAnchoredMenu } from "../shared/anchoredMenu";
import { slot } from "../shared/helpers";

import { clientOf, contactInitials, formatPhone, locationCaption, reminderFields } from "./contactData";
import { ContactPanelProps, PanelContact, ReminderChannels, ReminderKind } from "./ContactPanel.types";
import { EditEmailDialog, EditGeneralDialog, EditPhoneDialog } from "./forms/EditDialogs";
import ChannelModule, { ChannelConfig } from "./modules/ChannelModule";
import GeneralModule from "./modules/GeneralModule";
import RemindersModule from "./modules/RemindersModule";

import styles from "./ContactPanel.module.scss";

// The "Contact" side panel (Figma file yHAKtZA0xLw4AqxooiOHYI, page
// "↳ Side Panel"). ONE module for every contact — a client's, a location's, or
// a job's own one-off contact; the record and its owner are props.
//
// No navigation, no footer: four display modules — General · Phone number ·
// Email address · Reminders. What changes per case:
// - owner     → header caption, "Set as primary", the Reminders module (saved
//               contacts only);
// - inactive client → a warning banner with "Reactivate", and nothing can be
//               edited ("editing is restricted until a client is reactivated");
// - public view → no menu, no editing, no Reminders.

const PHONE: ChannelConfig = {
  title: "Phone number",
  emptyCaption: "No phone number",
  actionIcon: "phone",
  actionLabel: "Call",
  actionHref: (value) => `tel:${value.replace(/[^\d+]/g, "")}`,
};

const EMAIL: ChannelConfig = {
  title: "Email address",
  emptyCaption: "No email address",
  actionIcon: "envelope",
  actionLabel: "Send email",
  actionHref: (value) => `mailto:${value}`,
};

const FAILED = "Something went wrong. Please try again.";

type Prompting = "contact" | "phone" | "email" | null;
type Editing = "general" | "phone" | "email" | null;

export default function ContactPanel({
  open,
  onClose,
  contact,
  owner,
  isPrimary = false,
  onBack,
  editingBy,
  onSaveGeneral,
  onSavePhone,
  onDeletePhone,
  onSaveEmail,
  onDeleteEmail,
  onSaveReminders,
  onSetPrimary,
  onDelete,
  onReactivateClient,
  isPublicView = false,
  isLoading = false,
  state = "content",
  onRetry,
  breakpoint = "auto",
}: ContactPanelProps) {
  const mobile = !useIsDesktop(breakpoint);
  const menu = useAnchoredMenu(!mobile, "end");
  const [editing, setEditing] = useState<Editing>(null);
  const [prompting, setPrompting] = useState<Prompting>(null);

  // The panel's WORKING COPY. The caller stays the source of truth — every
  // action still calls its handler — but the panel applies the change itself
  // too, so nothing looks inert where a host has not wired a handler yet (the
  // Equipment / Warranty panels' rule).
  const [record, setRecord] = useState<PanelContact>(contact);
  useEffect(() => setRecord(contact), [contact]);
  const [primary, setPrimary] = useState(isPrimary);
  useEffect(() => setPrimary(isPrimary), [isPrimary]);

  // Closing the panel closes everything it opened.
  useEffect(() => {
    if (open) return;
    menu.close();
    setEditing(null);
    setPrompting(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const patch = (fields: Partial<PanelContact>) => setRecord((prev) => ({ ...prev, ...fields }));

  const isSaved = owner.kind !== "job";
  const client = clientOf(owner);
  const isClientInactive = client != null && !client.isActive;
  // Editing of any kind: not in the public view, not under an inactive client.
  const canEdit = !isPublicView && !isClientInactive;

  const name = record.name != null && record.name !== "" ? record.name : undefined;
  const phone = record.phone != null && record.phone !== "" ? formatPhone(record.phone, record.phoneExtension) : undefined;
  const email = record.email != null && record.email !== "" ? record.email : undefined;
  // "Only shown if both phone and email are missing" (23815-14533 / 23818-6848).
  const channelWarning = phone == null && email == null;

  // ---- header ----

  // Caption by owner (Header Content Variations, 23908-3853): the client with
  // its type icon, the location (name, else its address), or nothing for a
  // job's own contact.
  // While loading the header shows no caption (23815-13132 draws variant=title).
  const caption = isLoading
    ? undefined
    : owner.kind === "client"
      ? { text: owner.client.name, icon: owner.client.clientType === "Individual" ? semanticIcons.clientIndividual : semanticIcons.clientBusiness }
      : owner.kind === "location"
        ? { text: locationCaption(owner.location), icon: "location-dot" }
        : undefined;

  const avatar = (
    <AvatarUser
      size="xl"
      // Loading draws the generic person icon (23815-13132). Otherwise the
      // photo; without one, initials; without a name either, the icon.
      content={isLoading ? "icon" : record.avatar != null ? "image" : name != null ? "letters" : "icon"}
      imageSrc={record.avatar}
      characters={name != null ? contactInitials(name) : undefined}
      // The crown: "A contact is a primary contact of a location or a client" (23908-4058).
      isPrimary={!isLoading && isSaved && primary}
    />
  );

  const showSetPrimary = isSaved && !primary;

  const setAsPrimary = async () => {
    menu.close();
    const where = owner.kind === "location" ? "location" : "client";
    if ((await onSetPrimary?.()) === false) {
      toast({ type: "error", variant: "detailed", title: `Couldn't set as ${where} primary contact`, caption: FAILED });
      return;
    }
    setPrimary(true);
    toast({ type: "success", variant: "detailed", title: `Set as ${where} primary contact`, caption: name });
  };

  const headerMenuBody = (
    <>
      {/* "Only shown if a contact is not a primary one AND belongs to a client
          or a location" (23815-9615). */}
      {showSetPrimary && (
        <MenuItemGroup>
          <MenuItem label="Set as primary" slotLeft={slot("crown")} onClick={setAsPrimary} />
        </MenuItemGroup>
      )}
      <MenuItemGroup>
        <MenuItem
          danger
          label="Delete"
          slotLeft={slot(semanticIcons.delete)}
          onClick={() => {
            menu.close();
            setPrompting("contact");
          }}
        />
      </MenuItemGroup>
    </>
  );

  // ---- deletes ----

  const deleteContact = async () => {
    setPrompting(null);
    if ((await onDelete?.()) === false) {
      toast({ type: "error", variant: "detailed", title: "Couldn't delete the contact", caption: FAILED });
      return;
    }
    toast({ type: "success", variant: "detailed", title: "Contact deleted", caption: name });
  };

  const deleteChannel = async (which: "phone" | "email") => {
    setPrompting(null);
    const config = which === "phone" ? PHONE : EMAIL;
    const value = which === "phone" ? phone : email;
    if ((await (which === "phone" ? onDeletePhone : onDeleteEmail)?.()) === false) {
      toast({ type: "error", variant: "detailed", title: `Couldn't delete "${config.title}"`, caption: FAILED });
      return;
    }
    patch(which === "phone" ? { phone: undefined, phoneExtension: undefined } : { email: undefined });
    toast({ type: "success", variant: "detailed", title: `"${config.title}" deleted`, caption: value });
  };

  // ---- reminders: a flip saves at once ----

  const saveReminders = async (kind: ReminderKind, channels: ReminderChannels) => {
    const subject = kind === "estimate" ? "estimate" : "invoice";
    const before = record;
    patch(reminderFields(kind, channels));
    if ((await onSaveReminders?.(kind, channels)) === false) {
      setRecord(before); // the switch flips back
      toast({ type: "error", variant: "detailed", title: `Couldn't update ${subject} reminders`, caption: FAILED });
      return;
    }
    toast({ type: "success", title: `${subject === "estimate" ? "Estimate" : "Invoice"} reminders updated` });
  };

  return (
    <>
      <SidePanel
        open={open}
        onClose={onClose}
        onBack={onBack}
        // "No Name" in the placeholder color — "might show up from legacy
        // code" (23908-4100).
        title={name ?? "No Name"}
        titleClassName={name == null ? styles.placeholder : undefined}
        caption={caption?.text}
        captionLeftSlot={caption == null ? undefined : <Icon icon={caption.icon} pack="regular" size={14} />}
        avatar={avatar}
        // No menu while loading, in the public view ("No context menu") or
        // under an inactive client (Deactivated, 23906-3326).
        headerActions={
          isLoading || !canEdit ? undefined : (
            <IconButton
              icon={semanticIcons.contextMenu}
              variant="ghost"
              size="md"
              aria-label="More actions"
              isPressed={menu.open}
              noDebounce
              onClick={menu.onActions}
            />
          )
        }
        state={state}
        onRetry={onRetry}
        breakpoint={breakpoint}
      >
        {isClientInactive && !isPublicView && !isLoading && (
          <AlertBanner type="card" status="warning" ctaLabel="Reactivate" ctaOnClick={onReactivateClient}>
            Parent client is inactive. Reactivate to edit details.
          </AlertBanner>
        )}
        <GeneralModule contact={record} onEdit={() => setEditing("general")} isLoading={isLoading} canEdit={canEdit} />
        <ChannelModule
          config={PHONE}
          value={phone}
          mobile={mobile}
          onEdit={() => setEditing("phone")}
          onDelete={() => setPrompting("phone")}
          warning={channelWarning}
          editingBy={editingBy?.phone}
          isLoading={isLoading}
          canEdit={canEdit}
        />
        <ChannelModule
          config={EMAIL}
          value={email}
          mobile={mobile}
          onEdit={() => setEditing("email")}
          onDelete={() => setPrompting("email")}
          warning={channelWarning}
          editingBy={editingBy?.email}
          isLoading={isLoading}
          canEdit={canEdit}
        />
        {/* "Only show for location and client contacts" — and not in the
            public view (24076-21831 has three modules). */}
        {isSaved && !isPublicView && (
          <RemindersModule contact={record} mobile={mobile} onChange={saveReminders} isLoading={isLoading} canEdit={canEdit} />
        )}
      </SidePanel>

      {canEdit && (
        <>
          {mobile ? (
            <Menu
              open={menu.open}
              onClose={menu.close}
              // The drawer repeats the header: avatar, name, caption (23815-9617).
              drawerHeader={
                <DrawerHeader>
                  <PopoverHeaderContent avatar={avatar}>
                    <PopoverHeaderText
                      variant={caption == null ? "title" : "titleCaption"}
                      title={name ?? "No Name"}
                      titleClassName={name == null ? styles.placeholder : undefined}
                      caption={caption?.text}
                      captionLeftSlot={caption == null ? undefined : <Icon icon={caption.icon} pack="regular" size={14} />}
                    />
                  </PopoverHeaderContent>
                </DrawerHeader>
              }
              breakpoint="mobile"
            >
              {headerMenuBody}
            </Menu>
          ) : (
            menu.pos != null && (
              <div ref={menu.cardRef} className={styles.anchoredMenu} style={{ top: menu.pos.top, left: menu.pos.left, right: menu.pos.right }}>
                <Menu open={menu.open} onClose={menu.close} breakpoint="desktop">
                  {headerMenuBody}
                </Menu>
              </div>
            )
          )}

          <EditGeneralDialog
            open={editing === "general"}
            onClose={() => setEditing(null)}
            contact={record}
            onSave={async (edits) => {
              if ((await onSaveGeneral?.(edits)) === false) return false;
              patch(edits);
            }}
            breakpoint={breakpoint}
          />
          <EditPhoneDialog
            open={editing === "phone"}
            onClose={() => setEditing(null)}
            contact={record}
            onSave={async (edits) => {
              if ((await onSavePhone?.(edits)) === false) return false;
              patch(edits);
            }}
            breakpoint={breakpoint}
          />
          <EditEmailDialog
            open={editing === "email"}
            onClose={() => setEditing(null)}
            contact={record}
            onSave={async (value) => {
              if ((await onSaveEmail?.(value)) === false) return false;
              patch({ email: value });
            }}
            breakpoint={breakpoint}
          />

          <Prompt
            open={prompting === "contact"}
            title="Delete contact?"
            body={`Contact ${name == null ? "" : `${name} `}will be permanently deleted. This action can not be undone.`}
            actionLabel="Delete"
            actionVariant="danger"
            actionIcon={semanticIcons.delete}
            onAction={deleteContact}
            onCancel={() => setPrompting(null)}
            breakpoint={breakpoint}
          />
          <Prompt
            open={prompting === "phone"}
            title="Delete contact phone number?"
            body={`Phone number ${phone ?? ""} will be permanently deleted. This action can not be undone.`}
            actionLabel="Delete"
            actionVariant="danger"
            actionIcon={semanticIcons.delete}
            onAction={() => deleteChannel("phone")}
            onCancel={() => setPrompting(null)}
            breakpoint={breakpoint}
          />
          <Prompt
            open={prompting === "email"}
            title="Delete contact email address?"
            body={`Email address ${email ?? ""} will be permanently deleted. This action can not be undone.`}
            actionLabel="Delete"
            actionVariant="danger"
            actionIcon={semanticIcons.delete}
            onAction={() => deleteChannel("email")}
            onCancel={() => setPrompting(null)}
            breakpoint={breakpoint}
          />
        </>
      )}
    </>
  );
}

export type { ContactOwner, ContactPanelProps, PanelContact } from "./ContactPanel.types";
