import type { Meta, StoryObj } from "@storybook/react";

import HoverHint, { HintPosition } from "./HoverHint";
import HintTrigger from "./HintTrigger";
import { HintState, HintTongueAlignment } from "./Hint.types";
import { DeviceFrame } from "../../stories/helpers";

type StoryArgs = {
  position: HintPosition;
  align: HintTongueAlignment;
  state: HintState;
  title: string;
  caption: string;
};

const meta: Meta<StoryArgs> = {
  title: "Components/Hint/HoverHint",
  component: HoverHint,
  parameters: { layout: "centered" },
  args: { position: "top", align: "center", state: "info", title: "Title", caption: "Caption" },
  argTypes: {
    position: { options: ["top", "bottom", "left", "right"], control: { type: "inline-radio" } },
    align: { options: ["start", "center", "end"], control: { type: "inline-radio" } },
    state: { options: ["info", "success", "warning", "error"], control: { type: "inline-radio" } },
    title: { type: "string", control: { type: "text" } },
    caption: { type: "string", control: { type: "text" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Hover (or focus) the trigger. Position = hint side; align = tongue spot. */
export const Playground: Story = {
  render: ({ position, align, state, title, caption }) => (
    <div style={{ padding: "160px 240px" }}>
      <HoverHint position={position} align={align} state={state} title={title || undefined} caption={caption} breakpoint="desktop">
        <HintTrigger />
      </HoverHint>
    </div>
  ),
};

/** On mobile the hint opens as a drawer — tap the trigger. */
export const Mobile: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <DeviceFrame>
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <HoverHint title="Title" caption="Usually, hint turns into a drawer on mobile." breakpoint="mobile">
          <HintTrigger />
        </HoverHint>
      </div>
    </DeviceFrame>
  ),
};
