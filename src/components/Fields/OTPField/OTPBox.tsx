import { forwardRef } from "react";
import clsx from "clsx";

import styles from "./OTPBox.module.scss";
import { OTPBoxProps } from "./OTPBox.types";

// OTPBox — one digit cell of an OTPField (Figma "#️⃣ Input"): a centered
// single-character <input> in the shared input-box chrome. An empty cell shows
// a "–" placeholder; the focused cell hides the dash and shows the caret
// (active border). Presentational — OTPField owns the value, focus movement,
// paste distribution and validation.
const OTPBox = forwardRef<HTMLInputElement, OTPBoxProps>(function OTPBox(
  { value = "", isValid = true, className, ...rest },
  ref,
) {
  return (
    <input
      {...rest}
      ref={ref}
      value={value}
      placeholder="–"
      className={clsx(styles.box, !isValid && styles.invalid, className)}
    />
  );
});

export default OTPBox;
