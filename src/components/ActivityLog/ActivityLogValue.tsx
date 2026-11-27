import styles from "./ActivityLogValue.module.scss";
import { ActivityLogValueProps } from "./ActivityLogValue.types";

// ActivityLogValue — a value with its own icon or avatar inside a log sentence
// or a sub-log ("Priority: [icon] Medium → [icon] High"). DS doc "Log":
//  · the icon sits before its value and the two never break across two lines;
//  · the 6px space BEFORE the icon belongs to the text before it, not to the
//    icon — so when the pair wraps, the icon starts the new line flush and the
//    space stays at the end of the line above (Figma "Text Margins").
// A value without an icon renders its text alone.
export default function ActivityLogValue({
  icon,
  iconColor,
  isLeading = false,
  isWhole = false,
  children,
  className,
  ...rest
}: ActivityLogValueProps) {
  if (icon == null) {
    return (
      <span className={className} {...rest}>
        {children}
      </span>
    );
  }

  // Only the icon and the FIRST word are kept together — a long value (a time
  // session's "Working: Mon, Jan 1 at 11:30 AM → …") must still wrap.
  let head = children;
  let tail: string | null = null;
  // A person's name stays whole with its avatar (`isWhole`).
  if (typeof children === "string" && !isWhole) {
    const space = children.indexOf(" ");
    if (space > 0) {
      head = children.slice(0, space);
      tail = children.slice(space);
    }
  }

  return (
    <span className={className} {...rest}>
      {/* The space before the icon. An inline-block BEFORE the unbreakable
          pair, so a line break falls after it and it stays on the line above. */}
      {!isLeading && <span className={styles.gap} aria-hidden="true" />}
      <span className={styles.pair}>
        <span
          className={styles.icon}
          aria-hidden="true"
          // A removed value overrides the tint through the custom property.
          style={iconColor ? { color: `var(--activity-log-value-icon, ${iconColor})` } : undefined}
        >
          {icon}
        </span>
        {head}
      </span>
      {tail}
    </span>
  );
}
