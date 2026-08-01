import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import SelectList from "./SelectList";
import SelectListItemGroup from "./SelectListItemGroup";
import SelectListItem from "./SelectListItem";
import SelectListHeader from "./SelectListHeader";
import SelectListFooter from "./SelectListFooter";
import GroupLabel from "../GroupLabel/GroupLabel";
import MenuItem from "../Menu/MenuItem";
import Button from "../Button/Button";
import { Icon } from "../Icon/Icon";
import { DeviceFrame, noop } from "../../stories/helpers";

type StoryArgs = {
  header: boolean;
  footer: boolean;
  multiSelect: boolean;
};


const OPTIONS = ["Alpha Kitchen", "Bayside Diner", "Central Bistro", "Dockside Grill", "East End Cafe", "Fairview Restaurant", "Golden Wok", "Harbor House"];

// A self-contained interactive list: search filters, click selects.
function Demo({
  variant,
  title,
  header,
  footer,
  multiSelect,
  open = true,
  onClose,
  breakpoint,
}: {
  variant?: "inline" | "dialog" | "drawer";
  title?: string;
  header: boolean;
  footer: boolean;
  multiSelect: boolean;
  open?: boolean;
  onClose?: () => void;
  breakpoint?: "auto" | "desktop" | "mobile";
}) {
  const [selected, setSelected] = useState<string[]>([OPTIONS[1]]);

  const toggleOption = (option: string) =>
    setSelected((prev) =>
      multiSelect ? (prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]) : [option],
    );

  const listProps = {
    open,
    onClose,
    multiSelect,
    // Built-in search: SelectList owns the query, filters the items, shows the
    // noResults state, and resets the query when the list closes.
    searchable: header,
    searchPlaceholder: "Search",
    footer: footer ? (
      <SelectListFooter>
        <MenuItem label="Add new" slotLeft={<Icon icon="plus" pack="regular" size={14} container="square" />} onClick={noop} />
      </SelectListFooter>
    ) : undefined,
    breakpoint,
  };

  const groups = (
    <SelectListItemGroup>
      {OPTIONS.map((option) => (
        <SelectListItem key={option} label={option} multiSelect={multiSelect} selected={selected.includes(option)} onClick={() => toggleOption(option)} />
      ))}
    </SelectListItemGroup>
  );

  if (variant === "dialog") {
    return (
      <SelectList variant="dialog" title={title ?? "Select"} {...listProps}>
        {groups}
      </SelectList>
    );
  }
  if (variant === "drawer") {
    return (
      <SelectList variant="drawer" title={title} {...listProps}>
        {groups}
      </SelectList>
    );
  }
  return (
    <SelectList variant="inline" {...listProps}>
      {groups}
    </SelectList>
  );
}

const meta: Meta<StoryArgs> = {
  title: "Components/SelectList/SelectList",
  component: SelectList,
  parameters: { layout: "centered" },
  args: { header: true, footer: true, multiSelect: false },
  argTypes: {
    header: { name: "search header", control: { type: "boolean" } },
    footer: { control: { type: "boolean" } },
    multiSelect: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

// Single-select closes on selection — the button reopens it.
const PlaygroundDemo = (args: StoryArgs) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ minHeight: 480, display: "flex", flexDirection: "column", gap: "var(--size-4)", alignItems: "flex-start", paddingTop: 16 }}>
      {!open && (
        <Button variant="subtle" size="md" onClick={() => setOpen(true)}>
          Reopen list
        </Button>
      )}
      <div style={{ width: 320 }}>
        <Demo breakpoint="desktop" open={open} onClose={() => setOpen(false)} {...args} />
      </div>
    </div>
  );
};

/** Type to filter (no matches → noResults state); single-select closes on click. */
export const Playground: Story = {
  render: (args) => <PlaygroundDemo {...args} />,
};

/** Empty state — no items exist yet. */
export const Empty: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ minHeight: 300, display: "flex", alignItems: "flex-start", paddingTop: 16 }}>
      <SelectList
        variant="inline"
        breakpoint="desktop"
        state="empty"
        emptyState={{ icon: "building", title: "No clients here yet", caption: "Add a client to see it here", actionLabel: "Add client", onAction: noop }}
        style={{ width: 320 }}
      >
        {null}
      </SelectList>
    </div>
  ),
};

/** No-results state — the search matched nothing; header and footer stay. */
export const NoResults: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ minHeight: 340, display: "flex", alignItems: "flex-start", paddingTop: 16 }}>
      <SelectList
        variant="inline"
        breakpoint="desktop"
        state="noResults"
        noResultsCaption="Try a different search or add a new client"
        header={<SelectListHeader defaultValue="Value" onClear={noop} placeholder="Search" />}
        footer={
          <SelectListFooter>
            <MenuItem label="Add new" slotLeft={<Icon icon="plus" pack="regular" size={14} container="square" />} onClick={noop} />
          </SelectListFooter>
        }
        style={{ width: 320 }}
      >
        {null}
      </SelectList>
    </div>
  ),
};

/** Two groups with labels — dividers between groups are automatic. */
export const Groups: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ minHeight: 420, display: "flex", alignItems: "flex-start", paddingTop: 16 }}>
      <SelectList variant="inline" breakpoint="desktop" style={{ width: 320 }}>
        <SelectListItemGroup label={<GroupLabel variant="secondary" label="Recent" />}>
          <SelectListItem label="Bayside Diner" selected onClick={noop} />
          <SelectListItem label="Central Bistro" onClick={noop} />
        </SelectListItemGroup>
        <SelectListItemGroup label={<GroupLabel variant="secondary" label="All clients" />}>
          <SelectListItem label="Alpha Kitchen" onClick={noop} />
          <SelectListItem label="Dockside Grill" onClick={noop} />
          <SelectListItem label="East End Cafe" onClick={noop} />
        </SelectListItemGroup>
      </SelectList>
    </div>
  ),
};

// Dialog variant needs open state — the button reopens it.
const DialogDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Button variant="solid" size="lg" onClick={() => setOpen(true)}>
        Open select dialog
      </Button>
      <Demo variant="dialog" title="Select a client" header footer multiSelect={false} open={open} onClose={() => setOpen(false)} breakpoint="desktop" />
    </div>
  );
};

/** Dialog variant — built on Dialog; the search header is pinned below the title. */
export const DialogVariant: Story = {
  parameters: { controls: { disable: true } },
  render: () => <DialogDemo />,
};

/** Drawer (mobile) — drag handle + title, pinned search, footer above the home indicator. */
export const Mobile: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <DeviceFrame>
      <Demo variant="drawer" title="Select a client" header footer multiSelect breakpoint="mobile" />
    </DeviceFrame>
  ),
};
