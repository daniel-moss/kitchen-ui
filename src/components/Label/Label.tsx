import clsx from "clsx";

import HintTrigger from "../Hint/HintTrigger";
import HoverHint from "../Hint/HoverHint";

import styles from "./Label.module.scss";
import { LabelProps } from "./Label.types";

// A form field label. Two variants (subtle for input fields / default for
// checkboxes, toggles, radio items), an optional condition ("(optional)" /
// "(read-only)") and an optional hint trigger (info icon). See Figma "Label".
export default function Label({ children, variant = "default", condition, hintTrigger = false, hintContent, as: Comp = "label", className, ...rest }: LabelProps) {
  const conditionNode =
    condition === "optional" || condition === true
      ? "(optional)"
      : condition === "readOnly"
        ? "(read-only)"
        : condition;
  const showCondition = conditionNode != null && conditionNode !== false && conditionNode !== "";

  return (
    <Comp className={clsx(styles.root, styles[variant], className)} {...rest}>
      <span className={styles.text}>{children}</span>
      {showCondition && <span className={styles.condition}>{conditionNode}</span>}
      {/* With content, the trigger opens a HoverHint (375px info bubble —
          the fields-doc hints); bare `hintTrigger` keeps the plain icon.
          Either way it sits in the 20×20 centered box (a span — `as` can
          render the Label as a span, and a div inside one is invalid). */}
      {hintContent != null ? (
        <span className={styles.hintBox}>
          <HoverHint caption={hintContent} width={375}>
            <HintTrigger />
          </HoverHint>
        </span>
      ) : (
        hintTrigger && (
          <span className={styles.hintBox}>
            <HintTrigger />
          </span>
        )
      )}
    </Comp>
  );
}
