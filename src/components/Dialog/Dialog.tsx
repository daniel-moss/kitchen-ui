import { CSSProperties, MouseEvent, ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

import useMountTransition from "../../hooks/useMountTransition";
import useIsDesktop from "../../hooks/useIsDesktop";
import useEscapeKey from "../../hooks/useEscapeKey";
import useRestoreFocus from "../../hooks/useRestoreFocus";
import useFocusTrap from "../../hooks/useFocusTrap";
import Popover from "../Popover/Popover";
import { DrawerRootContext } from "../Popover/DrawerRootContext";
import PopoverHeader from "../Popover/PopoverHeader";
import DrawerHeader from "../Popover/DrawerHeader";
import PopoverHeaderContent from "../Popover/PopoverHeaderContent";
import PopoverHeaderText from "../Popover/PopoverHeaderText";
import PopoverFooter from "../Popover/PopoverFooter";
import Button from "../Button/Button";
import EmptyState from "../EmptyState/EmptyState";
import HintTrigger from "../Hint/HintTrigger";
import HoverHint from "../Hint/HoverHint";
import Prompt from "../Prompt/Prompt";

import styles from "./Dialog.module.scss";
import { DialogProps, DialogState } from "./Dialog.types";

// Enter/exit duration; keep in sync with the transitions in Dialog.module.scss.
const DURATION = 240;

// The error / offline body states (EmptyState content).
const STATE_CONTENT: Record<Exclude<DialogState, "content">, {
  icon: string;
  title: string;
  caption: string;
  actionLabel: string;
}> = {
  error: {
    icon: "circle-xmark",
    title: "Hmm, something went wrong",
    caption: "An error occurred while fetching data",
    actionLabel: "Reload",
  },
  offline: {
    icon: "wifi-slash",
    title: "You're offline",
    caption: "Content will load once reconnected.",
    actionLabel: "Try again",
  },
};

// A modal built on Popover. default: a 608px centered card (desktop) or a drawer
// (mobile). focus: a near/full-screen multi-step flow. Dismissing can trigger a
// warning Prompt (opt-in via confirmOnDismiss — pass it only when there are
// unsaved changes; Daniel 2026-07-27: no prompt when nothing changed), and the
// body can show error / offline states. See Figma "Dialog".
export default function Dialog(props: DialogProps) {
  const {
    open,
    onClose,
    title,
    caption,
    captionLeftSlot,
    titleHint = false,
    titleHintContent,
    breakpoint = "auto",
    children,
    bodyPadded = true,
    errorMessage,
    state = "content",
    onRetry,
    confirmOnDismiss = false,
    dismissPrompt,
    className,
  } = props;

  const { mounted, visible } = useMountTransition(open, DURATION);
  const isDesktop = useIsDesktop(breakpoint);
  const [confirming, setConfirming] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);

  // ---- focus "scroll to the end before Next" gating (opt-in) ----
  const focusStep = props.type === "focus" ? props.currentStep : -1;
  const gateNext = props.type === "focus" && !!props.requireScrollToEnd;
  const focusBodyRef = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    if (!gateNext || !visible) {
      setAtEnd(true); // no gating → never blocks
      return;
    }
    const bodyEl = focusBodyRef.current;
    if (!bodyEl) return;
    // The scrolling ancestor is Popover's ScrollArea .scroller — find it by
    // walking up to the first overflow-y auto/scroll element.
    let sc: HTMLElement | null = bodyEl.parentElement;
    while (sc) {
      const oy = getComputedStyle(sc).overflowY;
      if (oy === "auto" || oy === "scroll") break;
      sc = sc.parentElement;
    }
    const scroller = sc ?? bodyEl;
    // Each step starts at the top; Next stays disabled until the user reaches
    // the bottom (or the content doesn't overflow).
    scroller.scrollTop = 0;
    const check = () => setAtEnd(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= 4);
    check();
    scroller.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(scroller);
    ro.observe(bodyEl);
    return () => {
      scroller.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, [gateNext, visible, focusStep]);

  const isStateView = state !== "content";
  // Only when asked (confirmOnDismiss = the consumer's "there are unsaved
  // changes" flag) — never in a state view (no progress to lose when content
  // failed to load).
  const requireConfirm = confirmOnDismiss && !isStateView;

  const attemptDismiss = () => {
    if (requireConfirm) setConfirming(true);
    else onClose();
  };

  // Overlay a11y — Escape dismisses (except while the warning Prompt is up:
  // it owns the keyboard and can only be answered), focus is trapped inside
  // the dialog, and returns to the trigger on close.
  useEscapeKey(open && !confirming, attemptDismiss);
  useRestoreFocus(open, layerRef);
  useFocusTrap(layerRef, open && !confirming);

  if (!mounted) return null;

  // The title's info icon. With content it opens a HoverHint (375px info
  // bubble) — the same pattern FormModule and Label use; bare, it is just the
  // trigger.
  const titleHintSlot =
    titleHintContent != null ? (
      <HoverHint caption={titleHintContent} width={375}>
        <HintTrigger />
      </HoverHint>
    ) : titleHint ? (
      <HintTrigger />
    ) : undefined;

  const titleContent = (
    <PopoverHeaderContent>
      <PopoverHeaderText
        variant={caption != null ? "titleCaption" : "title"}
        title={title}
        caption={caption}
        captionLeftSlot={captionLeftSlot}
        titleRightSlot={titleHintSlot}
      />
    </PopoverHeaderContent>
  );

  const errorSlot = errorMessage ? <div className={styles.errorSlot}>{errorMessage}</div> : null;

  // error / offline → an EmptyState in place of the body.
  const stateView = isStateView ? (
    <EmptyState
      error
      icon={STATE_CONTENT[state].icon}
      title={STATE_CONTENT[state].title}
      caption={STATE_CONTENT[state].caption}
      primaryAction={{ label: STATE_CONTENT[state].actionLabel, leftIcon: "arrows-rotate", onClick: onRetry }}
    />
  ) : null;

  const onScrimClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) attemptDismiss();
  };

  // The warning Prompt shown when a dismiss would lose progress. Rendered always
  // (Prompt handles its own mount) so it animates out; it portals above the dialog.
  const dismissPromptNode = (
    <Prompt
      open={confirming}
      title={dismissPrompt?.title ?? "Discard changes?"}
      body={dismissPrompt?.body ?? "Your changes will be lost if you leave now."}
      cancelLabel={dismissPrompt?.cancelLabel ?? "Keep editing"}
      onCancel={() => setConfirming(false)}
      actionLabel={dismissPrompt?.actionLabel ?? "Discard"}
      actionVariant="danger"
      onAction={() => {
        setConfirming(false);
        onClose();
      }}
      breakpoint={breakpoint}
    />
  );

  let dialogPortal: ReactNode;

  // ---- focus: multi-step, near-/full-screen, no drawer ----
  if (props.type === "focus") {
    const { stepGroup, currentStep, stepCount, onBack, onNext, onFinish, finalActionLabel, secondaryAction } = props;
    const isFirst = currentStep <= 0;
    const isLast = currentStep >= stepCount - 1;

    // No header divider — the StepItemGroup below provides the separation. The steps
    // are hidden in a state view.
    const header = (
      <>
        <PopoverHeader close onClose={attemptDismiss} divider={false}>
          {titleContent}
        </PopoverHeader>
        {!isStateView && stepGroup}
      </>
    );

    // Left: Cancel (first step) → Back. Right: Next (all but last) → final action.
    const footer = isStateView ? undefined : (
      <>
        {errorSlot}
        <PopoverFooter
          leadingButton={
            isFirst ? (
              <Button size="lg" variant="ghost" onClick={attemptDismiss}>
                Cancel
              </Button>
            ) : (
              <Button size="lg" variant="ghost" leftIcon="arrow-left" onClick={onBack}>
                Back
              </Button>
            )
          }
        >
          {secondaryAction}
          {isLast ? (
            <Button size="lg" variant="solid" isDisabled={gateNext && !atEnd} onClick={onFinish}>
              {finalActionLabel}
            </Button>
          ) : (
            <Button size="lg" variant="solid" rightIcon="arrow-right" isDisabled={gateNext && !atEnd} onClick={onNext}>
              Next
            </Button>
          )}
        </PopoverFooter>
      </>
    );

    const cardStyle: CSSProperties = {
      background: "var(--surface-level-first)",
      width: "100%",
      height: "100%",
      maxHeight: "none",
      ...(isDesktop
        ? null
        : {
            borderRadius: 0,
            paddingTop: "var(--dialog-safe-top, env(safe-area-inset-top, 0px))",
            paddingBottom: "var(--dialog-safe-bottom, env(safe-area-inset-bottom, 0px))",
          }),
    };

    dialogPortal = createPortal(
      <div
        ref={layerRef}
        className={clsx(styles.scrim, visible && styles.scrimOpen, isDesktop && styles.scrimFocus, className)}
        onClick={onScrimClick}
      >
        <Popover open={visible} header={header} footer={footer} style={cardStyle}>
          {isStateView ? stateView : <div ref={focusBodyRef} className={clsx(styles.focusBody, bodyPadded && styles.body)}>{children}</div>}
        </Popover>
      </div>,
      document.body,
    );
  } else {
    // ---- default: 608px card (desktop) / drawer (mobile) ----
    const { footer, subHeader, cardStyle: cardStyleOverride } = props;
    const footerRegion =
      isStateView || !(errorSlot || footer) ? undefined : (
        <>
          {errorSlot}
          {footer}
        </>
      );
    // The content slot carries the standard padding + gap (see Dialog.module.scss
    // .body) unless bodyPadded is false (full-bleed content). A state view
    // (error/offline EmptyState) fills the region itself.
    const body = isStateView ? stateView : bodyPadded ? <div className={styles.body}>{children}</div> : children;
    const subHeaderRegion = isStateView ? null : subHeader;

    if (!isDesktop) {
      const header = (
        <>
          <DrawerHeader variant="bodyOnly" close onClose={attemptDismiss}>
            {titleContent}
          </DrawerHeader>
          {subHeaderRegion}
        </>
      );
      dialogPortal = createPortal(
        <div ref={layerRef} className={clsx(styles.fixedLayer, className)}>
          <Popover
            drawer
            open={visible}
            onClose={attemptDismiss}
            dismissible={!requireConfirm}
            header={header}
            footer={footerRegion}
          >
            {body}
          </Popover>
        </div>,
        document.body,
      );
    } else {
      const header = (
        <>
          <PopoverHeader close onClose={attemptDismiss}>
            {titleContent}
          </PopoverHeader>
          {subHeaderRegion}
        </>
      );
      const cardStyle: CSSProperties = {
        background: "var(--surface-level-first)",
        width: 608, // Figma Dialog width (updated from 560 — Daniel, 2026-07-21)
        maxWidth: "calc(100vw - var(--size-8))",
        ...cardStyleOverride,
      };
      dialogPortal = createPortal(
        <div ref={layerRef} className={clsx(styles.scrim, visible && styles.scrimOpen, className)} onClick={onScrimClick}>
          <Popover open={visible} header={header} footer={footerRegion} style={cardStyle}>
            {body}
          </Popover>
        </div>,
        document.body,
      );
    }
  }

  // Everything the Dialog renders portals to <body> and must stack above the app
  // and any device frame. Override the drawer root to body so this Dialog's own
  // drawer AND any drawer opened from inside it (a SelectList search, etc.)
  // portal there — synchronously, which is what lets their focus open the iOS
  // keyboard inside the tap.
  return (
    <DrawerRootContext.Provider value={typeof document !== "undefined" ? document.body : null}>
      {dialogPortal}
      {dismissPromptNode}
    </DrawerRootContext.Provider>
  );
}
