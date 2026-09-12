import { cloneElement, isValidElement, KeyboardEvent, MouseEvent, PointerEvent as ReactPointerEvent, ReactElement, useContext, useEffect, useRef } from "react";
import clsx from "clsx";

import { Icon } from "../Icon/Icon";
import CheckboxBox from "../Checkbox/CheckboxBox";
import IconButton from "../IconButton/IconButton";
import { shieldSynthesizedClick } from "../../utils/tapShield";
import { SelectListContext } from "./SelectList";
import SelectListItemContent from "./SelectListItemContent";
import { SelectListItemContentProps } from "./SelectListItemContent.types";

import styles from "./SelectListItem.module.scss";
import { SelectListItemProps } from "./SelectListItem.types";

// Touch taps activate on POINTERUP (immediate, correct target); the click iOS
// synthesizes ~300ms later carries a STALE hit-test and can land on a DIFFERENT
// option — tapping two adjacent options then registered the second on the first.
// After a touch tap we swallow that synthesized click GLOBALLY (module-scoped,
// so it covers whichever wrong option it lands on). Mirrors ListItem.
let suppressClicksUntil = 0;

// SelectListItem — a selectable option row for a select menu. Single-select shows
// a check-circle on the right when selected; multi-select shows a checkbox on the
// left; counter is a quantity row — the row click adds a copy, and while count > 0
// the count renders in the tag position with a 24px circle-minus decrement button.
// Drives hover / press / focus / disabled row states. Variants: default (compact
// text row) and object (60px avatar row with left/right copy blocks). See Figma
// "SelectListItem".
export default function SelectListItem({
  variant = "default",
  label,
  searchText: _searchText, // consumed by SelectList's search filter, not rendered
  caption,
  captionPlaceholder,
  tag,
  slotLeft,
  avatar,
  select,
  multiSelect = false,
  selected = false,
  count,
  onDecrement,
  disabled = false,
  readOnly = false,
  reversed = false,
  rightTitle,
  rightCaption,
  rightReversed = false,
  className,
  onClick,
  ...rest
}: SelectListItemProps) {
  const isObject = variant === "object";
  // `multiSelect` is the deprecated alias for select="multi".
  const mode = select ?? (multiSelect ? "multi" : "single");
  const isCounter = mode === "counter";
  const counterCount = isCounter ? (count ?? 0) : 0;
  // A counter row is "selected" while it holds at least one copy.
  const isSelected = isCounter ? counterCount > 0 : selected;
  // readOnly exists for MULTI-SELECT only — Figma draws no such variant for a
  // single or counter row, and neither has a checkbox to dim, so the state
  // would have nothing to show. TypeScript cannot express "this prop only with
  // that mode" here (the deprecated `multiSelect` alias also picks the mode), so
  // it is a runtime check — the same approach as ListItem's
  // CONTROLS_BLOCKING_CLICK warning.
  const isReadOnly = readOnly && mode === "multi";
  const readOnlyMisused = readOnly && !isReadOnly;
  useEffect(() => {
    if (readOnlyMisused) {
      console.warn(`SelectListItem: \`readOnly\` is multi-select only — ignored on select="${mode}".`);
    }
  }, [readOnlyMisused, mode]);
  // Both states switch the row off; only `disabled` also dims it.
  const inert = disabled || isReadOnly;
  // Inside a SelectList, every option click is reported — a single-select
  // list closes itself in response (multi-select stays open).
  const selectListCtx = useContext(SelectListContext);
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    onClick?.(e);
    selectListCtx?.notifySelect();
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(e as unknown as MouseEvent<HTMLDivElement>);
    }
  };

  // Touch path: activate on pointerup (correct target) and suppress the stale
  // click that follows. Mouse path (below) still activates on click.
  const touchStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") touchStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    const start = touchStart.current;
    touchStart.current = null;
    if (start == null || start.id !== e.pointerId) return;
    if (Math.abs(e.clientX - start.x) > 10 || Math.abs(e.clientY - start.y) > 10) return; // a scroll, not a tap
    suppressClicksUntil = Date.now() + 700;
    // …and stop that same synthesized click from reaching anything ELSE. A
    // single-select row closes its list, so the click would otherwise land on
    // whatever the list was covering and activate it.
    shieldSynthesizedClick();
    handleClick(e as unknown as MouseEvent<HTMLDivElement>);
  };
  const handleRowClick = (e: MouseEvent<HTMLDivElement>) => {
    if (Date.now() < suppressClicksUntil) return; // already handled on pointerup
    handleClick(e);
  };

  // caption / tag are mutually exclusive; re-wrap for the content's union.
  // In counter mode the COUNT is the tag (counter rows have no static tag and
  // no caption — see the types).
  // A bare Icon in the left slot is forced into the SQUARE container so the
  // slot has one size whatever glyph is used (same rule as MenuItem).
  const squaredSlotLeft =
    isValidElement(slotLeft) && slotLeft.type === Icon
      ? cloneElement(slotLeft as ReactElement<{ container?: string }>, { container: "square" })
      : slotLeft;
  const effectiveTag = isCounter ? (counterCount > 0 ? counterCount : undefined) : tag;
  // Default-variant counter rows support no caption (Daniel's rule); the
  // object variant keeps its title + caption structure in every mode.
  const effectiveCaption = isCounter && !isObject ? undefined : caption;
  const contentProps = { slotLeft: squaredSlotLeft, label, caption: effectiveCaption, tag: effectiveTag } as SelectListItemContentProps;

  // The object row's caption, or — where there is no value — its PLACEHOLDER,
  // dimmed to --text-placeholder. The ListItem Template copy doc's standard
  // empty behaviour: "The placeholder is shown if the value is missing"
  // (Figma 27171-15212). A row with neither renders no caption line at all.
  const objectCaption =
    caption != null ? (
      <span className={styles.objectCaption}>{caption}</span>
    ) : captionPlaceholder != null ? (
      <span className={clsx(styles.objectCaption, styles.objectCaptionEmpty)}>{captionPlaceholder}</span>
    ) : null;

  // The object copy: Slot Left (title/caption, flex-1) + optional Slot Right
  // (right-aligned title/caption block, or the tag/count). `reversed` flips a
  // block to caption-above-title (Figma titleCaptionReversed).
  const objectRight =
    effectiveTag != null ? (
      <span className={styles.objectTag}>{effectiveTag}</span>
    ) : rightTitle != null || rightCaption != null ? (
      rightReversed ? (
        <>
          {rightCaption != null && <span className={styles.objectRightCaption}>{rightCaption}</span>}
          {rightTitle != null && <span className={styles.objectRightTitle}>{rightTitle}</span>}
        </>
      ) : (
        <>
          {rightTitle != null && <span className={styles.objectRightTitle}>{rightTitle}</span>}
          {rightCaption != null && <span className={styles.objectRightCaption}>{rightCaption}</span>}
        </>
      )
    ) : null;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      // A read-only option cannot be chosen either, so it carries the same
      // attribute — which is also what keeps SelectList's arrow keys and its
      // "highlight the first match" from ever landing on it (both query
      // `[role="option"]:not([aria-disabled="true"])`).
      aria-disabled={inert || undefined}
      tabIndex={inert ? undefined : 0}
      className={clsx(
        styles.item,
        isObject ? styles.object : styles.default,
        mode === "multi" ? styles.multi : mode === "counter" ? styles.counter : styles.single,
        isSelected && styles.selected,
        disabled && styles.disabled,
        isReadOnly && styles.readOnly,
        className,
      )}
      onClick={inert ? undefined : handleRowClick}
      onPointerDown={inert ? undefined : handlePointerDown}
      onPointerUp={inert ? undefined : handlePointerUp}
      onKeyDown={inert ? undefined : handleKeyDown}
      {...rest}
    >
      {mode === "multi" && (
        <span className={styles.checkbox}>
          {/* readOnly dims the CHECKBOX and nothing else — the copy stays
              readable. `disabled` needs no `dimmed`: the whole row is already
              at 40%, and dimming twice would darken the box against it. */}
          <CheckboxBox checked={isSelected} interactive={false} dimmed={isReadOnly} />
        </span>
      )}

      {isObject ? (
        <>
          {avatar != null && <span className={styles.avatar}>{avatar}</span>}
          <div className={styles.objectCopy}>
            <div className={styles.objectLeft}>
              {reversed ? (
                <>
                  {objectCaption}
                  <span className={styles.objectTitle}>{label}</span>
                </>
              ) : (
                <>
                  <span className={styles.objectTitle}>{label}</span>
                  {objectCaption}
                </>
              )}
            </div>
            {objectRight != null && <div className={styles.objectRight}>{objectRight}</div>}
          </div>
        </>
      ) : (
        <SelectListItemContent className={styles.content} {...contentProps} />
      )}

      {mode === "single" && isSelected && (
        <span className={styles.check}>
          <Icon icon="circle-check" pack="solid" size={16} />
        </span>
      )}

      {isCounter && counterCount > 0 && (
        // The guard span keeps the minus from ALSO activating the row: the row
        // activates on click AND on touch pointerup, and Enter/Space are
        // handled at the row level — none of those may bubble out of here.
        <span
          className={styles.minusGuard}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") e.stopPropagation();
          }}
        >
          <IconButton
            icon="circle-minus"
            iconPack="solid"
            variant="ghost"
            size="xs"
            aria-label={typeof label === "string" ? `Remove one "${label}"` : "Remove one"}
            noDebounce
            isDisabled={disabled}
            onClick={onDecrement}
          />
        </span>
      )}
    </div>
  );
}
