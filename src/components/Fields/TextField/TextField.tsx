import { InputHTMLAttributes, useState } from "react";

import clsx from "clsx";

import { resolveGroupedField } from "../InputGroup/groupedField";
import InputHelpText from "../../InputHelpText/InputHelpText";
import { useInputLabel } from "../../Input/InputContext";
import { missingValueMessage } from "../missingValueMessage";

import styles from "./TextField.module.scss";
import { TextFieldProps, TextFieldKeyboard } from "./TextField.types";

// keyboard → native type/inputMode (docs "Mobile keyboard"). "numeric" keeps
// type=text (no number-input spinners/validation) with the numeric pad.
const KEYBOARD_ATTRS: Record<
  TextFieldKeyboard,
  { type: string; inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"] }
> = {
  text: { type: "text" },
  email: { type: "email", inputMode: "email" },
  url: { type: "url", inputMode: "url" },
  tel: { type: "tel", inputMode: "tel" },
  numeric: { type: "text", inputMode: "numeric" },
};

// TextField — the single-line text field (Figma "TextField"): a real <input>
// in the shared input chrome, with optional prefix/suffix texts. No
// placeholder by design. Bare — the label and help text live on the Input
// wrapper, and the default error message ("Enter [Label]") derives from the
// Input's label through InputContext.
export default function TextField(props: TextFieldProps) {
  const {
    prefix,
    suffix,
    keyboard = "text",
    isValid = true,
    errorMessage,
    className,
    disabled,
    readOnly,
    _group,
    value,
    defaultValue,
    onChange,
    onScroll,
    ...inputProps
  } = props as TextFieldProps & { disabled?: boolean; readOnly?: boolean };

  const contextLabel = useInputLabel();
  const effectiveError = errorMessage ?? missingValueMessage("Enter", contextLabel);

  // The glyphs are painted by an overlay span, not by the input itself (its
  // text is transparent, only the caret shows — see the scss): the overlay
  // tracks the input's scroll position and may extend past the viewport to
  // the field borders, so overflowing text clips at the border. Track the
  // scroll offset + the uncontrolled value for the overlay.
  const [scrollLeft, setScrollLeft] = useState(0);
  const [innerValue, setInnerValue] = useState(defaultValue != null ? String(defaultValue) : "");
  const displayValue = value != null ? String(value) : innerValue;

  // In an InputGroup the group's disabled / readOnly / isValid win, the field
  // renders as a fused segment, and the group shows one shared error.
  const g = resolveGroupedField(_group, { disabled, readOnly, isValid }, styles);
  const interactive = !g.disabled && !g.readOnly;
  // Disabled / read-only fields can not be invalid (the docs).
  const showInvalid = !g.isValid && interactive;
  const kb = KEYBOARD_ATTRS[keyboard];

  return (
    <div className={clsx(styles.root, g.rootClass, !g.grouped && g.disabled && styles.disabled, className)}>
      {/* A <label> wrapper: clicking anywhere on the field (prefix/suffix
          included) focuses the input. */}
      <label className={clsx(styles.field, g.fieldClasses, showInvalid && styles.invalid, g.readOnly && styles.readOnly)}>
        {prefix != null && <span className={styles.affix}>{prefix}</span>}
        <span
          className={clsx(
            styles.valueViewport,
            prefix == null && styles.reachLeft,
            suffix == null && styles.reachRight,
          )}
        >
          <input
            // Keep browser autofill and password managers off the field: they
            // otherwise pop a "save/fill password" prompt on any input they
            // guess is a user name (Daniel hit this on "Received by",
            // 2026-08-03). Listed BEFORE the spread, so a consumer that really
            // wants autofill (a real address/name field) can opt back in.
            autoComplete="off"
            data-1p-ignore="true"
            data-lpignore="true"
            data-form-type="other"
            {...inputProps}
            value={value}
            defaultValue={defaultValue}
            onChange={(e) => {
              setInnerValue(e.target.value);
              setScrollLeft(e.currentTarget.scrollLeft);
              onChange?.(e);
            }}
            onScroll={(e) => {
              setScrollLeft(e.currentTarget.scrollLeft);
              onScroll?.(e);
            }}
            className={styles.input}
            type={kb.type}
            inputMode={kb.inputMode}
            disabled={g.disabled}
            readOnly={g.readOnly}
            aria-invalid={showInvalid || undefined}
          />
          {displayValue !== "" && (
            <span
              className={styles.overlay}
              style={{ transform: `translate(${-scrollLeft}px, -50%)`, top: "50%" }}
              aria-hidden
            >
              {displayValue}
            </span>
          )}
        </span>
        {suffix != null && <span className={styles.affix}>{suffix}</span>}
      </label>
      {g.showOwnError && showInvalid && effectiveError != null && (
        <InputHelpText status="error" slotLeft>
          {effectiveError}
        </InputHelpText>
      )}
    </div>
  );
}
