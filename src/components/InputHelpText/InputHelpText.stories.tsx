import { Fragment } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame } from "../../stories/helpers";
import InputHelpText from "./InputHelpText";
import { InputHelpTextStatus } from "./InputHelpText.types";

type StoryArgs = {
  children: string;
  status: InputHelpTextStatus;
  slotLeft: boolean;
  icon: string;
  isLoading: boolean;
};

const STATUSES: InputHelpTextStatus[] = ["neutral", "info", "success", "warning", "error"];
const cap: React.CSSProperties = { font: "var(--font-caption-medium-500)", color: "var(--text-subtle)" };

/**
 * InputHelpText — a help-text line below an input or group. Colored by status,
 * with an optional left icon (the status icon, or a custom one for neutral) and
 * a loading skeleton.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/InputHelpText",
  component: InputHelpText,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: {
    children: "Help text",
    status: "neutral",
    slotLeft: false,
    icon: "circle-info",
    isLoading: false,
  },
  argTypes: {
    children: { control: { type: "text" } },
    status: { options: STATUSES, control: { type: "inline-radio" } },
    slotLeft: { control: { type: "boolean" } },
    icon: { control: { type: "text" } },
    isLoading: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

// The docs previews center these tiny examples (like the Figma page).
const centered = { display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-20)" } as const;
const centeredRow = { display: "flex", justifyContent: "center", gap: "var(--size-20)" } as const;

export const Playground: Story = {
  render: ({ children, status, slotLeft, icon, isLoading }) => (
    <div style={docsFrame}>
      <div style={centeredRow}>
        <div style={{ width: 200 }}>
          <InputHelpText status={status} slotLeft={slotLeft} icon={icon} isLoading={isLoading}>
            {children}
          </InputHelpText>
        </div>
      </div>
    </div>
  ),
};

// ---- docs-page stories (one per Figma Documentation example) ---------------

/** The hero: a success help text with its status icon. */
export const Basic: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={centeredRow}>
        <InputHelpText status="success" slotLeft>
          Help text
        </InputHelpText>
      </div>
    </div>
  ),
};

/** The parts: optional left icon + text. */
export const Parts: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={centeredRow}>
        <InputHelpText slotLeft icon="diamonds-4">
          Help text
        </InputHelpText>
        <InputHelpText>Help text</InputHelpText>
      </div>
    </div>
  ),
};

/** Neutral takes any icon by name. */
export const CustomIcon: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={centeredRow}>
        <InputHelpText slotLeft icon="rocket">
          Help text
        </InputHelpText>
      </div>
    </div>
  ),
};

/** The non-neutral statuses bring their own icon. */
export const StatusIcons: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={centered}>
        <InputHelpText status="info" slotLeft>
          Info
        </InputHelpText>
        <InputHelpText status="success" slotLeft>
          Success
        </InputHelpText>
        <InputHelpText status="warning" slotLeft>
          Warning
        </InputHelpText>
        <InputHelpText status="error" slotLeft>
          Error
        </InputHelpText>
      </div>
    </div>
  ),
};

/** The full set: with / without the icon × the 5 statuses. */
export const Variants: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--size-20)" }}>
        {STATUSES.map((s) => (
          <Fragment key={s}>
            <InputHelpText status={s}>{s[0].toUpperCase() + s.slice(1)}</InputHelpText>
            <InputHelpText status={s} slotLeft icon="diamonds-4">
              {s[0].toUpperCase() + s.slice(1)}
            </InputHelpText>
          </Fragment>
        ))}
      </div>
    </div>
  ),
};

/** The text wraps; the icon stays on the first line. */
export const Wrapping: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={centeredRow}>
        <div style={{ width: 206 }}>
          <InputHelpText status="error" slotLeft>
            The code provided is expired or invalid. Please try again.
          </InputHelpText>
        </div>
      </div>
    </div>
  ),
};

/** The loading skeleton — identical for every variant. */
export const Loading: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={centeredRow}>
        <div style={{ width: 140 }}>
          <InputHelpText status="info" isLoading>
            Help text
          </InputHelpText>
        </div>
      </div>
    </div>
  ),
};

/** Every status — text only, with the left icon, and loading. */
export const Overview: Story = {
  // Not frame-wrapped — keeps Storybook's centering.
  parameters: { controls: { disable: true }, layout: "centered" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "auto auto auto auto", columnGap: "var(--size-8)", rowGap: "var(--size-4)", alignItems: "center" }}>
      <span />
      <span style={cap}>text only</span>
      <span style={cap}>with icon</span>
      <span style={cap}>loading</span>
      {STATUSES.map((s) => (
        <Fragment key={s}>
          <span style={cap}>{s}</span>
          <InputHelpText status={s} icon="diamonds-4">
            Help text
          </InputHelpText>
          <InputHelpText status={s} slotLeft icon="diamonds-4">
            Help text
          </InputHelpText>
          <div style={{ width: 120 }}>
            <InputHelpText status={s} isLoading>
              Help text
            </InputHelpText>
          </div>
        </Fragment>
      ))}
    </div>
  ),
};
