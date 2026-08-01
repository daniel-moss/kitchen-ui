import type { Meta, StoryObj } from "@storybook/react";

import { cap } from "../../stories/helpers";
import Input from "./Input";
import PasswordField from "../Fields/PasswordField/PasswordField";
import StrengthIndicator from "./StrengthIndicator";

/**
 * StrengthIndicator — the password-strength readout at the right edge of an
 * Input's label: the state word + a 56×4 bar. The strength value comes from
 * the consumer (no strength logic in the DS); independent from PasswordField's
 * condition badges.
 */
const meta: Meta<typeof StrengthIndicator> = {
  title: "Components/Input/StrengthIndicator",
  component: StrengthIndicator,
  parameters: { layout: "padded" },
  args: {
    state: "weak",
  },
  argTypes: {
    state: { options: ["weak", "average", "strong", "excellent"], control: { type: "inline-radio" } },
  },
};
export default meta;

type Story = StoryObj<typeof StrengthIndicator>;

export const Playground: Story = {
  render: (args) => <StrengthIndicator {...args} />,
};

/** The four states. */
export const States: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
      <StrengthIndicator state="weak" />
      <StrengthIndicator state="average" />
      <StrengthIndicator state="strong" />
      <StrengthIndicator state="excellent" />
    </div>
  ),
};

/** In place — on the Input label, next to a PasswordField. */
export const OnInputLabel: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 350 }}>
      {(["weak", "average", "strong", "excellent"] as const).map((state) => (
        <div key={state}>
          <span style={cap}>{state}</span>
          <Input label="New password" strength={state}>
            <PasswordField variant="new" defaultValue="abcdefgh12" />
          </Input>
        </div>
      ))}
    </div>
  ),
};
