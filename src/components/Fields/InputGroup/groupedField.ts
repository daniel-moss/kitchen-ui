import type { InputGroupChildContext, InputGroupPosition } from "./InputGroup.types";

// Shared by every field that can sit inside an InputGroup (DateField,
// TextField, SelectField). Given the injected `_group` context and
// the field's own props, it resolves the effective disabled / readOnly /
// isValid (the group wins) and the class names for the fused chrome. Each
// field's SCSS module defines `.grouped`, `.groupFirst/Middle/Last` (via the
// `input-field-grouped` mixin) and `.groupedRoot`.

const POSITION_CLASS: Record<InputGroupPosition, string> = {
  first: "groupFirst",
  middle: "groupMiddle",
  last: "groupLast",
};

export interface ResolvedGroupedField {
  grouped: boolean;
  disabled: boolean;
  readOnly: boolean;
  isValid: boolean;
  /** Class for the field's root wrapper (makes it a flex segment). */
  rootClass?: string;
  /** Classes for the field's `.field` element (grouped + position). */
  fieldClasses: (string | undefined)[];
  /** Whether the field renders its OWN error message (false in a group). */
  showOwnError: boolean;
}

export function resolveGroupedField(
  group: InputGroupChildContext | undefined,
  own: { disabled?: boolean; readOnly?: boolean; isValid?: boolean },
  styles: Record<string, string>
): ResolvedGroupedField {
  if (group == null) {
    return {
      grouped: false,
      disabled: own.disabled ?? false,
      readOnly: own.readOnly ?? false,
      isValid: own.isValid ?? true,
      fieldClasses: [],
      showOwnError: true,
    };
  }
  return {
    grouped: true,
    disabled: group.disabled ?? false,
    readOnly: group.readOnly ?? false,
    isValid: group.isValid ?? true,
    rootClass: styles.groupedRoot,
    fieldClasses: [styles.grouped, styles[POSITION_CLASS[group.position]]],
    showOwnError: false,
  };
}
