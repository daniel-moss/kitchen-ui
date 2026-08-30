import { CSSProperties, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { cap, DocsFrame, PSEUDO_SELF } from "../../stories/helpers";
import SidebarNavItem from "./SidebarNavItem";

// SidebarNavItemProps is a UNION (the three types exclude each other's
// props), which react-docgen cannot read — the whole table is declared by
// hand here (see the ListItem gotcha) and kept in step with the .types.ts.
const meta: Meta<typeof SidebarNavItem> = {
  title: "Components/SidebarNav/SidebarNavItem",
  component: SidebarNavItem,
  // fullscreen — `DocsFrame` provides the (only) padding in docs stories.
  parameters: { layout: "fullscreen" },
  argTypes: {
    type: {
      options: ["default", "stackHeader", "stackItem"],
      control: { type: "inline-radio" },
      description:
        "`default` — a link with an icon and an optional right modifier, used outside of item stacks. `stackHeader` — opens/closes an item stack; NOT a link. `stackItem` — a link inside a stack; no icon, the label aligns with the default items' labels.",
      table: { type: { summary: '"default" | "stackHeader" | "stackItem"' }, defaultValue: { summary: '"default"' } },
    },
    children: {
      control: { type: "text" },
      description: "The label — `body-500-compact` (Inter Medium 14/20). Truncates with an ellipsis.",
      table: { type: { summary: "ReactNode" } },
    },
    icon: {
      control: { type: "text" },
      description: "Icon name (16px box, 14px glyph; regular — solid when active). `default` and `stackHeader` only.",
      table: { type: { summary: "string" } },
    },
    active: {
      control: { type: "boolean" },
      description:
        "Holds the current page: solid icon + strong label; `default`/`stackItem` also rest on the `--gray-a3` fill. On a `stackHeader` it adds the emphasis without a fill.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    strong: {
      control: { type: "boolean" },
      description: "Solid icon + strong label colors at REST, without a fill — the sidebar's Create button adjustment.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    isPressed: {
      control: { type: "boolean" },
      description: "Hold the pressed fill — e.g. while a menu the item opened is showing.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    isDisabled: {
      control: { type: "boolean" },
      description: "Dimmed to 30% and inert.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    hotKey: {
      control: { type: "text" },
      description: 'Right modifier: a hot-key hint (e.g. `"⌘K"`), `caption-sm-400` in `--text-subtle`. Display only. `default` type only.',
      table: { type: { summary: "string" } },
    },
    notificationDot: {
      control: { type: "boolean" },
      description: "Right modifier: a `--tomato-9` notification dot. Ignored when `hotKey` is set. `default` type only.",
      table: { type: { summary: "boolean" } },
    },
    href: {
      control: { type: "text" },
      description: "Renders the item as a real `<a>` link (`default`/`stackItem`). Without it the item is a `<button>`.",
      table: { type: { summary: "string" } },
    },
    target: { control: false, description: "Link target (needs `href`).", table: { type: { summary: "string" } } },
    rel: { control: false, description: "Link rel (needs `href`).", table: { type: { summary: "string" } } },
    open: {
      control: false,
      description: "`stackHeader`: the stack is expanded — the caret points down. Controlled; pairs with `onOpenChange`.",
      table: { type: { summary: "boolean" } },
    },
    defaultOpen: {
      control: false,
      description: "`stackHeader`: uncontrolled initial expanded state.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description: "`stackHeader`: called with the new expanded state.",
      table: { type: { summary: "(open: boolean) => void" } },
    },
    onClick: { control: false, description: "Click handler (all types).", table: { type: { summary: "(event: MouseEvent<HTMLElement>) => void" } } },
    className: { control: false, description: "Extra class on the row.", table: { type: { summary: "string" } } },
  },
};
export default meta;

type Story = StoryObj<typeof SidebarNavItem>;

const column: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const capRow: CSSProperties = { ...cap, margin: "16px 0 4px" };

// The states stories space the states 16px apart (Daniel).
const statesColumn: CSSProperties = { ...column, gap: 16 };

export const Playground: Story = {
  args: {
    children: "Home",
    icon: "house",
    active: false,
    isDisabled: false,
  },
  render: (args) => (
    <DocsFrame>
      <SidebarNavItem {...args} />
    </DocsFrame>
  ),
};

/** The hero example — one default item. */
export const Hero: Story = {
  render: () => (
    <DocsFrame>
      <SidebarNavItem icon="house">Home</SidebarNavItem>
    </DocsFrame>
  ),
};

/** Anatomy: a container with an Icon and the text label. */
export const Anatomy: Story = {
  render: () => (
    <DocsFrame>
      <SidebarNavItem icon="diamonds-4">Copy</SidebarNavItem>
    </DocsFrame>
  ),
};

/** Right modifiers (default type only): hot key and notification dot. */
export const Modifiers: Story = {
  render: () => (
    <DocsFrame>
      <div style={column}>
        <SidebarNavItem icon="magnifying-glass" hotKey="⌘K">
          Search...
        </SidebarNavItem>
        <SidebarNavItem icon="bullhorn" notificationDot>
          What&apos;s new
        </SidebarNavItem>
      </div>
    </DocsFrame>
  ),
};

/** Default item, inactive and active — every state. */
export const DefaultItemStates: Story = {
  parameters: PSEUDO_SELF,
  render: () => (
    <DocsFrame>
      <div style={capRow}>Inactive</div>
      <div style={statesColumn}>
        <SidebarNavItem icon="diamonds-4">Default</SidebarNavItem>
        <SidebarNavItem icon="diamonds-4" className="pseudo-focus-visible">
          Focused
        </SidebarNavItem>
        <SidebarNavItem icon="diamonds-4" className="pseudo-hover">
          Hovered
        </SidebarNavItem>
        <SidebarNavItem icon="diamonds-4" className="pseudo-active">
          Pressed
        </SidebarNavItem>
        <SidebarNavItem icon="diamonds-4" isDisabled>
          Disabled
        </SidebarNavItem>
      </div>
      <div style={capRow}>Active (current page)</div>
      <div style={statesColumn}>
        <SidebarNavItem icon="diamonds-4" active>
          Default
        </SidebarNavItem>
        <SidebarNavItem icon="diamonds-4" active className="pseudo-focus-visible">
          Focused
        </SidebarNavItem>
        <SidebarNavItem icon="diamonds-4" active className="pseudo-hover">
          Hovered
        </SidebarNavItem>
        <SidebarNavItem icon="diamonds-4" active className="pseudo-active">
          Pressed
        </SidebarNavItem>
        <SidebarNavItem icon="diamonds-4" active isDisabled>
          Disabled
        </SidebarNavItem>
      </div>
    </DocsFrame>
  ),
};

/** Stack header, collapsed and expanded — every state. */
export const StackHeaderStates: Story = {
  parameters: PSEUDO_SELF,
  render: () => (
    <DocsFrame>
      <div style={capRow}>Collapsed</div>
      <div style={statesColumn}>
        <SidebarNavItem type="stackHeader" icon="diamonds-4">
          Default
        </SidebarNavItem>
        <SidebarNavItem type="stackHeader" icon="diamonds-4" className="pseudo-focus-visible">
          Focused
        </SidebarNavItem>
        <SidebarNavItem type="stackHeader" icon="diamonds-4" className="pseudo-hover">
          Hovered
        </SidebarNavItem>
        <SidebarNavItem type="stackHeader" icon="diamonds-4" className="pseudo-active">
          Pressed
        </SidebarNavItem>
        <SidebarNavItem type="stackHeader" icon="diamonds-4" isDisabled>
          Disabled
        </SidebarNavItem>
      </div>
      <div style={capRow}>Expanded</div>
      <div style={statesColumn}>
        <SidebarNavItem type="stackHeader" icon="diamonds-4" defaultOpen>
          Default
        </SidebarNavItem>
        <SidebarNavItem type="stackHeader" icon="diamonds-4" defaultOpen className="pseudo-focus-visible">
          Focused
        </SidebarNavItem>
        <SidebarNavItem type="stackHeader" icon="diamonds-4" defaultOpen className="pseudo-hover">
          Hovered
        </SidebarNavItem>
        <SidebarNavItem type="stackHeader" icon="diamonds-4" defaultOpen className="pseudo-active">
          Pressed
        </SidebarNavItem>
        <SidebarNavItem type="stackHeader" icon="diamonds-4" defaultOpen isDisabled>
          Disabled
        </SidebarNavItem>
      </div>
    </DocsFrame>
  ),
};

/** Stack item, inactive and active — every state. */
export const StackItemStates: Story = {
  parameters: PSEUDO_SELF,
  render: () => (
    <DocsFrame>
      <div style={capRow}>Inactive</div>
      <div style={statesColumn}>
        <SidebarNavItem type="stackItem">Default</SidebarNavItem>
        <SidebarNavItem type="stackItem" className="pseudo-focus-visible">
          Focused
        </SidebarNavItem>
        <SidebarNavItem type="stackItem" className="pseudo-hover">
          Hovered
        </SidebarNavItem>
        <SidebarNavItem type="stackItem" className="pseudo-active">
          Pressed
        </SidebarNavItem>
        <SidebarNavItem type="stackItem" isDisabled>
          Disabled
        </SidebarNavItem>
      </div>
      <div style={capRow}>Active (current page)</div>
      <div style={statesColumn}>
        <SidebarNavItem type="stackItem" active>
          Default
        </SidebarNavItem>
        <SidebarNavItem type="stackItem" active className="pseudo-focus-visible">
          Focused
        </SidebarNavItem>
        <SidebarNavItem type="stackItem" active className="pseudo-hover">
          Hovered
        </SidebarNavItem>
        <SidebarNavItem type="stackItem" active className="pseudo-active">
          Pressed
        </SidebarNavItem>
        <SidebarNavItem type="stackItem" active isDisabled>
          Disabled
        </SidebarNavItem>
      </div>
    </DocsFrame>
  ),
};

/** A stack: the header toggles its items (SidebarNavItemGroup wires this). */
const StackDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <DocsFrame>
      <div style={column}>
        <SidebarNavItem icon="house">Home</SidebarNavItem>
        <SidebarNavItem type="stackHeader" icon="wrench-simple" open={open} onOpenChange={setOpen}>
          Jobs
        </SidebarNavItem>
        {open && (
          <>
            <SidebarNavItem type="stackItem">Requests</SidebarNavItem>
            <SidebarNavItem type="stackItem" active>
              Jobs
            </SidebarNavItem>
            <SidebarNavItem type="stackItem">Series</SidebarNavItem>
          </>
        )}
        <SidebarNavItem icon="file-lines">Estimates</SidebarNavItem>
      </div>
    </DocsFrame>
  );
};

export const Stack: Story = {
  render: () => <StackDemo />,
};
