import { Children, cloneElement, isValidElement, ReactElement } from "react";

import clsx from "clsx";

import InputHelpText from "../../InputHelpText/InputHelpText";
import { useInputLabel } from "../../Input/InputContext";

import { missingValueMessage } from "../missingValueMessage";

import styles from "./InputGroup.module.scss";
import { InputGroupChildContext, InputGroupPosition, InputGroupProps } from "./InputGroup.types";

// InputGroup — fuses two or more input fields into ONE bordered box that reads
// as a single piece of data (Figma "InputGroup"). It renders one shared error
// message below the fused row. Each child field (DateField / TextField /
// SelectField / …) is cloned with the internal `_group` context so it renders
// as a fused segment and inherits the group's disabled / readOnly / isValid.
// Hover + focus stay per-segment; the error, validity, disabled and read-only
// are group-level. Bare — the label and help text live on the Input wrapper,
// and the default error message ("Provide [Label]") derives from the Input's
// label through InputContext.
export default function InputGroup({
  isValid = true,
  errorMessage,
  disabled = false,
  readOnly = false,
  children,
  className,
}: InputGroupProps) {
  const contextLabel = useInputLabel();

  const interactive = !disabled && !readOnly;
  const showError = !isValid && interactive;
  // Default missing-value message (DS rule): "Provide [Label]".
  const effectiveError = errorMessage ?? missingValueMessage("Provide", contextLabel);

  // Inject the group context into each field: its position (for the fused
  // border) plus the shared disabled / readOnly / isValid.
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<{ _group?: InputGroupChildContext }>[];
  const fused = items.map((child, i) => {
    const position: InputGroupPosition = i === 0 ? "first" : i === items.length - 1 ? "last" : "middle";
    return cloneElement(child, {
      key: child.key ?? i,
      _group: { position, disabled, readOnly, isValid },
    });
  });

  return (
    <div className={clsx(styles.group, className)}>
      <div className={clsx(styles.fused, disabled && styles.disabled)}>{fused}</div>

      {showError && effectiveError != null && (
        <InputHelpText status="error" slotLeft>
          {effectiveError}
        </InputHelpText>
      )}
    </div>
  );
}
