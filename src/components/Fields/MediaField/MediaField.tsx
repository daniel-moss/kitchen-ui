import { ChangeEvent, Children, isValidElement, useRef } from "react";

import clsx from "clsx";

import useIsDesktop from "../../../hooks/useIsDesktop";
import { Icon } from "../../Icon/Icon";
import InputHelpText from "../../InputHelpText/InputHelpText";
import { useInputLabel } from "../../Input/InputContext";
import { missingValueMessage } from "../missingValueMessage";

import styles from "./MediaField.module.scss";
import { MediaFieldProps } from "./MediaField.types";

// MediaField — the file-upload field (Figma "MediaField"). Empty: a full-width
// dashed upload trigger (fixed height 151/180 by breakpoint). Filled: the
// files as CardFile children in a wrapping grid of fixed-size cards (106/135
// wide), with the trigger shrunk to one card's footprint at the end. The
// trigger proxies to a hidden native file input — on mobile the OS offers
// browse files / take a shot by itself. Bare — the label and help text live
// on the Input wrapper; the default error message ("Add [Label]") derives
// from the Input's label through InputContext.
export default function MediaField({
  children,
  onFilesSelected,
  accept,
  multiple = true,
  isValid = true,
  errorMessage,
  disabled = false,
  breakpoint = "auto",
  className,
}: MediaFieldProps) {
  const isDesktop = useIsDesktop(breakpoint);
  const contextLabel = useInputLabel();
  const effectiveError = errorMessage ?? missingValueMessage("Add", contextLabel);

  const fileRef = useRef<HTMLInputElement>(null);

  const cards = Children.toArray(children).filter(isValidElement);
  const filled = cards.length > 0;
  // Disabled fields can not be invalid (the docs).
  const showInvalid = !isValid && !disabled;

  const handlePicked = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Reset the input, so picking the same file again still fires a change.
    event.target.value = "";
    if (files.length > 0) onFilesSelected?.(files);
  };

  const trigger = (
    <button
      type="button"
      className={clsx(styles.trigger, filled ? styles.tile : styles.empty, showInvalid && styles.invalid)}
      disabled={disabled}
      aria-invalid={showInvalid || undefined}
      aria-label={contextLabel != null ? `Add ${contextLabel}` : "Add files"}
      onClick={() => fileRef.current?.click()}
    >
      <Icon icon="circle-plus" size={20} />
    </button>
  );

  return (
    <div className={clsx(styles.root, isDesktop ? styles.desktop : styles.mobile, className)}>
      {filled ? (
        <div className={styles.grid}>
          {cards.map((card) => (
            <div key={card.key} className={styles.cell}>
              {card}
            </div>
          ))}
          {trigger}
        </div>
      ) : (
        trigger
      )}
      {showInvalid && effectiveError != null && (
        <InputHelpText status="error" slotLeft>
          {effectiveError}
        </InputHelpText>
      )}
      <input
        ref={fileRef}
        className={styles.fileInput}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        onChange={handlePicked}
      />
    </div>
  );
}
