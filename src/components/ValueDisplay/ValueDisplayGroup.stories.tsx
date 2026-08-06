import type { Meta, StoryObj } from "@storybook/react";

import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";
import ValueDisplay from "./ValueDisplay";
import ValueDisplayGroup from "./ValueDisplayGroup";

const LONG_TEXT =
  "The product team convened late in the afternoon to review the latest iteration of the interface, focusing on clarity, consistency, and the cumulative impact of small interaction decisions. What initially appeared to be minor adjustments—spacing between elements, wording of helper text, timing of system feedback—gradually revealed themselves as critical factors in user confidence and task completion.";

const USERS: AvatarGroupItem[] = [
  { kind: "user", name: "Lorne Riddle" },
  { kind: "user", name: "Thiago Cummings" },
  { kind: "user", name: "Seb Phillips" },
];

const meta: Meta<typeof ValueDisplayGroup> = {
  title: "Components/ValueDisplay/ValueDisplayGroup",
  component: ValueDisplayGroup,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof ValueDisplayGroup>;

/** The doc's hero example: two horizontal pairs + one clamped vertical pair. */
export const Playground: Story = {
  render: () => (
    <div style={{ width: 440 }}>
      <ValueDisplayGroup>
        <ValueDisplay label="Label" value="Value" />
        <ValueDisplay label="Label" value="Value" />
        <ValueDisplay orientation="vertical" label="Label" value={LONG_TEXT} lineLimit={4} />
      </ValueDisplayGroup>
    </div>
  ),
};

/** Horizontal pairs only — a 4px stack, no dividers (the anatomy example). */
export const HorizontalOnly: Story = {
  render: () => (
    <div style={{ width: 440 }}>
      <ValueDisplayGroup>
        <ValueDisplay label="Location name" value="Headquarters" />
        <ValueDisplay label="Street address" value="123 Main Street" />
        <ValueDisplay label="Apartment, suite, etc." value="Suite 45" />
        <ValueDisplay label="City" value="San Francisco" />
        <ValueDisplay label="State / province" value="CA" />
        <ValueDisplay label="Postal code" value="98765" />
      </ValueDisplayGroup>
    </div>
  ),
};

/** Several vertical pairs — each one its own section behind a divider. */
export const MultipleVertical: Story = {
  render: () => (
    <div style={{ width: 440 }}>
      <ValueDisplayGroup>
        <ValueDisplay label="Scheduled for" value="January 1, 2026 at 12:00 PM" />
        <ValueDisplay label="Duration" value="1 hour 30 minutes" />
        <ValueDisplay orientation="vertical" label="Assignees" kind="avatarStack" items={USERS} />
        <ValueDisplay orientation="vertical" label="Notes" value={LONG_TEXT} />
      </ValueDisplayGroup>
    </div>
  ),
};

/** The order rule is enforced: verticals go last even when passed first. */
export const OrderEnforced: Story = {
  render: () => (
    <div style={{ width: 440 }}>
      <ValueDisplayGroup>
        <ValueDisplay orientation="vertical" label="Notes" value="Vertical pairs always render after horizontal ones." />
        <ValueDisplay label="Label" value="Value" />
        <ValueDisplay label="Label" value="Value" />
      </ValueDisplayGroup>
    </div>
  ),
};
