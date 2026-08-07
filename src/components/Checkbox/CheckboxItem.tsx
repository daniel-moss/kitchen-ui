import { ChangeEvent, forwardRef, MutableRefObject, useEffect, useRef, useState } from "react";
import clsx from "clsx";

import { Icon } from "../Icon/Icon";
import { Divider } from "../Divider/Divider";
import CheckboxBox from "./CheckboxBox";
import boxStyles from "./CheckboxBox.module.scss";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";

import styles from "./CheckboxItem.module.scss";
import { CheckboxItemProps } from "./CheckboxItem.types";

// The full CheckboxItem. inline = a bare row (checkbox left); card = a bordered,
// selectable card (checkbox right) that turns "selected" when checked. The whole
// item is one control (a label with a hidden input), so clicking anywhere toggles
// and the row's hover/press/focus drive the shared CheckboxBox. See Figma.
const CheckboxItem = forwardRef<HTMLInputElement, CheckboxItemProps>(function CheckboxItem(
  {
    variant = "inline",
    label,
    caption,
    icon,
    iconPack = "solid",
    content,
    contentPadded = true,
    checked,
    defaultChecked,
    indeterminate = false,
    onChange,
    error = false,
    disabled = false,
    readOnly = false,
    loading = false,
    className,
    ...rest
  },
  ref,
) {
  const innerRef = useRef<HTMLInputElement | null>(null);
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(!!defaultChecked);
  const isChecked = isControlled ? !!checked : internal;
  const selected = isChecked || indeterminate;

  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const setRefs = (node: HTMLInputElement | null) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node;
  };

  const interactive = !disabled && !readOnly && !loading;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!interactive) return; // read-only / disabled / loading: no toggle
    if (!isControlled) setInternal(e.target.checked);
    onChange?.(e);
  };

  const copy = (
    <div className={styles.copy}>
      {icon && !loading && (
        <span className={styles.slotLeft}>
          <Icon icon={icon} pack={iconPack} size={14} />
        </span>
      )}
      <div className={styles.text}>
        {loading ? (
          <>
            <SkeletonTypography variant="bodyCompact" width="65%" />
            {caption && <SkeletonTypography variant="bodyCompact" width="45%" />}
          </>
        ) : (
          <>
            <span className={styles.label}>{label}</span>
            {caption && <span className={styles.caption}>{caption}</span>}
          </>
        )}
      </div>
    </div>
  );

  const box = (
    <span className={styles.checkboxOffset}>
      <CheckboxBox
        checked={isChecked}
        indeterminate={indeterminate}
        error={error}
        loading={loading}
        dimmed={disabled || readOnly}
        interactive={interactive}
      />
    </span>
  );

  return (
    <label
      className={clsx(
        styles.item,
        styles[variant],
        interactive && styles.interactive,
        interactive && boxStyles.control,
        variant === "inline" && interactive && boxStyles.ringOnBox,
        selected && !loading && styles.filled,
        error && styles.error,
        disabled && styles.disabled,
        readOnly && styles.readOnly,
        loading && styles.loading,
        className,
      )}
    >
      <input
        ref={setRefs}
        type="checkbox"
        className={styles.srInput}
        checked={isChecked}
        disabled={disabled || loading}
        readOnly={readOnly}
        onChange={handleChange}
        {...rest}
      />

      <div className={styles.top}>
        {variant === "inline" ? (
          <>
            {box}
            {copy}
          </>
        ) : (
          <>
            {copy}
            {box}
          </>
        )}
      </div>

      {variant === "card" && selected && !loading && content != null && (
        <>
          <Divider />
          {/* The slot sits inside the <label>, so a click on its non-interactive
              parts would otherwise toggle the CHECKBOX — only the header row
              may toggle. preventDefault ONLY for non-interactive targets: a
              blanket preventDefault would also cancel nested native controls
              (e.g. the status radios). */}
          <div
            className={clsx(styles.contentSlot, !contentPadded && styles.contentBare)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              // Nearest interactive ancestor — it must live INSIDE the slot to
              // count (closest("label") otherwise always finds the CheckboxItem's
              // own outer <label> and the guard never fires).
              const interactive = (e.target as Element).closest("input, label, button, a");
              if (interactive == null || !e.currentTarget.contains(interactive)) e.preventDefault();
            }}
          >
            {content}
          </div>
        </>
      )}
    </label>
  );
});

export default CheckboxItem;
