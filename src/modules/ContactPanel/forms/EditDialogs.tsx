import { ReactNode, useEffect, useState } from "react";

import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import TextField from "../../../components/Fields/TextField/TextField";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import { toast } from "../../../components/Toast/Toaster";
import { isValidEmail, normalizePhone } from "../contactData";
import { ContactGeneralEdits, ContactPhoneEdits, PanelContact } from "../ContactPanel.types";

// The panel's three edit forms — each a default Dialog titled after its MODULE
// ("General", "Phone number", "Email address"), holding only that module's
// fields (Figma Edit Form sections 17002-51402, 17013-16470, 17015-19026). No
// FormModule: the forms have no sections (the Equipment panel's rule).
//
// Save: "1. Saves the changes. 2. Triggers the Toast." — '"<Module>" module
// updated' / 'Couldn't update "<Module>" module'. The save handler may return
// false; the form then stays open with the values intact.

type SaveResult = void | boolean | Promise<void | boolean>;

interface ShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  dirty: boolean;
  onSave: () => void;
  breakpoint: "auto" | "desktop" | "mobile";
  children: ReactNode;
}

function FormShell({ open, onClose, title, dirty, onSave, breakpoint, children }: ShellProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      breakpoint={breakpoint}
      confirmOnDismiss={dirty}
      footer={
        <PopoverFooter
          slotLeft={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={onSave}>
            Save
          </Button>
        </PopoverFooter>
      }
    >
      <>{children}</>
    </Dialog>
  );
}

/** Runs a save and shows the module's toast; true when it went through. */
async function saveWithToast(module: string, run: () => SaveResult): Promise<boolean> {
  if ((await run()) === false) {
    toast({
      type: "error",
      variant: "detailed",
      title: `Couldn't update "${module}" module`,
      caption: "Something went wrong. Please try again.",
    });
    return false;
  }
  toast({ type: "success", title: `"${module}" module updated` });
  return true;
}

interface FormProps<T> {
  open: boolean;
  onClose: () => void;
  contact: PanelContact;
  onSave: (edits: T) => SaveResult;
  breakpoint?: "auto" | "desktop" | "mobile";
}

// ---- General (23815-13516): Name (required — "Enter Name"), Position (optional)

export function EditGeneralDialog({ open, onClose, contact, onSave, breakpoint = "auto" }: FormProps<ContactGeneralEdits>) {
  const [name, setName] = useState(contact.name ?? "");
  const [position, setPosition] = useState(contact.position ?? "");
  const [showErrors, setShowErrors] = useState(false);

  // Re-read the record every time the form opens.
  useEffect(() => {
    if (!open) return;
    setName(contact.name ?? "");
    setPosition(contact.position ?? "");
    setShowErrors(false);
  }, [open, contact]);

  const missingName = name.trim() === "";
  const dirty = name !== (contact.name ?? "") || position !== (contact.position ?? "");

  const save = async () => {
    if (missingName) {
      setShowErrors(true);
      return;
    }
    const edits = { name: name.trim(), position: position.trim() === "" ? undefined : position.trim() };
    if (await saveWithToast("General", () => onSave(edits))) onClose();
  };

  return (
    <FormShell open={open} onClose={onClose} title="General" dirty={dirty} onSave={save} breakpoint={breakpoint}>
      <Input label="Name">
        <TextField value={name} onChange={(event) => setName(event.target.value)} isValid={!(showErrors && missingName)} />
      </Input>
      <Input label="Position" labelCondition="optional">
        <TextField value={position} onChange={(event) => setPosition(event.target.value)} />
      </Input>
    </FormShell>
  );
}

// ---- Phone number (23818-6273): the number (required; "Enter Phone number" /
// "Invalid Phone number", Error Messages 23818-6672) and the Extension (optional).

export function EditPhoneDialog({ open, onClose, contact, onSave, breakpoint = "auto" }: FormProps<ContactPhoneEdits>) {
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [extension, setExtension] = useState(contact.phoneExtension ?? "");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPhone(contact.phone ?? "");
    setExtension(contact.phoneExtension ?? "");
    setShowErrors(false);
  }, [open, contact]);

  const missing = phone.trim() === "";
  const normalized = normalizePhone(phone);
  const dirty = phone !== (contact.phone ?? "") || extension !== (contact.phoneExtension ?? "");

  const save = async () => {
    if (missing || normalized == null) {
      setShowErrors(true);
      return;
    }
    const edits = { phone: normalized, phoneExtension: extension.trim() === "" ? undefined : extension.trim() };
    if (await saveWithToast("Phone number", () => onSave(edits))) onClose();
  };

  return (
    <FormShell open={open} onClose={onClose} title="Phone number" dirty={dirty} onSave={save} breakpoint={breakpoint}>
      <Input label="Phone number">
        <TextField
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          keyboard="tel"
          isValid={!(showErrors && (missing || normalized == null))}
          // Empty → the default "Enter Phone number"; filled but wrong → the
          // node's own copy.
          errorMessage={missing ? undefined : "Invalid Phone number"}
        />
      </Input>
      <Input label="Extension" labelCondition="optional">
        <TextField value={extension} onChange={(event) => setExtension(event.target.value)} keyboard="numeric" />
      </Input>
    </FormShell>
  );
}

// ---- Email address (23818-7567): required; "Enter Email address" / "Invalid
// Email address" (Error Messages 23818-7572).

export function EditEmailDialog({ open, onClose, contact, onSave, breakpoint = "auto" }: FormProps<string>) {
  const [email, setEmail] = useState(contact.email ?? "");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail(contact.email ?? "");
    setShowErrors(false);
  }, [open, contact]);

  const missing = email.trim() === "";
  const valid = isValidEmail(email);
  const dirty = email !== (contact.email ?? "");

  const save = async () => {
    if (missing || !valid) {
      setShowErrors(true);
      return;
    }
    if (await saveWithToast("Email address", () => onSave(email.trim()))) onClose();
  };

  return (
    <FormShell open={open} onClose={onClose} title="Email address" dirty={dirty} onSave={save} breakpoint={breakpoint}>
      <Input label="Email address">
        <TextField
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          keyboard="email"
          isValid={!(showErrors && (missing || !valid))}
          errorMessage={missing ? undefined : "Invalid Email address"}
        />
      </Input>
    </FormShell>
  );
}
