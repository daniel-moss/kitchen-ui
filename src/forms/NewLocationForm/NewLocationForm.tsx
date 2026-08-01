import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from "react";

import Badge from "../../components/Badge/Badge";
import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import TextArea from "../../components/Fields/TextArea/TextArea";
import TextField from "../../components/Fields/TextField/TextField";
import FormModule from "../../components/FormModule/FormModule";
import FormModuleGroup from "../../components/FormModule/FormModuleGroup";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import useIsDesktop from "../../hooks/useIsDesktop";
import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";
import { AddressSuggestion, ADDRESS_SUGGESTIONS, LABEL_POOL, suggestionLabel } from "./data";
import { NewLocationFormProps } from "./NewLocationForm.types";

import styles from "./NewLocationForm.module.scss";

// The Notes hint copy (Figma 25809:7275).
const NOTES_HINT =
  "Any additional details about this location. Details about a particular job should not be entered here.";

// NewLocationForm — the reusable "New location" form (Figma 23805-13764):
// a Dialog titled "New location" with the owning client in the header caption,
// three FormModules (Service address / Labels / Notes) and a Create footer.
// The address flow follows the "Fill-in Address" doc: typing in Street address
// suggests (mock) Google addresses in an anchored list; picking one — or
// "Enter manually" when nothing matches — reveals the remaining fields.
// Labels are a chips row: empty = a ghost "Add labels" Button; with badges =
// a plus IconButton at the row START, then the badges. The trigger opens a
// multi-select list to its LEFT (mobile: drawer) with create-from-search;
// while the list is open the chips row is FROZEN (badges sync on close), and
// the list itself is FIXED where it opened — the form never moves under it.
export default function NewLocationForm({
  open,
  onClose,
  client,
  onCreated,
  breakpoint = "auto",
}: NewLocationFormProps) {
  const isDesktop = useIsDesktop(breakpoint);

  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [suite, setSuite] = useState("");
  const [city, setCity] = useState("");
  const [stateProv, setStateProv] = useState("");
  const [postal, setPostal] = useState("");
  // The address fields beyond Street show after a suggestion is picked or
  // "Enter manually" — the doc's collapsed → expanded flow.
  const [expanded, setExpanded] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [labelPool, setLabelPool] = useState<string[]>(LABEL_POOL);
  const [notes, setNotes] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  // Fresh form every open.
  useEffect(() => {
    if (!open) return;
    setName("");
    setStreet("");
    setSuite("");
    setCity("");
    setStateProv("");
    setPostal("");
    setExpanded(false);
    setLabels([]);
    setLabelPool(LABEL_POOL);
    setNotes("");
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // The street suggestions are an AUTOCOMPLETE — anchored under the field on
  // BOTH breakpoints (a drawer would cover the field being typed in).
  const addressPop = useSelectPopover(false);
  const labelsPop = useSelectPopover(!isDesktop, "left");
  useEffect(() => {
    if (open) return;
    addressPop.close();
    labelsPop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const streetRef = useRef<HTMLDivElement>(null);

  const matches =
    street.trim() === ""
      ? []
      : ADDRESS_SUGGESTIONS.filter((s) => suggestionLabel(s).toLowerCase().includes(street.trim().toLowerCase()));

  const onStreetChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStreet(e.target.value);
    if (expanded) return; // expanded = plain text field, no suggestions
    const q = e.target.value.trim();
    const hasMatches =
      q !== "" && ADDRESS_SUGGESTIONS.some((s) => suggestionLabel(s).toLowerCase().includes(q.toLowerCase()));
    if (hasMatches && streetRef.current != null) addressPop.openAt(streetRef.current);
    else addressPop.close();
  };

  const pickSuggestion = (s: AddressSuggestion) => {
    setStreet(s.street);
    setCity(s.city);
    setStateProv(s.state);
    setPostal(s.postal);
    setExpanded(true);
    addressPop.close();
  };

  // The layout-freeze rule (Daniel, 2026-07-29): while the labels list is
  // open, the chips row shows the selection AS IT WAS ON OPEN — the list's
  // checkmarks are the live feedback, and the form's layout does not move
  // under the open list (including the trigger's Button↔IconButton form).
  // The badges sync when the list closes.
  const [chipsSnapshot, setChipsSnapshot] = useState<string[]>([]);
  const shownLabels = labelsPop.open ? chipsSnapshot : labels;

  const openLabels = (e: MouseEvent<HTMLButtonElement>) => {
    if (!labelsPop.open) setChipsSnapshot(labels);
    labelsPop.toggle(e.currentTarget);
  };

  const toggleLabel = (label: string) =>
    setLabels((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));

  // Create-from-search (Figma "Create new label"): the new label joins the
  // pool AND becomes selected; the list returns to its full state.
  const createLabel = (query: string) => {
    if (query === "" || labelPool.includes(query)) return;
    setLabelPool((prev) => [...prev, query]);
    setLabels((prev) => [...prev, query]);
  };

  // Required: Street address always; City / State / Postal once expanded
  // ("Missing Value Errors" doc — Name, Suite, Labels, Notes are optional).
  const missingStreet = street.trim() === "";
  const missingCity = expanded && city.trim() === "";
  const missingState = expanded && stateProv.trim() === "";
  const missingPostal = expanded && postal.trim() === "";

  const dirty =
    name !== "" || street !== "" || suite !== "" || city !== "" || stateProv !== "" || postal !== "" ||
    labels.length > 0 || notes !== "";

  const create = () => {
    if (missingStreet || missingCity || missingState || missingPostal) {
      setShowErrors(true);
      return;
    }
    onCreated?.({
      name: name.trim(),
      street: street.trim(),
      suite: suite.trim(),
      city: city.trim(),
      state: stateProv.trim(),
      postal: postal.trim(),
      labels,
      notes: notes.trim(),
    });
    // The "Preview" CTA opens the Location side panel — a separate design,
    // display-only for now.
    toast({ type: "success", title: "Location created", cta: { children: "Preview" } });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New location"
      caption={client}
      captionLeftSlot={<Icon icon="building" pack="regular" size={14} />}
      breakpoint={breakpoint}
      confirmOnDismiss={dirty}
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
      <FormModuleGroup>
        <FormModule title="Service address">
          <Input label="Name" labelCondition="optional">
            <TextField value={name} onChange={(e) => setName(e.target.value)} />
          </Input>
          <div className={styles.streetBlock} ref={streetRef}>
            <Input label="Street address">
              <TextField value={street} onChange={onStreetChange} isValid={!(showErrors && missingStreet)} />
            </Input>
            {/* No matching addresses → manual entry (Figma 11804:2346). */}
            {!expanded && street.trim() !== "" && matches.length === 0 && (
              <Button size="lg" variant="ghost" isFullWidth leftIcon="pen" onClick={() => setExpanded(true)}>
                Enter manually
              </Button>
            )}
          </div>
          {expanded && (
            <>
              <Input label="Suite, unit, etc." labelCondition="optional">
                <TextField value={suite} onChange={(e) => setSuite(e.target.value)} />
              </Input>
              <Input label="City">
                <TextField value={city} onChange={(e) => setCity(e.target.value)} isValid={!(showErrors && missingCity)} />
              </Input>
              <div className={styles.row2}>
                <Input label="State / Province">
                  <TextField
                    value={stateProv}
                    onChange={(e) => setStateProv(e.target.value)}
                    isValid={!(showErrors && missingState)}
                  />
                </Input>
                <Input label="Postal code">
                  <TextField
                    value={postal}
                    onChange={(e) => setPostal(e.target.value)}
                    isValid={!(showErrors && missingPostal)}
                  />
                </Input>
              </div>
            </>
          )}
        </FormModule>

        <FormModule title="Labels" titleCondition="optional">
          {/* Chips row (Daniel, 2026-07-29): empty = a ghost "Add labels"
              Button; with badges = a plus IconButton FIRST, then the badges.
              Rendered from the frozen snapshot while the list is open, synced
              on close (see above). */}
          <div className={styles.chips}>
            {shownLabels.length === 0 ? (
              <Button size="md" variant="ghost" leftIcon="plus" isPressed={labelsPop.open} onClick={openLabels}>
                Add labels
              </Button>
            ) : (
              <>
                <IconButton
                  icon="plus"
                  variant="ghost"
                  size="md"
                  aria-label="Add labels"
                  isPressed={labelsPop.open}
                  noDebounce
                  onClick={openLabels}
                />
                {shownLabels.map((l) => (
                  <Badge key={l} size="lg" isDismissable onDismiss={() => toggleLabel(l)}>
                    {l}
                  </Badge>
                ))}
              </>
            )}
          </div>
        </FormModule>

        <FormModule title="Notes" titleCondition="optional" titleHintContent={NOTES_HINT}>
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} clearable onClear={() => setNotes("")} />
        </FormModule>
      </FormModuleGroup>

      {/* Street-address suggestions (mock Google). Single-select: picking
          closes and expands the address fields. */}
      <SelectPopoverList pop={addressPop} mobile={false}>
        <SelectListItemGroup>
          {matches.map((s) => (
            <SelectListItem key={suggestionLabel(s)} label={suggestionLabel(s)} onClick={() => pickSuggestion(s)} />
          ))}
          <div className={styles.googleRow}>Powered by Google</div>
        </SelectListItemGroup>
      </SelectPopoverList>

      {/* The Labels multi-select list — inline card / mobile drawer. */}
      <SelectPopoverList
        pop={labelsPop}
        mobile={!isDesktop}
        title="Labels"
        multiSelect
        searchable
        searchPlaceholder="Search by label name..."
        createFromSearch={{ label: "Create new label:", onCreate: createLabel }}
        state={labelPool.length === 0 ? "empty" : "default"}
        emptyState={{ icon: "tag", title: "No labels here yet", caption: "Start typing to create a new label" }}
      >
        <SelectListItemGroup>
          {labelPool.map((l) => (
            <SelectListItem
              key={l}
              label={l}
              select="multi"
              selected={labels.includes(l)}
              onClick={() => toggleLabel(l)}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </Dialog>
  );
}
