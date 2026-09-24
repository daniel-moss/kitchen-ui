import { Children, cloneElement, isValidElement, KeyboardEvent, ReactElement, useRef } from "react";

import clsx from "clsx";

import InputHelpText from "../InputHelpText/InputHelpText";
import { useInputLabel } from "../Input/InputContext";
import { missingValueMessage } from "../Fields/missingValueMessage";

import { ChipSelectionModeContext } from "./ChipSelectionModeContext";
import styles from "./ChipGroup.module.scss";
import { ChipGroupProps } from "./ChipGroup.types";

type ChipChildProps = {
  isValid?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  tabIndex?: number;
};

// ChipGroup — the container for a row of Chips: they wrap onto more lines when
// the row runs out of width, with `--size-2` (8px) between them on both axes.
// `isFullWidth` flips to the stretch mode: one non-wrapping row where the
// chips share the width equally. Selection stays with the consumer, which
// sets each Chip's `isSelected` — but the group owns VALIDATION, like the
// other group fields (when invalid, every chip is forced into its error look
// and the error message shows below; the default "Choose [Label]" derives from
// the surrounding Input's label through InputContext) and it owns the
// SELECTION SEMANTICS through `selectionMode`. See Figma "ChipGroup"
// (set 29824-6190).
export default function ChipGroup({
  children,
  isFullWidth = false,
  selectionMode = "multiple",
  isValid = true,
  errorMessage,
  className,
  ...rest
}: ChipGroupProps) {
  const contextLabel = useInputLabel();
  const effectiveError = errorMessage ?? missingValueMessage("Choose", contextLabel);
  const rowRef = useRef<HTMLDivElement>(null);
  const isRadioGroup = selectionMode === "single";

  const items = Children.toArray(children);

  // A radio group holds ONE tab stop: the selected chip, or the first enabled
  // one when nothing is selected yet. Everything else is reachable with the
  // arrow keys instead.
  const rovingIndex = (() => {
    if (!isRadioGroup) return -1;
    let firstEnabled = -1;
    for (let i = 0; i < items.length; i++) {
      const child = items[i];
      if (!isValidElement(child)) continue;
      const props = (child as ReactElement<ChipChildProps>).props;
      if (props.isDisabled === true) continue;
      if (firstEnabled === -1) firstEnabled = i;
      if (props.isSelected === true) return i;
    }
    return firstEnabled;
  })();

  // Push the error state onto every chip when the group is invalid; a valid
  // group leaves each chip's own isValid alone. In a radio group the tab stop
  // rides along — `tabIndex` is a plain button attribute, so it clones, while
  // the ROLES travel by context (a chip's aria-pressed is not a prop).
  const chips = items.map((child, index) => {
    if (!isValidElement(child)) return child;
    const el = child as ReactElement<ChipChildProps>;
    const next: ChipChildProps = { isValid: isValid ? el.props.isValid : false };
    if (isRadioGroup) next.tabIndex = index === rovingIndex ? 0 : -1;
    return cloneElement(el, next);
  });

  // Radio-group keyboard: the arrows move the focus, and because the group
  // does not own the value, they replay the chip's own click so the selection
  // follows the focus the way a radio group's does.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isRadioGroup) return;
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const back = event.key === "ArrowLeft" || event.key === "ArrowUp";
    if (!forward && !back) return;

    const row = rowRef.current;
    if (row == null) return;
    const buttons = Array.from(row.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;

    event.preventDefault();
    const target = buttons[(current + (forward ? 1 : -1) + buttons.length) % buttons.length];
    target.focus();
    target.click();
  };

  return (
    <div className={clsx(styles.group, className)} {...rest}>
      <div
        ref={rowRef}
        role={isRadioGroup ? "radiogroup" : undefined}
        className={clsx(styles.chips, isFullWidth && styles.fullWidth)}
        onKeyDown={handleKeyDown}
      >
        <ChipSelectionModeContext.Provider value={selectionMode}>{chips}</ChipSelectionModeContext.Provider>
      </div>

      {!isValid && effectiveError != null && (
        <InputHelpText status="error" slotLeft>
          {effectiveError}
        </InputHelpText>
      )}
    </div>
  );
}
