import type { CSSProperties } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { cap, DocsFrame, noop, PSEUDO_ALL } from "../../stories/helpers";
import Toast from "../Toast/Toast";
import Dropzone from "./Dropzone";

/**
 * Dropzone — the drag-and-drop file input: a large drop target that uploads
 * files by dragging them in or by clicking to open the system file picker.
 * Bare — it never gets a Label or the Input wrapper; the FormModule header
 * labels it. Validation (size / type / count) and the rejection Toasts are
 * the consumer's.
 */
const meta: Meta<typeof Dropzone> = {
  title: "Components/Dropzone",
  component: Dropzone,
  parameters: { layout: "fullscreen" },
  args: {
    isWarning: false,
    isDisabled: false,
    multiple: true,
    onFilesSelected: noop,
  },
  argTypes: {
    title: { control: { type: "text" } },
    caption: { control: { type: "text" } },
    warningTitle: { control: { type: "text" } },
    warningCaption: { control: { type: "text" } },
    accept: { control: { type: "text" } },
    _isDragOver: { table: { disable: true } },
  },
};
export default meta;

type Story = StoryObj<typeof Dropzone>;

export const Playground: Story = {
  render: (args) => (
    <DocsFrame>
      <Dropzone {...args} />
    </DocsFrame>
  ),
};

/** The hero / anatomy preview — the default state with the master's generic copy. */
export const Default: Story = {
  render: () => (
    <DocsFrame>
      <Dropzone />
    </DocsFrame>
  ),
};

const captioned: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-2)" };

/** The default interaction state, captioned for the states row. */
export const DefaultState: Story = {
  render: () => (
    <DocsFrame>
      <div style={captioned}>
        <span style={cap}>Default</span>
        <Dropzone />
      </div>
    </DocsFrame>
  ),
};

/** Hover: border and icon step to gray-12, the dashes march clockwise. */
export const Hovered: Story = {
  render: () => (
    <DocsFrame>
      <div style={captioned}>
        <span style={cap}>Hovered</span>
        <div className={PSEUDO_ALL.hover}>
          <Dropzone />
        </div>
      </div>
    </DocsFrame>
  ),
};

/** Press: gray-a3 fill, gray-12 border and icon, dashes marching. */
export const Pressed: Story = {
  render: () => (
    <DocsFrame>
      <div style={captioned}>
        <span style={cap}>Pressed</span>
        <div className={PSEUDO_ALL.press}>
          <Dropzone />
        </div>
      </div>
    </DocsFrame>
  ),
};

/** Keyboard focus: a 2px solid gray-12 border replaces the dashes; the icon follows. */
export const Focused: Story = {
  render: () => (
    <DocsFrame>
      <div style={captioned}>
        <span style={cap}>Focused</span>
        <div className={PSEUDO_ALL.focus}>
          <Dropzone />
        </div>
      </div>
    </DocsFrame>
  ),
};

/** Drag-over shows the pressed state (story-forced — drag a real file to see it live). */
export const DragOver: Story = {
  render: () => (
    <DocsFrame>
      <Dropzone _isDragOver />
    </DocsFrame>
  ),
};

/** The limit is reached: amber, warning copy, non-interactive. */
export const Warning: Story = {
  render: () => (
    <DocsFrame>
      <Dropzone isWarning />
    </DocsFrame>
  ),
};

/** Disabled: 30% opacity, non-interactive. Wins over the warning state. */
export const Disabled: Story = {
  render: () => (
    <DocsFrame>
      <Dropzone isDisabled />
    </DocsFrame>
  ),
};

// The rejection Toasts the consumer shows (the Dropzone itself never shows
// them) — one Toast per drop; the copy comes from the Figma doc page.
const REJECTION_TOASTS = [
  { label: "File limit reached", type: "warning" as const, title: "File limit reached", caption: "X of Y files added. Maximum Z files allowed." },
  { label: "File size exceeded (1 file)", type: "error" as const, title: "File size exceeded", caption: '"File name.xyz" (X MB) exceeds the maximum allowed size of Y MB' },
  { label: "File size exceeded (2+ files)", type: "error" as const, title: "File size exceeded", caption: "X files exceed the maximum allowed size of Y MB" },
  { label: "Invalid file type (1 file)", type: "error" as const, title: "Invalid file type", caption: 'File type ".xyz" is not allowed for security reasons' },
  { label: "Invalid file type (2+ files)", type: "error" as const, title: "Invalid file type", caption: "X files have file types that are not allowed for security reasons" },
  { label: "Mixed reasons", type: "error" as const, title: "Some files couldn't be added", caption: "X of Y files added" },
];

/** The six rejection Toasts (consumer-side; detailed, dismissible, no CTA). */
export const RejectionToasts: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-20)" }}>
        {REJECTION_TOASTS.map((toast) => (
          <div key={toast.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-2)" }}>
            <span style={cap}>{toast.label}</span>
            <Toast variant="detailed" type={toast.type} title={toast.title} caption={toast.caption} onDismiss={noop} />
          </div>
        ))}
      </div>
    </DocsFrame>
  ),
};
