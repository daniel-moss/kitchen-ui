import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Button from "../../components/Button/Button";
import Toaster from "../../components/Toast/Toaster";
import { PhoneViewport } from "../../stories/helpers";
import SendSummaryForm from "./SendSummaryForm";

import styles from "./SendSummaryForm.module.scss";

// The form on its own, so it can be tested without walking through the whole
// Complete-job flow first. In the product it opens the moment a job is
// completed (JobDetails wires it to CompleteJobForm's `onCompleted`).
const meta: Meta = {
  title: 'Prototypes/Job Details/"Send Summary" Form',
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

// The page behind the form: one button that opens it again after Skip / Send.
// The FIRST open (on mount) stands for the hand-over from the Complete flow, so
// its leading button says "Skip"; the button below reopens it by hand, the
// "Resend summary" case, and the leading button says "Cancel".
const Harness = ({ mobile }: { mobile: boolean }) => {
  const [open, setOpen] = useState(true);
  const [afterCompletion, setAfterCompletion] = useState(true);
  return (
    <PhoneViewport>
      <div className={styles.storyPage}>
        <Button
          size="lg"
          variant="subtle"
          leftIcon="paper-plane"
          onClick={() => {
            setAfterCompletion(false);
            setOpen(true);
          }}
        >
          Open the form
        </Button>
      </div>
      <SendSummaryForm open={open} onClose={() => setOpen(false)} afterCompletion={afterCompletion} mobile={mobile} />
      <Toaster breakpoint={mobile ? "mobile" : "desktop"} />
    </PhoneViewport>
  );
};

/** Desktop: the 608px Dialog card. */
export const Desktop: Story = { render: () => <Harness mobile={false} /> };

/** Mobile: the same form as a drawer. Works on a real phone via the story's iframe URL. */
export const Mobile: Story = { render: () => <Harness mobile /> };
