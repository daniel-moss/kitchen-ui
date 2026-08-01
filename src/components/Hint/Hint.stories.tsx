import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Hint from "./Hint";
import HoverHint from "./HoverHint";
import HintTrigger from "./HintTrigger";
import Button from "../Button/Button";
import { HintState, HintTongue, HintTongueAlignment } from "./Hint.types";
import { DeviceFrame } from "../../stories/helpers";

type StoryArgs = {
  state: HintState;
  indicator: boolean;
  title: string;
  caption: string;
  tongue: HintTongue;
  tongueAlignment: HintTongueAlignment;
};

const frame: React.CSSProperties = { width: 320 };

const meta: Meta<StoryArgs> = {
  title: "Components/Hint/Hint",
  component: Hint,
  parameters: { layout: "centered" },
  args: {
    state: "info",
    indicator: true,
    title: "Title",
    caption: "Caption",
    tongue: "bottom",
    tongueAlignment: "center",
  },
  argTypes: {
    state: { options: ["info", "success", "warning", "error"], control: { type: "inline-radio" } },
    indicator: { control: { type: "boolean" } },
    title: { type: "string", control: { type: "text" } },
    caption: { type: "string", control: { type: "text" } },
    tongue: { options: ["top", "bottom", "left", "right"], control: { type: "inline-radio" } },
    tongueAlignment: { options: ["start", "center", "end"], control: { type: "inline-radio" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** The inline bubble. Empty the title — it is optional; so is the indicator. */
export const Playground: Story = {
  render: ({ state, indicator, title, caption, tongue, tongueAlignment }) => (
    <div style={frame}>
      <Hint
        state={state}
        indicator={indicator}
        title={title || undefined}
        caption={caption}
        tongue={tongue}
        tongueAlignment={tongueAlignment}
      />
    </div>
  ),
};

/** The indicator supports 4 states — info, success, warning and error. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)", ...frame }}>
      {(["info", "success", "warning", "error"] as const).map((state) => (
        <Hint key={state} state={state} title={state} caption="Caption" />
      ))}
    </div>
  ),
};

/** Tongue on any of the four sides, aligned start / center / end (12px inset). */
export const TonguePositions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 320px)", gap: "var(--size-6)" }}>
      <Hint tongue="bottom" tongueAlignment="center" caption="Tongue bottom, center" />
      <Hint tongue="top" tongueAlignment="start" caption="Tongue top, start" />
      <Hint tongue="left" tongueAlignment="start" caption="Tongue left, start" />
      <Hint tongue="right" tongueAlignment="center" caption="Tongue right, center" />
    </div>
  ),
};

/**
 * Content rules: text wraps when it does not fit; the indicator and the title
 * are optional; the slot variant (children) takes any content edge to edge.
 */
export const Content: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)", ...frame }}>
      <Hint
        title="Very long title which doesn't fit 1 line and needs to be wrapped"
        caption="Put copy which is supposed to be used on this tooltip here. Copy should fit 1 paragraph, be concrete, clear and easy-to-read."
      />
      <Hint indicator={false} title="Title" caption="Caption" />
      <Hint caption="Caption" />
      <Hint>
        <div style={{ padding: "var(--size-6)", textAlign: "center" }}>
          <Button variant="subtle" size="md" onClick={() => {}}>
            Any content
          </Button>
        </div>
      </Hint>
    </div>
  ),
};

const DrawerDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <DeviceFrame>
      {!open && (
        <div style={{ position: "absolute", top: 100, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <Button variant="subtle" size="md" onClick={() => setOpen(true)}>
            Reopen hint
          </Button>
        </div>
      )}
      {open && (
        <Hint
          variant="drawer"
          title="Title"
          caption="Usually, hint turns into a drawer on mobile."
          onClose={() => setOpen(false)}
        />
      )}
    </DeviceFrame>
  );
};

/** Mobile — the hint turns into a drawer (16px body padding). */
export const Drawer: Story = {
  parameters: { controls: { disable: true } },
  render: () => <DrawerDemo />,
};

/** HoverHint wires the behavior: hover the trigger (desktop) and the hint pops up. */
export const WithTrigger: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ padding: "120px 200px" }}>
      <HoverHint title="Title" caption="By default, the hint pops up on top of the trigger." breakpoint="desktop">
        <HintTrigger />
      </HoverHint>
    </div>
  ),
};
