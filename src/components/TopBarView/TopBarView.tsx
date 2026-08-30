import { ChangeEvent, FocusEvent, ReactNode, UIEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import clsx from "clsx";

import useControllableState from "../../hooks/useControllableState";
import useIsDesktop from "../../hooks/useIsDesktop";
import Button from "../Button/Button";
import { Divider } from "../Divider/Divider";
import SearchField from "../Fields/SearchField/SearchField";
import { Icon } from "../Icon/Icon";
import IconButton from "../IconButton/IconButton";
import SelectList from "../SelectList/SelectList";
import SelectListItem from "../SelectList/SelectListItem";
import SelectListItemGroup from "../SelectList/SelectListItemGroup";
import TabGroup from "../Tabs/TabGroup";
import TabItem from "../Tabs/TabItem";
import HoverTooltip from "../Tooltip/HoverTooltip";

import styles from "./TopBarView.module.scss";
import { TopBarViewProps } from "./TopBarView.types";

// The desktop tabs scroller (TopBarNav's pattern, with this bar's 40px fade):
// tabs scroll horizontally when space is tight, and a fade marks the side
// where they continue behind the container.
function TabsScroller({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });

  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setFade((f) => (f.left === left && f.right === right ? f : { left, right }));
  };

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  });

  // A plain vertical mouse wheel scrolls the tabs horizontally (no Shift
  // needed). Native non-passive listener — React's onWheel can't
  // preventDefault (it's registered passive).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // real horizontal input works natively
      if (el.scrollWidth <= el.clientWidth) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onScroll = (_e: UIEvent) => measure();

  return (
    <div
      ref={ref}
      className={clsx(
        styles.tabsScroller,
        fade.left && fade.right && styles.fadeBoth,
        fade.left && !fade.right && styles.fadeLeft,
        !fade.left && fade.right && styles.fadeRight,
      )}
      onScroll={onScroll}
    >
      {children}
    </div>
  );
}

// TopBarView — the view-controls bar above a table / cards list. Desktop: a
// TabGroup with the views on the left, Search / Filters / View on the right.
// Mobile: the tabs become a view selector (an inline select list); the
// buttons become IconButtons, and the keyword search opens as its own bar
// below. The Filters and View MENUS are the consumer's wiring — this bar
// only reports the clicks. See Figma "TopBarView" (node 29570-31216).
export default function TopBarView({
  views,
  view,
  defaultView,
  onViewChange,
  search,
  defaultSearch,
  onSearchChange,
  searchPlaceholder = "Keyword search...",
  filtersCount = 0,
  onFiltersClick,
  onViewMenuClick,
  breakpoint = "auto",
  className,
  _searchOpen = false,
  _viewListOpen = false,
}: TopBarViewProps) {
  const isDesktop = useIsDesktop(breakpoint);

  const [selectedView, setSelectedView] = useControllableState(
    view,
    defaultView ?? views[0]?.value ?? "",
    onViewChange,
  );
  const [searchValue, setSearchValue] = useControllableState(search, defaultSearch ?? "", onSearchChange);

  // The doc's rule, both breakpoints: the search field/bar stays as long as
  // it has a value or focus. Opening happens on the Search button; closing on
  // blur with an empty value. The Clear (×) button refocuses the input, so
  // clearing alone never closes it — the following blur does.
  const [searchOpenState, setSearchOpenState] = useState((search ?? defaultSearch ?? "") !== "");
  const searchOpen = searchOpenState || _searchOpen;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  // Render the field synchronously and focus it inside the same tap gesture —
  // iOS opens the on-screen keyboard only for a focus made during the tap.
  const openSearch = () => {
    flushSync(() => setSearchOpenState(true));
    searchInputRef.current?.focus();
  };

  const onSearchBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (searchWrapRef.current?.contains(e.relatedTarget as Node) ?? false) return;
    if ((searchValue ?? "") === "") setSearchOpenState(false);
  };

  const searchFieldProps = {
    value: searchValue,
    placeholder: searchPlaceholder,
    onChange: (e: ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value),
    onClear: () => setSearchValue(""),
    onBlur: onSearchBlur,
  };

  // The mobile view-selector list (inline, like TopBarNavTitle's subpages).
  const [listOpenState, setListOpenState] = useState(false);
  const listOpen = listOpenState || _viewListOpen;
  const selectorWrapRef = useRef<HTMLDivElement>(null);

  // Clicking outside the selector + list closes the list.
  useEffect(() => {
    if (!listOpen) return undefined;
    const onDown = (e: PointerEvent) => {
      if (selectorWrapRef.current != null && !selectorWrapRef.current.contains(e.target as Node)) {
        setListOpenState(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [listOpen]);

  if (isDesktop) {
    return (
      <div className={clsx(styles.bar, className)}>
        <div className={styles.inner}>
          <TabsScroller>
            <TabGroup variant="default" size="lg" value={selectedView} onChange={setSelectedView}>
              {views.map((v) => (
                <TabItem key={v.value} value={v.value}>
                  {v.label}
                </TabItem>
              ))}
            </TabGroup>
          </TabsScroller>
          <div className={styles.controls}>
            {searchOpen ? (
              <div ref={searchWrapRef} className={styles.searchField}>
                <SearchField ref={searchInputRef} type="field" {...searchFieldProps} />
              </div>
            ) : (
              <Button variant="ghost" size="lg" leftIcon="search" onClick={openSearch}>
                Search
              </Button>
            )}
            <Button variant="ghost" size="lg" leftIcon="bars-filter" onClick={onFiltersClick}>
              Filters
            </Button>
            <Button variant="ghost" size="lg" leftIcon="sliders" onClick={onViewMenuClick}>
              View
            </Button>
          </div>
        </div>
        <Divider />
      </div>
    );
  }

  const selectedLabel = views.find((v) => v.value === selectedView)?.label ?? "";

  return (
    <div className={clsx(styles.bar, className)}>
      <div className={clsx(styles.inner, styles.mobileInner)}>
        <div ref={selectorWrapRef} className={styles.selectorWrap}>
          <button
            type="button"
            className={clsx(styles.selector, listOpen && styles.selectorOpen)}
            aria-haspopup="listbox"
            aria-expanded={listOpen}
            onClick={() => setListOpenState(!listOpenState)}
          >
            <span className={styles.selectorLabel}>{selectedLabel}</span>
            <span className={styles.selectorIcon} aria-hidden="true">
              <Icon icon="angles-up-down" size={14} />
            </span>
          </button>
          <div className={styles.listAnchor}>
            {/* breakpoint="desktop" keeps the INLINE list on mobile — the
                doc's rule: "The select list opens inline on mobile." */}
            <SelectList variant="inline" breakpoint="desktop" open={listOpen} onClose={() => setListOpenState(false)}>
              <SelectListItemGroup>
                {views.map((v) => (
                  <SelectListItem
                    key={v.value}
                    label={v.label}
                    selected={v.value === selectedView}
                    onClick={() => {
                      setSelectedView(v.value);
                      setListOpenState(false);
                    }}
                  />
                ))}
              </SelectListItemGroup>
            </SelectList>
          </div>
        </div>
        <div className={styles.controls}>
          {/* The Search button HIDES while the search bar is shown (the doc). */}
          {!searchOpen && (
            <HoverTooltip text="Search">
              <IconButton variant="ghost" size="lg" icon="search" aria-label="Search" onClick={openSearch} />
            </HoverTooltip>
          )}
          {/* With applied filters the IconButton turns into a Button whose
              copy is the count; clearing them all turns it back (the doc).
              The tooltip belongs to the IconButton form only. */}
          {filtersCount > 0 ? (
            <Button variant="ghost" size="lg" leftIcon="bars-filter" aria-label={`Filters (${filtersCount} applied)`} onClick={onFiltersClick}>
              {filtersCount}
            </Button>
          ) : (
            <HoverTooltip text="Filters">
              <IconButton variant="ghost" size="lg" icon="bars-filter" aria-label="Filters" onClick={onFiltersClick} />
            </HoverTooltip>
          )}
          <HoverTooltip text="View">
            <IconButton variant="ghost" size="lg" icon="sliders" aria-label="View" onClick={onViewMenuClick} />
          </HoverTooltip>
        </div>
      </div>
      <Divider />
      {searchOpen && (
        <div ref={searchWrapRef}>
          <SearchField ref={searchInputRef} type="bar" {...searchFieldProps} />
          <Divider />
        </div>
      )}
    </div>
  );
}
