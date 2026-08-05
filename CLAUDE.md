# Kitchen UI — React + Storybook design system

Handoff context. Read this fully before working in this folder.

## What this project is

A standalone **React + Storybook** playground where **Daniel** (a product
designer at Roopairs) builds his **own** design system components. It is
completely separate from:

- the production app at `../roopairs_api` (READ-ONLY — see below), and
- the single-file HTML prototypes in `../Prototypes` and the token/spec source
  in `../Kitchen UI`.

Why it exists (Daniel's goals):
1. Build components his dev team can adopt into the real codebase.
2. A simple, safe place to test new looks and behaviours without the complexity
   of the real repo.
3. Build and share prototypes of features that are not built yet.
4. Stay fully separate, so nothing here can break production.

## Communication style (important)

- Daniel is **not a native English speaker**. Use simple, clear, plain English.
  No idioms, slang, or rare words. Simple does NOT mean leaving out important
  information — keep it informative.
- He prefers **careful, small steps** and understanding each part. Explain a
  meaningful change before doing it; do not make big foundational decisions
  silently.

## How to run

- First time, or after a new package is added: `npm install`
- Start Storybook: `npm run storybook` (opens http://localhost:6006)
- Stop it: `Ctrl + C` in the terminal.
- Static build to share as a link: `npm run build-storybook` (creates
  `storybook-static/`). The built output is self-contained — whoever opens it
  needs no packages.

## Conventions — mirror the codebase's PATTERNS, not its tokens

We copy **how** the production codebase is written, not its design tokens.

- **TypeScript** (`.tsx`, `.types.ts`) + **CSS Modules SCSS** (`.module.scss`) +
  **Storybook** stories (`.stories.tsx`).
- Each component is its own folder directly under `src/components/<Name>/`.
  **Mostly flat — no `atoms` / `molecules` / `particles` grouping** (Daniel
  removed that grouping on purpose; do not reintroduce it). The ONE intentional
  exception (Daniel, 2026-07-15): the field inputs live together under
  `src/components/Fields/<Name>/` — TextField, TextArea, SelectField, DateField,
  SearchField, PasswordField, OTPField, MediaField, InputGroup — and their
  stories are grouped under
  `Components/Fields/…` in Storybook. (DatePicker is NOT in Fields — it is the
  calendar picker, not a field; it stays top-level `src/components/DatePicker/`.)
  Everything else stays flat.
- Per component, typically: `Name.tsx`, `Name.types.ts`,
  `Name.module.scss` (only if it has its own styles), `Name.stories.tsx`.
- Patterns from the codebase: `clsx` for class names, a separate `.types.ts`,
  `forwardRef` where it fits, and the `font` SCSS mixin in
  `src/styles/mixins/_font.scss` (used as `@include font("body-500-spacious")`).
- The production components live at
  `../roopairs_api/roopairs/pwa/src/components` — use them only as a
  **read-only reference** for patterns.

## Design source

- Component **design** (look, variants, sizes, states) comes from **Kitchen UI**
  (Figma-aligned), documented in `../Kitchen UI/components/*.md` and
  `../Kitchen UI/SKILL.md`. Build the clean Figma version.
- Do NOT copy the production component's exact CSS or pull its tokens/overrides
  as the foundation. Patterns yes, tokens no.

## Design-build verification (MANDATORY — run every time)

### RULE 0 — Screenshots are FORBIDDEN as a basis for ANY claim about the design.

A screenshot (Figma render, `get_screenshot`, or a browser capture) may be used ONLY
for gross layout sanity. It is NEVER acceptable as the source for a statement,
assumption, or decision about the design — not the component's identity, not whether
something is a real component vs plain text, not a size, token, spacing, variant, or
structure. **Every such claim MUST come from reading the NODE** (`get_metadata` /
`get_design_context` / `get_variable_defs`). If you have not read the node for a
claim, you do not get to make the claim — say "not verified" instead.

This includes **generalizing from one node to a similar-looking one**: read EACH node
you make a claim about. (This rule exists because I keep asserting things off
screenshots that a one-line node read would have corrected — e.g. claiming the Notes
empty state was "plain text" from its screenshot without reading node 21833-90883.)

**`get_metadata` alone is NOT enough to confirm component identity — use
`get_design_context`.** Metadata FLATTENS a component instance to its visible leaf: an
`EmptyState` instance shows up as just its inner `<text>`, a `Counter` as its number,
etc. Reading metadata and concluding "that's plain text / a bare number" is a
misread — the flattened leaf hides the real component. To decide "is this a real DS
component or raw content," read the FULL tree with `get_design_context` (it shows
`EmptyState Template → EmptyState → text`). Metadata is for structure/layout overview
and finding node ids; identity + props come from `get_design_context`.

When building any UI from Figma, then follow this as a PROCEDURE, not a judgment call.
The failure it prevents: leaving a component prop at its default without confirming
the design intends that default. **Unset props and component defaults are decisions
too** — the value you don't write is the one you forget to check. Do NOT trim these
steps to save effort; silently dropping a check is the exact bug this prevents.

1. **Read values per component, from the NODE — never from a screenshot** (Rule 0).
   For each distinct DS component in the design, pull its exact attributes with
   `get_design_context` / `get_variable_defs` on that node.
2. **Propose a PROP TABLE before coding.** In the build proposal, list every DS
   component with its exact props read off Figma, e.g. `TabGroup: variant=contained,
   size=lg, isFullWidth=true`. Any value not yet verified is written `?` — a `?`
   means STOP and read the node. Daniel reviews the table before the build.
3. **Diff the built result against the node, prop by prop.** Before saying "done",
   confirm each component's props match the node's attributes — not just "looks right
   in a screenshot" (a screenshot won't catch e.g. md-vs-lg tabs).

## Foundations (design tokens)

CSS variables, split by category in `src/styles/variables/` (same idea as the
codebase's `styles/variables/`). `src/tokens.css` is the aggregator that
`@import`s each file; it is loaded globally in `.storybook/preview.js`.

- `colors/radix.css` — colors imported **live** from the `@radix-ui/colors`
  package (pinned to **v3.0.0**, the same version the codebase uses). 14 scales
  (gray, tomato, crimson, pink, plum, violet, indigo, blue, cyan, jade, teal,
  orange, amber, brown), each with light, alpha, dark, dark-alpha.
- `colors/pure.css` — pure white/black + adaptive alpha, on top of Radix.
- `colors/alias.css` — semantic colors (text, surfaces, shadow colors). Keep it
  last among the color files (it references the scales).
- `typography.css`, `spacing.css` (the `--size-*` scale), `border-radius.css`,
  `shadows.css`, `breakpoints.css`, `icons-semantic.css`.
- Theming: light = `:root` (and `.light-theme`); dark = `.dark` / `.dark-theme`
  (Radix dark files target `.dark, .dark-theme`). Storybook has a theme toolbar
  (Auto/Light/Dark) in `.storybook/preview.js`; "Auto" follows the OS, so
  `npm run screenshot` captures in the system theme.

## Icons — "Option B" (self-contained, no Font Awesome Pro npm kit)

- Icons render by **codepoint** using the Font Awesome **Pro fonts** (the `.otf`
  files in `src/assets/fonts/`) plus the glyph classes in
  `src/styles/icons-glyphs.css` (5,195 `.g-<name>` classes). This is
  self-contained and needs **no** paid `@awesome.me/...` Font Awesome kit / token.
- `src/components/Icon/Icon.tsx` takes an icon **name string** (e.g. `"plus"`,
  `"wrench-simple"`) and applies the `.g-<name>` class.
- The production codebase's `Icon` instead takes a Font Awesome `IconProp`
  object. When the team adopts one of our components, they swap our `Icon` for
  their real Font Awesome `Icon` — a small, documented change.

## What exists now

Many components are built. Browse `src/components/` (and run Storybook) for the
current, authoritative list — don't trust a hardcoded list here to stay complete.
Family folders hold their parts (e.g. `Avatar/` contains every `Avatar<Type>`).
Roughly, as of this handoff:

- **Foundations:** `Icon` (Option B codepoint), `Skeleton`, `SkeletonTypography`,
  `Divider`, `Label`, `InputHelpText`, `Counter`, `src/utils/` (debounce,
  groupDividers), `src/hooks/` (useMountTransition, useIsDesktop,
  useControllableState, useEscapeKey, useFocusTrap, useRestoreFocus),
  `src/styles/mixins/` (_font, _interaction, _collapse).
- **Buttons/links:** `Button` (solid/subtle/ghost/danger; sm/md/lg; `isFullWidth`;
  debounced onClick), `IconButton` (variants incl. `muted`; sizes xxxs–lg),
  `LinkButton` (polymorphic `<a>`/`<button>`, `--text-*` schemes, +8px hit area),
  `Chip` (md 28/lg 32; `active` selected look + aria-pressed; slotLeft = Icon or
  any avatar strictly xxs/16; loading skeleton; Button-style focus ring).
- **Avatars/Badges:** `Avatar/` (Avatar + every `Avatar<Type>` + AvatarGroup —
  stack rows: truncated names get full-name tooltips, the "+N" overflow line
  gets an avatar-stack tooltip of the hidden users; Badge/LinkButton labels
  ellipsize when a container squeezes them),
  `Badge/` (Badge + every `Badge<Status>`).
- **Tooltip:** `Tooltip` (text / avatarGroup / free-slot content),
  `TruncatingText` (1–3-line clamp + full-text tooltip; body portal),
  `HoverTooltip` (same three content variants via `variant`/`items`/`content`).
- **Hint family (`Hint/`):** `Hint` (inline bubble: indicator info/success/
  warning/error, optional title, caption or free slot, tongue on 4 sides ×
  start/center/end alignment, drop-shadow FILTER so the shadow wraps the
  tongue; drawer variant for mobile), `HoverHint` (shows the Hint on trigger
  hover/focus in a body portal — position top/bottom/left/right + align; on
  mobile a tap opens the drawer instead), `HintTrigger` (the info icon).
- **Popover family (`Popover/`):** `Popover` (desktop card / mobile drawer; sticky
  header/footer + scrolling body), `PopoverHeader` (+ Body/Content/Text/Title/
  Caption), `PopoverFooter`, `DrawerHeader`.
- **Modals (built on Popover):** `Dialog` (default card/drawer + focus multi-step;
  error/offline states; `confirmOnDismiss`; `subHeader` + `cardStyle`), `Prompt`
  (non-dismissible confirm), `EmptyState`, `AlertBanner`. All overlays: Escape /
  focus trap / focus restore via the shared hooks.
- **NavSidebar (`NavSidebar/`):** `NavSidebarItem` — one sidebar row, 3 types:
  default (icon + label + optional `hotKey` text or `notificationDot`
  modifier; a link), stackHeader (toggles a stack; caret left→down via `open`,
  which is SPLIT from `active` on purpose — Figma couples them, Daniel OK'd
  the split), stackItem (no icon, pl 34 aligns labels; a link). Desktop 32 /
  mobile 36 (breakpoint auto via useIsDesktop), fills container width.
  Active = solid icon + strong text (+ gray-a3 fill except stackHeader);
  hover/press strengthen colors and fill a3/a4 (active default/stackItem step
  to a4/a5); focus/disabled from the interaction mixins. Renders `<a href>`
  or `<button>`. `NavSidebarItemGroup` = the item stack (a Figma template):
  stackHeader (icon+label props) + children stackItems 2px apart, open/close
  via the collapse mixin; `headerActive` separate from `open`; breakpoint
  flows to everything inside via `NavSidebarBreakpointContext` (context, not
  prop cloning — fragments would swallow cloned props). An OPEN stackHeader is
  emphasized like active (Daniel confirmed the Figma coupling).
  `NavSidebarProfileButton`: 36px circular avatar button (AvatarUser md);
  opens the profile Menu — desktop card 4px below left-aligned (name/e-mail
  section as the card's first block, swallows Menu's injected divider prop);
  mobile drawer with avatar+name+e-mail in the DrawerHeader (via Menu's new
  `header` prop for a custom root drawer header). The button STAYS PRESSED
  (gray-a4) while the menu is open; wrap is position:relative on desktop ONLY
  (a positioned wrapper would trap the mobile drawer's scrim).
  `NavSidebarWorkspaceButton`: 28px object avatar (image or first-letter
  fallback) + name (truncates w/ tooltip) + angles-up-down; opens a
  SelectList (desktop inline 4px below / mobile drawer) with xs avatars +
  selected check; picking closes; stays pressed while open; with ONE
  workspace it renders non-interactive without the angles icon.
  `NavSidebar`: the full sidebar — 280px column + right-edge vertical
  Divider; 52px header (workspace + profile, sticks on top, long names
  truncate with a min 8px gap); below it ONE scroll container (top items pin
  up, bottom block pins down via space-between; everything but the header
  scrolls on overflow); built-in Search item (`onSearchClick`; hotKey ⌘K/Ctrl
  K by OS, display-only) and Create button (`createMenu`; NavSidebarItem
  `strong` + `isPressed` adjustments — strong rest colors, held pressed while
  its Menu shows; desktop menu = body-portal card right of the button,
  bottoms aligned, 4px gap; mobile = drawer titled "Create"). MenuItem gained
  `subMenuTitle` (mobile sub-drawer title, e.g. "Create job" over "Job").
  Provides NavSidebarBreakpointContext to everything inside.
- **NavBottomBar (`NavBottomBar/`):** `NavBottomBarItem` — the mobile bottom
  bar's icon-only pill: 68×44 radius-full (stretches in a row up to max 112;
  `flex: 1 1 auto` on purpose — a length basis would hijack the height in
  column layouts), icon 18 regular gray-a11 → SOLID gray-12 + gray-a3 fill
  when active; hover a4 / press a5 / focus ring with a4 fill / disabled 0.3;
  requires `label` (aria-label — icon-only); renders `<a href>` or button;
  `strong` = dark icon at rest (the bar's Create adjustment). `NavBottomBar`:
  the bar — top Divider, 8px padding, items 2px apart sharing the width
  (capped 112, centered on wide screens), min-width 320, surface-level-first
  fill, safe-area padding-bottom from the shared drawer inset var; the
  consumer fixes it to the screen bottom; only ONE item active at a time.
  **Breakpoint-exclusive (Daniel's rule): NavBottomBar renders ONLY on
  mobile (≤1024), NavSidebar renders ONLY on desktop — each returns null on
  the other breakpoint (`breakpoint` prop forces for stories/tests).**
- **NavTopBar (`NavTopBar/`, being built in slices):** `NavTopBarTitle` —
  the title combination: optional `slotLeft` (Icon 14 solid gray-12, or any
  md/28 avatar — gap 8 after an icon, 10 after an avatar, detected by
  element type like Chip) + title (body-500-compact strong, ellipsis) +
  optional `dropdown` (angles-up-down 14 regular gray-a9, 8px gap).
  `NavTopBarLeftElements` — [back IconButton?] 8px [NavTopBarTitle as
  children] 8px [ellipsis IconButton?]; buttons are md/32 ghost, shown when
  `onBack`/`onActions` are set. `NavTopBarRightElements` — format-dependent
  (breakpoint auto): [live avatars (AvatarGroup inline lg)][search IconButton
  — DESKTOP ONLY][create: desktop = solid md Button "New" w/ plus, mobile =
  solid plus IconButton], gap 8.
  `NavTopBarLiveUsers` (used by RightElements + the details bar): the live
  stack — inline lg AvatarGroup capped at 3 avatars desktop / 2 mobile
  (beyond → "+N" counter); desktop hover = tooltip with ALL users; mobile
  tap = drawer with the lg stack. `NavTopBar` — the bar: 52px inner (px 16,
  gap 16) + bottom Divider; `variant="list"` (children = LeftElements
  assembly; right = live users + onSearch/onCreate via RightElements) or
  `variant="details"` (children + `tabs` TabGroup element + live users
  only; desktop tabs scroll horizontally with DYNAMIC edge fades — right at
  start, both mid-scroll, left at end; mobile tabs move to a second 52px
  bar row, no fade, "Details" first by convention). Tabs wheel-scroll with
  a plain vertical wheel (native non-passive listener). `hideOnScroll` prop
  (mobile): the top row stays sticky; the TABS ROW collapses on scroll-down
  and returns on scroll-up (height-animated bottom-anchored clip; guards:
  overflow-anchor none on the scroll container + a 250ms echo-ignore window
  — the layout change otherwise feeds back through scroll anchoring /
  scrollTop clamping and oscillates). NavTopBarTitle `subPages` opens an inline SelectList on
  title click (forced inline on mobile too, per the doc; the interactive
  title dims to 75% on hover / 50% on press). Search/create icon
  buttons carry tooltips ("Object search" / createLabel).
- **Steppers:** `StepItem`, `StepGroup`. **Tabs (`Tabs/`):** `TabItem`, `TabGroup`
  (contained tabs are 4px shorter; `isFullWidth` stretches tabs equally).
  TabItem `warning` (2026-08-05) turns the icon + label `--text-warning` and
  HOLDS that colour in every state (selected, hover, press) — built for
  SidePanel's navigation, so it is scoped to the `default` + `container`
  variants; the amber `warning` icon is the caller's, not built in.
- **Form controls:** `Checkbox/` (Checkbox, CheckboxBox, CheckboxItem,
  CheckboxGroup), `Radio/` (same shape, single-select), `Toggle/` (ToggleSwitch,
  Toggle, ToggleItem), `SelectInput/` (assembly + Field + Body + Counter;
  fit-content width, `isFullWidth`), `SearchField` (field / bar types; renamed
  from SearchInput 2026-07-29 with the Figma-parameter fixes + docs page).
- **Containers:** `Card`, `DisplayModule` (default/accordion/bodyOnly + status
  ring/banner/error), `GroupLabel` (primary/secondary; counter/caption;
  accordion).
- **ValueDisplay:** label–value pair. Horizontal (fixed 120px label column that
  wraps; value kinds text / badge / linkButton — badge & link + slotLeft-text
  truncate with cursor-following tooltips; `valueColor`; `isWarning` amber text
  that FILLS the width and pushes the icon to the right edge; one optional
  `slotRight` IconButton) and vertical (`orientation`; text body-400-SPACIOUS
  with optional `lineLimit` clamp + Show more/less, or `kind="avatarGroup"` xs
  stack with optional `avatarLimit` + Show more/less). Show more/less animates
  height (240ms drawer curve, flushSync measure-mutate-measure; the text clamp
  is lifted during the collapse so lines stay visible while the box shrinks).
  Empty = auto "No [Label]" placeholder (`emptyText` overrides); loading =
  value-only skeletons (1 line / badge shell / 4 spacious lines / 3 avatar
  rows). Kinds are type-enforced per orientation. Figma's 6px content radius
  intentionally dropped (Daniel: leftover, no hover/copy states).
  `ValueDisplayGroup` (same folder): children = ValueDisplays in any order;
  the group SPLITS by `orientation` and enforces the doc rule — horizontal
  pairs first (4px stack), each vertical pair its own section, Dividers with
  12px around between sections. Usually lives inside a DisplayModule.
- **Select family (`SelectList/`):** `SelectList` (inline/dialog/drawer; empty +
  noResults states; single-select auto-close; arrow-key navigation; a search
  header is auto-focused on open — only on devices matching `(hover: hover)`
  (the DS hover signal): TOUCH devices never auto-focus, because iOS opens the
  on-screen keyboard on tap-focus (covered half an iPad — and an iPad in
  LANDSCAPE gets the desktop presentation, so the breakpoint is NOT the
  signal; the input modality is. Daniel, 2026-07-29); a
  DRAWER with a search always fills the full
  height — a content-hugging sheet would jump on every keystroke),
  `SelectListHeader` (search), `SelectListItem` (+ Content/Copy; default/object),
  `SelectListItemGroup` (pairs with GroupLabel: primary ↔ object items,
  secondary ↔ default items), `SelectListFooter` (menuItem/actionBar).
- **SidePanel (`SidePanel/`, 2026-08-05):** the data-preview overlay, built on
  Popover. Desktop = a FIXED 400px panel on the right that slides in from the
  edge, `--size-3` (12px) margin all round, full screen height, radius 10,
  `--surface-level-first`, over a `--pure-black-a5` scrim. Mobile = the same
  panel filling the screen (no scrim/margin/radius, safe-area padding) — the
  focus-Dialog pattern. Header = PopoverHeader (its `back`/`close`), optional
  footer = PopoverFooter, optional `nav` = `SidePanelNavigation` (52px rows,
  16px sides, bottom divider: object tabs = TabGroup default/md scrolling
  sideways with NO edge fade; `topLevel` adds a second row above = TabGroup
  contained/**lg** full-width). Body defaults: 16px padding + 16px gap
  (`bodyPadded={false}` opts out). `state="error" | "offline"` swaps the body
  for the same EmptyState Dialog uses and hides nav + footer. **A link inside a
  panel never stacks a second panel** — the CONSUMER keeps the stack, swaps
  `title` + children and passes `onBack` (unlimited levels). SidePanel portals
  to the nearest DrawerRootContext / `[data-drawer-root]`, else `<body>` — that
  is what lets a device frame or a docs preview box contain it.
  `SidePanelNavigation` unwraps a fragment before handing tabs to TabGroup:
  `Children.toArray` does NOT look inside `<>…</>`, so the tabs would silently
  lose value/selection/click.
- **Menus (`MenuItem/`, `Menu/`):** `MenuItem` (danger, whole-row toggle,
  `subMenu` hover cards / drawer push), `MenuItemGroup`, `Menu` (desktop card,
  content-adaptive width 160–384; mobile drawer with sub-menu stack).
- **ListItem (`ListItem/`):** text parts (TextLeft/TextRight/Text with 1/2/3/wrap
  truncation rules + tooltips), `ListItemContent` (xl avatar slot),
  `ListItemBody` (right slot, up to 3 instances; `ListItemSlotIcon`), `ListItem`
  with the 5 behavior variants: static, clickable (+whole-row toggle —
  `slotRight` instances are allowed next to the switch and don't flip the row),
  draggable, clickable+draggable, accordion. `ListItemGroup` (the list
  container: optional GroupLabel header, separated variant, one-way truncation
  "Show N more", accordion via the header, bottom divider between stacked
  groups, and built-in drag-reorder — `onReorder(from, to)` wires pointer
  drags on the items' grip handles: the dragged row leaves the list, a lifted
  copy follows the pointer, and the other rows translate so a row-sized empty
  slot marks the drop position (Daniel iterated away from the doc's black
  line and from showing the dimmed original); the consumer reorders its
  array. A **long-press (250ms, 8px tolerance) anywhere on the row** also
  starts the drag — no need to aim at the grip; interactive slots
  (slotStop/slotBottom) are excluded. Because it starts MID-gesture (after
  pointerdown already bubbled), it needs `src/utils/dragLock.ts`: a global
  row-drag flag that the Popover sheet checks (no dismiss-drag-along) and
  ListItem checks on pointerup (release ≠ tap), plus a window-level
  non-passive `touchmove` preventDefault while dragging (rows allow panning,
  so the first move would otherwise start a native scroll → pointercancel)
  and `suppressListItemTaps(350)` on finish for the trailing click).
  **Docs page + Figma alignment (2026-08-05):** `ListItem.mdx` follows the
  Figma Documentation page section-for-section. The caption's left slot
  (`captionSlotLeft`, 20px box / centred / 8px before the text; the icon's
  size, style and color are the caller's) is wired through
  ListItemText → ListItemTextLeft. Two doc rules are now ENFORCED, not just
  written: (1) `slotBottom` is type-restricted to the STATIC row — clickable /
  draggable / accordion + a bottom slot no longer compiles; (2) a clickable row
  whose `slotRight` holds a TabGroup or a field logs a console warning
  (`CONTROLS_BLOCKING_CLICK` in ListItem.tsx) — TypeScript cannot look inside a
  `ReactNode`, so this one is a runtime check that matches on the element's
  function name (it does not see through a wrapper element).

**Tooling:** `npm run screenshot [filter]` captures every story to
`screenshots/` via headless Chrome for visual-regression comparisons (capture
before and after a change and compare the folders). Z-index layers are tokens
(`--z-modal` / `--z-menu` / `--z-tooltip`).

**Git + publishing (2026-08-01).** This project WAS deliberately not a git
repository; Daniel reversed that on 2026-08-01 so the source is backed up and
Storybook can publish itself. It is now a git repo pushed to
`github.com/daniel-moss/kitchen-ui`, and
`.github/workflows/deploy-storybook.yml` builds Storybook on every push to
`main` and deploys it to GitHub Pages. **Build output is never committed** —
`storybook-static/`, `storybook-share/`, `screenshots/`, `node_modules/` and
`.claude/settings.local.json` are gitignored. So publishing an update = push;
do NOT hand-upload build files (that repo used to hold the built site, which
is why raw `.tsx` uploads there did nothing).

### Cross-component patterns established (reuse these)
- **Every `:hover` rule lives inside `@media (hover: hover)`** — touch devices
  never match it, so taps don't leave sticky hover states (fixed DS-wide after
  real-iPhone testing). Write new hover styles the same way; keep
  active/focus/invalid selectors OUTSIDE the media query.
- **Borders that must not add size** (subtle Button, AlertBanner card, StepGroup
  band): draw as an **inset `box-shadow`**, not a real `border` — an auto-sized
  element's border is added outside the box and changes dimensions.
- **Interactive-row states come from mixins** (`src/styles/mixins/_interaction.scss`):
  `row-hover-fill` / `row-press-fill` / `row-focus-fill` (no ring) /
  `row-focus-ring` (2px stroke + 2px gap + fill, stacked inset shadows — the DS
  focus spec) / `row-disabled`. Components keep their own selectors (including
  `:not(:has(...))` slot exclusions) and include the fills. The accordion
  collapse (grid-template-rows 0fr→1fr) is `src/styles/mixins/_collapse.scss`.
- **Controlled-or-uncontrolled state** is `src/hooks/useControllableState.ts` —
  used by every toggle (`checked`) and accordion (`open`).
- **Group dividers** (all groups but the last) = `src/utils/groupDividers.tsx`,
  used by Menu, MenuItem sub-menus, and SelectList.
- **Story helpers live in `src/stories/helpers.tsx`** (DeviceFrame, cap, noop,
  PSEUDO_ALL/PSEUDO_SELF, LINES) — import them, do not re-declare per story.
  PSEUDO_SELF (className on the element) is for components whose hover excludes
  slot-hover via `:has()` — the `-all` variants would suppress the row state.
- **Debounce is leading-edge** (`src/utils/debounce.ts`): fires immediately, then
  guards for `wait` ms. Trailing debounce delayed every click by 250ms.
- **Tooltips never clip:** render in a `document.body` portal (see `TruncatingText`,
  `HoverTooltip`) — any `overflow`/scroll ancestor would otherwise cut them off.
- **Every `<input>` opts OUT of autofill / password managers** (Daniel hit a
  native password popup on a "Received by" picker, 2026-08-03): `autoComplete="off"`
  + `data-1p-ignore` + `data-lpignore` + `data-form-type="other"`, listed BEFORE
  the `{...rest}` spread so a consumer can opt back in for a real name/address
  field. `SearchField` also sets a neutral `name="search"` — Chrome and Safari
  classify a field as a user name from its `name`/`id` AND its placeholder, and
  once they have, they IGNORE `autocomplete="off"`. So avoid the words "user
  name" / "password" in a placeholder unless you want the browser's UI.
- **Modals** (`Dialog`, `Prompt`) share `src/hooks/useMountTransition` +
  `useIsDesktop` and portal to `document.body` at z-index 1000 (tooltips 9999).
- **Design values come from Figma only** (see the `figma-only-design-source`
  memory) — the `../Kitchen UI/components/*.md` specs have drifted; confirm every
  size/token/font against Figma.
- **Sidebar order** lives in `.storybook/preview.js` `storySort.order` — components
  alphabetical (Popover family grouped under `Components/Popover/`); add each new
  component there, Playground-first.

## Component docs pages (MDX) — the standing conventions

Every component gets a Storybook documentation page, built from its **Figma
"Documentation" page** (Daniel shares the node link; read the nodes fully —
Rule 0 — and follow the page's structure and copy; small grammar fixes are OK
but flag them). Check `src/**/*.mdx` for the current list of built pages —
**`FormModule.mdx` + `FormModule.stories.tsx` are the reference template.**

- One `<Name>.mdx` next to the component: `<Meta of>` + content ONLY. ALL
  styling comes from the global `src/styles/storybook-docs.css` (page type
  spec, spacing rhythm, always-dark code blocks, ArgTypes table, preview
  strokes — all token-based, theme-aware). Never add a per-file `<style>`
  block.
- Each Figma example = its own named story, embedded with `<Canvas of>`.
  Docs-embedded stories wrap their content in **`docsFrame`** (or
  `<DocsFrame>`) from `src/stories/helpers.tsx`, and the stories' meta sets
  `parameters: { layout: "fullscreen" }` — the frame owns the ONLY padding.
- Page skeleton: `# Name` → one intro paragraph — always opens **We use
  `Name` …** → hero `<Canvas>` → a ` ```tsx ` usage snippet → ↳ TOC links
  (`#anatomy` / `#behaviour` / `#props`) → `## Anatomy` (structure + the key
  measurements) → `## Behaviour` (one `###` per rule) → `## Props` with
  `<ArgTypes of={Stories} />` (the table is fed by the JSDoc in `*.types.ts`
  — keep those comments good). The middle rule-section is ALWAYS titled
  `## Behaviour` — never "States" or another synonym (Daniel, 2026-07-30).
  A component with two mount modes may instead split into named sections
  (e.g. CheckboxItem/RadioItem `## Inline` / `## Card`); that is the one
  sanctioned deviation. **Second sanctioned deviation (Daniel, 2026-08-05):**
  when the component's Figma Documentation page is itself split into several
  top-level sections, FOLLOW THE FIGMA SECTION NAMES instead of folding them
  into one `## Behaviour` — ListItem.mdx does this (`Anatomy` / `Content` /
  `Right elements` / `Bottom elements` / `Dragging` / `Interactivity` /
  `Accordion` / `Props`), and the TOC links mirror them.
- **Props-table gotcha:** `<ArgTypes>` is fed by react-docgen, which CANNOT
  read JSDoc off a **union** props type — it renders an empty table (no
  descriptions, no types). When `<Name>Props` is a union (ListItem's variant
  axes exclude each other), declare the whole table by hand in the stories
  meta's `argTypes` (`description` + `table.type.summary` +
  `table.defaultValue.summary`) and keep it in step with the `.types.ts`
  JSDoc. See `ListItem.stories.tsx`.
- Measurements in docs prose (and in the JSDoc the props table shows) are
  written as **the token with the px value**: `` `--size-1_5` (6px) `` —
  but ONLY where the code truly uses that token; untokenized values stay
  px-only (a token name for a bare number would lie).
- Cross-links to other components: `<a href="/?path=..." target="_top">`
  (root-absolute — they break under sub-path hosting; fine on root hosts).
  Target rule (Daniel, 2026-07-30): link to the component's **`--docs`** page
  when it HAS one (`/?path=/docs/<id>--docs`); fall back to its
  `--playground` story (`/?path=/story/<id>--playground`) ONLY when it has no
  docs page (e.g. AlertBanner, Button, Icon, DatePicker, CardFile).
- Behavior that is the CONSUMER's wiring (not the component's) gets a live
  interactive story (see `BannerDismissal`) plus an explicit "the component
  does not do this by itself" line.
- The Storybook MANAGER (nav sidebar etc.) is themed to the NavSidebar look in
  `.storybook/manager.js` + `manager-head.html` (light/dark literals of the
  DS tokens; follows the preview's theme toolbar). Manager file changes need a
  Storybook RESTART, not just HMR.

## Forms (`src/forms/`) — the reusable product-form tier

Between the DS (`src/components/`) and the prototypes: **product forms** that
several flows share, built once from DS components (Daniel's one-source-of-
truth rule, 2026-07-28). One folder per form, same file conventions as
components; stories under the **"Forms"** Storybook section. Rules:
- The form owns everything that is the same everywhere: fields, validation,
  layout, its own Dialog/drawer shell, the footer. Per-case differences are
  NAMED PROPS — data props (e.g. `client`), behavior props (`onCreated` — the
  caller decides the follow-up), slots only for truly case-specific content.
  No copies per case.
- `src/forms/shared/selectPopover.tsx` is the SHARED trigger→SelectList wiring
  (desktop anchored card / mobile drawer, placements `below`/`left`, `openAt`
  for autocompletes). RULE (Daniel): the card is FIXED once open — it must not
  follow a trigger that moves from layout changes; only window resize
  re-measures.
  JobDetails imports it; the other prototypes still carry local copies
  (consolidation pending).
- **LAYOUT-FREEZE RULE — `pop.freeze(value)` (Daniel, 2026-08-03).** Because the
  card is fixed once open, anything the picks GROW below the trigger (a badge
  row, the picked items' list) would push the trigger down and the card would
  drift away from its field. So wrap that content in `pop.freeze(...)`: it
  returns the value as it was when the list OPENED and re-syncs on close, and
  the frozen content sits behind the open list where nobody sees it lag. Use it
  for EVERY multi-select whose picks render below the field — do not hand-roll a
  snapshot. Do NOT freeze the field's own value/counter: the field does not
  change size, so it must keep updating live as you tick.
- Built so far: **NewLocationForm** (Figma 23805-13764: header caption =
  client, Service address module with the mock-Google address autocomplete +
  "Enter manually", Labels = chips row ending with a plus IconButton that
  opens the multi-select list to its LEFT (create-from-search; the chips row
  is FROZEN while the list is open — badges sync when it closes, the
  layout-freeze rule), Notes with title hint, "Location created" toast). Used by the
  Job Details Location flow.

## Prototypes (`src/prototypes/`)

The point of the DS: **assemble working feature prototypes Daniel can share
with colleagues.** Read **`MOBILE.md`** before building or device-testing a
prototype — it documents the iOS home-screen viewport limitation, the
touch/gesture rules baked into the DS, and the real-phone testing workflow
(PhoneViewport, Add to Home Screen, meta-tag caveats).

Conventions (established with the first one, View Menu):

- One folder per prototype under `src/prototypes/<Name>/`; each is a Storybook
  story under the **"Prototypes"** sidebar section (add it to `storySort.order`
  in preview.js). Usually a Desktop story + a Mobile story (in `DeviceFrame`).
- **DS components must be the real DS components** — never a lookalike. Pieces
  that are NOT in the DS (e.g. View Menu's "Unpinned" divider, the Hint bubble)
  are built prototype-LOCAL and flagged to Daniel. Local style overrides (like
  the View Menu's compact ListItem paddings) are allowed when the design shows
  them on purpose — keep them in the prototype's own scss.
- Workflow per prototype: deep-read the Figma file first, then present Daniel a
  component mapping + behavior rules + open questions; he answers; then build.
  Figma prototype wiring (interaction arrows) and comment pins are NOT readable
  via MCP — behavior comes from state boards, canvas text, cursors, and Figma
  dev annotations (`data-annotations` in design context).
- Gotcha: floating things (dropdown lists, hints) must render in a
  `document.body` portal, like tooltips — ListItem clips them
  (`overflow: hidden`), and anchoring inside a Popover card grows the card
  body's scroll area (a scrollbar appears while the list is open and the menu
  visibly narrows) or clips at the card edge. See `FloatingList` in the View
  Menu prototype: `position: fixed` from the anchor's rect, re-measured on
  scroll/resize; mark the portal (`data-floating-list`) and exclude it from
  outside-click-close handlers.
- **Sharing plan (agreed):** `npm run build-storybook` → upload
  `storybook-static/` to any static host (Netlify Drop / Surge / GitHub Pages —
  Daniel decides; NOT one repo per prototype). Share
  `<site>/iframe.html?id=prototypes-<name>--<story>` for a clean full-screen
  link. Not tried yet.

## Read-only — production codebase

- **Never edit, create, move, or delete anything in `../roopairs_api`.** It is
  the production app. Read and reference it freely; ask Daniel before touching
  any file there.
- There is a broader project `CLAUDE.md` one level up (`../CLAUDE.md`) with rules
  for the prototypes and the design-system source.

## Likely next steps

- Build more components Daniel asks for, following the conventions above. He works
  one component at a time: he shares Figma links, you propose the build + open
  decisions, he answers, then says to build. Reference **Figma** for all design
  values (not the drifted `../Kitchen UI/components/*.md` specs).
- Shared hooks live in `src/hooks/` (`useMountTransition`, `useIsDesktop`) —
  Popover, Dialog, Prompt, Menu, and MenuItem all use them; new floating/modal
  components should too.
