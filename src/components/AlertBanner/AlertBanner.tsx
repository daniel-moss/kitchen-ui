import { CSSProperties } from "react";
import clsx from "clsx";

import { Icon } from "../Icon/Icon";
import LinkButton from "../LinkButton/LinkButton";
import IconButton from "../IconButton/IconButton";
import { LinkButtonColorScheme } from "../LinkButton/LinkButton.types";

import styles from "./AlertBanner.module.scss";
import { AlertBannerProps, AlertBannerStatus } from "./AlertBanner.types";

// Per status: the LinkButton scheme + the solid status icon.
const STATUS: Record<AlertBannerStatus, { scheme: LinkButtonColorScheme; icon: string }> = {
  info: { scheme: "blue", icon: "circle-info" },
  success: { scheme: "jade", icon: "circle-check" },
  warning: { scheme: "amber", icon: "triangle-exclamation" },
  error: { scheme: "tomato", icon: "circle-xmark" },
};

// An inline alert colored entirely by `status`. Reuses Icon (status glyph),
// LinkButton (CTA), and a muted IconButton (dismiss). See
// Kitchen UI/components/alert-banner.md.
export default function AlertBanner({
  children,
  type = "card",
  orientation = "horizontal",
  status = "info",
  ctaLabel,
  ctaHref,
  ctaOnClick,
  ctaIcon,
  onDismiss,
  className,
  ...rest
}: AlertBannerProps) {
  const { scheme, icon } = STATUS[status];

  const cta = ctaLabel ? (
    <span className={styles.cta}>
      <LinkButton size="md" colorScheme={scheme} leftIcon={ctaIcon} href={ctaHref} onClick={ctaOnClick}>
        {ctaLabel}
      </LinkButton>
    </span>
  ) : null;

  return (
    <div
      className={clsx(styles.alert, styles[type], styles[orientation], styles[status], className)}
      {...rest}
    >
      <span className={styles.icon}>
        <Icon icon={icon} pack="solid" size={14} />
      </span>

      <div className={styles.body}>
        <span className={styles.text}>{children}</span>
        {orientation === "vertical" && cta}
      </div>

      {orientation === "horizontal" && cta}

      {onDismiss && (
        <IconButton
          className={styles.dismiss}
          variant="muted"
          size="xxs"
          icon="xmark"
          aria-label="Dismiss"
          onClick={onDismiss}
          // Resting = status a9; hover / press / focus keep the status color
          // (a11, = --al-fg) instead of reverting to the muted gray.
          style={
            {
              "--ibtn-fg": "var(--al-dismiss)",
              "--ibtn-fg-hover": "var(--al-fg)",
            } as CSSProperties
          }
        />
      )}
    </div>
  );
}
