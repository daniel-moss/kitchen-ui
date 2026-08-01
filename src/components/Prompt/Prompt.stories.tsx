import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Prompt from "./Prompt";
import { PromptActionVariant, PromptBreakpoint } from "./Prompt.types";
import Button from "../Button/Button";

type StoryArgs = {
  title: string;
  body: string;
  actionLabel: string;
  actionVariant: PromptActionVariant;
  actionIcon?: string;
  breakpoint: PromptBreakpoint;
};

const Demo = ({ title, body, actionLabel, actionVariant, actionIcon, breakpoint }: StoryArgs) => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Button size="md" variant={actionVariant === "danger" ? "danger" : "solid"} onClick={() => setOpen(true)}>
        Open prompt
      </Button>
      <Prompt
        open={open}
        title={title}
        body={body}
        onCancel={close}
        actionLabel={actionLabel}
        onAction={close}
        actionVariant={actionVariant}
        actionIcon={actionIcon}
        breakpoint={breakpoint}
      />
    </>
  );
};

/**
 * Prompt — a small, non-dismissible confirmation modal built on Popover. A 440px
 * centered card (desktop) or a bottom sheet (mobile) with a title + body and
 * Cancel + action buttons. It can only be answered — no scrim tap, swipe, or close.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Prompt",
  component: Prompt,
  parameters: { layout: "centered" },
  args: {
    title: "Delete this item?",
    body: "This action can't be undone. The item will be permanently removed.",
    actionLabel: "Delete",
    actionVariant: "danger",
    breakpoint: "desktop",
  },
  argTypes: {
    title: { control: { type: "text" } },
    body: { control: { type: "text" } },
    actionLabel: { control: { type: "text" } },
    actionVariant: { options: ["solid", "danger"], control: { type: "inline-radio" } },
    breakpoint: { options: ["auto", "desktop", "mobile"], control: { type: "inline-radio" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: (args) => <Demo {...args} />,
};

/** Desktop — a 440px centered card. */
export const Desktop: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Demo
      title="Leave without saving?"
      body="Your changes haven't been saved yet."
      actionLabel="Leave"
      actionVariant="solid"
      breakpoint="desktop"
    />
  ),
};

/** Mobile — a bottom sheet (non-dismissible: no swipe, no scrim tap). */
export const Mobile: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Demo
      title="Leave without saving?"
      body="Your changes haven't been saved yet."
      actionLabel="Leave"
      actionVariant="solid"
      breakpoint="mobile"
    />
  ),
};

/** A destructive action uses the danger button. */
export const Danger: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Demo
      title="Delete this item?"
      body="This action can't be undone. The item will be permanently removed."
      actionLabel="Delete"
      actionVariant="danger"
      breakpoint="desktop"
    />
  ),
};

/** A destructive prompt whose action button carries a left icon (e.g. "trash"). */
export const ActionIcon: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Demo
      title="Delete time session?"
      body="Time session will be permanently deleted. This action can not be undone."
      actionLabel="Delete"
      actionVariant="danger"
      actionIcon="trash"
      breakpoint="desktop"
    />
  ),
};
