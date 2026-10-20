import { Client, ContactRecord, ContactReminders, Location } from "../../data/db";
import { User } from "../../data/users";

/** The contact the panel shows — any saved or job-only contact. */
export type PanelContact = ContactRecord & ContactReminders;

/**
 * Who the contact BELONGS to. It decides the header caption, whether the
 * contact can be a primary one, and whether it has reminders:
 * - "client"   — a client's contact (production `ExternalClientContact`);
 * - "location" — a service location's contact (`ServiceLocationContact`);
 * - "job"      — a job's own one-off contact. Production does not save it as a
 *                contact at all (plain fields on the job), so it has no
 *                reminders and cannot be a primary contact (Daniel, 2026-10-20).
 */
export type ContactOwner =
  | { kind: "client"; client: Client }
  | { kind: "location"; location: Location; client: Client }
  | { kind: "job" };

/** What the "General" form hands back. */
export interface ContactGeneralEdits {
  name: string;
  position?: string;
}

/** What the "Phone number" form hands back. */
export interface ContactPhoneEdits {
  phone: string;
  phoneExtension?: string;
}

export type ReminderKind = "estimate" | "invoice";

/** One reminder's two channels. */
export interface ReminderChannels {
  email: boolean;
  sms: boolean;
}

type Result = void | boolean | Promise<void | boolean>;

/**
 * What the panel can DO. Every handler may return `false` (or a Promise of it)
 * to report that the action FAILED — the panel then shows the designed error
 * toast and a form stays open with its values intact. Anything else, a missing
 * handler included, counts as success (the Warranty panel's contract).
 */
export interface ContactPanelActions {
  onSaveGeneral?: (edits: ContactGeneralEdits) => Result;
  onSavePhone?: (edits: ContactPhoneEdits) => Result;
  onDeletePhone?: () => Result;
  onSaveEmail?: (email: string) => Result;
  onDeleteEmail?: () => Result;
  /** A reminder toggle was flipped — saved at once, there is no form. */
  onSaveReminders?: (kind: ReminderKind, channels: ReminderChannels) => Result;
  /** "Set as primary" from the header menu (client and location contacts only). */
  onSetPrimary?: () => Result;
  /**
   * Delete, after the "Delete contact?" Prompt is confirmed. The panel shows the
   * toast; the handler removes the record and decides what happens next
   * (usually: close the panel).
   */
  onDelete?: () => Result;
  /** The inactive-client banner's "Reactivate" link — opens the client's Reactivate form. */
  onReactivateClient?: () => void;
}

export interface ContactPanelProps extends ContactPanelActions {
  /** Controls the open/close animation and mounting, like SidePanel. */
  open: boolean;
  /** Called on any dismissal: the close button, the scrim, or Escape. */
  onClose: () => void;

  /** The contact this panel shows. The caller stays the source of truth. */
  contact: PanelContact;
  /** Who the contact belongs to — see `ContactOwner`. */
  owner: ContactOwner;
  /**
   * The contact is its client's or location's PRIMARY contact: the avatar gets
   * the crown and the header menu drops "Set as primary". Ignored for a job
   * contact. Default false.
   */
  isPrimary?: boolean;

  /** A link inside a panel never opens a second panel — the caller passes this to go back. */
  onBack?: () => void;

  /**
   * Someone else is editing a value right now (Figma "Editing In Progress"):
   * that row's menu button becomes their live avatar with a "[Name S.] is
   * editing" tooltip, so the value cannot be edited or deleted. Copy and
   * Call / Send email stay.
   */
  editingBy?: { phone?: User; email?: User };

  // ---- view ----

  /**
   * The PUBLIC view — what the client sees (Figma "Public View", 24076-21831):
   * no header menu, no editing anywhere, no warning states, and no Reminders
   * module. Copy, Call and Send email stay. Default false.
   */
  isPublicView?: boolean;

  // ---- state ----

  /**
   * Loading (Figma "Loading", 23815-13132): the module bodies render skeletons
   * and every action button is hidden. The header keeps the real title —
   * SidePanel takes a string, so the node's title skeleton is not buildable
   * (the Warranty and Equipment panels behave the same way).
   */
  isLoading?: boolean;
  /** Body state, passed straight to SidePanel. */
  state?: "content" | "error" | "offline";
  onRetry?: () => void;

  /** Presentation: "auto" (default) picks desktop ≥ 1024px, else mobile. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
