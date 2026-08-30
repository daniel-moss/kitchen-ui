import { MouseEvent } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";

export interface TopBarViewView {
  /** Unique view id — the value reported by `onViewChange`. */
  value: string;
  /** The view's visible name: a tab on desktop; the selector label and a select-list item on mobile. */
  label: string;
}

export interface TopBarViewProps {
  /** The available views. Desktop renders them as tabs; mobile as the view selector's select list. */
  views: TopBarViewView[];
  /** Selected view value (controlled). */
  view?: string;
  /** Uncontrolled initial view. Default: the first view. */
  defaultView?: string;
  /** Called with the newly-selected view value. */
  onViewChange?: (value: string) => void;

  /** Keyword search value (controlled). */
  search?: string;
  /** Uncontrolled initial search value. A non-empty value mounts the search field/bar open. */
  defaultSearch?: string;
  /** Called with the search value on every keystroke, and with "" on Clear. */
  onSearchChange?: (value: string) => void;
  /** Hint text shown while the search input is empty. Default `"Keyword search..."`. */
  searchPlaceholder?: string;

  /**
   * The number of applied filters. Above 0, the mobile Filters IconButton
   * turns into a ghost Button whose label is this number; at 0 it turns back
   * into the IconButton. Desktop keeps the labeled "Filters" Button. Default 0.
   */
  filtersCount?: number;
  /**
   * Called when "Filters" is clicked (the Button on desktop, the IconButton on
   * mobile). The filters menu itself is the consumer's wiring.
   */
  onFiltersClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * Called when "View" is clicked (the Button on desktop, the IconButton on
   * mobile). The view menu itself is the consumer's wiring.
   */
  onViewMenuClick?: (event: MouseEvent<HTMLButtonElement>) => void;

  /** "auto" (default) tracks the viewport; "desktop" / "mobile" force one (Storybook, tests). */
  breakpoint?: Breakpoint;
  className?: string;

  // Story-only visual-state simulators (hidden from the docs table).
  /** Force the keyword search open (the desktop field / the mobile search bar). */
  _searchOpen?: boolean;
  /** Force the mobile view-selector list open. */
  _viewListOpen?: boolean;
}
