import { KeyboardEvent, MouseEvent } from "react";
import clsx from "clsx";

import { Icon } from "../../Icon/Icon";
import { resolveGroupedField } from "../InputGroup/groupedField";
import InputHelpText from "../../InputHelpText/InputHelpText";
import { useInputLabel } from "../../Input/InputContext";
import { missingValueMessage } from "../missingValueMessage";
import SelectFieldBody from "./SelectFieldBody";
import SelectFieldCounter from "./SelectFieldCounter";

import styles from "./SelectField.module.scss";
import { SelectFieldProps } from "./SelectField.types";

// SelectField — the select trigger field (Figma "SelectField"): a bordered
// surface holding the body (value + slots), a trailing chevron, and — for
// multi-select — a count pill. Drives hover / active(focus/open) / disabled /
// read-only / error states. Fills its container (the Figma default);
// `fitContent` hugs the value instead. Bare — the label and help text live on
// the Input wrapper, and the default error message ("Choose [Label]") derives
// from the Input's label through InputContext.
export default function SelectField({
  value,
  slotLeft,
  suffix,
  multiSelect = false,
  count,
  multiSelectLabel = "Options selected",
  onClearSelection,
  isValid = true,
  errorMessage,
  disabled = false,
  readOnly = false,
  open = false,
  fitContent = false,
  className,
  onClick,
  _group,
  ...rest
}: SelectFieldProps) {
  const contextLabel = useInputLabel();
  const effectiveError = errorMessage ?? missingValueMessage("Choose", contextLabel);

  // In an InputGroup the group's disabled / readOnly / isValid win, the field
  // renders as a fused segment, and the group shows one shared error.
  const g = resolveGroupedField(_group, { disabled, readOnly, isValid }, styles);
  const filled = multiSelect ? (count ?? 0) > 0 : value != null && value !== "";
  const showCounter = multiSelect && filled;
  const interactive = !g.disabled && !g.readOnly;

  // Multi-select display: >1 selected shows the summary copy; exactly 1 shows the
  // single option's name (`value`). Single-select just shows `value`.
  const displayValue = multiSelect && (count ?? 0) > 1 ? multiSelectLabel : value;

  // Disabled / read-only can never be invalid (per the docs).
  const showInvalid = !g.isValid && interactive;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(e as unknown as MouseEvent<HTMLDivElement>);
    }
  };

  return (
    <div
      className={clsx(
        styles.root,
        g.rootClass,
        !g.grouped && fitContent && styles.fitContent,
        !g.grouped && g.disabled && styles.disabled,
        className
      )}
    >
      <div
        className={clsx(styles.field, g.fieldClasses, showInvalid && styles.invalid, g.readOnly && styles.readOnly, open && styles.open)}
        role="button"
        tabIndex={interactive ? 0 : undefined}
        aria-disabled={g.disabled || undefined}
        aria-readonly={g.readOnly || undefined}
        aria-expanded={open}
        aria-invalid={showInvalid || undefined}
        onClick={interactive ? onClick : undefined}
        onKeyDown={interactive ? handleKeyDown : undefined}
        {...rest}
      >
        <div className={styles.content}>
          {showCounter && <SelectFieldCounter count={count} onClear={onClearSelection} readOnly={g.readOnly} />}
          <SelectFieldBody className={styles.body} value={filled ? displayValue : undefined} slotLeft={slotLeft} suffix={suffix} />
        </div>
        {!g.readOnly && (
          <span className={styles.chevron}>
            <Icon icon="angles-up-down" pack="regular" size={14} />
          </span>
        )}
      </div>

      {g.showOwnError && showInvalid && effectiveError != null && (
        <InputHelpText status="error" slotLeft>
          {effectiveError}
        </InputHelpText>
      )}
    </div>
  );
}
