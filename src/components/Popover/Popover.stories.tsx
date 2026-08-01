import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Popover from "./Popover";
import PopoverHeader from "./PopoverHeader";
import DrawerHeader from "./DrawerHeader";
import PopoverHeaderContent from "./PopoverHeaderContent";
import PopoverHeaderText from "./PopoverHeaderText";
import PopoverFooter from "./PopoverFooter";
import Button from "../Button/Button";
import { DeviceFrame } from "../../stories/helpers";

type StoryArgs = {
  drawer: boolean;
  header: boolean;
  footer: boolean;
};

// ---- shared demo content ---------------------------------------------------

const titleContent = (
  <PopoverHeaderContent>
    <PopoverHeaderText variant="title" title="Title" />
  </PopoverHeaderContent>
);

const desktopHeader = (onClose: () => void) => (
  <PopoverHeader close onClose={onClose}>
    {titleContent}
  </PopoverHeader>
);

// Drawer header: default variant (drag handle + body). No close button when a
// handle is present — the handle / tap-outside / swipe dismisses.
const drawerHeader = <DrawerHeader variant="default">{titleContent}</DrawerHeader>;

const footerEl = (onClose: () => void) => (
  <PopoverFooter
    leadingButton={
      <Button size="lg" variant="ghost" onClick={onClose}>
        Cancel
      </Button>
    }
  >
    <Button size="lg" variant="subtle">
      Secondary
    </Button>
    <Button size="lg" variant="solid" onClick={onClose}>
      Primary
    </Button>
  </PopoverFooter>
);

const SampleBody = ({ rows = 8, note = true }: { rows?: number; note?: boolean }) => (
  <div style={{ padding: "var(--size-4)", display: "flex", flexDirection: "column", gap: "var(--size-3)" }}>
    {note && (
      <p style={{ margin: 0, font: "var(--font-body-400-compact)", color: "var(--text-subtle)" }}>
        Popover is a container — it only defines the surface. Put any content here.
        The body is the only scrolling region; the header and footer stay fixed.
      </p>
    )}
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        style={{
          height: 48,
          borderRadius: "var(--border-radius-1_5)",
          background: "var(--gray-a3)",
        }}
      />
    ))}
  </div>
);

// ---- frames ----------------------------------------------------------------

// Plain area to show a floating desktop card.
const DesktopFrame = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      position: "relative",
      width: 560,
      minHeight: 420,
      padding: "var(--size-8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--surface-level-first)",
      borderRadius: "var(--border-radius-2_5)",
    }}
  >
    <div style={{ width: 520 }}>{children}</div>
  </div>
);

// A 375×812 device frame with full chrome (shared helper); the scrim fills it
// and the 44px status bar sets --popover-drawer-top-inset.
const PopoverDeviceFrame = ({ children }: { children: React.ReactNode }) => (
  <DeviceFrame statusBar homeIndicator>
    {children}
  </DeviceFrame>
);

// ---- meta ------------------------------------------------------------------

/**
 * Popover — a container that floats above the page and holds any content. It
 * only defines the surface style and the sticky header/footer layout. On
 * desktop it is a floating card; on mobile it becomes a bottom-sheet drawer over
 * a scrim, dismissed by tapping outside, swiping down, or a close button.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Popover/Popover",
  component: Popover,
  parameters: { layout: "centered" },
  args: { drawer: false, header: true, footer: true },
  argTypes: {
    drawer: { control: { type: "boolean" } },
    header: { control: { type: "boolean" } },
    footer: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

// ---- interactive playground ------------------------------------------------

const Demo = ({ drawer, header, footer }: StoryArgs) => {
  const [open, setOpen] = useState(true);
  const close = () => setOpen(false);

  if (!drawer) {
    return (
      <DesktopFrame>
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Button size="md" variant="solid" onClick={() => setOpen(true)}>
            Open popover
          </Button>
        </div>
        <Popover
          open={open}
          style={{ position: "relative", zIndex: 1 }}
          header={header ? desktopHeader(close) : undefined}
          footer={footer ? footerEl(close) : undefined}
        >
          <SampleBody />
        </Popover>
      </DesktopFrame>
    );
  }

  return (
    <PopoverDeviceFrame>
      {/* reopen button sits behind; the Popover covers it while open, and shows
          through once it has fully animated out and unmounted */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Button size="md" variant="solid" onClick={() => setOpen(true)}>
          Open drawer
        </Button>
      </div>
      <Popover
        drawer
        open={open}
        header={header ? drawerHeader : undefined}
        footer={footer ? footerEl(close) : undefined}
        onClose={close}
      >
        <SampleBody />
      </Popover>
    </PopoverDeviceFrame>
  );
};

export const Playground: Story = {
  render: (args) => <Demo {...args} />,
};

/** Desktop — a floating card with header, scrolling body, and footer. */
export const Desktop: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Demo drawer={false} header footer />,
};

/**
 * Drawer (mobile) — a bottom sheet over a scrim. Tap outside, swipe the sheet
 * down, or use a close button to dismiss. Per Figma, a footer is allowed
 * together with a drag-handle DrawerHeader.
 */
export const Drawer: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Demo drawer header footer />,
};

// ---- matrix ----------------------------------------------------------------

const cellLabel: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

const combos: { header: boolean; footer: boolean; label: string }[] = [
  { header: false, footer: false, label: "no header, no footer" },
  { header: true, footer: false, label: "header only" },
  { header: false, footer: true, label: "footer only" },
  { header: true, footer: true, label: "header + footer" },
];

const noop = () => {};

/** All 8 combinations at normal size: desktop (card) and drawer (bottom sheet) × header × footer. */
export const Matrix: Story = {
  parameters: { controls: { disable: true }, layout: "padded" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-8)" }}>
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--size-3)" }}>
        <span style={{ ...cellLabel, color: "var(--text-strong)" }}>Desktop</span>
        <div style={{ display: "flex", gap: "var(--size-5)", flexWrap: "wrap", alignItems: "flex-start" }}>
          {combos.map(({ header, footer, label }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
              <span style={cellLabel}>{label}</span>
              <DesktopFrame>
                <Popover
                  header={header ? desktopHeader(noop) : undefined}
                  footer={footer ? footerEl(noop) : undefined}
                >
                  <SampleBody rows={4} note={false} />
                </Popover>
              </DesktopFrame>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "var(--size-3)" }}>
        <span style={{ ...cellLabel, color: "var(--text-strong)" }}>Drawer (mobile)</span>
        <div style={{ display: "flex", gap: "var(--size-5)", flexWrap: "wrap", alignItems: "flex-start" }}>
          {combos.map(({ header, footer, label }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
              <span style={cellLabel}>{label}</span>
              <PopoverDeviceFrame>
                <Popover
                  drawer
                  header={header ? drawerHeader : undefined}
                  footer={footer ? footerEl(noop) : undefined}
                  onClose={noop}
                >
                  <SampleBody rows={4} note={false} />
                </Popover>
              </PopoverDeviceFrame>
            </div>
          ))}
        </div>
      </section>
    </div>
  ),
};

/**
 * Long content — the body scrolls while the header and footer stay fixed. On the
 * drawer, the footer sits above the iOS home-indicator area.
 */
export const Scrollable: Story = {
  parameters: { controls: { disable: true }, layout: "padded" },
  render: () => (
    <div style={{ display: "flex", gap: "var(--size-8)", flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
        <span style={cellLabel}>Desktop — capped height, body scrolls</span>
        <DesktopFrame>
          <Popover header={desktopHeader(noop)} footer={footerEl(noop)} style={{ maxHeight: 420 }}>
            <SampleBody rows={14} />
          </Popover>
        </DesktopFrame>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
        <span style={cellLabel}>Drawer — body scrolls, footer above home indicator</span>
        <PopoverDeviceFrame>
          <Popover drawer header={drawerHeader} footer={footerEl(noop)} onClose={noop}>
            <SampleBody rows={16} />
          </Popover>
        </PopoverDeviceFrame>
      </div>
    </div>
  ),
};
