import { ChangeEvent, ClipboardEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import clsx from "clsx";

import InputHelpText from "../../InputHelpText/InputHelpText";
import OTPBox from "./OTPBox";

import styles from "./OTPField.module.scss";
import { OTPFieldProps } from "./OTPField.types";

// A code string → a fixed-length array of cells ("" for an empty cell). Entry is
// sequential, so the filled cells are always a contiguous prefix.
const toCells = (code: string, length: number) => Array.from({ length }, (_, i) => code[i] ?? "");

// OTPField — the one-time-code field (Figma "OTPField"): a row of `length`
// single-digit boxes (default 6), each an OTPBox in the shared input chrome.
// Entry is STRICTLY SEQUENTIAL: the user types from the first box to the last
// and can only erase in reverse; a specific middle digit can not be edited
// (focus is redirected to the current position). When the last digit is
// entered the code is complete (`onComplete`) — the consumer verifies it and,
// if it is wrong, flips `isValid`: the field then shakes, holds the error for 2
// seconds, then clears BOTH the digits and the error state — only the message
// stays, until the user types again. Bare — the label lives on the Input wrapper.
export default function OTPField({
  value,
  defaultValue = "",
  onChange,
  onComplete,
  length = 6,
  isValid = true,
  errorMessage = "Enter the code",
  autoFocus = true,
  disabled = false,
  className,
}: OTPFieldProps) {
  const controlled = value !== undefined;
  const [cells, setCells] = useState(() => toCells(controlled ? value! : defaultValue, length));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Keep the cells in sync with a controlled value / a length change.
  useEffect(() => {
    if (controlled) setCells(toCells(value!, length));
  }, [controlled, value, length]);

  // The current position: the first empty box (or the last box when full).
  const firstEmpty = cells.findIndex((c) => c === "");
  const filledCount = firstEmpty === -1 ? length : firstEmpty;
  const activeIndex = firstEmpty === -1 ? length - 1 : firstEmpty;

  // True only while WE move focus (auto-advance / backspace / reset). The focus
  // redirect below must ignore these — otherwise a stale activeIndex (the
  // programmatic .focus() fires onFocus synchronously, before the state update
  // that advanced the position has applied) would bounce focus backwards.
  const programmatic = useRef(false);
  const focusBox = (i: number) => {
    programmatic.current = true;
    const el = inputs.current[Math.max(0, Math.min(i, length - 1))];
    el?.focus();
    el?.select();
    programmatic.current = false;
  };

  const commit = (next: string[]) => {
    if (!controlled) setCells(next);
    const code = next.join("");
    onChange?.(code);
    if (next.every((c) => c !== "")) onComplete?.(code);
  };

  // Fill digits starting at the current position (typing, paste, SMS autofill),
  // then move to the new current position.
  const fillFromActive = (digits: string) => {
    const next = cells.slice();
    let i = activeIndex;
    for (const d of digits) {
      if (i >= length) break;
      next[i] = d;
      i += 1;
    }
    commit(next);
    const nextEmpty = next.findIndex((c) => c === "");
    focusBox(nextEmpty === -1 ? length - 1 : nextEmpty);
  };

  // --- error → shake, hold 2s, then reset digits AND error state -------------
  const prevValid = useRef(isValid);
  const [shaking, setShaking] = useState(false);
  const [boxErrorHidden, setBoxErrorHidden] = useState(false); // red state gone after reset
  const [messageHidden, setMessageHidden] = useState(false); // message gone once the user types
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (prevValid.current && !isValid && !disabled) {
      setMessageHidden(false);
      setBoxErrorHidden(false);
      setShaking(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        // Clear the digits AND the error state; only the message stays.
        if (!controlled) setCells(toCells("", length));
        onChange?.("");
        setBoxErrorHidden(true);
        focusBox(0);
      }, 2000);
    }
    prevValid.current = isValid;
    return () => clearTimeout(resetTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid, disabled]);

  // --- autofocus the current box on mount ("active by default") --------------
  useEffect(() => {
    if (autoFocus && !disabled) focusBox(activeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissMessageOnType = () => {
    if (!isValid) setMessageHidden(true);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    dismissMessageOnType();
    const digits = e.target.value.replace(/\D/g, "");
    if (digits === "") return; // a deletion — handled by Backspace in keydown
    fillFromActive(digits);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Backspace erases the LAST filled digit (reverse order only).
    if (e.key === "Backspace") {
      e.preventDefault();
      dismissMessageOnType();
      if (filledCount === 0) return;
      const next = cells.slice();
      const last = filledCount - 1;
      next[last] = "";
      commit(next);
      focusBox(last);
    }
    // Arrow keys are intentionally not handled — a digit can not be edited out
    // of order, so there is no free navigation between boxes.
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "");
    if (digits === "") return;
    e.preventDefault();
    dismissMessageOnType();
    fillFromActive(digits);
  };

  // Redirect focus to the current position — a filled/ahead box can not be
  // edited. Skip our own programmatic moves (auto-advance / backspace / reset).
  const handleFocus = (index: number) => {
    if (programmatic.current) return;
    if (index !== activeIndex) focusBox(activeIndex);
    else inputs.current[index]?.select();
  };

  const boxesInvalid = !isValid && !boxErrorHidden && !disabled;
  const showMessage = !isValid && !messageHidden && !disabled && errorMessage != null;

  return (
    <div className={clsx(styles.root, className)}>
      <div className={clsx(styles.group, shaking && styles.shake)} onAnimationEnd={() => setShaking(false)}>
        {cells.map((c, i) => (
          <OTPBox
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={c}
            isValid={!boxesInvalid}
            disabled={disabled}
            type="tel"
            inputMode="tel"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1}`}
            aria-invalid={boxesInvalid || undefined}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => handleFocus(i)}
          />
        ))}
      </div>
      {showMessage && (
        <InputHelpText status="error" slotLeft>
          {errorMessage}
        </InputHelpText>
      )}
    </div>
  );
}
