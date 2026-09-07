import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../components/Button/Button";
import Toaster from "../../components/Toast/Toaster";
import NewServiceForm from "./NewServiceForm";

// A reusable Modules-tier form (like NewLocationForm / NewEquipmentForm),
// opened from the New Job form's Service list. Name and Default priority are
// required; Duration is optional (the shared hr/min widget with chips).
const meta: Meta = {
  title: 'Modules/"New Service" Form',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const Demo = ({ breakpoint }: { breakpoint: "desktop" | "mobile" }) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="lg" variant="subtle" leftIcon="plus" onClick={() => setOpen(true)}>
        New service
      </Button>
      <NewServiceForm open={open} onClose={() => setOpen(false)} breakpoint={breakpoint} />
      <Toaster breakpoint={breakpoint} />
    </>
  );
};

export const Desktop: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" />,
};

export const Mobile: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="mobile" />,
};
