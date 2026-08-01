import { createContext } from "react";

// The DOM element a mobile drawer should portal INTO. Provided synchronously
// (via React context, which flows through portals) so a Popover drawer can
// render its portal on its FIRST render — without this the portal target was
// resolved in a useLayoutEffect (a frame late), so a freshly-opened drawer's
// content (e.g. a SelectList search input) wasn't in the DOM for the SYNCHRONOUS
// focus attempt inside the user's tap, and iOS refused to open the keyboard.
//
// - DeviceFrame / PhoneViewport provide THEIR container element.
// - Modals (Dialog / Prompt) OVERRIDE this to document.body, because their own
//   drawer and any drawer opened from inside them must stack above everything.
// - null (default, no provider) → the drawer falls back to the legacy
//   closest("[data-drawer-root]") lookup.
export const DrawerRootContext = createContext<Element | null>(null);
