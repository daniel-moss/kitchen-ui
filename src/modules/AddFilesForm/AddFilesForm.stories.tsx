import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../components/Button/Button";
import Toaster from "../../components/Toast/Toaster";
import AddFilesForm from "./AddFilesForm";

// The Add-Files form — the source of the shared file-list functionality the
// New Job form's Files module inherits (Dropzone + grouped list + menus).
const meta: Meta = {
  title: 'Modules/"Add Files" Form',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const Demo = ({ breakpoint }: { breakpoint: "desktop" | "mobile" }) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="lg" variant="subtle" leftIcon="plus" onClick={() => setOpen(true)}>
        Add files
      </Button>
      <AddFilesForm open={open} onClose={() => setOpen(false)} breakpoint={breakpoint} />
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
