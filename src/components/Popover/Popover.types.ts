import { CSSProperties, ReactNode } from "react";

export interface PopoverProps {
  /** Body content — always present. The only scrolling region. */
  children: ReactNode;
  /**
   * Optional chrome pinned to the top. Pass a PopoverHeader on desktop or a
   * DrawerHeader on mobile (the drawer variant). Stays fixed while the body
   * scrolls.
   */
  header?: ReactNode;
  /** Optional chrome pinned to the bottom — a PopoverFooter. Stays fixed. */
  footer?: ReactNode;
  /**
   * false = desktop floating card; true = mobile bottom-sheet drawer, rendered
   * over a scrim. Default false.
   */
  drawer?: boolean;
  /**
   * Controls the enter/exit animation. Keep the Popover mounted and flip this:
   * true plays the open (card fades in / drawer slides up), false plays the
   * close and then the Popover unmounts itself. Default true.
   */
  open?: boolean;
  /**
   * Drawer only. Called when the user dismisses the drawer by tapping the scrim
   * (outside the sheet) or swiping the sheet down past the threshold. A close
   * button, when present, lives inside the DrawerHeader and is wired through its
   * own onClose — not here.
   */
  onClose?: () => void;
  /**
   * Drawer only. When false, the sheet can't be dismissed by swiping it down.
   * (Scrim taps still call onClose — pass no onClose for a fully non-dismissible
   * sheet like a Prompt.) Default true.
   */
  dismissible?: boolean;
  className?: string;
  style?: CSSProperties;
}
