import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../components/Button/Button";
import Toaster from "../../components/Toast/Toaster";
import NewEquipmentForm from "./NewEquipmentForm";

// The reusable "New equipment" form (Figma 21897-7658) — assembled from DS
// components and shared by the prototypes (Job Details opens it from the
// Equipment list's "Add equipment"). The demo location is "HQ" (the header
// caption).
const meta: Meta = {
  title: 'Modules/"New Equipment" Form',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const Demo = ({ breakpoint }: { breakpoint: "desktop" | "mobile" }) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="lg" variant="subtle" leftIcon="plus" onClick={() => setOpen(true)}>
        New equipment
      </Button>
      <NewEquipmentForm open={open} onClose={() => setOpen(false)} location="HQ" breakpoint={breakpoint} />
      {/* The form's "Equipment created" toast needs a mounted Toaster. */}
      <Toaster />
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
