import { ChangeEvent, forwardRef, MutableRefObject, useRef, useState } from "react";
import clsx from "clsx";

import { Icon } from "../../Icon/Icon";
import IconButton from "../../IconButton/IconButton";
import HoverTooltip from "../../Tooltip/HoverTooltip";
import { Skeleton } from "../../Skeleton/Skeleton";

import styles from "./SearchField.module.scss";
import { SearchFieldProps } from "./SearchField.types";

// SearchField — a text search input with a leading search icon and a trailing
// "Clear" (×) button that appears once there is a value (hidden while
// disabled). `field` is a bordered 36px box with a `--gray-a2` fill
// (Clear = sm/28); `bar` is a bare 40px row — no fill, no border and no
// divider (Clear = md/32). See Figma "SearchField" (node 24657-19070).
const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { type = "field", value, defaultValue, placeholder, disabled = false, loading = false, onClear, onChange, className, ...rest },
  ref,
) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = isControlled ? value : internal;
  const filled = (current ?? "").length > 0;

  const innerRef = useRef<HTMLInputElement | null>(null);
  const setRefs = (node: HTMLInputElement | null) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternal(e.target.value);
    onChange?.(e);
  };
  const handleClear = () => {
    if (!isControlled) setInternal("");
    onClear?.();
    innerRef.current?.focus();
  };

  if (loading) {
    return <Skeleton width="100%" height={type === "bar" ? 40 : 36} borderRadius={type === "bar" ? 0 : "var(--border-radius-1_5)"} />;
  }

  const row = (
    <div className={clsx(styles.row, styles[type], filled && styles.filled)}>
      <span className={styles.icon}>
        <Icon icon="search" pack="regular" size={14} />
      </span>
      <input
        ref={setRefs}
        type="search"
        className={styles.input}
        value={current}
        placeholder={placeholder}
        disabled={disabled}
        // Keep autofill + password managers off a search field (they otherwise
        // pop a "save/fill password" prompt that sticks). Consumers can override
        // via {...rest}. The neutral `name` matters as much as the attributes:
        // Chrome/Safari classify a field as a user name from its name/id AND
        // its placeholder, and they ignore autocomplete="off" once they have.
        name="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-1p-ignore="true"
        data-lpignore="true"
        data-form-type="other"
        onChange={handleChange}
        {...rest}
      />
      {filled && !disabled && (
        <HoverTooltip text="Clear" className={styles.clearWrap}>
          <IconButton
            iconClassName={styles.clearIcon}
            icon="circle-xmark"
            iconPack="solid"
            size={type === "bar" ? "md" : "sm"}
            variant="muted"
            aria-label="Clear"
            onClick={handleClear}
          />
        </HoverTooltip>
      )}
    </div>
  );

  return <div className={clsx(styles.wrapper, disabled && styles.disabled, className)}>{row}</div>;
});

export default SearchField;
