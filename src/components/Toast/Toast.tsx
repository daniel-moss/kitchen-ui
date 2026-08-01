import clsx from "clsx";

import { Icon } from "../Icon/Icon";
import IconButton from "../IconButton/IconButton";
import LinkButton from "../LinkButton/LinkButton";

import styles from "./Toast.module.scss";
import { ToastProps, ToastType } from "./Toast.types";

// Fixed per type (solid). Only neutral's icon may be overridden.
const TYPE_ICON: Record<ToastType, string> = {
  neutral: "circle-question",
  processing: "spinner-third",
  success: "circle-check",
  informative: "circle-info",
  warning: "triangle-exclamation",
  error: "circle-xmark",
};

// Toast — the system-response chip (Figma "Toast"). This is the VISUAL only:
// the Toaster that positions, stacks and auto-dismisses toasts is a separate
// component (next step). Default = one row; detailed = top-aligned copy block
// with an optional caption and up to two CTAs. See Figma docs "Toast".
export default function Toast(props: ToastProps) {
  const { type, title, cta, icon, isDismissible = true, onDismiss, className } = props;
  const variant = props.variant ?? "default";

  const iconName = type === "neutral" && icon != null ? icon : TYPE_ICON[type];
  const statusIcon = (
    <Icon
      icon={iconName}
      pack="solid"
      size={14}
      container="square"
      spin={type === "processing"}
      className={styles.icon}
    />
  );

  // 22px muted × — extra touch area per the docs (the CTA LinkButton already
  // carries its own +8px hit area).
  const dismiss = isDismissible ? (
    <IconButton
      icon="xmark"
      size="xxs"
      variant="muted"
      aria-label="Dismiss"
      className={styles.dismiss}
      onClick={onDismiss}
      noDebounce
    />
  ) : null;

  if (props.variant === "detailed") {
    const { caption, secondaryCta } = props;
    return (
      <div className={clsx(styles.toast, styles.detailed, styles[type], className)} role="status">
        {/* The offset box centers the icon on the title's first line (22px). */}
        <div className={styles.iconOffset}>{statusIcon}</div>
        <div className={styles.copyAndCtas}>
          <div className={styles.copy}>
            <div className={styles.title}>{title}</div>
            {caption != null && <div className={styles.caption}>{caption}</div>}
          </div>
          {(cta != null || secondaryCta != null) && (
            <div className={styles.ctas}>
              {cta != null && <LinkButton size="md" colorScheme="black" {...cta} />}
              {secondaryCta != null && <LinkButton size="md" colorScheme="black" {...secondaryCta} />}
            </div>
          )}
        </div>
        {dismiss}
      </div>
    );
  }

  return (
    <div className={clsx(styles.toast, styles.default, styles[type], className)} role="status">
      {statusIcon}
      <div className={clsx(styles.title, styles.grow)}>{title}</div>
      {cta != null && (
        <div className={styles.ctaMargins}>
          <LinkButton size="md" colorScheme="black" {...cta} />
        </div>
      )}
      {dismiss}
    </div>
  );
}
