import { useState } from "react";

// Controlled-or-uncontrolled state, the pattern shared by every toggling
// component (MenuItem/ListItem toggle `checked`, ListItem/GroupLabel/
// DisplayModule accordion `open`): a defined `controlled` value wins;
// otherwise internal state applies. `set` updates the internal state (when
// uncontrolled) and always reports through `onChange`.
export default function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
) {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : internal;

  const set = (next: T) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  return [value, set] as const;
}
