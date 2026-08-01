import { Children, cloneElement, isValidElement, ReactElement } from "react";
import clsx from "clsx";

import InputHelpText from "../InputHelpText/InputHelpText";
import { useInputLabel } from "../Input/InputContext";
import { missingValueMessage } from "../Fields/missingValueMessage";

import styles from "./CheckboxGroup.module.scss";
import { CheckboxGroupProps } from "./CheckboxGroup.types";

// Groups up to 4 card CheckboxItems with a validation state. When invalid,
// every item is forced into its error look and an error message shows below.
// Bare — the label and help text live on the Input wrapper, and the default
// error message ("Choose [Label]") derives from the Input's label through
// InputContext. See Figma "CheckboxGroup".
export default function CheckboxGroup({
  orientation = "vertical",
  isValid = true,
  errorMessage,
  children,
  className,
  ...rest
}: CheckboxGroupProps) {
  const contextLabel = useInputLabel();
  const effectiveError = errorMessage ?? missingValueMessage("Choose", contextLabel);

  // The group only supports card items; force the variant, and push the error
  // state onto every item when the group is invalid.
  const items = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const el = child as ReactElement<{ variant?: string; error?: boolean }>;
    return cloneElement(el, {
      variant: "card",
      error: isValid ? el.props.error : true,
    });
  });

  return (
    <div className={clsx(styles.group, className)} {...rest}>
      <div className={clsx(styles.items, styles[orientation])}>{items}</div>

      {!isValid && effectiveError != null && (
        <InputHelpText status="error" slotLeft>
          {effectiveError}
        </InputHelpText>
      )}
    </div>
  );
}
