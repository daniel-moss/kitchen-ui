// Cross-component guard against the SYNTHESIZED CLICK that follows a touch tap.
//
// A component that activates on `pointerup` (SelectListItem, ListItem) has
// already done its work by the time iOS dispatches the click it synthesizes
// ~300ms later. Usually that stray click is harmless — it lands on the same
// element, which ignores it. It is NOT harmless when the tap made that element
// go away: tapping a condition inside a drawer closes the drawer, and the click
// then lands on whatever took its place — a row in the sheet underneath, which
// happily opens (Daniel, 2026-08-19: "it also triggers the elements on the
// drawer below"). The element that lost the tap cannot defend itself, because
// the click never reaches it.
//
// So the component that CONSUMED the tap raises this shield instead: one
// capture-phase listener on the document that eats the next click anywhere, for
// a short window. Capture phase, so it runs before any target's own handler.
//
// Only the synthesized CLICK is swallowed — pointer events are untouched, so
// tapping several rows in a row keeps working.
let shieldUntil = 0;
let installed = false;

const swallow = (e: MouseEvent) => {
  if (Date.now() > shieldUntil) return;
  e.stopPropagation();
  e.preventDefault();
};

/**
 * Swallow the click iOS synthesizes after a touch tap that has already been
 * handled. Call it from the pointerup path, on touch pointers only.
 */
export function shieldSynthesizedClick(ms = 400) {
  shieldUntil = Date.now() + ms;
  if (installed) return;
  installed = true;
  // Kept for the page's life: it costs nothing once the window has passed, and
  // a listener added/removed per tap would race the very click it must catch.
  document.addEventListener("click", swallow, true);
}
