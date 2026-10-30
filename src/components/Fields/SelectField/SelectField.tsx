import { KeyboardEvent, MouseEvent } from "react";
import clsx from "clsx";

import { Icon } from "../../Icon/Icon";
import IconButton from "../../IconButton/IconButton";
import HoverTooltip from "../../Tooltip/HoverTooltip";
import { FieldSkeleton } from "../FieldSkeleton";
import { resolveGroupedField } from "../InputGroup/groupedField";
import InputHelpText from "../../InputHelpText/InputHelpText";
import { useInputLabel } from "../../Input/InputContext";
import { missingValueMessage } from "../missingValueMessage";
import SelectFieldBody from "./SelectFieldBody";
import SelectFieldCounter from "./SelectFieldCounter";

import styles from "./SelectField.module.scss";
import { SelectFieldProps } from "./SelectField.types";

// SelectField — the select trigger field (Figma "SelectField"): a bordered
// surface holding the body (value or placeholder + slots), the actions (the
// optional single-select clear button + the chevron), and — for multi-select —
// a count pill. Drives hover / active(focus/open) / disabled / read-only /
// error / loading states. Fills its container (the Figma default);
// `fitContent` hugs the value instead, and a grouped field hugs by default.
// Bare — the label and help text live on the Input wrapper, and the default
// error message ("Choose [Label]") derives from the Input's label through
// InputContext.
export default function SelectField({
  value,
  placeholder,
  slotLeft,
  suffix,
  multiSelect = false,
  count,
  multiSelectLabel = "Options selected",
  onClearSelection,
  isClearable = false,
  onClear,
  isValid = true,
  errorMessage,
  disabled = false,
  readOnly = false,
  isLoading = false,
  open = false,
  fitContent,
  className,
  onClick,
  _group,
  ...rest
}: SelectFieldProps) {
  const contextLabel = useInputLabel();
  const effectiveError = errorMessage ?? missingValueMessage("Choose", contextLabel);

  // In an InputGroup the group's disabled / readOnly / isValid / isLoading
  // win, the field renders as a fused segment, and the group shows one shared
  // error.
  const g = resolveGroupedField(_group, { disabled, readOnly, isValid, isLoading }, styles);
  // A grouped select hugs unless told otherwise (the Figma select segment).
  const hug = fitContent ?? g.grouped;
  const filled = multiSelect ? (count ?? 0) > 0 : value != null && value !== "";
  const showCounter = multiSelect && filled;
  const interactive = !g.disabled && !g.readOnly;
  const showClear = isClearable && !multiSelect && filled && interactive;

  // Multi-select display: >1 selected shows the summary copy; exactly 1 shows the
  // single option's name (`value`). Single-select just shows `value`.
  const displayValue = multiSelect && (count ?? 0) > 1 ? multiSelectLabel : value;

  // Disabled / read-only can never be invalid (per the docs).
  const showInvalid = !g.isValid && interactive;

  const rootClass = clsx(
    styles.root,
    g.rootClass,
    !g.grouped && hug && styles.fitContent,
    // Inside a group the segment hugs by default: it takes only its content's
    // width and the other segments share what is left (the Scheduling form's
    // date + time row, Figma 24522-88085).
    g.grouped && hug && styles.groupedFitContent,
    className
  );

  // Loading: the block only — no value, no icons, no error (Figma
  // state=loading).
  if (g.isLoading) {
    return (
      <div className={clsx(rootClass, styles.loading)} aria-busy="true">
        <FieldSkeleton position={g.position} />
      </div>
    );
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Keys pressed on an inner button (clear, the counter's ×) are that
    // button's — they must not open the list too.
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(e as unknown as MouseEvent<HTMLDivElement>);
    }
  };

  return (
    <div className={clsx(rootClass, !g.grouped && g.disabled && styles.disabled)}>
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
          <SelectFieldBody
            className={styles.body}
            value={filled ? displayValue : undefined}
            placeholder={placeholder}
            slotLeft={slotLeft}
            suffix={suffix}
          />
        </div>
        {!g.readOnly && (
          <span className={styles.actions}>
            {showClear && (
              // The clear button must not also open the list: the click stops
              // here.
              <span className={styles.clear} onClick={(e) => e.stopPropagation()}>
                <HoverTooltip text="Clear">
                  <IconButton
                    icon="xmark-circle"
                    iconPack="solid"
                    variant="ghost"
                    size="md"
                    aria-label="Clear"
                    noDebounce
                    onClick={() => onClear?.()}
                  />
                </HoverTooltip>
              </span>
            )}
            <span className={styles.chevron}>
              <Icon icon="angles-up-down" pack="regular" size={14} />
            </span>
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
