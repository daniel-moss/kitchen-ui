import { ChangeEvent, forwardRef, MutableRefObject, useState } from "react";
import clsx from "clsx";

import RadioDot from "./RadioDot";
import boxStyles from "./RadioDot.module.scss";

import styles from "./Radio.module.scss";
import { RadioProps } from "./Radio.types";

// A 16px radio: a native (visually hidden) input overlaying the shared RadioDot
// visual. The whole 16px label is the `.control`, so hover/press/focus drive the
// dot. Mirrors Checkbox. See Figma "Radio".
const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { checked, defaultChecked, error = false, disabled = false, loading = false, onChange, className, ...rest },
  ref,
) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(!!defaultChecked);
  const isChecked = isControlled ? !!checked : internal;

  const setRefs = (node: HTMLInputElement | null) => {
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternal(e.target.checked);
    onChange?.(e);
  };

  const interactive = !disabled && !loading;

  return (
    <label
      className={clsx(
        styles.root,
        interactive && boxStyles.control,
        interactive && boxStyles.ringOnBox,
        disabled && styles.disabled,
        loading && styles.loading,
        className,
      )}
    >
      <input
        ref={setRefs}
        type="radio"
        className={styles.input}
        checked={isChecked}
        disabled={disabled || loading}
        onChange={handleChange}
        {...rest}
      />
      <RadioDot checked={isChecked} error={error} loading={loading} dimmed={disabled} interactive={interactive} />
    </label>
  );
});

export default Radio;
