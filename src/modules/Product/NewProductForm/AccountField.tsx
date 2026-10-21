import { MouseEvent } from "react";

import EmptyState from "../../../components/EmptyState/EmptyState";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import Input from "../../../components/Input/Input";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import { QuickbooksAccount } from "../../../data/db/types";
import { TEXT_SEPARATOR } from "../../../utils/textSeparator";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

// One QuickBooks account field of the Accounting module (Figma 4191-28154) —
// Revenue account, Cost of goods account and Inventory asset account are the
// same field over three account lists:
//
//   - The list: search "Account...", numbered accounts first by number, then
//     the unnumbered ones A → Z; "No accounts match" when the search finds
//     nothing.
//   - A row reads "4010  ·  Service Revenue", or the name alone. A sub-account
//     carries its DIRECT parent as the caption, written the same way (Figma
//     3054-11652; Daniel 2026-10-21: the list stays flat, a parent is an
//     ordinary pickable row, the caption is the only link, searching the
//     parent's name finds its sub-accounts, and the closed field shows the
//     picked account alone).
//   - Required: "Choose [label]" once Create was pressed.
//   - `defaultHelpText` is the "Pre-selected based on company default account"
//     line; it shows only while the field still holds the default it opened
//     with ("Hides when a user switches to another account").
//   - ONE account on the list: it IS the value, shown read-only with "The
//     only account synced from QuickBooks" ("A required field with only one
//     option is shown read-only, with that option selected" — Shared
//     Behavior 3060-14505). The form reads the value the same way: when
//     `accounts` holds one row, that row's id is what it saves.
//
// Shared by every pricebook "Create" form (Figma "Shared Fields" → Revenue
// Account 3054-11652) — the product form's three account lists and the labor
// rate's one.

export const accountLabel = (account: QuickbooksAccount) =>
  account.number ? `${account.number}${TEXT_SEPARATOR}${account.name}` : account.name;

// "Sorted as text from A to Z. 4010 comes before 900." — the number is
// compared as TEXT, not by value (Daniel, 2026-10-21; production orders the
// same way). Digits come before letters, so numbered accounts lead and the
// unnumbered ones follow by name.
const sortKey = (account: QuickbooksAccount) => (account.number ? `${account.number} ${account.name}` : account.name);
const byAccount = (a: QuickbooksAccount, b: QuickbooksAccount) => sortKey(a).localeCompare(sortKey(b));

/** The account a form saves: the only one when the list has one, else the pick. */
export const accountValue = (accounts: QuickbooksAccount[], value: string | null) =>
  accounts.length === 1 ? accounts[0].id : value;

export interface AccountFieldProps {
  label: string;
  accounts: QuickbooksAccount[];
  value: string | null;
  onChange: (accountId: string) => void;
  /** Shown while the value is still `defaultId`. */
  defaultId?: string;
  showErrors: boolean;
  mobile: boolean;
}

export default function AccountField({ label, accounts, value, onChange, defaultId, showErrors, mobile }: AccountFieldProps) {
  const pop = useSelectPopover(mobile);
  const only = accounts.length === 1 ? accounts[0] : undefined;
  const parentOf = (account: QuickbooksAccount) =>
    account.parentId == null ? undefined : accounts.find((row) => row.id === account.parentId);

  if (only)
    return (
      <Input label={label} helpText="The only account synced from QuickBooks">
        <SelectField value={accountLabel(only)} readOnly />
      </Input>
    );

  const chosen = accounts.find((account) => account.id === value);
  const onDefault = defaultId != null && value === defaultId;

  return (
    <>
      <Input label={label} helpText={onDefault ? "Pre-selected based on company default account" : undefined}>
        <SelectField
          value={chosen ? accountLabel(chosen) : undefined}
          open={pop.open}
          onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
          isValid={!(showErrors && chosen == null)}
          errorMessage={`Choose ${label}`}
        />
      </Input>

      <SelectPopoverList
        pop={pop}
        mobile={mobile}
        title={label}
        searchable
        searchPlaceholder="Account..."
        noResultsState={<EmptyState caption="No accounts match" />}
      >
        <SelectListItemGroup>
          {[...accounts].sort(byAccount).map((account) => {
            const parent = parentOf(account);
            return (
              <SelectListItem
                key={account.id}
                label={accountLabel(account)}
                caption={parent ? accountLabel(parent) : undefined}
                searchText={`${account.number ?? ""} ${account.name} ${parent ? `${parent.number ?? ""} ${parent.name}` : ""}`}
                selected={account.id === value}
                onClick={() => {
                  onChange(account.id);
                  pop.close();
                }}
              />
            );
          })}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
}
