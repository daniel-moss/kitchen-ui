import type { Meta, StoryObj } from "@storybook/react";

import Badge from "../Badge/Badge";
import BadgeJobStatus from "../Badge/BadgeJobStatus";
import { Icon } from "../Icon/Icon";
import IconButton from "../IconButton/IconButton";
import LinkButton from "../LinkButton/LinkButton";
import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";
import AvatarUser from "../Avatar/AvatarUser";
import ValueDisplay from "./ValueDisplay";

const LONG_TEXT =
  "The product team convened late in the afternoon to review the latest iteration of the interface, focusing on clarity, consistency, and the cumulative impact of small interaction decisions. What initially appeared to be minor adjustments—spacing between elements, wording of helper text, timing of system feedback—gradually revealed themselves as critical factors in user confidence and task completion.";

const USERS: AvatarGroupItem[] = [
  { kind: "user", name: "Lorne Riddle" },
  { kind: "user", name: "Thiago Cummings" },
  { kind: "user", name: "Seb Phillips" },
  { kind: "user", name: "Angel Leblanc" },
  { kind: "user", name: "Ken Potts" },
];

const meta: Meta<typeof ValueDisplay> = {
  title: "Components/ValueDisplay/ValueDisplay",
  component: ValueDisplay,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof ValueDisplay>;

const column = (width: number) => ({
  display: "flex",
  flexDirection: "column" as const,
  gap: 24,
  width,
});

export const Playground: Story = {
  args: {
    label: "Label",
    value: "Value",
  },
  render: (args) => (
    <div style={{ width: 440 }}>
      <ValueDisplay {...args} />
    </div>
  ),
};

/** Horizontal text values: plain (wraps), left slots (truncate), colors, warning. */
export const HorizontalText: Story = {
  render: () => (
    <div style={column(440)}>
      <ValueDisplay label="Label" value="Value" />
      <ValueDisplay label="Label" value="Very long value which does not fit 1 line and needs to be wrapped" />
      <ValueDisplay label="Label which doesn't fit 1 line" value="Value" />
      <ValueDisplay label="Label" value="Value" slotLeft={<Icon icon="diamonds-4" size={14} />} />
      <ValueDisplay label="Label" value="Value" slotLeft={<AvatarUser size="xs" />} />
      <ValueDisplay
        label="Label"
        value="Very long value which does not fit 1 line and needs to be truncated"
        slotLeft={<Icon icon="diamonds-4" size={14} />}
      />
      <ValueDisplay
        label="Status"
        value="Active"
        valueColor="var(--text-success)"
        slotLeft={<Icon icon="shield" pack="solid" size={14} style={{ color: "var(--text-success)" }} />}
      />
      <ValueDisplay
        label="Status"
        value="Upcoming"
        valueColor="var(--text-info)"
        slotLeft={<Icon icon="clock" pack="solid" size={14} style={{ color: "var(--text-info)" }} />}
      />
      <ValueDisplay
        label="Status"
        value="Expired"
        valueColor="var(--text-error)"
        slotLeft={<Icon icon="hexagon-exclamation" pack="solid" size={14} style={{ color: "var(--text-error)" }} />}
      />
    </div>
  ),
};

/** Warning state — amber value + warning icon; long messages wrap. */
export const Warning: Story = {
  render: () => (
    <div style={column(440)}>
      <ValueDisplay label="Manufacturer" value="No Manufacturer" isWarning />
      <ValueDisplay label="Credit limit" value="$1,000.00" isWarning />
      <ValueDisplay label="Label" value="Very long warning message which does not fit 1 line" isWarning />
    </div>
  ),
};

/** Badge / LinkButton values, incl. squeezed-width truncation. */
export const BadgeAndLink: Story = {
  render: () => (
    <div style={column(440)}>
      <ValueDisplay label="Label" kind="badge" badge={<Badge size="md">Badge</Badge>} />
      <ValueDisplay label="Status" kind="badge" badge={<BadgeJobStatus status="active" />} />
      <div style={{ width: 320 }}>
        <ValueDisplay
          label="Label"
          kind="badge"
          badge={<Badge size="md">Very long badge copy which does not fit 1 line and needs to be truncated</Badge>}
        />
      </div>
      <ValueDisplay label="Label" kind="linkButton" link={<LinkButton noDebounce>Link</LinkButton>} />
      <ValueDisplay
        label="Recall"
        kind="linkButton"
        link={
          <LinkButton rightIcon="arrow-up-right" noDebounce>
            JOB-10001
          </LinkButton>
        }
      />
      <div style={{ width: 320 }}>
        <ValueDisplay
          label="Label"
          kind="linkButton"
          link={<LinkButton noDebounce>Very long button copy which does not fit 1 line and needs to be truncated</LinkButton>}
        />
      </div>
      <ValueDisplay label="Label" kind="badge" badge={<Badge size="md">Badge</Badge>} slotRight={<IconButton icon="diamonds-4" variant="ghost" size="lg" aria-label="Action" />} />
    </div>
  ),
};

/** The right slot (horizontal only): one IconButton after the value. */
export const SlotRight: Story = {
  render: () => (
    <div style={column(440)}>
      <ValueDisplay
        label="Label"
        value="Value"
        slotRight={<IconButton icon="diamonds-4" variant="ghost" size="lg" aria-label="Action" />}
      />
      <ValueDisplay
        label="Label which doesn't fit 1 line"
        value="Value"
        slotRight={<IconButton icon="diamonds-4" variant="ghost" size="lg" aria-label="Action" />}
      />
    </div>
  ),
};

/** Empty and loading — every kind. */
export const EmptyAndLoading: Story = {
  render: () => (
    <div style={column(440)}>
      <ValueDisplay label="Label" />
      <ValueDisplay label="Name" />
      <ValueDisplay label="Model number" />
      <ValueDisplay label="Status" kind="badge" />
      <ValueDisplay label="Recall" kind="linkButton" />
      <ValueDisplay label="Label" isLoading />
      <ValueDisplay label="Label" kind="badge" isLoading />
      <ValueDisplay label="Label" kind="linkButton" isLoading />
      <ValueDisplay orientation="vertical" label="Technician notes" />
      <ValueDisplay orientation="vertical" label="Label" isLoading />
      <ValueDisplay orientation="vertical" label="Assignees" kind="avatarGroup" />
      <ValueDisplay orientation="vertical" label="Assignees" kind="avatarGroup" isLoading />
    </div>
  ),
};

/** Vertical text — wraps freely, or clamps to a line limit with Show more. */
export const VerticalText: Story = {
  render: () => (
    <div style={column(440)}>
      <ValueDisplay orientation="vertical" label="Label" value={LONG_TEXT} />
      <ValueDisplay orientation="vertical" label="Label" value={LONG_TEXT} lineLimit={4} />
      <ValueDisplay orientation="vertical" label="Label" value="Short value — no Show more needed" lineLimit={4} />
    </div>
  ),
};

/** Vertical avatar group — full list, or an avatar limit with +N and Show more. */
export const VerticalAvatars: Story = {
  render: () => (
    <div style={column(440)}>
      <ValueDisplay orientation="vertical" label="Assignees" kind="avatarGroup" items={USERS.slice(0, 3)} />
      <ValueDisplay orientation="vertical" label="Assignees" kind="avatarGroup" items={USERS} avatarLimit={3} />
      <div style={{ width: 254 }}>
        <ValueDisplay orientation="vertical" label="Assignees" kind="avatarGroup" items={USERS} avatarLimit={3} />
      </div>
    </div>
  ),
};
