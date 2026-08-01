import { ChangeEvent, forwardRef, MutableRefObject, useEffect, useRef, useState } from "react";
import clsx from "clsx";

import CheckboxBox from "./CheckboxBox";
import boxStyles from "./CheckboxBox.module.scss";

import styles from "./Checkbox.module.scss";
import { CheckboxProps } from "./Checkbox.types";

// A 16px checkbox: a native (visually hidden) input overlaying the shared
// CheckboxBox visual. The whole 16px label is the `.control`, so hover/press/
// focus drive the box. See Figma "Checkbox".
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { checked, defaultChecked, indeterminate = false, error = false, disabled = false, loading = false, onChange, className, ...rest },
  ref,
) {
  const innerRef = useRef<HTMLInputElement | null>(null);
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(!!defaultChecked);
  const isChecked = isControlled ? !!checked : internal;

  // `indeterminate` is a DOM property, not an HTML attribute — reflect it.
  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const setRefs = (node: HTMLInputElement | null) => {
    innerRef.current = node;
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
        type="checkbox"
        className={styles.input}
        checked={isChecked}
        disabled={disabled || loading}
        onChange={handleChange}
        {...rest}
      />
      <CheckboxBox
        checked={isChecked}
        indeterminate={indeterminate}
        error={error}
        loading={loading}
        dimmed={disabled}
        interactive={interactive}
      />
    </label>
  );
});

export default Checkbox;
