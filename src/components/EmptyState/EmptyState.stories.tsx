import type { Meta, StoryObj } from "@storybook/react";

import EmptyState from "./EmptyState";
import Avatar from "../Avatar/Avatar";

type SlotType = "none" | "icon" | "avatar";

type StoryArgs = {
  title: string;
  caption: string;
  slot: SlotType;
  actions: 0 | 1 | 2;
  error: boolean;
};

const noop = () => {};

const avatarSlot = <Avatar type="object" content="icon" size="xl" />;

// A framed box so you can see the EmptyState fill and center within a container.
const Frame = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      width: 300,
      minHeight: 220,
      display: "flex",
      background: "var(--surface-level-first)",
      borderRadius: "var(--border-radius-2_5)",
    }}
  >
    {children}
  </div>
);

const cellLabel: React.CSSProperties = { font: "var(--font-caption-medium-500)", color: "var(--text-subtle)" };

/**
 * EmptyState — a centered block for when there's no content: an optional top slot
 * (icon or avatar), a title + caption, and up to two actions. It fills and
 * centers within its container. The `error` variant recolors the icon and title.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/EmptyState",
  component: EmptyState,
  parameters: { layout: "centered" },
  args: {
    title: "No results found",
    caption: "Try adjusting your filters or search.",
    slot: "icon",
    actions: 1,
    error: false,
  },
  argTypes: {
    title: { control: { type: "text" } },
    caption: { control: { type: "text" } },
    slot: { options: ["none", "icon", "avatar"], control: { type: "inline-radio" } },
    actions: { options: [0, 1, 2], control: { type: "inline-radio" } },
    error: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: ({ title, caption, slot, actions, error }) => (
    <Frame>
      <EmptyState
        title={title}
        caption={caption}
        error={error}
        icon={slot === "icon" ? "folder-open" : undefined}
        slot={slot === "avatar" ? avatarSlot : undefined}
        primaryAction={actions >= 1 ? { label: "Action", onClick: noop } : undefined}
        secondaryAction={actions >= 2 ? { label: "Action 2", onClick: noop } : undefined}
      />
    </Frame>
  ),
};

/** The content combinations: top slot on/off × actions on/off. */
export const Variations: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", gap: "var(--size-6)", flexWrap: "wrap", alignItems: "flex-start" }}>
      {(
        [
          ["title + caption", {}],
          ["icon + text", { icon: "folder-open" }],
          ["text + action", { primaryAction: { label: "Action", onClick: noop } }],
          [
            "icon + text + actions",
            {
              icon: "folder-open",
              primaryAction: { label: "Action 1", onClick: noop },
              secondaryAction: { label: "Action 2", onClick: noop },
            },
          ],
        ] as const
      ).map(([name, props]) => (
        <div key={name} style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
          <span style={cellLabel}>{name}</span>
          <Frame>
            <EmptyState title="No results found" caption="Try adjusting your filters or search." {...props} />
          </Frame>
        </div>
      ))}
    </div>
  ),
};

/** A custom top slot — here an Avatar instead of an icon. */
export const WithAvatar: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <EmptyState
        slot={avatarSlot}
        title="No files yet"
        caption="Upload a file to get started."
        primaryAction={{ label: "Upload", onClick: noop }}
      />
    </Frame>
  ),
};

/** The error variant — icon and title turn red. */
export const Error: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <EmptyState
        error
        icon="circle-exclamation"
        title="Something went wrong"
        caption="We couldn't load this content. Please try again."
        primaryAction={{ label: "Retry", onClick: noop }}
      />
    </Frame>
  ),
};
