import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../components/Button/Button";
import Toaster from "../../components/Toast/Toaster";
import { users } from "../../data/users";
import { DeviceFrame } from "../../stories/helpers";

import ContactPanel from "./ContactPanel";
import { ContactOwner, ContactPanelProps, PanelContact } from "./ContactPanel.types";
import { contactPanelData, reminderFields } from "./contactData";

// The "Contact" side panel (Figma "Contact Side Panel — Next Update", page
// "↳ Side Panel"). One module every contact uses: the caller hands over the
// record and its owner; the panel renders General · Phone number · Email
// address · Reminders, with no navigation and no footer.
//
// Demo contacts, all from the database:
//   cc-wildwood-3          Dana Whitfield — a business client's contact, reminders on.
//   lc-wildwood-downtown-1 Ben Castillo — the Downtown location's PRIMARY contact.
//   cc-ferry-1             Dana Liu — an INDIVIDUAL client's primary contact, phone only.
//   lc-wildwood-marina-1   no name, phone only ("might show up from legacy code").
//   cc-sunset-1            Lena Park — neither phone nor email (warning state).
//   lc-presidio-canteen-1  Aiko Tanaka — her client (Presidio) is INACTIVE.
const meta: Meta = {
  title: 'Modules/Contact/"Contact" Side Panel',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

// A job's own one-off contact (JOB-1203's reporter) — not a saved row.
const JOB_CONTACT: PanelContact = { id: "job-1203-reporter", name: "Night porter (Karl)", phone: "(415) 555-0111" };

const Demo = ({
  id,
  record,
  owner: ownerOverride,
  breakpoint,
  isLoading,
  fails = false,
  isPublicView = false,
  editingBy,
}: {
  /** A saved contact's db id … */
  id?: string;
  /** … or a record + owner given directly (the job contact). */
  record?: PanelContact;
  owner?: ContactOwner;
  breakpoint: "desktop" | "mobile";
  isLoading?: boolean;
  /** Every action reports failure — the designed "Couldn't …" toasts. */
  fails?: boolean;
  isPublicView?: boolean;
  editingBy?: ContactPanelProps["editingBy"];
}) => {
  const data = id != null ? contactPanelData(id) : { contact: record!, owner: ownerOverride!, isPrimary: false };
  // The panel holds no record of its own — the caller is the source of truth,
  // so every change lands here.
  const [contact, setContact] = useState<PanelContact>(data.contact);
  const [isPrimary, setPrimary] = useState(data.isPrimary);
  const [open, setOpen] = useState(true);

  const apply = (fields: Partial<PanelContact>) => (fails ? false : void setContact((prev) => ({ ...prev, ...fields })));

  return (
    <>
      <Button size="lg" variant="subtle" onClick={() => setOpen(true)}>
        Open contact
      </Button>
      <ContactPanel
        open={open}
        onClose={() => setOpen(false)}
        contact={contact}
        owner={data.owner}
        isPrimary={isPrimary}
        isLoading={isLoading}
        isPublicView={isPublicView}
        editingBy={editingBy}
        breakpoint={breakpoint}
        onSaveGeneral={(edits) => apply(edits)}
        onSavePhone={(edits) => apply(edits)}
        onDeletePhone={() => apply({ phone: undefined, phoneExtension: undefined })}
        onSaveEmail={(email) => apply({ email })}
        onDeleteEmail={() => apply({ email: undefined })}
        onSaveReminders={(kind, channels) => apply(reminderFields(kind, channels))}
        onSetPrimary={() => (fails ? false : void setPrimary(true))}
        onDelete={() => (fails ? false : setOpen(false))}
        onReactivateClient={() => {}}
      />
      <Toaster breakpoint={breakpoint} />
    </>
  );
};

const desktop = (args: Parameters<typeof Demo>[0]) => <Demo {...args} />;
const mobile = (args: Omit<Parameters<typeof Demo>[0], "breakpoint">) => (
  <DeviceFrame statusBar homeIndicator>
    <Demo {...args} breakpoint="mobile" />
  </DeviceFrame>
);

export const Desktop: Story = {
  parameters: { layout: "centered" },
  render: () => desktop({ id: "cc-wildwood-3", breakpoint: "desktop" }),
};

export const Mobile: Story = {
  parameters: { layout: "centered" },
  render: () => mobile({ id: "cc-wildwood-3" }),
};

/** The location's name under the title, and the crown: the header menu loses "Set as primary". */
export const LocationPrimary: Story = {
  name: "Location contact — primary",
  parameters: { layout: "centered" },
  render: () => desktop({ id: "lc-wildwood-downtown-1", breakpoint: "desktop" }),
};

/** An individual client — the caption's icon is `building-user`. Phone only, so the email reminders are off. */
export const IndividualClient: Story = {
  name: "Individual client",
  parameters: { layout: "centered" },
  render: () => desktop({ id: "cc-ferry-1", breakpoint: "desktop" }),
};

/** A job's own contact: no caption, no Reminders module, no "Set as primary". */
export const JobContact: Story = {
  name: "Job contact",
  parameters: { layout: "centered" },
  render: () => desktop({ record: JOB_CONTACT, owner: { kind: "job" }, breakpoint: "desktop" }),
};

/** "No Name" in the header, and the General module's warning state. */
export const NoName: Story = {
  name: "No name",
  parameters: { layout: "centered" },
  render: () => desktop({ id: "lc-wildwood-marina-1", breakpoint: "desktop" }),
};

/** Both modules warn, and every reminder switch is disabled with "Add …" captions. */
export const NoPhoneOrEmail: Story = {
  name: "No phone or email",
  parameters: { layout: "centered" },
  render: () => desktop({ id: "cc-sunset-1", breakpoint: "desktop" }),
};

/** The parent client is inactive: the Reactivate banner, and nothing can be edited. */
export const InactiveClient: Story = {
  name: "Inactive client",
  parameters: { layout: "centered" },
  render: () => desktop({ id: "lc-presidio-canteen-1", breakpoint: "desktop" }),
};

/** Someone else edits the phone number: their live avatar replaces its menu button. */
export const SomeoneIsEditing: Story = {
  name: "Someone is editing",
  parameters: { layout: "centered" },
  render: () => desktop({ id: "cc-wildwood-3", breakpoint: "desktop", editingBy: { phone: users[1] } }),
};

export const Loading: Story = {
  parameters: { layout: "centered" },
  render: () => desktop({ id: "cc-wildwood-3", breakpoint: "desktop", isLoading: true }),
};

/** Every save, delete and switch reports failure — the "Couldn't …" toasts. */
export const ActionsFail: Story = {
  name: "Actions fail",
  parameters: { layout: "centered" },
  render: () => desktop({ id: "cc-wildwood-3", breakpoint: "desktop", fails: true }),
};

// ---- the PUBLIC view (Figma 24076-21831): no menu, no editing, no Reminders.

export const PublicDesktop: Story = {
  name: "Public view — desktop",
  parameters: { layout: "centered" },
  render: () => desktop({ id: "cc-wildwood-3", breakpoint: "desktop", isPublicView: true }),
};

export const PublicMobile: Story = {
  name: "Public view — mobile",
  parameters: { layout: "centered" },
  render: () => mobile({ id: "cc-wildwood-3", isPublicView: true }),
};

// The error / offline states are SidePanel's own behavior, documented on that
// component's page — the panel only forwards `state` and `onRetry` (Daniel,
// 2026-09-29: no duplicate component states in module stories).
