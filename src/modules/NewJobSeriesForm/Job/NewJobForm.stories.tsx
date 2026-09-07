import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../../components/Button/Button";
import Toaster from "../../../components/Toast/Toaster";
import { PhoneViewport } from "../../../stories/helpers";
import NewJobForm from "./NewJobForm";

// The "New Job" flow of the «"New Job / Series" Form» module family (the
// series flow is deferred). The sidebar group name uses "∕" (U+2215) instead
// of "/" — a real slash would split the Storybook level.
const meta: Meta = {
  title: 'Modules/"New Job ∕ Series" Form/Job',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const Demo = ({ breakpoint }: { breakpoint: "desktop" | "mobile" }) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="lg" variant="subtle" leftIcon="plus" onClick={() => setOpen(true)}>
        New job
      </Button>
      <NewJobForm
        open={open}
        onClose={() => setOpen(false)}
        onEditDraft={() => setOpen(true)}
        breakpoint={breakpoint}
      />
      <Toaster breakpoint={breakpoint} />
    </>
  );
};

export const Desktop: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" />,
};

// Works in the browser AND on a real phone (MOBILE.md): open this story's
// iframe URL on the device and Add to Home Screen — PhoneViewport owns the
// standalone viewport and the safe-area insets.
export const Mobile: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <PhoneViewport>
      <Demo breakpoint="mobile" />
    </PhoneViewport>
  ),
};
