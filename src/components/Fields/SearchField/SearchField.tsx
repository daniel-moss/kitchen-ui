import { ChangeEvent, forwardRef, MutableRefObject, useRef, useState } from "react";
import clsx from "clsx";

import { Icon } from "../../Icon/Icon";
import IconButton from "../../IconButton/IconButton";
import HoverTooltip from "../../Tooltip/HoverTooltip";
import { Divider } from "../../Divider/Divider";
import { Skeleton } from "../../Skeleton/Skeleton";

import styles from "./SearchField.module.scss";
import { SearchFieldProps } from "./SearchField.types";

// SearchField — a text search input with a leading search icon and a trailing
// "Clear" (×) button that appears once there is a value (hidden while
// disabled). `field` is a bordered 32px box (Clear = xs/24); `bar` is a filled
// 36px row with a bottom divider (Clear = sm/28). See Figma "SearchField".
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
    return <Skeleton width="100%" height={type === "bar" ? 37 : 32} borderRadius={type === "bar" ? 0 : "var(--border-radius-1_5)"} />;
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
        // via {...rest}.
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
            size={type === "bar" ? "sm" : "xs"}
            variant="muted"
            aria-label="Clear"
            onClick={handleClear}
          />
        </HoverTooltip>
      )}
    </div>
  );

  return (
    <div className={clsx(styles.wrapper, disabled && styles.disabled, className)}>
      {row}
      {type === "bar" && <Divider />}
    </div>
  );
});

export default SearchField;
