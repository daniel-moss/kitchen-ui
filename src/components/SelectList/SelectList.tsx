import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  KeyboardEvent,
  ReactElement,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import clsx from "clsx";

import useMountTransition from "../../hooks/useMountTransition";
import useIsDesktop from "../../hooks/useIsDesktop";
import useEscapeKey from "../../hooks/useEscapeKey";
import useRestoreFocus from "../../hooks/useRestoreFocus";
import Popover from "../Popover/Popover";
import Dialog from "../Dialog/Dialog";
import DrawerHeader from "../Popover/DrawerHeader";
import PopoverHeaderContent from "../Popover/PopoverHeaderContent";
import PopoverHeaderText from "../Popover/PopoverHeaderText";
import EmptyState from "../EmptyState/EmptyState";
import { Icon } from "../Icon/Icon";
import MenuItem from "../Menu/MenuItem";
import ScrollArea from "../ScrollArea/ScrollArea";
import SelectListHeader from "./SelectListHeader";
import { withGroupDividers } from "../../utils/groupDividers";

import styles from "./SelectList.module.scss";
import { SelectListProps } from "./SelectList.types";

// Card fade duration. Keep in sync with the transitions in SelectList.module.scss.
const DURATION = 160;
const noop = () => {};

// Built-in search: filter the SelectListItems (inside their groups) whose
// `searchText` (else `label`) matches the query; drop groups left empty.
// Returns the filtered children and the total number of matching items (for
// the "no results" state). Non-string labels are never filtered out (can't
// match reliably).
function filterGroups(children: ReactNode, query: string): { nodes: ReactNode; count: number } {
  const q = query.trim().toLowerCase();
  if (q === "") return { nodes: children, count: -1 };
  let count = 0;
  const groups = Children.toArray(children).map((group) => {
    if (!isValidElement(group)) return null;
    const items = Children.toArray((group.props as { children?: ReactNode }).children).filter((item) => {
      if (!isValidElement(item)) return false;
      const { label, searchText } = item.props as { label?: ReactNode; searchText?: string };
      const haystack =
        searchText ?? (typeof label === "string" || typeof label === "number" ? String(label) : null);
      const ok = haystack == null ? true : haystack.toLowerCase().includes(q);
      if (ok) count += 1;
      return ok;
    });
    if (items.length === 0) return null;
    return cloneElement(group as ReactElement, {}, items);
  });
  return { nodes: groups.filter(Boolean), count };
}

// Multi-select "selected on top" (Figma 13875-5979): the items that are selected
// when the list OPENS are pinned into a group at the top, a divider, then the
// rest. `pinned` is the snapshot of selected keys taken on open and FROZEN while
// open — checking/unchecking does not move items (they only re-sort on the next
// open), so options never jump under the finger. All items are flattened and
// re-split into selected/unselected (the first group element is reused as the
// wrapper). withGroupDividers then draws the divider between the two.
//
// THE RULE (Daniel, 2026-08-07): this applies ONLY to a SINGLE-group list. With
// more than one group the groups carry meaning — where an option comes from —
// so they stay as the consumer wrote them and nothing is pinned on top. See
// `groupCount` at the call site.
function reorderSelected(children: ReactNode, pinned: Set<string>): ReactNode {
  const groups = Children.toArray(children).filter(isValidElement) as ReactElement[];
  if (groups.length === 0) return children;
  const template = groups[0];
  const items = groups.flatMap((g) =>
    Children.toArray((g.props as { children?: ReactNode }).children).filter(isValidElement),
  ) as ReactElement[];
  const sel: ReactElement[] = [];
  const rest: ReactElement[] = [];
  items.forEach((it) => (pinned.has(String(it.key)) ? sel : rest).push(it));
  const out: ReactElement[] = [];
  if (sel.length > 0) out.push(cloneElement(template, { key: "__selected" }, sel));
  if (rest.length > 0) out.push(cloneElement(template, { key: "__unselected" }, rest));
  return out;
}

// What a SelectListItem needs from its SelectList: it reports every option
// click, and a single-select list closes itself in response.
export interface SelectListContextValue {
  notifySelect: () => void;
}
export const SelectListContext = createContext<SelectListContextValue | null>(null);

// SelectList — the select menu container holding SelectListItemGroups, with an
// optional pinned SelectListHeader (search) and SelectListFooter. Variants:
// inline = a floating card (under a SelectField); dialog = built on Dialog
// (560px card, title + close, max height 1000); drawer = the mobile bottom
// sheet. On mobile, inline and dialog fall back to the drawer. Group dividers
// are managed automatically (every group but the last). Single-select closes
// on selection; arrow keys walk the options; empty / noResults states swap the
// body for an EmptyState. See Figma "SelectList".
export default function SelectList({
  variant = "inline",
  children,
  open = true,
  restoreFocus = true,
  onClose,
  title,
  caption,
  drawerHeaderDivider = true,
  header,
  searchable = false,
  searchPlaceholder,
  footer,
  multiSelect = false,
  state = "default",
  emptyState,
  noResultsCaption,
  noResultsAction,
  noResultsState,
  autoFocusSearch = false,
  createFromSearch,
  breakpoint = "auto",
  className,
  style,
}: SelectListProps) {
  const isDesktop = useIsDesktop(breakpoint);
  const { mounted, visible } = useMountTransition(open, DURATION);
  const listRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Built-in search: SelectList owns the query, filters the items, and RESETS
  // when the list closes (no stale search on reopen).
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);
  const searchHeader = searchable ? (
    <SelectListHeader
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onClear={() => setQuery("")}
      placeholder={searchPlaceholder ?? "Search…"}
    />
  ) : (
    header
  );
  const { nodes: bodyChildren, count } = searchable ? filterGroups(children, query) : { nodes: children, count: -1 };
  const effectiveState = searchable && count === 0 ? "noResults" : state;

  // Multi-select "selected on top": snapshot the selected item keys when the
  // list opens and freeze them while it stays open (re-sort only on reopen).
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!open || !multiSelect) return;
    const keys = new Set<string>();
    Children.toArray(children).forEach((g) => {
      if (!isValidElement(g)) return;
      Children.toArray((g.props as { children?: ReactNode }).children).forEach((it) => {
        if (isValidElement(it) && (it.props as { selected?: boolean }).selected) keys.add(String(it.key));
      });
    });
    setPinned(keys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  // Counted on the ORIGINAL children, not the filtered ones: a search that
  // empties one of two groups must not flip the list into "selected on top".
  const groupCount = Children.toArray(children).filter(isValidElement).length;
  const orderedChildren = multiSelect && groupCount === 1 ? reorderSelected(bodyChildren, pinned) : bodyChildren;

  // A search header auto-focuses on open ONLY on devices with a real pointer
  // (`hover: hover` — the same signal as the DS-wide hover rule), so typing
  // filters right away on desktop. TOUCH devices never auto-focus (Daniel,
  // 2026-07-29): focusing inside the tap makes iOS open the on-screen
  // keyboard instantly, covering half an iPad's screen — and an iPad in
  // landscape gets the DESKTOP presentation, so the breakpoint is NOT the
  // right signal; the input modality is. The drawer never auto-focuses either
  // way. useLayoutEffect + a SYNCHRONOUS first attempt remain for the
  // pointer-device variants; the interval is a fallback for variants whose
  // content mounts frames later (the Dialog).
  const hasHeader = searchHeader != null;
  const isDrawer = !isDesktop || variant === "drawer";
  useLayoutEffect(() => {
    if (!open || !hasHeader) return;
    // `autoFocusSearch` opts out of both exclusions — the consumer states that
    // typing is the whole point of the list (address autocomplete).
    if (!autoFocusSearch && isDrawer) return;
    if (!autoFocusSearch && !window.matchMedia("(hover: hover)").matches) return; // touch device
    // Succeeds only once the search input is actually FOCUSED — not merely
    // present. When the list opens from a control that grabs focus back a tick
    // later (e.g. a SelectField revealed inside a RadioItem card — the pause
    // forms), a single focus() lands then gets stolen; re-asserting until it
    // sticks fixes the "focuses only on the 2nd/3rd try" bug. The window is
    // short and stops the instant focus holds, so it never fights the user.
    let tries = 0;
    const ensureFocus = () => {
      const input = headerRef.current?.querySelector<HTMLElement>("input");
      if (input == null) return false; // not mounted yet — keep trying
      if (document.activeElement !== input) input.focus({ preventScroll: true });
      return document.activeElement === input;
    };
    if (ensureFocus()) return;
    const timer = setInterval(() => {
      if (ensureFocus() || ++tries > 40) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [open, hasHeader, isDrawer, autoFocusSearch]);

  // Escape closes the list; focus returns to the trigger. The dialog variant
  // gets both from Dialog itself, so it is excluded here.
  const usesDialog = variant === "dialog" && isDesktop;
  useEscapeKey(open && !usesDialog, onClose);
  useRestoreFocus(open && !usesDialog && restoreFocus);

  // Arrow keys (plus Home/End) move focus through the options, skipping
  // disabled ones. With no option focused, ArrowDown enters at the top and
  // ArrowUp at the bottom.
  const handleListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // The handler sits on BOTH the listbox and the outer card / search header (so
    // arrows + Enter work while focus is in the search); the guard stops it
    // running twice when a keydown on an option bubbles up.
    if (e.defaultPrevented) return;
    const options = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])') ?? [],
    );
    // Enter while the search (not an option) has focus selects the highlighted
    // first result (item 1). A focused option handles its own Enter.
    if (e.key === "Enter") {
      if (options.some((o) => o === document.activeElement)) return;
      const hl = options.find((o) => o.getAttribute("data-highlight") === "true");
      if (hl != null) {
        e.preventDefault();
        hl.click();
      }
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    if (options.length === 0) return;
    e.preventDefault();
    const current = options.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "ArrowDown"
        ? Math.min(current + 1, options.length - 1)
        : e.key === "ArrowUp"
          ? current === -1
            ? options.length - 1
            : Math.max(current - 1, 0)
          : e.key === "Home"
            ? 0
            : options.length - 1;
    options[next]?.focus();
    // Moving focus to an option supersedes the search-highlight.
    options.forEach((o) => o.removeAttribute("data-highlight"));
  };

  // While searching, pre-light the first match (data-highlight) so Enter selects
  // it without leaving the search input (item 1). Re-runs when the results change.
  useEffect(() => {
    if (!searchable) return;
    const list = listRef.current;
    if (list == null) return;
    const options = Array.from(list.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])'));
    const on = query.trim() !== "";
    options.forEach((o, i) => {
      if (on && i === 0) o.setAttribute("data-highlight", "true");
      else o.removeAttribute("data-highlight");
    });
    if (on && options[0] != null) options[0].scrollIntoView({ block: "nearest" });
  }, [query, count, searchable]);

  const body =
    effectiveState === "empty" ? (
      <EmptyState
        icon={emptyState?.icon}
        // Caption-only is a real state (the address drawer before typing), so
        // the default title only fills in when there is no copy at all.
        title={emptyState?.title ?? (emptyState?.caption == null ? "Nothing here yet" : undefined)}
        caption={emptyState?.caption}
        primaryAction={
          emptyState?.actionLabel != null
            ? { label: emptyState.actionLabel, leftIcon: "plus", onClick: emptyState.onAction }
            : undefined
        }
      />
    ) : effectiveState === "noResults" ? (
      createFromSearch != null ? (
        // The creatable variant (Figma "Create new label"): the no-match state
        // offers to create the searched value instead of a dead end.
        <div className={styles.createRow}>
          <MenuItem
            label={createFromSearch.label}
            tag={`"${query.trim()}"`}
            slotLeft={<Icon icon="plus" pack="regular" size={14} container="square" />}
            onClick={() => {
              createFromSearch.onCreate(query.trim());
              setQuery("");
            }}
          />
        </div>
      ) : (
        // A consumer-supplied block wins over the built-in one — see
        // `noResultsState`.
        noResultsState ?? (
          <EmptyState
            icon="ban"
            title="No results found"
            caption={noResultsCaption ?? "Try a different search"}
            primaryAction={
              noResultsAction != null
                ? { label: noResultsAction.label, leftIcon: noResultsAction.icon, onClick: noResultsAction.onClick }
                : undefined
            }
          />
        )
      )
    ) : (
      <div role="listbox" ref={listRef} onKeyDown={handleListKeyDown}>
        {withGroupDividers(orderedChildren)}
      </div>
    );

  // A single-select list closes as soon as an option is clicked (rule 6);
  // multi-select stays open.
  const context: SelectListContextValue = { notifySelect: multiSelect ? noop : (onClose ?? noop) };

  // ---- dialog (desktop) — wraps Dialog; the search header is its pinned subHeader ----
  if (variant === "dialog" && isDesktop) {
    return (
      <SelectListContext.Provider value={context}>
        <Dialog
          open={open}
          onClose={onClose ?? noop}
          title={title ?? ""}
          caption={caption}
          breakpoint="desktop"
          bodyPadded={false}
          subHeader={searchHeader != null ? <div ref={headerRef} onKeyDown={handleListKeyDown}>{searchHeader}</div> : undefined}
          footer={footer}
          cardStyle={{ maxHeight: "min(1000px, 80vh)" }}
          className={className}
        >
          {body}
        </Dialog>
      </SelectListContext.Provider>
    );
  }

  // ---- inline (desktop) — a floating card with sticky header/footer ----
  if (variant === "inline" && isDesktop) {
    if (!mounted) return null;
    return (
      <SelectListContext.Provider value={context}>
        <div className={clsx(styles.card, visible && styles.cardOpen, className)} style={style} onKeyDown={handleListKeyDown}>
          {searchHeader != null && (
            <div ref={headerRef} className={styles.header}>
              {searchHeader}
            </div>
          )}
          <ScrollArea wrapperClassName={styles.body}>{body}</ScrollArea>
          {footer != null && <div className={styles.footer}>{footer}</div>}
        </div>
      </SelectListContext.Provider>
    );
  }

  // ---- drawer — the mobile presentation (and the fallback for inline/dialog) ----
  const drawerHeader = (
    <>
      {title != null ? (
        <DrawerHeader divider={drawerHeaderDivider}>
          <PopoverHeaderContent>
            <PopoverHeaderText variant={caption != null ? "titleCaption" : "title"} title={title} caption={caption} />
          </PopoverHeaderContent>
        </DrawerHeader>
      ) : (
        <DrawerHeader variant="dragHandle" />
      )}
      {searchHeader != null && (
        <div ref={headerRef} onKeyDown={handleListKeyDown}>
          {searchHeader}
        </div>
      )}
    </>
  );

  return (
    <SelectListContext.Provider value={context}>
      <Popover
        drawer
        open={open}
        onClose={onClose}
        header={drawerHeader}
        footer={footer}
        className={clsx(className, hasHeader && styles.drawerFull)}
        style={style}
      >
        {body}
      </Popover>
    </SelectListContext.Provider>
  );
}
