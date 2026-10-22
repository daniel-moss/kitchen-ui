import type { Meta, StoryObj } from "@storybook/react";

import FormStoryFrame from "./FormStoryFrame";
import UnscheduleJobForm from "./UnscheduleJobForm";

// The "Unschedule job" form (Figma 27154-49578) in every state: one required
// "Unschedule reason", and the reason missing.
const meta: Meta = {
  title: 'Modules/Job/"Unschedule Job" Form',
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const Demo = ({ mobile = false, press = false }: { mobile?: boolean; press?: boolean }) => (
  <FormStoryFrame mobile={mobile} icon="calendar-xmark" press={press ? "Unschedule" : undefined}>
    {(open, close) => <UnscheduleJobForm open={open} onClose={close} onUnschedule={close} mobile={mobile} />}
  </FormStoryFrame>
);

/** One required "Unschedule reason". */
export const Desktop: Story = { render: () => <Demo /> };

/** The same, as a mobile drawer — the field fills it. */
export const Mobile: Story = { render: () => <Demo mobile /> };

/** "Unschedule" pressed empty: "Provide Unschedule reason". */
export const ReasonMissing: Story = { name: "Reason missing", render: () => <Demo press /> };
