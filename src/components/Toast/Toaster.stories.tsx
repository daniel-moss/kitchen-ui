import type { Meta, StoryObj } from "@storybook/react";

import Button from "../Button/Button";
import { DeviceFrame } from "../../stories/helpers";
import Toaster, { toast } from "./Toaster";
import { ToastType } from "./Toast.types";

const TYPES: ToastType[] = ["neutral", "processing", "success", "informative", "warning", "error"];

const TITLES: Record<ToastType, string> = {
  neutral: "Draft saved",
  processing: "Sending invitation…",
  success: "Job JOB-10001 created",
  informative: "3 visits scheduled for tomorrow",
  warning: "Estimate expires in 2 days",
  error: "Could not save the job",
};

const show = (type: ToastType) =>
  toast({ type, title: TITLES[type], cta: { children: "Action", onClick: () => {} } });

const showDetailed = () =>
  toast({
    type: "informative",
    variant: "detailed",
    title: "Invitation for daniel.moss@roopairs.com has been resent.",
    caption: "Please check both inbox and spam folders to make sure that you've got an email.",
    cta: { children: "Primary", onClick: () => {} },
    secondaryCta: { children: "Secondary", onClick: () => {} },
  });

// A processing toast stays until it is RESOLVED — here it becomes a success
// after 2 seconds, which starts the normal auto-dismiss.
const showProcessingFlow = () => {
  const id = toast({ type: "processing", title: "Creating invoice…", isDismissible: false });
  window.setTimeout(() => toast.update(id, { type: "success", title: "Invoice INV-1042 created", isDismissible: true }), 2000);
};

const Triggers = () => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 16 }}>
    {TYPES.map((type) => (
      <Button key={type} size="sm" variant="subtle" onClick={() => show(type)}>
        {type}
      </Button>
    ))}
    <Button size="sm" variant="subtle" onClick={showDetailed}>
      detailed
    </Button>
    <Button size="sm" variant="solid" onClick={showProcessingFlow}>
      processing → success
    </Button>
  </div>
);

/**
 * Toaster — mount once; `toast(props)` shows a toast, `toast.update(id,
 * patch)` changes it, `toast.dismiss(id?)` removes one/all. Auto-dismiss
 * after 4s (hover pauses it; `processing` stays until resolved).
 */
const meta: Meta<typeof Toaster> = {
  title: "Components/Toast/Toaster",
  component: Toaster,
  parameters: { controls: { disable: true } },
};
export default meta;

type Story = StoryObj<typeof Toaster>;

/** Bottom-right corner, 24px from the window edges, newest at the bottom. */
export const Desktop: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ height: "100vh" }}>
      <Triggers />
      <Toaster breakpoint="desktop" />
    </div>
  ),
};

/** On top, 8px below the status bar, full width with 8px edge gaps, newest first. */
export const Mobile: Story = {
  parameters: { layout: "centered" },
  render: () => (
    <DeviceFrame pageText="" statusBar homeIndicator>
      <div style={{ position: "absolute", inset: "44px 0 0", overflow: "hidden" }}>
        <Triggers />
      </div>
      <Toaster breakpoint="mobile" />
    </DeviceFrame>
  ),
};
