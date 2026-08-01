import { ChangeEvent, forwardRef, useState } from "react";
import clsx from "clsx";

import ToggleSwitch from "./ToggleSwitch";
import switchStyles from "./ToggleSwitch.module.scss";

import styles from "./Toggle.module.scss";
import { ToggleProps } from "./Toggle.types";

// A 34×22 switch: a native (visually hidden) input overlaying the shared
// ToggleSwitch visual. The whole label is the `.control`, so hover/press/focus
// drive the track. `role="switch"` makes it an on/off control to AT. See Figma
// "Toggle".
const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  { checked, defaultChecked, error = false, disabled = false, loading = false, onChange, className, ...rest },
  ref,
) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(!!defaultChecked);
  const isChecked = isControlled ? !!checked : internal;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternal(e.target.checked);
    onChange?.(e);
  };

  const interactive = !disabled && !loading;

  return (
    <label className={clsx(styles.root, interactive && switchStyles.control, disabled && styles.disabled, loading && styles.loading, className)}>
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        className={styles.input}
        checked={isChecked}
        disabled={disabled || loading}
        onChange={handleChange}
        {...rest}
      />
      <ToggleSwitch checked={isChecked} error={error} loading={loading} dimmed={disabled} interactive={interactive} />
    </label>
  );
});

export default Toggle;
