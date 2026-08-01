import clsx from "clsx";

import styles from "./StrengthIndicator.module.scss";
import { StrengthIndicatorProps, StrengthIndicatorState } from "./StrengthIndicator.types";

const STATE_TEXT: Record<StrengthIndicatorState, string> = {
  weak: "Weak",
  average: "Average",
  strong: "Strong",
  excellent: "Excellent",
};

// StrengthIndicator — the password-strength readout shown at the right edge of
// an Input's label (used with PasswordField): the state word + a 56×4 progress
// bar filled 1/4 → full in the state's color. The strength VALUE comes from the
// consumer — no strength logic lives here. Independent from PasswordField's
// condition badges (the docs: a password can be weak but meet all requirements
// and vice-versa). See Figma "StrengthIndicator".
export default function StrengthIndicator({ state, className }: StrengthIndicatorProps) {
  return (
    <span className={clsx(styles.indicator, styles[state], className)}>
      <span className={styles.text}>{STATE_TEXT[state]}</span>
      <span className={styles.bar}>
        <span className={styles.fill} />
      </span>
    </span>
  );
}
