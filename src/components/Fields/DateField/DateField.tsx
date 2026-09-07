import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import * as chrono from "chrono-node";
import clsx from "clsx";

import useControllableState from "../../../hooks/useControllableState";
import useIsDesktop from "../../../hooks/useIsDesktop";
import DatePicker from "../../DatePicker/DatePicker";
import { resolveGroupedField } from "../InputGroup/groupedField";
import { Icon } from "../../Icon/Icon";
import InputHelpText from "../../InputHelpText/InputHelpText";
import { useInputLabel } from "../../Input/InputContext";
import { missingValueMessage } from "../missingValueMessage";

import styles from "./DateField.module.scss";
import { DateFieldProps } from "./DateField.types";

// The standardized display (Figma + the app-wide date rule): weekday + month +
// day + year — "Monday, January 1, 2027". The year is ALWAYS shown — the old
// "hide the current year" rule was removed (Daniel, 2026-09-07).
const FORMAT_WITH_YEAR = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
export const formatDate = (date: Date) => FORMAT_WITH_YEAR.format(date);

// Parse typed text into a Date: "" clears, a Chrono-parseable string commits,
// anything else returns undefined (the caller reverts).
const parseText = (text: string): Date | null | undefined => {
  const t = text.trim();
  if (t === "") return null;
  const parsed = chrono.parseDate(t);
  return parsed ?? undefined;
};

// DateField — the date field (Figma "DateField"): the shared input chrome with
// a calendar icon on the right. Type a date in ANY format — Chrono parses it
// on commit (blur / Enter) and standardizes the display — OR click the field
// to open the DatePicker. Unparseable text reverts to the last valid value.
// Bare — the label and help text live on the Input wrapper; the default error
// message ("Choose [Label]") and the mobile picker label derive from the
// Input's label through InputContext.
export default function DateField(props: DateFieldProps) {
  const {
    value,
    defaultValue,
    onDateChange,
    onDateInput,
    isValid = true,
    errorMessage,
    withPicker = true,
    minDate,
    maxDate,
    today,
    pickerLabel,
    breakpoint = "auto",
    formatValue,
    className,
    disabled,
    readOnly,
    _group,
    ...inputProps
  } = props as DateFieldProps & { disabled?: boolean; readOnly?: boolean };

  const contextLabel = useInputLabel();
  const effectiveError = errorMessage ?? missingValueMessage("Choose", contextLabel);
  const effectivePickerLabel = pickerLabel ?? contextLabel;

  const [date, setDate] = useControllableState<Date | null>(value, defaultValue ?? null, onDateChange);
  // While editing, the raw typed text; null = not editing (show the date).
  const [draft, setDraft] = useState<string | null>(null);
  const displayed = draft ?? (date != null ? (formatValue ?? formatDate)(date) : "");

  // In an InputGroup the group's disabled / readOnly / isValid win, the field
  // renders as a fused segment, and the group shows one shared error.
  const g = resolveGroupedField(_group, { disabled, readOnly, isValid }, styles);
  const interactive = !g.disabled && !g.readOnly;
  // Disabled / read-only fields can not be invalid (the docs).
  const showInvalid = !g.isValid && interactive;
  const pickerEnabled = withPicker && interactive;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
    // Live parse for real-time consumers (the DatePicker's inner field).
    onDateInput?.(parseText(e.target.value));
  };

  // Commit: empty clears; parseable standardizes; anything else reverts.
  const commit = () => {
    if (draft == null) return;
    setDraft(null);
    const next = parseText(draft);
    if (next !== undefined) setDate(next);
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commit();
  };

  // ===== DatePicker wiring ==================================================
  const isDesktop = useIsDesktop(breakpoint);
  // Mobile: this field only OPENS the picker drawer (typing happens in the
  // drawer's own inner DateField), so the input must NOT summon the keyboard.
  // A real `readOnly` attribute keeps iOS from showing it (the label's onClick
  // still opens the picker); the read-only VISUAL is intentionally not applied
  // (the field stays interactive).
  const mobileNoKeyboard = pickerEnabled && !isDesktop;
  const fieldRef = useRef<HTMLLabelElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // 4px gap, left-aligned (docs). When the card would run past the viewport
  // bottom it FLIPS above the field instead of clipping (Daniel, 2026-09-07);
  // before the card has rendered (no height yet) it opens below.
  const placeCard = () => {
    if (fieldRef.current == null) return;
    const r = fieldRef.current.getBoundingClientRect();
    const cardHeight = cardRef.current?.getBoundingClientRect().height ?? 0;
    const below = r.bottom + 4;
    const flip = cardHeight > 0 && below + cardHeight > window.innerHeight - 8 && r.top - 4 - cardHeight > 8;
    setPos({ top: flip ? r.top - 4 - cardHeight : below, left: r.left });
  };

  const openPicker = () => {
    if (!pickerEnabled) return;
    if (isDesktop) placeCard();
    setPickerOpen(true);
  };
  const closePicker = () => setPickerOpen(false);

  // The picker applied a date (desktop: a chip was clicked; mobile: Apply was
  // tapped) — commit it and close.
  const pickDate = (d: Date) => {
    setDraft(null);
    setDate(d);
    closePicker();
  };
  // Desktop: keep the card glued to the field on scroll/resize, and close on
  // an outside click (the field's own click re-opens, so it is excluded).
  useEffect(() => {
    if (!pickerOpen || !isDesktop) return undefined;
    const update = placeCard;
    // Re-measure now that the card is mounted — its height decides the flip.
    update();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (fieldRef.current?.contains(t) || cardRef.current?.contains(t)) return;
      setPickerOpen(false);
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [pickerOpen, isDesktop]);

  const picker = pickerEnabled ? (
    isDesktop ? (
      pos != null &&
      createPortal(
        <div ref={cardRef} className={styles.pickerAnchor} style={{ top: pos.top, left: pos.left }}>
          <DatePicker
            breakpoint="desktop"
            open={pickerOpen}
            value={date}
            onChange={pickDate}
            onClose={closePicker}
            minDate={minDate}
            maxDate={maxDate}
            today={today}
          />
        </div>,
        document.body
      )
    ) : (
      // Mobile: the DRAWER — the DatePicker's own inner DateField (labelled
      // like this field) above the calendar, plus the Apply footer. Day taps
      // fill the inner field; Apply commits (onChange fires then) and closes;
      // dismissing the drawer discards.
      <DatePicker
        breakpoint="mobile"
        open={pickerOpen}
        value={date}
        onChange={pickDate}
        onClose={closePicker}
        minDate={minDate}
        maxDate={maxDate}
        today={today}
        label={effectivePickerLabel}
      />
    )
  ) : null;

  return (
    <div className={clsx(styles.root, g.rootClass, !g.grouped && g.disabled && styles.disabled, className)}>
      <label
        ref={fieldRef}
        className={clsx(styles.field, g.fieldClasses, showInvalid && styles.invalid, g.readOnly && styles.readOnly)}
        onClick={openPicker}
      >
        <input
          {...inputProps}
          className={styles.input}
          type="text"
          value={displayed}
          onChange={handleChange}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          // Mobile: the field only opens the calendar picker, so its input must
          // not focus at all — that's what popped the iOS "AutoFill" bubble.
          // preventDefault on pointerdown blocks the focus; the label's onClick
          // still fires and opens the picker.
          onPointerDown={mobileNoKeyboard ? (e) => e.preventDefault() : undefined}
          disabled={g.disabled}
          readOnly={g.readOnly || mobileNoKeyboard}
          // Keep iOS/1Password autofill off a date field (no autofill target).
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-1p-ignore="true"
          data-lpignore="true"
          data-form-type="other"
          aria-invalid={showInvalid || undefined}
        />
        {/* The calendar icon — identifies the input as a date input and opens
            the DatePicker. Read-only drops it (Figma). */}
        {!g.readOnly && (
          <span className={clsx(styles.calendar, date != null && styles.calendarFilled)}>
            <Icon icon="calendar" pack="regular" size={14} />
          </span>
        )}
      </label>
      {g.showOwnError && showInvalid && effectiveError != null && (
        <InputHelpText status="error" slotLeft>
          {effectiveError}
        </InputHelpText>
      )}
      {picker}
    </div>
  );
}
