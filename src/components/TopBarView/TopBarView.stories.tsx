import { CSSProperties, ReactNode } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { Do, DoDont, Dont } from "../../stories/DoDont";
import { docsFrame, DocsFrame, noop } from "../../stories/helpers";
import Button from "../Button/Button";
import { Icon } from "../Icon/Icon";
import IconButton from "../IconButton/IconButton";
import TopBarView from "./TopBarView";

const meta: Meta<typeof TopBarView> = {
  title: "Components/TopBarView",
  component: TopBarView,
  // fullscreen — the stories' own frame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: {
    breakpoint: "desktop",
    searchPlaceholder: "Search...",
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

// The desktop bar is wider than the 600px docs column, so its previews hug
// their content and overflow it equally on both sides (`data-hug`, see
// storybook-docs.css). 740px of bar + 80px padding = the Figma preview's 900.
const DESKTOP_BAR = 740;

const hugFrame: CSSProperties = { ...docsFrame, maxWidth: "none", width: "fit-content" };
const Hug = ({ children }: { children: ReactNode }) => (
  <div data-hug style={hugFrame}>
    <div style={{ width: DESKTOP_BAR }}>{children}</div>
  </div>
);

// 80px between stacked examples, the docs-page rhythm.
const Stack = ({ children }: { children: ReactNode }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>{children}</div>
);

const VIEWS = [
  { value: "all", label: "All" },
  { value: "my-jobs", label: "My jobs" },
  { value: "office", label: "Office" },
  { value: "recently-closed", label: "Recently closed" },
];

const TWO_VIEWS = VIEWS.slice(0, 2);

export const Playground: Story = {
  args: { views: VIEWS },
  parameters: { layout: "centered" },
  render: (args) => (
    <DocsFrame>
      <TopBarView {...args} />
    </DocsFrame>
  ),
};

/** The hero: the desktop bar, as on the Figma page. */
export const Hero: Story = {
  render: () => (
    <Hug>
      <TopBarView views={TWO_VIEWS} breakpoint="desktop" onFiltersClick={noop} onViewMenuClick={noop} />
    </Hug>
  ),
};

/** Desktop anatomy: TabGroup left; search field, Filters and View right. */
export const AnatomyDesktop: Story = {
  render: () => (
    <Hug>
      <TopBarView views={TWO_VIEWS} breakpoint="desktop" onFiltersClick={noop} onViewMenuClick={noop} />
    </Hug>
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
 * Views answer "which records", not "which page": the statuses of the chosen
 * phase belong here, the phase itself belongs to TopBarNav above.
 */
export const WhenToUse: Story = {
  // `data-hug` on the wrapper, not the column width the pair normally takes:
  // a desktop bar needs 740px, and the controls alone fill the 440px a
  // column-width Do / Don't body leaves. The pair still stacks.
  render: () => (
    <div data-hug>
      <DoDont>
        <Do caption="The statuses of the chosen phase as views — they change which records the same table shows.">
          <div style={{ width: DESKTOP_BAR }}>
            <TopBarView
              views={[
                { value: "all-open", label: "All open" },
                { value: "pending", label: "Pending" },
                { value: "scheduled", label: "Scheduled" },
              ]}
              breakpoint="desktop"
              onFiltersClick={noop}
              onViewMenuClick={noop}
            />
          </div>
        </Do>
        <Dont caption="The phase itself as views — open and closed belong to the bar above, and putting them here gives one choice two homes.">
          <div style={{ width: DESKTOP_BAR }}>
            <TopBarView
              views={[
                { value: "open", label: "Open" },
                { value: "closed", label: "Closed" },
              ]}
              breakpoint="desktop"
              onFiltersClick={noop}
              onViewMenuClick={noop}
            />
          </div>
        </Dont>
      </DoDont>
    </div>
  ),
};

/**
 * Live scroll: more views than the width fits — the TabGroup scrolls (drag,
 * or a plain mouse wheel) and the 40px fade marks the side where the tabs
 * continue behind the container.
 */
export const TabsScroll: Story = {
  render: () => (
    <Hug>
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
    </Hug>
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
          views={[{ value: "long", label: "Very long view name which does not fit one line" }, ...TWO_VIEWS]}
          breakpoint="mobile"
          onFiltersClick={noop}
          onViewMenuClick={noop}
        />
      </div>
    </DocsFrame>
  ),
};

/**
 * Mobile keyword search, top to bottom: the resting bar; the search bar open
 * and empty (the search IconButton has hidden); the search bar with a value
 * and its Clear button.
 */
export const Search: Story = {
  render: () => (
    <DocsFrame>
      <Stack>
        <TopBarView views={VIEWS} breakpoint="mobile" onFiltersClick={noop} onViewMenuClick={noop} />
        <TopBarView views={VIEWS} breakpoint="mobile" _searchOpen onFiltersClick={noop} onViewMenuClick={noop} />
        <TopBarView
          views={VIEWS}
          breakpoint="mobile"
          defaultSearch="Value"
          onFiltersClick={noop}
          onViewMenuClick={noop}
        />
      </Stack>
    </DocsFrame>
  ),
};

/** The "Filters" control: the labelled Button on desktop, the IconButton on mobile. */
export const FiltersButton: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--size-10)" }}>
        <Button variant="ghost" size="lg" leftIcon="bars-filter" onClick={noop}>
          Filters
        </Button>
        <IconButton variant="ghost" size="lg" icon="bars-filter" aria-label="Filters" onClick={noop} />
      </div>
    </DocsFrame>
  ),
};

/**
 * The mobile Filters control's two forms: no applied filters (the IconButton)
 * and applied filters (the ghost Button whose copy is the count).
 */
export const FiltersButtonStates: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--size-10)" }}>
        <IconButton variant="ghost" size="lg" icon="bars-filter" aria-label="Filters" onClick={noop} />
        <Icon icon="arrow-right" pack="regular" size={14} style={{ color: "var(--gray-a8)" }} aria-hidden="true" />
        <Button variant="ghost" size="lg" leftIcon="bars-filter" aria-label="Filters (3 applied)" onClick={noop}>
          3
        </Button>
      </div>
    </DocsFrame>
  ),
};

/** The "View" control: the labelled Button on desktop, the IconButton on mobile. */
export const ViewButton: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--size-10)" }}>
        <Button variant="ghost" size="lg" leftIcon="sliders" onClick={noop}>
          View
        </Button>
        <IconButton variant="ghost" size="lg" icon="sliders" aria-label="View" onClick={noop} />
      </div>
    </DocsFrame>
  ),
};

/**
 * `isLoading` on both breakpoints: only the views are skeletons, every control
 * stays, and the bar keeps its height.
 */
export const Loading: Story = {
  render: () => (
    <Hug>
      <Stack>
        <TopBarView views={TWO_VIEWS} breakpoint="desktop" isLoading onFiltersClick={noop} onViewMenuClick={noop} />
        <TopBarView views={VIEWS} breakpoint="mobile" isLoading onFiltersClick={noop} onViewMenuClick={noop} />
      </Stack>
    </Hug>
  ),
};
