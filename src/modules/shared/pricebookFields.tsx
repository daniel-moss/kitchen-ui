import { MouseEvent } from "react";

import EmptyState from "../../components/EmptyState/EmptyState";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextField from "../../components/Fields/TextField/TextField";
import Input from "../../components/Input/Input";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { PricebookSubtype } from "../../data/db/types";
import { MAX_NAME, NO_SUGGESTIONS, overLimitError } from "../Product/NewProductForm/productRules";

import { SelectPopoverList, useSelectPopover } from "./selectPopover";

// The pricebook "Shared Fields" (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "Shared Fields" 3060-14391) — the inputs every pricebook item's "Create" form
// and side-panel edit dialogs share, built once so the two can not drift.
//
// Each field documents its own rules in the same four headings: Applies when ·
// Must be filled in when · Default · Input rules. WHICH form shows a field
// comes from the one form rule (Shared Behavior → Which Fields Show, 3060-14505):
//   "Create" form  only fields the user must fill in; a required field with
//                  only one option is shown read-only, with it selected
//   "Edit" form    every field that applies, required or optional
// so the CALLER decides whether to render a field, and the field decides how.

// ---- Name (3054-8589) -------------------------------------------------------

/**
 * Name's three problems. "Enter Name" waits for Create/Save; the 50-character
 * limit and the duplicate check speak while typing ("Compares names ignoring
 * upper/lower case and trims spaces"). `ownName` is the record's current name
 * in an edit form — saving it unchanged is never a duplicate.
 */
export const nameIssues = (name: string, existingNames: string[], ownName?: string) => {
  const key = (value: string) => value.trim().toLowerCase();
  const missing = name.trim() === "";
  return {
    missing,
    tooLong: overLimitError(name, MAX_NAME),
    duplicate:
      !missing && existingNames.some((taken) => key(taken) === key(name) && (ownName == null || key(taken) !== key(ownName))),
  };
};

interface NameFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Names already taken (production checks the whole pricebook). */
  existingNames?: string[];
  /** The record's own name, in an edit form. */
  ownName?: string;
  /** The item type at the start of the duplicate error — "Labor rate". */
  itemLabel: string;
  /** Create/Save was pressed — "Enter Name" shows. */
  showErrors: boolean;
}

export function NameField({ value, onChange, existingNames = [], ownName, itemLabel, showErrors }: NameFieldProps) {
  const issues = nameIssues(value, existingNames, ownName);
  return (
    // 50 characters max, text keyboard, autocorrect and auto-capitalisation
    // off. The limit never stops the typing: over it the field turns red with
    // "60 / 50 characters".
    <Input label="Name">
      <TextField
        {...NO_SUGGESTIONS}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        isValid={!((showErrors && issues.missing) || issues.tooLong != null || issues.duplicate)}
        errorMessage={issues.tooLong ?? (issues.duplicate ? `${itemLabel} with this name already exists` : undefined)}
      />
    </Input>
  );
}

// ---- Subtype (3060-14052) ---------------------------------------------------

/**
 * Subtype's rules.
 *   Applies when           the company supports subtypes (the list is not empty)
 *   Must be filled in when the company requires subtypes and there are 2 or more
 *   Single required option shown read-only, selected — the caller pre-picks it
 */
export const subtypeRules = (subtypes: PricebookSubtype[], required: boolean) => {
  const applies = subtypes.length > 0;
  const lone = applies && required && subtypes.length === 1 ? subtypes[0] : undefined;
  return { applies, required: applies && required, lone };
};

interface SubtypeFieldProps {
  subtypes: PricebookSubtype[];
  /** The company requires a subtype (`require_subtypes`). */
  required: boolean;
  value: string | null;
  onChange: (subtypeId: string | null) => void;
  /** Create/Save was pressed — "Choose Subtype" shows. */
  showErrors: boolean;
  mobile: boolean;
}

export function SubtypeField({ subtypes, required, value, onChange, showErrors, mobile }: SubtypeFieldProps) {
  const pop = useSelectPopover(mobile);
  const rules = subtypeRules(subtypes, required);
  if (!rules.applies) return null;

  if (rules.lone)
    return (
      <Input label="Subtype" helpText="The only subtype available">
        <SelectField value={rules.lone.name} readOnly />
      </Input>
    );

  const chosen = subtypes.find((row) => row.id === value);
  return (
    <>
      <Input label="Subtype" labelCondition={rules.required ? undefined : "optional"}>
        <SelectField
          value={chosen?.name}
          open={pop.open}
          onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
          isValid={!(showErrors && rules.required && value == null)}
        />
      </Input>

      {/* Single-select, "sorted by name from A to Z". */}
      <SelectPopoverList
        pop={pop}
        mobile={mobile}
        title="Subtype"
        searchable
        searchPlaceholder="Subtype..."
        noResultsState={<EmptyState caption="No subtypes match" />}
      >
        <SelectListItemGroup>
          {/* "Only exists if subtype is NOT required. It allows the user to
              clear the selection. Always on top of the list." */}
          {!rules.required && (
            <SelectListItem
              label="No subtype"
              selected={value == null}
              onClick={() => {
                onChange(null);
                pop.close();
              }}
            />
          )}
          {[...subtypes]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((subtype) => (
              <SelectListItem
                key={subtype.id}
                label={subtype.name}
                selected={subtype.id === value}
                onClick={() => {
                  onChange(subtype.id);
                  pop.close();
                }}
              />
            ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
}
