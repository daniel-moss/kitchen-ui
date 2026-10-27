import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../../components/Button/Button";
import Toaster from "../../../components/Toast/Toaster";
import { PhoneViewport } from "../../../stories/helpers";
import DownloadPdfForm from "./DownloadPdfForm";

import styles from "./DownloadPdfForm.module.scss";

// The form on its own — Job Details opens it from every "Download PDF"
// action. Figma section 24592-39416. With a parent estimate, the picked card
// offers "Include parent estimate PDF"; without one, it is just the two cards.
const meta: Meta = {
  title: 'Modules/Job/Details/Forms/Download PDF',
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

// The page behind the form: one button that opens it again after Cancel / Download.
const Harness = ({ mobile, hasParentEstimate }: { mobile: boolean; hasParentEstimate: boolean }) => {
  const [open, setOpen] = useState(true);
  return (
    <PhoneViewport>
      <div className={styles.storyPage}>
        <Button size="lg" variant="subtle" leftIcon="download" onClick={() => setOpen(true)}>
          Open the form
        </Button>
      </div>
      <DownloadPdfForm open={open} onClose={() => setOpen(false)} hasParentEstimate={hasParentEstimate} mobile={mobile} />
      <Toaster breakpoint={mobile ? "mobile" : "desktop"} />
    </PhoneViewport>
  );
};

/** With a parent estimate — the picked card shows "Include parent estimate PDF". */
export const ParentDesktop: Story = {
  name: "Parent / Desktop",
  render: () => <Harness mobile={false} hasParentEstimate />,
};

/** The same form as a drawer. Works on a real phone via the story's iframe URL. */
export const ParentMobile: Story = {
  name: "Parent / Mobile",
  render: () => <Harness mobile hasParentEstimate />,
};

/** No parent estimate — the two version cards alone. */
export const NoParentDesktop: Story = {
  name: "No Parent / Desktop",
  render: () => <Harness mobile={false} hasParentEstimate={false} />,
};

/** The same form as a drawer. Works on a real phone via the story's iframe URL. */
export const NoParentMobile: Story = {
  name: "No Parent / Mobile",
  render: () => <Harness mobile hasParentEstimate={false} />,
};
