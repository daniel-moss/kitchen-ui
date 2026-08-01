import { Fragment } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { cap, noop } from "../../stories/helpers";
import DateButton from "./DateButton";
import { DateButtonType } from "./DateButton.types";

const meta: Meta<typeof DateButton> = {
  title: "Components/DatePicker/DateButton",
  component: DateButton,
  parameters: { layout: "padded" },
  args: { day: 15, type: "default", disabled: false, onClick: noop },
  argTypes: {
    type: { options: ["default", "today", "selected"], control: { type: "inline-radio" } },
  },
};
export default meta;

type Story = StoryObj<typeof DateButton>;

export const Playground: Story = {};

const TYPES: DateButtonType[] = ["default", "today", "selected"];

/** The 3 types across every state. */
export const Overview: Story = {
  render: () => {
    const STATES: { label: string; cls?: string; disabled?: boolean }[] = [
      { label: "default" },
      { label: "hover", cls: "pseudo-hover" },
      { label: "press", cls: "pseudo-active" },
      { label: "focus", cls: "pseudo-focus-visible" },
      { label: "disabled", disabled: true },
    ];
    return (
      <div style={{ display: "grid", gridTemplateColumns: `80px repeat(${TYPES.length}, 80px)`, gap: 16, alignItems: "center" }}>
        <span />
        {TYPES.map((type) => (
          <span key={type} style={{ ...cap, textTransform: "capitalize" }}>
            {type}
          </span>
        ))}
        {STATES.map((state) => (
          <Fragment key={state.label}>
            <span style={cap}>{state.label}</span>
            {TYPES.map((type) => (
              <DateButton
                key={`${type}-${state.label}`}
                day={15}
                type={type}
                disabled={state.disabled}
                className={state.cls}
                onClick={noop}
              />
            ))}
          </Fragment>
        ))}
      </div>
    );
  },
};
