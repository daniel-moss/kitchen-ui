import type { Meta, StoryObj } from "@storybook/react";

import { DocsFrame, noop } from "../../stories/helpers";
import Button from "../Button/Button";
import { Icon } from "../Icon/Icon";
import IconButton from "../IconButton/IconButton";
import HoverTooltip from "../Tooltip/HoverTooltip";
import TopBarView from "./TopBarView";

const meta: Meta<typeof TopBarView> = {
  title: "Components/TopBarView",
  component: TopBarView,
  // fullscreen — the stories' own DocsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: {
    breakpoint: "desktop",
    searchPlaceholder: "Keyword search...",
  },
  argTypes: {
    views: { control: false },
    onViewChange: { control: false },
    onSearchChange: { control: false },
    filtersCount: { control: { type: "number", min: 0 } },
    onFiltersClick: { control: false },
    onViewMenuClick: { control: false },
    breakpoint: { options: ["auto", "desktop", "mobile"], control: { type: "inline-radio" } },
    // Story-only simulators — not part of the public API.
    _searchOpen: { table: { disable: true } },
    _viewListOpen: { table: { disable: true } },
  },
};
export default meta;

type Story = StoryObj<typeof TopBarView>;

const VIEWS = [
  { value: "all", label: "All" },
  { value: "my-jobs", label: "My jobs" },
  { value: "office", label: "Office" },
  { value: "recently-closed", label: "Recently closed" },
];

const TWO_VIEWS = VIEWS.slice(0, 2);

export const Playground: Story = {
  args: { views: VIEWS },
  render: (args) => (
    <DocsFrame>
      <TopBarView {...args} />
    </DocsFrame>
  ),
};

/** The two breakpoints, as in the Figma hero: desktop above, mobile below. */
export const Hero: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
        <TopBarView views={TWO_VIEWS} breakpoint="desktop" onFiltersClick={noop} onViewMenuClick={noop} />
        <TopBarView views={TWO_VIEWS} breakpoint="mobile" onFiltersClick={noop} onViewMenuClick={noop} />
      </div>
    </DocsFrame>
  ),
};

/** Desktop anatomy: TabGroup left, Search / Filters / View right, Divider below. */
export const AnatomyDesktop: Story = {
  render: () => (
    <DocsFrame>
      <TopBarView views={TWO_VIEWS} breakpoint="desktop" onFiltersClick={noop} onViewMenuClick={noop} />
    </DocsFrame>
  ),
};

/** Mobile anatomy: the view selector left, the IconButtons right. */
export const AnatomyMobile: Story = {
  render: () => (
    <DocsFrame>
      <TopBarView views={VIEWS} breakpoint="mobile" onFiltersClick={noop} onViewMenuClick={noop} />
    </DocsFrame>
  ),
};

/**
 * Live scroll: more tabs than the width fits — the TabGroup scrolls (drag,
 * or a plain mouse wheel) and the 40px fade marks the side where the tabs
 * continue behind the container.
 */
export const TabsScroll: Story = {
  render: () => (
    <DocsFrame>
      <TopBarView
        views={[
          ...VIEWS,
          { value: "unassigned", label: "Unassigned" },
          { value: "overdue", label: "Overdue" },
          { value: "this-week", label: "This week" },
        ]}
        breakpoint="desktop"
        onFiltersClick={noop}
        onViewMenuClick={noop}
      />
    </DocsFrame>
  ),
};

/** The mobile view selector with its inline select list open. */
export const ViewSelectorOpen: Story = {
  render: () => (
    <DocsFrame>
      <TopBarView views={VIEWS} breakpoint="mobile" _viewListOpen onFiltersClick={noop} onViewMenuClick={noop} />
      {/* Room for the overhanging list in the docs canvas. */}
      <div style={{ height: 200 }} />
    </DocsFrame>
  ),
};

/** A long view name truncates instead of pushing the IconButtons out. */
export const ViewNameTruncation: Story = {
  render: () => (
    <DocsFrame>
      {/* Phone width, so the long name actually runs out of room. */}
      <div style={{ maxWidth: 375, margin: "0 auto" }}>
        <TopBarView
          views={[{ value: "long", label: "Very long view name which does not fit 1 line" }, ...TWO_VIEWS]}
          breakpoint="mobile"
          onFiltersClick={noop}
          onViewMenuClick={noop}
        />
      </div>
    </DocsFrame>
  ),
};

/**
 * Desktop keyword search, top to bottom: the resting "Search" button; the
 * empty field (click into it for the focused state); the field with a value
 * and its Clear button.
 */
export const SearchDesktop: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
        <TopBarView views={TWO_VIEWS} breakpoint="desktop" onFiltersClick={noop} onViewMenuClick={noop} />
        <TopBarView views={TWO_VIEWS} breakpoint="desktop" _searchOpen onFiltersClick={noop} onViewMenuClick={noop} />
        <TopBarView
          views={TWO_VIEWS}
          breakpoint="desktop"
          defaultSearch="Value"
          onFiltersClick={noop}
          onViewMenuClick={noop}
        />
      </div>
    </DocsFrame>
  ),
};

/**
 * Mobile keyword search, top to bottom: the resting bar; the search bar shown
 * (the Search IconButton hides); the search bar with a value.
 */
export const SearchMobile: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
        <TopBarView views={VIEWS} breakpoint="mobile" onFiltersClick={noop} onViewMenuClick={noop} />
        <TopBarView views={VIEWS} breakpoint="mobile" _searchOpen onFiltersClick={noop} onViewMenuClick={noop} />
        <TopBarView
          views={VIEWS}
          breakpoint="mobile"
          defaultSearch="Value"
          onFiltersClick={noop}
          onViewMenuClick={noop}
        />
      </div>
    </DocsFrame>
  ),
};

/** Hover the Search IconButton for its tooltip (mobile's icon-only form). */
export const SearchTooltip: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--size-10) 0" }}>
        <HoverTooltip text="Search">
          <IconButton variant="ghost" size="lg" icon="search" aria-label="Search" onClick={noop} />
        </HoverTooltip>
      </div>
    </DocsFrame>
  ),
};

/** The "View" button (desktop) and its mobile IconButton — hover it for the tooltip. */
export const ViewButton: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-20)", padding: "var(--size-10) 0" }}>
        <Button variant="ghost" size="lg" leftIcon="sliders" onClick={noop}>
          View
        </Button>
        <HoverTooltip text="View">
          <IconButton variant="ghost" size="lg" icon="sliders" aria-label="View" onClick={noop} />
        </HoverTooltip>
      </div>
    </DocsFrame>
  ),
};

/**
 * The mobile Filters control's two states: no applied filters (the
 * IconButton) and applied filters (the ghost Button with the count).
 */
export const FiltersButtonStates: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--size-10)", padding: "var(--size-10) 0" }}>
        <IconButton variant="ghost" size="lg" icon="bars-filter" aria-label="Filters" onClick={noop} />
        <Icon icon="arrow-right" pack="regular" size={14} style={{ color: "var(--gray-a8)" }} aria-hidden="true" />
        <Button variant="ghost" size="lg" leftIcon="bars-filter" onClick={noop}>
          2
        </Button>
      </div>
    </DocsFrame>
  ),
};

/** The "Filters" button (desktop) and its mobile IconButton — hover it for the tooltip. */
export const FiltersButton: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-20)", padding: "var(--size-10) 0" }}>
        <Button variant="ghost" size="lg" leftIcon="bars-filter" onClick={noop}>
          Filters
        </Button>
        <HoverTooltip text="Filters">
          <IconButton variant="ghost" size="lg" icon="bars-filter" aria-label="Filters" onClick={noop} />
        </HoverTooltip>
      </div>
    </DocsFrame>
  ),
};
