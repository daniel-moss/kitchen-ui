import { ReactNode, useContext, useRef } from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";

import Dialog from "../../../components/Dialog/Dialog";
import Popover from "../../../components/Popover/Popover";
import PopoverHeader from "../../../components/Popover/PopoverHeader";
import PopoverHeaderContent from "../../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../../components/Popover/PopoverHeaderText";
import { DrawerRootContext } from "../../../components/Popover/DrawerRootContext";
import useEscapeKey from "../../../hooks/useEscapeKey";
import useFocusTrap from "../../../hooks/useFocusTrap";
import useIsDesktop from "../../../hooks/useIsDesktop";
import useMountTransition from "../../../hooks/useMountTransition";
import useRestoreFocus from "../../../hooks/useRestoreFocus";

import styles from "./ScanSurface.module.scss";

// The shell the "Scan" form lives in — a MODULE-LOCAL surface, not a DS
// component (Daniel, 2026-10-13: "the drawer is not fine… is it possible to
// build it as a custom solution?").
//
// Desktop is the ordinary Dialog: a 608px card. MOBILE is where the design
// leaves the DS: the node (Figma 4019-12190) draws a FULL-SCREEN surface —
// Popover 375×812, radius 0, a PopoverHeader with the close button, the body,
// the footer — not the bottom drawer `Dialog type="default"` gives a phone. The
// DS has that presentation only on `Dialog type="focus"`, which forces a
// stepped flow and writes its own footer, so neither type fits.
//
// So the mobile branch is assembled here from the SAME parts the focus Dialog
// uses — Popover + PopoverHeader + PopoverFooter, the overlay hooks, the drawer
// root — sized full-screen with the safe-area insets. Nothing in the DS
// changed; if a full-screen mobile dialog is ever wanted elsewhere, this is the
// build to move into Dialog.
//
// The camera is why the drawer is wrong, by the way: a sheet that hugs its
// content leaves the viewfinder a few hundred pixels, and the viewfinder IS
// the screen here.

/** Keep in sync with Dialog's DURATION — both play the same open/close. */
const DURATION = 240;

export interface ScanSurfaceProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** A PopoverFooter — the same node on both breakpoints. */
  footer: ReactNode;
  children: ReactNode;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function ScanSurface({ open, onClose, title, footer, children, breakpoint = "auto" }: ScanSurfaceProps) {
  const isDesktop = useIsDesktop(breakpoint);
  const { mounted, visible } = useMountTransition(open, DURATION);
  const layerRef = useRef<HTMLDivElement>(null);

  // Where the full-screen surface renders: <body> normally, or the container
  // that provides a drawer root (a Storybook device frame), in which case the
  // layer is positioned against that container instead of the viewport. Same
  // rule as Dialog and SidePanel.
  const ctxRoot = useContext(DrawerRootContext);
  const body = typeof document === "undefined" ? null : document.body;
  const root = ctxRoot ?? body;
  const contained = root != null && root !== body;

  // Overlay a11y, on the mobile branch only (Dialog brings its own).
  const overlayActive = open && !isDesktop;
  useEscapeKey(overlayActive, onClose);
  useRestoreFocus(overlayActive, layerRef);
  useFocusTrap(layerRef, overlayActive);

  if (isDesktop) {
    return (
      <Dialog open={open} onClose={onClose} title={title} breakpoint={breakpoint} bodyPadded={false} footer={footer}>
        {children}
      </Dialog>
    );
  }

  if (!mounted || root == null) return null;

  return (
    <DrawerRootContext.Provider value={root}>
      {createPortal(
        <div ref={layerRef} className={clsx(styles.layer, contained && styles.contained, visible && styles.visible)}>
          <Popover
            open={visible}
            style={{ width: "100%", height: "100%", maxHeight: "none", borderRadius: 0, background: "var(--surface-level-first)" }}
            header={
              <PopoverHeader close onClose={onClose}>
                <PopoverHeaderContent>
                  <PopoverHeaderText variant="title" title={title} />
                </PopoverHeaderContent>
              </PopoverHeader>
            }
            footer={footer}
          >
            {children}
          </Popover>
        </div>,
        root,
      )}
    </DrawerRootContext.Provider>
  );
}
