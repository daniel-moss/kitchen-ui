import { MouseEvent, ReactNode } from "react";

import SelectField from "../components/Fields/SelectField/SelectField";
import Input from "../components/Input/Input";
import SelectListItem from "../components/SelectList/SelectListItem";
import SelectListItemGroup from "../components/SelectList/SelectListItemGroup";
import { SelectPopoverList, useSelectPopover } from "../modules/shared/selectPopover";

// Moved out of DemoSettingsPage.tsx (2026-11-14) so the sub-status settings
// can use it too.

/** A SelectField over a short list of choices — the Demo's standard select. */
export default function ChoiceField<T extends string>({
  label,
  helpText,
  value,
  options,
  onChange,
  mobile,
  noneLabel,
}: {
  label: string;
  helpText?: ReactNode;
  value: T | undefined;
  options: { value: T; label: string }[];
  onChange: (next: T | undefined) => void;
  mobile: boolean;
  /** Adds a first row that clears the value — for an optional setting. */
  noneLabel?: string;
}) {
  const pop = useSelectPopover(mobile);
  const selected = options.find((option) => option.value === value);
  return (
    <>
      <Input label={label} helpText={helpText}>
        <SelectField
          value={selected?.label ?? noneLabel}
          open={pop.open}
          onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
        />
      </Input>
      <SelectPopoverList pop={pop} mobile={mobile} title={label}>
        <SelectListItemGroup>
          {noneLabel != null && (
            <SelectListItem
              label={noneLabel}
              selected={value == null}
              onClick={() => {
                onChange(undefined);
                pop.close();
              }}
            />
          )}
          {options.map((option) => (
            <SelectListItem
              key={option.value}
              label={option.label}
              selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                pop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
}

