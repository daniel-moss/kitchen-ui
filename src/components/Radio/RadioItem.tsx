import { ChangeEvent, forwardRef, MutableRefObject, useState } from "react";
import clsx from "clsx";

import { Icon } from "../Icon/Icon";
import { Divider } from "../Divider/Divider";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";
import RadioDot from "./RadioDot";
import boxStyles from "./RadioDot.module.scss";

import styles from "./RadioItem.module.scss";
import { RadioItemProps } from "./RadioItem.types";

// The full RadioItem. inline = a bare row (radio left); card = a bordered,
// selectable card (radio right) that turns "selected" when checked. The whole
// item is one control (a label with a hidden radio input). Mirrors CheckboxItem.
const RadioItem = forwardRef<HTMLInputElement, RadioItemProps>(function RadioItem(
  {
    variant = "inline",
    label,
    caption,
    icon,
    iconColor,
  iconPack = "solid",
    content,
    checked,
    defaultChecked,
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
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(!!defaultChecked);
  const isChecked = isControlled ? !!checked : internal;

  const setRefs = (node: HTMLInputElement | null) => {
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node;
  };

  const interactive = !disabled && !readOnly && !loading;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!interactive) return;
    if (!isControlled) setInternal(e.target.checked);
    onChange?.(e);
  };

  const copy = (
    <div className={styles.copy}>
      {icon && !loading && (
        <span className={styles.slotLeft} style={iconColor ? { color: iconColor } : undefined}>
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

  const dot = (
    <span className={styles.radioOffset}>
      <RadioDot checked={isChecked} error={error} loading={loading} dimmed={disabled || readOnly} interactive={interactive} />
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
        isChecked && !loading && styles.filled,
        error && styles.error,
        disabled && styles.disabled,
        readOnly && styles.readOnly,
        loading && styles.loading,
        className,
      )}
    >
      <input
        ref={setRefs}
        type="radio"
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
            {dot}
            {copy}
          </>
        ) : (
          <>
            {copy}
            {dot}
          </>
        )}
      </div>

      {variant === "card" && isChecked && !loading && content != null && (
        <>
          <Divider />
          {/* The reveal slot holds its OWN interactive content (e.g. a SelectField).
              It sits inside the <label>, so a click here would otherwise activate the
              radio and steal focus (e.g. from a SelectList search that just opened —
              the "focuses only on the 2nd try" bug). Keep clicks out of the label. */}
          <div
            className={styles.contentSlot}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            {content}
          </div>
        </>
      )}
    </label>
  );
});

export default RadioItem;
