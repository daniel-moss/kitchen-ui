import { Children, cloneElement, isValidElement, ReactElement, useId, useState } from "react";
import clsx from "clsx";

import InputHelpText from "../InputHelpText/InputHelpText";
import { useInputLabel } from "../Input/InputContext";
import { missingValueMessage } from "../Fields/missingValueMessage";

import styles from "./RadioGroup.module.scss";
import { RadioGroupProps } from "./RadioGroup.types";

// Groups up to 4 card RadioItems with a validation state. Single-select: the
// group owns the value and injects a shared name + checked into each item.
// Mirrors CheckboxGroup. Bare — the label and help text live on the Input
// wrapper, and the default error message ("Choose [Label]") derives from the
// Input's label through InputContext. See Figma "RadioGroup".
export default function RadioGroup({
  orientation = "vertical",
  isValid = true,
  errorMessage,
  name,
  value,
  defaultValue,
  onChange,
  children,
  className,
  ...rest
}: RadioGroupProps) {
  const autoName = useId();
  const groupName = name ?? autoName;
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const current = isControlled ? value : internal;

  const contextLabel = useInputLabel();
  const effectiveError = errorMessage ?? missingValueMessage("Choose", contextLabel);

  const select = (v: string) => {
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };

  const items = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const el = child as ReactElement<{
      value?: string;
      error?: boolean;
      variant?: string;
      name?: string;
      checked?: boolean;
      onChange?: () => void;
    }>;
    const v = el.props.value;
    return cloneElement(el, {
      variant: "card",
      name: groupName,
      checked: v !== undefined && v === current,
      onChange: () => {
        if (v !== undefined) select(v);
      },
      error: isValid ? el.props.error : true,
    });
  });

  return (
    <div className={clsx(styles.group, className)} role="radiogroup" {...rest}>
      <div className={clsx(styles.items, styles[orientation])}>{items}</div>

      {!isValid && effectiveError != null && (
        <InputHelpText status="error" slotLeft>
          {effectiveError}
        </InputHelpText>
      )}
    </div>
  );
}
