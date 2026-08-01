import clsx from "clsx";

import HintTrigger from "../Hint/HintTrigger";
import HoverHint from "../Hint/HoverHint";

import styles from "./FormModule.module.scss";
import { FormModuleProps } from "./FormModule.types";

// FormModule — a form section: a header (title + optional caption + optional
// info banner) above a body slot of fields. Used to group related inputs in a
// form (e.g. "Scheduling" → Date & time + Duration). The title is the module's
// own part (heading/h3, Semibold 15/24 — the old Label "strong/solid" variant
// moved here). See Figma "FormModule".
export default function FormModule({
  title,
  titleCondition,
  titleHint = false,
  titleHintContent,
  caption,
  banner,
  children,
  className,
}: FormModuleProps) {
  // "optional" / true → "(optional)"; any other node passes through. ("readOnly"
  // is not applicable to a form section — the type excludes it.)
  const conditionNode = titleCondition === "optional" || titleCondition === true ? "(optional)" : titleCondition;
  const showCondition = conditionNode != null && conditionNode !== false && conditionNode !== "";

  return (
    <section className={clsx(styles.module, className)}>
      <div className={styles.header}>
        <div className={styles.content}>
          <div className={styles.title}>
            <span className={styles.titleText}>{title}</span>
            {showCondition && <span className={styles.condition}>{conditionNode}</span>}
            {titleHintContent != null ? (
              // With content, the trigger opens a HoverHint (375px info
              // bubble) — same pattern as Label's hintContent. The 24px
              // container is the hover target.
              <HoverHint caption={titleHintContent} width={375} className={styles.hintTriggerContainer}>
                <HintTrigger />
              </HoverHint>
            ) : (
              titleHint && (
                <span className={styles.hintTriggerContainer}>
                  <HintTrigger />
                </span>
              )
            )}
          </div>
          {caption != null && <p className={styles.caption}>{caption}</p>}
        </div>
        {banner != null && banner}
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
