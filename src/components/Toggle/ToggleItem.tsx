import { ChangeEvent, forwardRef, useState } from "react";
import clsx from "clsx";

import Label from "../Label/Label";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";
import ToggleSwitch from "./ToggleSwitch";
import switchStyles from "./ToggleSwitch.module.scss";

import styles from "./ToggleItem.module.scss";
import { ToggleItemProps } from "./ToggleItem.types";

// The full ToggleItem — a bare row with the toggle on the left and a Label (plus
// optional caption) on the right. The whole item is one control (a label with a
// hidden input), so clicking anywhere toggles and the row's hover/press/focus
// drive the shared ToggleSwitch. See Figma "ToggleItem".
const ToggleItem = forwardRef<HTMLInputElement, ToggleItemProps>(function ToggleItem(
  { label, caption, checked, defaultChecked, onChange, error = false, disabled = false, readOnly = false, loading = false, className, ...rest },
  ref,
) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(!!defaultChecked);
  const isChecked = isControlled ? !!checked : internal;

  const interactive = !disabled && !readOnly && !loading;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!interactive) return; // read-only / disabled / loading: no toggle
    if (!isControlled) setInternal(e.target.checked);
    onChange?.(e);
  };

  return (
    <label
      className={clsx(
        styles.item,
        interactive && switchStyles.control,
        error && styles.error,
        disabled && styles.disabled,
        readOnly && styles.readOnly,
        loading && styles.loading,
        className,
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        className={styles.srInput}
        checked={isChecked}
        disabled={disabled || loading}
        readOnly={readOnly}
        onChange={handleChange}
        {...rest}
      />

      <ToggleSwitch checked={isChecked} error={error} loading={loading} dimmed={disabled || readOnly} interactive={interactive} />

      <div className={styles.text}>
        {loading ? (
          <>
            <SkeletonTypography variant="bodyCompact" width="55%" />
            {caption && <SkeletonTypography variant="bodyCompact" width="40%" />}
          </>
        ) : (
          <>
            <Label as="span" variant="default" className={styles.label}>
              {label}
            </Label>
            {caption && <span className={styles.caption}>{caption}</span>}
          </>
        )}
      </div>
    </label>
  );
});

export default ToggleItem;
