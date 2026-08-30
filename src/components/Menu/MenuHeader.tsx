import { forwardRef, MutableRefObject, useContext, useLayoutEffect, useRef } from "react";

import useIsDesktop from "../../hooks/useIsDesktop";
import SearchField from "../Fields/SearchField/SearchField";
import { Divider } from "../Divider/Divider";
import { MenuContext } from "./Menu";

import { MenuHeaderProps } from "./MenuHeader.types";

// MenuHeader — the header of a menu. Currently a single variant: a SearchField
// in the "bar" type (a bare 40px row) plus the Divider that separates it from
// the items — 41px in all. The line belongs to THIS component, not to the
// SearchField (Figma node 29422-6849 draws both). No styles of its own — the
// same shape as SelectListHeader, for the Menu instead of the SelectList.
// See Figma "MenuHeader" (node 29422-6742).
//
// It TAKES FOCUS on mount by default (Daniel, 2026-08-17: the search is active
// as soon as the menu opens), with the two exclusions the DS already applies to
// SelectList's search — see `autoFocusSearch` in MenuHeader.types.ts.
const MenuHeader = forwardRef<HTMLInputElement, MenuHeaderProps>(function MenuHeader(
  { autoFocusSearch = true, ...props },
  ref,
) {
  // Own the input node so the focus can be applied here, and still hand it to
  // the caller's ref.
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref != null) (ref as MutableRefObject<HTMLInputElement | null>).current = node;
  };

  // Inside a Menu the presentation follows the Menu (its `breakpoint` prop can
  // force it); standalone it falls back to the viewport — the same rule
  // MenuItem uses.
  const menuCtx = useContext(MenuContext);
  const autoDesktop = useIsDesktop();
  const isDesktop = menuCtx ? menuCtx.isDesktop : autoDesktop;

  useLayoutEffect(() => {
    if (!autoFocusSearch) return;
    // A DRAWER never auto-focuses: on mobile the keyboard would open over the
    // list (Daniel, 2026-08-17 — the Filters menu must not do this).
    if (!isDesktop) return;
    // And no device without a real pointer does either, even on the desktop
    // presentation — an iPad in landscape gets the desktop card but is still
    // touch, so the BREAKPOINT is not the signal, the input modality is.
    if (!window.matchMedia("(hover: hover)").matches) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [autoFocusSearch, isDesktop]);

  return (
    <>
      <SearchField ref={setRef} type="bar" {...props} />
      {/* `medium` (--gray-a4), not Divider's own `low` default — the node draws
          this line one step stronger. */}
      <Divider contrast="medium" />
    </>
  );
});

export default MenuHeader;
