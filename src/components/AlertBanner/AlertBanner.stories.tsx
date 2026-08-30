import type { Meta, StoryObj } from "@storybook/react";

import AlertBanner from "./AlertBanner";
import { AlertBannerOrientation, AlertBannerStatus, AlertBannerType } from "./AlertBanner.types";

type StoryArgs = {
  type: AlertBannerType;
  orientation: AlertBannerOrientation;
  status: AlertBannerStatus;
  text: string;
  showCta: boolean;
  showDismiss: boolean;
};

const STATUSES: AlertBannerStatus[] = ["info", "success", "warning", "error"];

const SHORT = "Insert your content here.";
const LONG =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

const noop = () => {};

const frame: React.CSSProperties = { width: 460 };
const col: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-4)", width: 460 };
const label: React.CSSProperties = { font: "var(--font-caption-medium-500)", color: "var(--text-subtle)" };

/**
 * AlertBanner — an inline alert colored entirely by status. card = bordered
 * tinted box; banner = same tint without border/radius. Horizontal keeps one
 * centered row and always has a CTA (required); vertical may omit the CTA and
 * drops it below the text. Dismiss is always optional.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/AlertBanner",
  component: AlertBanner,
  parameters: { layout: "centered" },
  args: {
    type: "card",
    orientation: "horizontal",
    status: "info",
    text: SHORT,
    showCta: true,
    showDismiss: true,
  },
  argTypes: {
    type: { options: ["card", "banner"], control: { type: "inline-radio" } },
    orientation: { options: ["horizontal", "vertical"], control: { type: "inline-radio" } },
    status: { options: STATUSES, control: { type: "inline-radio" } },
    text: { control: { type: "text" } },
    // Horizontal always has a CTA, so the toggle only applies to vertical.
    showCta: { name: "CTA", control: { type: "boolean" }, if: { arg: "orientation", eq: "vertical" } },
    showDismiss: { name: "dismiss", control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: ({ type, orientation, status, text, showCta, showDismiss }) => {
    const dismiss = showDismiss ? noop : undefined;
    return (
      <div style={frame}>
        {orientation === "vertical" ? (
          <AlertBanner
            type={type}
            orientation="vertical"
            status={status}
            ctaLabel={showCta ? "Action" : undefined}
            ctaOnClick={showCta ? noop : undefined}
            onDismiss={dismiss}
          >
            {text}
          </AlertBanner>
        ) : (
          // horizontal always has a CTA
          <AlertBanner type={type} orientation="horizontal" status={status} ctaLabel="Action" ctaOnClick={noop} onDismiss={dismiss}>
            {text}
          </AlertBanner>
        )}
      </div>
    );
  },
};

/** card (bordered tinted box) vs banner (same tint, no border/radius). */
export const Types: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={col}>
      <span style={label}>card</span>
      <AlertBanner type="card" status="info" ctaLabel="Action" ctaOnClick={noop} onDismiss={noop}>
        {SHORT}
      </AlertBanner>
      <span style={label}>banner</span>
      <AlertBanner type="banner" status="info" ctaLabel="Action" ctaOnClick={noop} onDismiss={noop}>
        {SHORT}
      </AlertBanner>
    </div>
  ),
};

/** horizontal (one row) vs vertical (CTA below the text). */
export const Orientations: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={col}>
      <span style={label}>horizontal</span>
      <AlertBanner orientation="horizontal" status="info" ctaLabel="Action" ctaOnClick={noop} onDismiss={noop}>
        {LONG}
      </AlertBanner>
      <span style={label}>vertical</span>
      <AlertBanner orientation="vertical" status="info" ctaLabel="Action" ctaOnClick={noop} onDismiss={noop}>
        {LONG}
      </AlertBanner>
    </div>
  ),
};

/** The four statuses. */
export const Statuses: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={col}>
      {STATUSES.map((status) => (
        <AlertBanner key={status} status={status} ctaLabel="Action" ctaOnClick={noop} onDismiss={noop}>
          {SHORT}
        </AlertBanner>
      ))}
    </div>
  ),
};

/**
 * The CTA is optional only in vertical (horizontal always has one); dismiss is
 * always optional.
 */
export const Options: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={col}>
      <span style={label}>vertical — text only</span>
      <AlertBanner orientation="vertical" status="info">
        {SHORT}
      </AlertBanner>
      <span style={label}>vertical — dismiss only</span>
      <AlertBanner orientation="vertical" status="info" onDismiss={noop}>
        {SHORT}
      </AlertBanner>
      <span style={label}>horizontal — CTA (required)</span>
      <AlertBanner status="info" ctaLabel="Action" ctaOnClick={noop}>
        {SHORT}
      </AlertBanner>
      <span style={label}>horizontal — CTA + dismiss</span>
      <AlertBanner status="info" ctaLabel="Action" ctaOnClick={noop} onDismiss={noop}>
        {SHORT}
      </AlertBanner>
    </div>
  ),
};
