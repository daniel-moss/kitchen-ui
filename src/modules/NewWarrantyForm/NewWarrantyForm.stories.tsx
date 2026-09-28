import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../components/Button/Button";
import Toaster from "../../components/Toast/Toaster";
import NewWarrantyForm from "./NewWarrantyForm";

// The reusable "New warranty" form (Figma section 23801-3854) — assembled from
// DS components and shared by the flows that add a warranty (the Equipment
// side panel's Warranties tab opens it from "Add warranty"). The demo
// equipment is the db's walk-in cooler.
const meta: Meta = {
  title: 'Modules/"New Warranty" Form',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const Demo = ({ breakpoint, fails = false }: { breakpoint: "desktop" | "mobile"; fails?: boolean }) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="lg" variant="subtle" leftIcon="plus" onClick={() => setOpen(true)}>
        New warranty
      </Button>
      <NewWarrantyForm
        open={open}
        onClose={() => setOpen(false)}
        equipmentName="Walk-in cooler"
        // Returning false is how a caller reports a failed create — it shows
        // the designed error toast and keeps the form open.
        onCreated={fails ? () => false : undefined}
        onPreview={() => {}}
        breakpoint={breakpoint}
      />
      {/* The form's toasts need a mounted Toaster. */}
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

/** Create fails — the error toast, and the form keeps what was typed. */
export const CreateFails: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo breakpoint="desktop" fails />,
};
