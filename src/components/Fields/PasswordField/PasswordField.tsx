import { useState } from "react";

import clsx from "clsx";

import HoverTooltip from "../../Tooltip/HoverTooltip";
import { Icon } from "../../Icon/Icon";
import IconButton from "../../IconButton/IconButton";
import InputHelpText from "../../InputHelpText/InputHelpText";
import { useInputLabel } from "../../Input/InputContext";
import { missingValueMessage } from "../missingValueMessage";

import styles from "./PasswordField.module.scss";
import { PasswordCondition, PasswordConditionState, PasswordFieldProps } from "./PasswordField.types";

// The "new password" requirement badges (the docs' default set).
const DEFAULT_CONDITIONS: PasswordCondition[] = [
  { label: "At least 8 characters" },
  { label: "Letters" },
  { label: "Numbers" },
];

// The "confirm password" badge copy per match state (the docs).
const MATCH_TEXT: Record<PasswordConditionState, string> = {
  default: "Passwords must match",
  valid: "Passwords match",
  invalid: "Passwords do not match",
};

// One condition badge — an InputHelpText: circle-minus/subtle when unchecked,
// the success/error status looks when met/not met.
function ConditionBadge({ label, state }: { label: React.ReactNode; state: PasswordConditionState }) {
  return state === "default" ? (
    <InputHelpText status="neutral" slotLeft icon="circle-minus">
      {label}
    </InputHelpText>
  ) : (
    <InputHelpText status={state === "valid" ? "success" : "error"} slotLeft>
      {label}
    </InputHelpText>
  );
}

// PasswordField — the password field (Figma "PasswordField"): a real
// <input type="password"> in the shared input chrome with a Show/Hide eye
// button ("Show"/"Hide" tooltips). variant="new" adds the requirement badges
// below; variant="confirm" adds the single match badge; variant="default"
// shows the error help text when invalid. No read-only state exists. Bare —
// the label, help text, and strength indicator live on the Input wrapper; the
// default error message derives from the Input's label through InputContext.
export default function PasswordField({
  variant = "default",
  conditions,
  matchState = "default",
  passwordManagerIcon = false,
  isValid = true,
  errorMessage,
  disabled = false,
  className,
  ...inputProps
}: PasswordFieldProps) {
  const contextLabel = useInputLabel();
  const [revealed, setRevealed] = useState(false);

  const interactive = !disabled;
  // Disabled can not be invalid (the docs).
  const showInvalid = !isValid && interactive;
  const effectiveError = errorMessage ?? missingValueMessage("Enter", contextLabel) ?? "Enter password";

  // A group-level invalid turns unchecked ("default") badges into their error
  // look — explicitly set badge states always win (mirrors CheckboxGroup).
  const badgeState = (state: PasswordConditionState = "default"): PasswordConditionState =>
    showInvalid && state === "default" ? "invalid" : state;

  return (
    <div className={clsx(styles.root, disabled && styles.disabled, className)}>
      {/* A <label> wrapper: clicking anywhere on the field focuses the input
          (the eye button toggles and re-focuses through the same label). */}
      <label className={clsx(styles.field, showInvalid && styles.invalid)}>
        <input
          {...inputProps}
          className={styles.input}
          type={revealed ? "text" : "password"}
          disabled={disabled}
          aria-invalid={showInvalid || undefined}
        />
        {interactive && (
          <span className={styles.actions}>
            {/* The password-manager slot — a dedicated 32px container next to
                the Show/Hide button, visible while the field is focused. */}
            {passwordManagerIcon && (
              <span className={styles.pmIcon}>
                <Icon icon="key" pack="solid" size={14} />
              </span>
            )}
            <HoverTooltip text={revealed ? "Hide" : "Show"}>
              <IconButton
                icon={revealed ? "eye-slash" : "eye"}
                variant="ghost"
                size="md"
                aria-label={revealed ? "Hide password" : "Show password"}
                noDebounce
                onClick={() => setRevealed((v) => !v)}
              />
            </HoverTooltip>
          </span>
        )}
      </label>

      {/* Below the field: badges (new/confirm) or the error help text (default). */}
      {variant === "new" && interactive && (
        <div className={styles.conditions}>
          {(conditions ?? DEFAULT_CONDITIONS).map((c, i) => (
            <ConditionBadge key={i} label={c.label} state={badgeState(c.state)} />
          ))}
        </div>
      )}
      {variant === "confirm" && interactive && (
        <ConditionBadge label={MATCH_TEXT[matchState]} state={badgeState(matchState)} />
      )}
      {variant === "default" && showInvalid && effectiveError != null && (
        <InputHelpText status="error" slotLeft>
          {effectiveError}
        </InputHelpText>
      )}
    </div>
  );
}
