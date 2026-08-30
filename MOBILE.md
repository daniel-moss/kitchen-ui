# Mobile & real-device testing — what we learned

Everything below was learned the hard way while testing the View Menu
prototype on a real iPhone (home-screen web app). Read this before building
or testing a prototype on a device. Most fixes live in the DS components, so
new prototypes inherit them automatically — this file explains what exists,
why, and the rules to keep following.

## Testing a prototype on a phone

1. Start Storybook (`npm run storybook`). Phone and Mac on the **same Wi-Fi**.
2. On the phone open
   `http://<Mac Wi-Fi IP>:6006/iframe.html?id=prototypes-<name>--mobile-fullscreen&viewMode=story`.
   The `iframe.html` form has no Storybook panels. Get the IP with
   `ipconfig getifaddr en0` (careful: the Mac can be on two networks at once —
   use the Wi-Fi one).
3. **Add to Home Screen** → opens full-screen like the real PWA.
   `.storybook/preview-head.html` provides the app meta tags:
   standalone mode, `black-translucent` status bar (the page draws behind the
   clock), `maximum-scale=1` (stops the iOS focus auto-zoom), and
   `viewport-fit=cover`.
4. iOS copies those tags **at the moment you add the icon** — after changing
   them, delete the icon and add it again. Changing `preview-head.html` also
   needs a Storybook restart.
5. Hot reload works on the phone. For a guaranteed fresh load: kill the app
   in the app switcher and reopen. When in doubt whether the phone runs fresh
   code, add a temporary build stamp to the story and look for it.

### Full-device stories

Wrap the story in **`PhoneViewport`** (from `src/stories/helpers.tsx`) — not
in hand-rolled `100dvh` / `position: fixed; inset: 0` divs. It is a normal-flow
`position: relative; height: 100vh` device block (see the big section below for
why that exact shape matters) and publishes the safe-area insets on `:root` for
the drawers. Keep a `Mobile` story in `DeviceFrame` for desktop viewing and a
`MobileFullscreen` story in `PhoneViewport` for the device.

## The iOS home-screen viewport (the big one) — SOLVED 2026-07-18

Earlier this was written up as "confirmed unfixable" — drawers could not reach
behind the home indicator in a home-screen (standalone) PWA. **That was wrong.**
It was two stacked bugs, both now fixed:

1. **Storybook injected a second `<meta name="viewport">`** (its own, without
   `viewport-fit=cover`) before the one in `preview-head.html`. Two viewport
   metas make iOS ignore `cover` entirely — no real safe area. Fixed by the
   dedup `<script>` in `.storybook/preview-head.html` (removes every viewport
   meta, installs a single `cover` one). Invisible on desktop; only bit iOS.

2. **`PhoneViewport` was `position: fixed`.** On device, `position:fixed` and
   `bottom:0` resolve against the SMALL layout viewport (`innerHeight` ≈ 768 =
   screen minus status bar), never the physical 812 — so a fixed `bottom:0`
   lands ~44px ABOVE the indicator and can never reach behind it. This is the
   real reason the old code floated drawers above the indicator (not any
   "iOS won't paint below the viewport" rule).

**The fix (verified on device):** `PhoneViewport` renders in **normal flow** —
`position: relative; height: 100vh` (standalone) — NOT fixed. A normal-flow
`100vh` block genuinely fills the physical 812, and because it makes the
document a real, tall, scrollable 812 page, iOS then resolves the **layout
viewport itself to 812**. `window.innerHeight` becomes 812; every `bottom:0`
(in-container AND body-portaled fixed dialogs) reaches the true bottom, behind
the indicator. This mirrors the old bare-HTML prototypes that always worked.

Hard-won constraints — do NOT change these without device-testing:

- **Must be `100vh`, not `100dvh`, in standalone.** `100dvh` (and any
  `overflow:hidden` / scroll lock on the document) collapses the document back
  to ~768, which drops the layout viewport to 768 and floats drawers above the
  indicator again. Only a tall, scrollable `100vh` document yields the 812
  viewport. Browser tab still uses `100dvh` (to clear the Safari toolbar).
- **`env()` now works** (single cover meta): `PhoneViewport` measures it and
  publishes `--popover-drawer-bottom-inset` / `--phone-safe-bottom` (34) and
  `--popover-drawer-top-inset` (44) on `:root` for the body-portaled drawers.
- **Accepted trade-off — background scroll on keyboard.** Because the page is a
  real scrollable `100vh` document, when the keyboard opens iOS scrolls the
  whole page up (behind the dimmed scrim) to reveal the field. The focused
  drawer still lifts itself correctly above the keyboard. This can't be locked
  away with pure CSS — every attempt (`100dvh`, `overflow:hidden`) re-breaks the
  indicator. Left as-is; a JS keyboard-height shrink could remove it later if
  needed.
- **Keyboard**: the drawer that owns the focused input lifts above the keyboard
  via `interactive-widget=resizes-content` (the layout viewport shrinks, the
  sheet's `bottom:0` rides up). The indicator strip collapses **only** for a real
  text field —
  `.drawer:has(input:not([readonly]):focus, textarea:not([readonly]):focus)`,
  NOT `:focus-within`. A `SelectInput` (role=button div) or `DateInput` (readOnly
  input) must not collapse it, or their tap drops the footer behind the indicator.
- **Keyboard, the two PLACEMENTS** (2026-08-19). Popover measures the keyboard
  differently depending on where the sheet lives, because the scrim it measures
  is a different thing in each case:
  - **body-portaled** — the scrim is `fixed` and IS the screen, so the lift is
    `scrim.offsetHeight − (vv.offsetTop + vv.height)`. Unchanged; tuned on a real
    device, do not touch it.
  - **inside a `[data-drawer-root]`** — every device-frame story, so every phone
    prototype. The scrim is `absolute` and only fills the frame, so its height
    says nothing about the keyboard. Measured from the scrim's RECT instead:
    `rect.bottom − (vv.offsetTop + vv.height)`, i.e. how far the frame's bottom
    reaches past the last visible pixel. This case used to be skipped entirely,
    so a drawer in a device frame got NO keyboard handling and the keyboard sat
    on top of its footer.
    **Do NOT cross-check that against `documentElement.clientHeight`** (tried,
    reverted on a real iPhone): with `interactive-widget=resizes-content` the
    layout viewport shrinks along with the keyboard, so `clientHeight −
    keyboardTop` reports a keyboard far smaller than it is, and taking the min
    of the two under-lifts the sheet — the footer ends up behind the keyboard's
    accessory bar. The phantom-keyboard case it was meant to guard (a frame
    taller than the browser window) is handled by a `(hover: hover)` check
    instead: only a device with no fine pointer has an on-screen keyboard.
  Only the first case existed until Assignee's search started auto-focusing on
  mobile, which made the second one visible on every open.
- **A footer button tapped while the keyboard is up** (real iPhone, 2026-08-19).
  iOS blurs the focused field as the DEFAULT ACTION of `mousedown`; the blur
  dismisses the keyboard, the sheet grows back to full height, and the footer
  moves DOWN out from under the finger — so the click iOS synthesizes ~300ms
  later carries a stale hit-test and never reaches the button. The tap then only
  closed the keyboard. `PopoverFooter` prevents that one default (**`mousedown`,
  not `pointerdown` — preventing a touch `pointerdown` can suppress the
  compatibility mouse events including the click**), and only while a real
  `input:not([readonly])` / `textarea` holds focus. Option ROWS never had this:
  `SelectListItem` and `ListItem` activate on `pointerup` for the same reason.
  Any new tappable thing that shares a sheet with a text field needs one of the
  two treatments.
- Drawer open/close animations are **fade + 32px shift** (`SHEET_SHIFT` in
  Popover), not a full slide-off — a full slide visibly clips at the
  invisible seam. Don't reintroduce big travel distances.
- The one accepted artifact: while a finger actively drags a drawer down,
  content slides under the same-colored seam. Cosmetic, gesture-only,
  OS-level.

## iPad standalone (desktop-layout stories) — SOLVED 2026-07-22

Saving a DESKTOP story to the iPad home screen (album mode) needs its own
handling — the iPhone rules do NOT transfer:

- **Wrap the desktop story in `PhoneViewport`** (Job Details does), never a bare
  `100vh` div — the bare div leaves Storybook body margins and no safe-area
  vars.
- **iPadOS's standalone viewport lies.** The page draws behind the status bar
  (black-translucent + cover), but neither `100vh` (short → dead strip at the
  bottom) nor `100vh + env(safe-area-inset-top)` (overshoots → clipped) matches
  the physical screen. PhoneViewport therefore sizes the container on iPad to
  the **measured hardware screen** (`screen.width`/`height` in CSS px, picked by
  orientation with max/min so it works whether or not iPadOS rotates them,
  re-measured on rotation). iPhone keeps plain `100vh` — verified correct there;
  do not "unify" the two paths.
- **iPad detection:** iPadOS masquerades as "Macintosh" in the UA —
  `maxTouchPoints > 1` tells it from a real Mac.
- **The desktop shell reserves the TOP inset only** (`padding-top:
  var(--shell-safe-top)` on `.desktop`). Do NOT reserve the bottom: a reserved
  home-indicator strip reads as a dead band — native iPad apps draw to the
  bottom edge and let the indicator float over content.

## Touch rules (DS-wide, keep following them)

- **Hover**: every `:hover` rule sits inside `@media (hover: hover)`. Touch
  devices never match it → no stuck hover after taps. Write new hover styles
  the same way; keep `:active` / `:focus-visible` / error-state selectors
  OUTSIDE the media query (they must work on touch).
- **Tooltips are hover-only**: on touch they don't exist at all
  (`HoverTooltip` / `HoverHint` attach mouse handlers only when
  `(hover: hover)` matches — iOS emulates `mouseenter` on tap and never ends
  it). Focus opens them only for `:focus-visible` (keyboard).
- **Adjacent small tap targets**: iOS groups two quick taps within ~40px as a
  double tap **on the first target**. `touch-action: manipulation` helps but
  is not enough — ListItem activates rows from the **pointer event** (true
  coordinates) and swallows the synthesized click globally. Reuse that
  pattern for any new tap-row component.
- **Auto-focus that should open the keyboard** must run synchronously inside
  the tap's task. `useMountTransition` mounts synchronously during render for
  this reason; SelectList focuses in `useLayoutEffect` with
  `focus({ preventScroll: true })`. Never delay a focus "until the animation
  ends" — iOS silently drops it.
- **Restoring focus** (`useRestoreFocus`): capture the previously-focused
  element during RENDER when the overlay activates (an effect-time capture
  runs after the overlay's own autofocus and memorizes the overlay's input —
  the close then focuses the dying drawer and iOS scroll-bounces the page).
  Always restore with `focus({ preventScroll: true })`.
- **Drawer gestures** (all in Popover): the sheet has `touch-action: none`,
  the body `pan-y` + `overscroll-behavior: contain`, plus a non-passive
  `touchmove` listener so a downward pull with the body at its top belongs to
  the sheet (otherwise native scroll hijacks it after ~5px and the sheet
  snaps back).
- **Dragging rows** (ListItemGroup): the handle stops event propagation (so
  the drawer doesn't drag along), rows disable text selection AND the iOS
  long-press callout, the lifted copy renders in a **body portal** — floating
  things must never live inside an `overflow` ancestor.
- **Long-press drag** (ListItemGroup): holding a row 250ms (8px tolerance)
  starts the drag without the grip. It begins MID-gesture, which needs three
  things a handle drag gets for free: a global row-drag flag
  (`src/utils/dragLock.ts`) that the Popover sheet checks (its dismiss-drag
  was already armed by the same pointerdown) and ListItem checks on release
  (a still-finger release is otherwise a tap), and a window-level
  non-passive `touchmove` preventDefault while the drag runs — touch-action
  was decided at pointerdown (rows allow panning), so the first finger move
  would otherwise start a native scroll and pointercancel the drag. Moving
  more than the tolerance during the hold cancels it — that is a scroll.

## Safe areas in drawers (Popover)

- Drawer **with a footer**: the safe zone is a surface strip below the footer
  (footer stays above the indicator).
- Drawer **without a footer**: the safe zone is `padding-bottom` inside the
  scrolling body — scrolled content passes behind the indicator zone and
  stays visible.
- Both read `--popover-drawer-bottom-inset` (fallback
  `env(safe-area-inset-bottom)`); `DeviceFrame` mocks it at 34px,
  `PhoneViewport` computes the real value.

## Exit animations

Keep overlays **mounted** and drive their `open` prop
(`{open && <Drawer/>}` skips the exit — Popover unmounts itself after
playing it). The sheet fades while it shifts, both directions; the scrim has
direction-specific easing. Duration 160ms; curves in `Popover.tsx`.

## Lessons from the Job Details / Toast round (2026-07-14)

Learned debugging toasts and the job context menu on a real iPhone. Follow
these to not re-live that week.

### When "animations don't work" on a device

1. **Check iOS Reduce Motion FIRST** (Settings → Accessibility → Motion).
   Our styles honor `prefers-reduced-motion` on purpose — motion silently
   disappears and it looks exactly like a bug. Three fix rounds were spent on
   an accessibility setting.
2. **Make the device tell you what it runs.** Before rewriting code, add a
   temporary on-page badge with a build number + `matchMedia` readings
   (`prefers-reduced-motion`, computed values, env() probes). A JS transition
   probe on a bare element can say "transitions work" while a media block
   disables them on YOUR component only.
3. Stale code has mimicked bugs twice: Safari kept old Vite modules through
   reload AND private tabs (restart Storybook to bust every hash), and a
   forgotten `python http.server` on another port served a 2-day-old static
   build. Verify the badge/build number before debugging anything.

### Safari CSS rules (bit us for real)

- **Never put `env()` inside a `var()` fallback that is used in `calc()`** —
  Safari mishandles it. Pre-resolve once into a custom property:
  `--safe: var(--x, env(safe-area-inset-bottom, 0px));` then
  `calc(var(--safe) - 20px)`.
- **`@starting-style` only in its top-level form**
  (`@starting-style { .x { … } }`) — some Safari 18 builds ignore the nested
  form. This is the right tool for enter animations (transition on insertion,
  no JS timing). Every JS class-flip variant (rAF, double rAF, forced reflow)
  raced first paint somewhere.
- **Do not run a keyframe animation and rely on transitions for the same
  properties on the same element.** WebKit: a finished ancestor animation can
  block later transitions on those properties and stall DESCENDANT animations
  (the toast spinner froze while the toast itself had entered by keyframes).
- Custom properties used in transforms need a default (`--offset: 0px` on the
  element) — an unset `var()` makes the whole declaration invalid at
  computed-value time.

### Touch interaction rules (extends the list above)

- **Hover-driven features (expand-on-hover, pause-timers-on-hover) are
  desktop-only.** iOS synthesizes `mouseenter` from taps and the matching
  `mouseleave` may never come — the Toaster's timers froze forever. Gate the
  handlers on `useIsDesktop`, and force-reset the hover state when leaving
  desktop.
- **Document-level `pointerdown` outside-close handlers are desktop-only
  too.** On a drawer they fire BEFORE the tap's `click`, close the sheet, and
  the sinking sheet puts a DIFFERENT item under the finger (taps hit the
  wrong menu item). Drawers already dismiss via their own scrim.
- **Restoring focus must not paint a phantom ring**: Safari applies
  `:focus-visible` to programmatic focus even after touch. `useRestoreFocus`
  remembers whether the trigger's focus was visible at open and blurs
  otherwise — keep that behavior for new overlays.

### State and stores

- **Module-level stores live in their own, rarely-edited file**
  (`toastStore.ts`). When a store shares a module with a component, every HMR
  edit re-runs the module and SPLITS the store — the app writes to one copy,
  the mounted UI listens to another, and updates appear one interaction late.

### Rotation vs the stable height

`PhoneViewport` filters iOS's transient viewport spikes with a
"minimum-ever-seen" height — but ROTATION legitimately changes the height,
so the stable value must be re-learned when orientation flips (otherwise the
app stays shrunk to the landscape height after rotating back — a
half-screen page). Handled inside `PhoneViewport`; keep the rule if the
sizing logic is ever touched. Prototypes are portrait-only: manifest
`"orientation": "portrait"` (Android installs) + a landscape blocker overlay
(iOS cannot lock orientation for web apps).

### Anchored floating cards must follow their trigger

A `position: fixed` menu measured once at open DRIFTS when any container
scrolls (the trigger moves, the menu stays). Re-measure while open on
`scroll` (capture phase — inner scroll containers don't bubble) and
`resize` — see `useAnchoredMenu` in the Job Details prototype and
NavSidebar's Create menu.

### The home-indicator numbers

Two different values, both "correct": `env(safe-area-inset-bottom)` = **34px**
(what a Safari-tab page that extends under the indicator must pad) and
**~44px** = the system band iOS reserves BELOW a standalone app's viewport
(outside the page; nothing can draw there — see "the big one" above).
`DeviceFrame` mocks the standalone look, so its indicator zone uses 44
(`HOME_INDICATOR` in `stories/helpers.tsx`).
