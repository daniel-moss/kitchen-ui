import { Children, cloneElement, isValidElement, ReactElement } from "react";

import clsx from "clsx";

import InputHelpText from "../InputHelpText/InputHelpText";
import { useInputLabel } from "../Input/InputContext";
import { missingValueMessage } from "../Fields/missingValueMessage";

import styles from "./ChipGroup.module.scss";
import { ChipGroupProps } from "./ChipGroup.types";

// ChipGroup — the container for a row of Chips: they wrap onto more lines when
// the row runs out of width, with `--size-2` (8px) between them on both axes.
// `isFullWidth` flips to the stretch mode: one non-wrapping row where the
// chips share the width equally. Selection stays with the consumer, which
// sets each Chip's `isSelected` — but the group owns VALIDATION, like the
// other group fields: when invalid, every chip is forced into its error look
// and the error message shows below (the default "Choose [Label]" derives
// from the surrounding Input's label through InputContext). See Figma
// "ChipGroup" (set 29824-6190; isValid variants added 2026-09-08).
export default function ChipGroup({
  children,
  isFullWidth = false,
  isValid = true,
  errorMessage,
  className,
  ...rest
}: ChipGroupProps) {
  const contextLabel = useInputLabel();
  const effectiveError = errorMessage ?? missingValueMessage("Choose", contextLabel);

  // Push the error state onto every chip when the group is invalid; a valid
  // group leaves each chip's own isValid alone.
  const chips = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const el = child as ReactElement<{ isValid?: boolean }>;
    return cloneElement(el, { isValid: isValid ? el.props.isValid : false });
  });

  return (
    <div className={clsx(styles.group, className)} {...rest}>
      <div className={clsx(styles.chips, isFullWidth && styles.fullWidth)}>{chips}</div>

      {!isValid && effectiveError != null && (
        <InputHelpText status="error" slotLeft>
          {effectiveError}
        </InputHelpText>
      )}
    </div>
  );
}
