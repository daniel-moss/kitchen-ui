import { CSSProperties, useRef } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

import useMountTransition from "../../hooks/useMountTransition";
import useIsDesktop from "../../hooks/useIsDesktop";
import useRestoreFocus from "../../hooks/useRestoreFocus";
import useFocusTrap from "../../hooks/useFocusTrap";
import Popover from "../Popover/Popover";
import { DrawerRootContext } from "../Popover/DrawerRootContext";
import PopoverFooter from "../Popover/PopoverFooter";
import Button from "../Button/Button";

import styles from "./Prompt.module.scss";
import { PromptProps } from "./Prompt.types";

// Enter/exit duration; keep in sync with the transitions in Prompt.module.scss.
const DURATION = 240;

// A small, non-dismissible confirmation modal built on Popover: a 440px centered
// card (desktop) or a bottom sheet (mobile) with a title + body and Cancel +
// action buttons. It can only be answered — no scrim tap, swipe, or close.
// See Figma "Prompt".
export default function Prompt({
  open,
  title,
  body,
  cancelLabel = "Cancel",
  onCancel,
  actionLabel,
  onAction,
  actionVariant = "solid",
  actionIcon,
  actionIconPack = "regular",
  actionIconPosition = "left",
  actionIconClassName,
  breakpoint = "auto",
  className,
}: PromptProps) {
  const onRight = actionIconPosition === "right";
  const { mounted, visible } = useMountTransition(open, DURATION);
  const isDesktop = useIsDesktop(breakpoint);
  const layerRef = useRef<HTMLDivElement>(null);

  // Focus is trapped inside (a prompt can only be answered — no Escape) and
  // returns to the trigger when it closes.
  useRestoreFocus(open, layerRef);
  useFocusTrap(layerRef, open);

  if (!mounted) return null;

  const content = (
    <div className={styles.body}>
      <p className={styles.title}>{title}</p>
      <div className={styles.text}>{body}</div>
    </div>
  );

  const footer = (
    <PopoverFooter
      leadingButton={
        <Button size="lg" variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
      }
    >
      <Button
        size="lg"
        variant={actionVariant}
        leftIcon={onRight ? undefined : actionIcon}
        leftIconPack={actionIconPack}
        leftIconClassName={onRight ? undefined : actionIconClassName}
        rightIcon={onRight ? actionIcon : undefined}
        rightIconPack={actionIconPack}
        rightIconClassName={onRight ? actionIconClassName : undefined}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </PopoverFooter>
  );

  if (!isDesktop) {
    // Mobile bottom sheet — non-dismissible, no header. Portals to body and
    // must stack above everything, so its drawer root is body too.
    return createPortal(
      <DrawerRootContext.Provider value={typeof document !== "undefined" ? document.body : null}>
        <div ref={layerRef} className={clsx(styles.fixedLayer, className)}>
          <Popover drawer open={visible} dismissible={false} footer={footer}>
            {content}
          </Popover>
        </div>
      </DrawerRootContext.Provider>,
      document.body,
    );
  }

  // Desktop centered card. Lighter shadow than the default Popover card (sm/down).
  const cardStyle: CSSProperties = {
    background: "var(--surface-level-first)",
    width: 440,
    maxWidth: "calc(100vw - var(--size-8))",
    boxShadow: "0 2px 5px 0 var(--box-shadow-shadow-default)",
  };

  return createPortal(
    // No scrim onClick — the prompt is non-dismissible.
    <div ref={layerRef} className={clsx(styles.scrim, visible && styles.scrimOpen, className)}>
      <Popover open={visible} footer={footer} style={cardStyle}>
        {content}
      </Popover>
    </div>,
    document.body,
  );
}
