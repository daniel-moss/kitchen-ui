import { ChangeEvent, useEffect, useState } from "react";

import Button from "../../../components/Button/Button";
import CheckboxItem from "../../../components/Checkbox/CheckboxItem";
import Dialog from "../../../components/Dialog/Dialog";
import TextField from "../../../components/Fields/TextField/TextField";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import { toast } from "../../../components/Toast/Toaster";
import { JobSource } from "../../../data/db/types";
import useIsDesktop from "../../../hooks/useIsDesktop";

import styles from "./NewSourceForm.module.scss";

// The "New source" form (Figma 17181-58583), opened from the Source list's
// "Add source". A created source joins the list and is selected by the
// caller. The abbreviation only accepts letters, auto-uppercases, and stops
// at 5 characters (the dev notes).

const ABBR_HINT =
  "The abbreviation is used in the PDF and accounting integration where space is limited. " +
  'For example, the source name "ServiceChannel" could be abbreviated to "SC".';

export interface NewSourceFormProps {
  open: boolean;
  /** Any dismissal AND after Create — the caller flips `open`. */
  onClose: () => void;
  /** Called after Create; the caller adds the source to the list and selects it. */
  onCreated?: (source: JobSource) => void;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function NewSourceForm({ open, onClose, onCreated, breakpoint = "auto" }: NewSourceFormProps) {
  const isDesktop = useIsDesktop(breakpoint);
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [requiresId, setRequiresId] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setAbbreviation("");
      setRequiresId(false);
      setShowErrors(false);
    }
  }, [open]);

  const handleAbbreviation = (event: ChangeEvent<HTMLInputElement>) => {
    // Letters only, auto-uppercased, capped at 5 (the dev notes).
    setAbbreviation(event.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 5));
  };

  const create = () => {
    if (name.trim() === "") {
      setShowErrors(true);
      return;
    }
    const trimmed = name.trim();
    const abbr = abbreviation || null;
    onCreated?.({
      id: `created-${Date.now()}`,
      name: trimmed,
      prefix: abbr,
      requiresId,
    });
    toast({
      type: "success",
      variant: "detailed",
      title: "Job source created",
      caption: abbr ? `${trimmed} (${abbr})` : trimmed,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New source"
      breakpoint={breakpoint}
      confirmOnDismiss={name.trim() !== "" || abbreviation !== "" || requiresId}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={create}>
            Create
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        {/* Desktop: Name + fixed-width Abbreviation share the row (the
            2026-09-07 layout, 368 + 192); mobile stacks them. */}
        <div className={isDesktop ? styles.nameRow : styles.form}>
          <Input label="Name" helpText="The origin of the job" className={styles.name}>
            <TextField
              value={name}
              onChange={(event) => setName(event.target.value)}
              isValid={!(showErrors && name.trim() === "")}
            />
          </Input>
          <Input
            label="Abbreviation"
            labelCondition="optional"
            labelHintContent={ABBR_HINT}
            helpText="Max 5 characters"
            className={isDesktop ? styles.abbreviation : undefined}
          >
            <TextField value={abbreviation} onChange={handleAbbreviation} />
          </Input>
        </div>
        <CheckboxItem
          variant="card"
          label="Require source ID"
          caption="Jobs using this source will require a source ID"
          checked={requiresId}
          onChange={(event) => setRequiresId(event.target.checked)}
        />
      </div>
    </Dialog>
  );
}
