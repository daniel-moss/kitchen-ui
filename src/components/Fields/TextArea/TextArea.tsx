import { ChangeEvent, useRef, useState } from "react";

import clsx from "clsx";

import HoverTooltip from "../../Tooltip/HoverTooltip";
import IconButton from "../../IconButton/IconButton";
import InputHelpText from "../../InputHelpText/InputHelpText";
import { useInputLabel } from "../../Input/InputContext";
import Prompt from "../../Prompt/Prompt";
import { missingValueMessage } from "../missingValueMessage";

import styles from "./TextArea.module.scss";
import { TextAreaProps } from "./TextArea.types";

// TextArea — the multi-line text field (Figma "TextArea"): a real <textarea>
// in the shared input chrome. Min 4 rows; GROWS with the content (no inner
// scroll, no max height — the docs' explicit rule). The height comes from an
// invisible replica of the text in the same grid cell, so no resize listeners
// are needed. A clear (×) button is shown whenever the field is filled; it
// confirms through a Prompt before clearing. Bare — the label and help text
// live on the Input wrapper; the Prompt copy and the default error message
// derive from the Input's label through InputContext.
export default function TextArea(props: TextAreaProps) {
  const {
    value,
    defaultValue,
    onChange,
    clearable = true,
    onClear,
    clearPromptLabel,
    isValid = true,
    errorMessage,
    className,
    disabled,
    readOnly,
    ...textareaProps
  } = props as TextAreaProps & { disabled?: boolean; readOnly?: boolean };

  const contextLabel = useInputLabel();
  const promptLabel = clearPromptLabel ?? contextLabel ?? "text";
  const effectiveError = errorMessage ?? missingValueMessage("Provide", contextLabel);

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = isControlled ? value : internal;
  const filled = (current ?? "").length > 0;

  const [promptOpen, setPromptOpen] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const interactive = disabled !== true && readOnly !== true;
  // Disabled / read-only fields can not be invalid (the docs).
  const showInvalid = !isValid && interactive;

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (!isControlled) setInternal(e.target.value);
    onChange?.(e);
  };
  const confirmClear = () => {
    setPromptOpen(false);
    if (!isControlled) setInternal("");
    else if (areaRef.current != null) {
      // Controlled field: the consumer owns the value — clear it THROUGH its
      // onChange by setting the native value and dispatching an input event
      // (React's onChange listens to `input`). Without this, controlled
      // textareas never actually cleared.
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(areaRef.current, "");
      areaRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    }
    onClear?.();
    areaRef.current?.focus();
  };


  return (
    <div className={clsx(styles.root, disabled && styles.disabled, className)}>
      <div className={clsx(styles.field, showInvalid && styles.invalid, readOnly && styles.readOnly)}>
        {/* The replica mirrors the text and sizes the shared grid cell —
            the textarea just fills it (min-height = 4 rows). */}
        <div className={styles.grow}>
          <div className={styles.replica} aria-hidden="true">
            {(current ?? "") + " "}
          </div>
          {/* Internally always controlled (mirrors `internal` when the
              consumer is uncontrolled) — the clear Prompt must be able to
              empty the DOM value too. */}
          <textarea
            {...textareaProps}
            ref={areaRef}
            className={styles.textarea}
            value={current ?? ""}
            onChange={handleChange}
            disabled={disabled}
            readOnly={readOnly}
            aria-invalid={showInvalid || undefined}
          />
        </div>
        {/* Filled + interactive: the clear button (the docs: shown whenever
            the value is provided). */}
        {clearable && interactive && filled && (
          <div className={styles.clear}>
            <HoverTooltip text="Clear">
              <IconButton
                icon="xmark-circle"
                iconPack="solid"
                variant="ghost"
                size="md"
                aria-label="Clear"
                noDebounce
                onClick={() => setPromptOpen(true)}
              />
            </HoverTooltip>
          </div>
        )}
      </div>
      {showInvalid && effectiveError != null && (
        <InputHelpText status="error" slotLeft>
          {effectiveError}
        </InputHelpText>
      )}
      <Prompt
        open={promptOpen}
        title={`Clear "${promptLabel}"?`}
        body={`"${promptLabel}" will be cleared. This action can not be undone.`}
        actionLabel="Clear"
        actionVariant="danger"
        onAction={confirmClear}
        onCancel={() => setPromptOpen(false)}
      />
    </div>
  );
}
