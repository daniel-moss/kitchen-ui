import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from "react";

import Badge from "../../components/Badge/Badge";
import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import TextArea from "../../components/Fields/TextArea/TextArea";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextField from "../../components/Fields/TextField/TextField";
import FormModule from "../../components/FormModule/FormModule";
import FormModuleGroup from "../../components/FormModule/FormModuleGroup";
import { Icon } from "../../components/Icon/Icon";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectList from "../../components/SelectList/SelectList";
import SelectListHeader from "../../components/SelectList/SelectListHeader";
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
// The address flow follows the "Fill-in Address" doc (updated 2026-08-03):
// the Street address field suggests (mock) Google addresses on EVERY focus —
// desktop in a list anchored under it, mobile in a drawer whose search is the
// field itself. Picking one — or "Enter manually" in the list's no-results
// state — reveals the remaining fields.
// Labels are a multi-select SelectField with the selected labels as
// dismissible badges below it — the New-equipment form's pattern, chosen over
// the chips-row trigger and over a list dialog (Daniel, 2026-08-03). The field
// opens the labels list anchored under it (mobile: drawer), picks apply live,
// and the chips row is frozen while the list is open (see below).
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

  // The street suggestions (Figma "Fill-in Address", updated 2026-08-03):
  // DESKTOP = a list anchored under the field; MOBILE = a drawer titled
  // "Street address" whose SEARCH is the street input (the field itself only
  // opens the drawer, so the keyboard belongs to one input at a time).
  const addressPop = useSelectPopover(false);
  const [addressDrawerOpen, setAddressDrawerOpen] = useState(false);
  // The labels list is anchored UNDER the field (desktop) / a drawer (mobile).
  const labelsPop = useSelectPopover(!isDesktop);
  useEffect(() => {
    if (open) return;
    addressPop.close();
    setAddressDrawerOpen(false);
    labelsPop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const streetRef = useRef<HTMLDivElement>(null);

  const matches =
    street.trim() === ""
      ? []
      : ADDRESS_SUGGESTIONS.filter((s) => suggestionLabel(s).toLowerCase().includes(street.trim().toLowerCase()));
  // With text but nothing matching, the list shows the "no results" state with
  // its "Enter manually" way out (the button used to sit under the field).
  const addressNoResults = street.trim() !== "" && matches.length === 0;

  // Suggestions come back on EVERY focus, also after the address was expanded
  // (Daniel, 2026-08-03) — the street may still be edited.
  const openAddressList = () => {
    if (!isDesktop) {
      setAddressDrawerOpen(true);
      return;
    }
    if (street.trim() !== "" && streetRef.current != null) addressPop.openAt(streetRef.current);
  };

  const onStreetChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStreet(e.target.value);
    if (!isDesktop) return; // mobile types in the drawer's search
    if (e.target.value.trim() !== "" && streetRef.current != null) addressPop.openAt(streetRef.current);
    else addressPop.close();
  };

  const closeAddressList = () => {
    addressPop.close();
    setAddressDrawerOpen(false);
  };

  const pickSuggestion = (s: AddressSuggestion) => {
    setStreet(s.street);
    setCity(s.city);
    setStateProv(s.state);
    setPostal(s.postal);
    setExpanded(true);
    closeAddressList();
  };

  /** The "no results" way out: reveal the manual fields, keep what was typed. */
  const enterManually = () => {
    setExpanded(true);
    closeAddressList();
  };

  // Picks apply LIVE (the field's counter updates as you tick), but the CHIPS
  // row follows the shared layout-freeze rule — it syncs when the list closes,
  // so the growing dialog never moves the field out from under the open card.
  const shownLabels = labelsPop.freeze(labels);

  const openLabels = (e: MouseEvent<HTMLDivElement>) => labelsPop.toggle(e.currentTarget);

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
              {/* Mobile: the field only OPENS the drawer — the drawer's search
                  is the input, so the keyboard never serves two inputs. */}
              <TextField
                value={street}
                onChange={onStreetChange}
                isValid={!(showErrors && missingStreet)}
                onFocus={(e) => {
                  if (!isDesktop) e.currentTarget.blur();
                  openAddressList();
                }}
                // Desktop: the list belongs to the focused field — leaving it
                // closes the list (Daniel, 2026-08-03). Focus moving INTO the
                // card (an option, or "Enter manually") is not leaving: the
                // options carry tabIndex, so they are the blur's relatedTarget.
                onBlur={(e) => {
                  if (!isDesktop) return;
                  const next = e.relatedTarget as Node | null;
                  if (next != null && addressPop.cardRef.current?.contains(next)) return;
                  addressPop.close();
                }}
                onClick={() => {
                  if (!isDesktop && !addressDrawerOpen) setAddressDrawerOpen(true);
                }}
              />
            </Input>
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
          {/* The multi-select field with its counter, and the selected labels
              as dismissible badges 12px below it. */}
          <div className={styles.labelBlock}>
            <SelectField
              multiSelect
              count={labels.length}
              value={labels.length === 1 ? labels[0] : undefined}
              multiSelectLabel="Labels selected"
              onClearSelection={() => setLabels([])}
              open={labelsPop.open}
              onClick={openLabels}
            />
            {shownLabels.length > 0 && (
              <div className={styles.chips}>
                {shownLabels.map((l) => (
                  <Badge key={l} size="lg" isDismissable onDismiss={() => toggleLabel(l)}>
                    {l}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </FormModule>

        <FormModule title="Notes" titleCondition="optional" titleHintContent={NOTES_HINT}>
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} clearable onClear={() => setNotes("")} />
        </FormModule>
      </FormModuleGroup>

      {/* DESKTOP — street-address suggestions (mock Google) anchored under the
          field. Single-select: picking closes and expands the address fields.
          Nothing matching → the "no results" state with "Enter manually". */}
      <SelectPopoverList
        pop={addressPop}
        mobile={false}
        state={addressNoResults ? "noResults" : "default"}
        noResultsCaption="Try a different search or enter address manually"
        noResultsAction={{ label: "Enter manually", icon: "pen", onClick: enterManually }}
      >
        <SelectListItemGroup>
          {matches.map((s) => (
            <SelectListItem key={suggestionLabel(s)} label={suggestionLabel(s)} onClick={() => pickSuggestion(s)} />
          ))}
          <div className={styles.googleRow}>Powered by Google</div>
        </SelectListItemGroup>
      </SelectPopoverList>

      {/* MOBILE — the same suggestions in a drawer whose search IS the street
          input (Figma 11829-421 / 11829-5435 / 11829-5647): its value is the
          street field's, so opening it keeps what was typed and editing there
          edits the field. Empty search = a caption-only state. */}
      <SelectList
        variant="drawer"
        breakpoint="mobile"
        title="Street address"
        open={addressDrawerOpen}
        onClose={() => setAddressDrawerOpen(false)}
        autoFocusSearch
        header={
          <SelectListHeader
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            onClear={() => setStreet("")}
            placeholder="Search by street address..."
          />
        }
        state={street.trim() === "" ? "empty" : addressNoResults ? "noResults" : "default"}
        emptyState={{ caption: "Start typing street address" }}
        noResultsCaption="Try a different search or enter address manually"
        noResultsAction={{ label: "Enter manually", icon: "pen", onClick: enterManually }}
      >
        <SelectListItemGroup>
          {matches.map((s) => (
            <SelectListItem key={suggestionLabel(s)} label={suggestionLabel(s)} onClick={() => pickSuggestion(s)} />
          ))}
          <div className={styles.googleRow}>Powered by Google</div>
        </SelectListItemGroup>
      </SelectList>

      {/* The Labels multi-select list — anchored under the field on desktop,
          a drawer on mobile. Picks apply live. */}
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
