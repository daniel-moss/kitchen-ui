import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../components/Button/Button";
import NewLocationForm from "./NewLocationForm";

// The first form in the reusable Forms tier (src/forms/): assembled from DS
// components, shared by prototypes — see the folder's components for the
// Figma sources. The demo client is "McDonald's" (the header caption).
const meta: Meta = {
  title: "Forms/New Location Form",
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const Demo = ({ breakpoint }: { breakpoint: "desktop" | "mobile" }) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="lg" variant="subtle" leftIcon="plus" onClick={() => setOpen(true)}>
        New location
      </Button>
      <NewLocationForm open={open} onClose={() => setOpen(false)} client="McDonald's" breakpoint={breakpoint} />
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
