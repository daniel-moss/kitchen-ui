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
//   - A row reads "4010  ·  Service Revenue", or the name alone.
//   - Required: "Choose [label]" once Create was pressed.
//   - `defaultHelpText` is the "Pre-selected based on company default account"
//     line; it shows only while the field still holds the default it opened
//     with ("Hides when a user switches to another account").
//
// NOTE the Labor rate form writes the same accounts as "4010: Service
// Revenue" — this form follows its own Figma, which uses the text separator.

export const accountLabel = (account: QuickbooksAccount) =>
  account.number ? `${account.number}${TEXT_SEPARATOR}${account.name}` : account.name;

const byAccount = (a: QuickbooksAccount, b: QuickbooksAccount) => {
  if (a.number && b.number) return a.number.localeCompare(b.number, undefined, { numeric: true });
  if (a.number) return -1;
  if (b.number) return 1;
  return a.name.localeCompare(b.name);
};

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
          {[...accounts].sort(byAccount).map((account) => (
            <SelectListItem
              key={account.id}
              label={accountLabel(account)}
              searchText={`${account.number ?? ""} ${account.name}`}
              selected={account.id === value}
              onClick={() => {
                onChange(account.id);
                pop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
}
