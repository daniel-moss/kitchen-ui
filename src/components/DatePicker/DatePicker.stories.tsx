import { useEffect, useRef, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import DateField from "../Fields/DateField/DateField";
import Input from "../Input/Input";
import { DeviceFrame, noop } from "../../stories/helpers";
import DatePicker from "./DatePicker";

// Deterministic "today" so the stories match Figma (January 2027, today = 15).
const TODAY = new Date(2027, 0, 15);
const SELECTED = new Date(2027, 0, 20);

const meta: Meta<typeof DatePicker> = {
  title: "Components/DatePicker/DatePicker",
  component: DatePicker,
  parameters: { layout: "centered" },
  args: { today: TODAY, breakpoint: "desktop", open: true, onChange: noop },
  argTypes: {
    value: { control: false },
    defaultValue: { control: false },
    today: { control: false },
    minDate: { control: false },
    maxDate: { control: false },
  },
};
export default meta;

type Story = StoryObj<typeof DatePicker>;

/** The desktop card. Today (15) has the gray fill; 20 is selected. */
export const Desktop: Story = {
  render: (args) => {
    const [value, setValue] = useState<Date | null>(SELECTED);
    return <DatePicker {...args} value={value} onChange={setValue} />;
  },
};

/** minDate = today: earlier days are dimmed and inert; the back arrow stops. */
export const MinMax: Story = {
  render: (args) => {
    const [value, setValue] = useState<Date | null>(null);
    return (
      <DatePicker {...args} value={value} onChange={setValue} minDate={TODAY} maxDate={new Date(2027, 1, 10)} />
    );
  },
};

/**
 * The desktop integration: clicking a DateField opens the card 4px below the
 * field, left-aligned. Type a date OR pick a day (both commit + close).
 */
export const WithDateField: Story = {
  render: () => (
    <div style={{ width: 320, paddingBottom: 380 }}>
      <Input label="Date received" helpText="Pick a day or type one">
        <DateField breakpoint="desktop" today={TODAY} />
      </Input>
    </div>
  ),
};

// Opens the DateField's DatePicker on mount (clicks the field) so the drawer
// shows without interaction. `breakpoint="mobile"` is REQUIRED inside a
// DeviceFrame — the auto check reads the real window width, not the 375px frame.
const MobileDrawerDemo = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = window.setTimeout(() => ref.current?.querySelector("label")?.click(), 150);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <DeviceFrame homeIndicator pageText="Tap the field to open the picker.">
      <div ref={ref} style={{ padding: 16 }}>
        <Input label="Date received">
          <DateField breakpoint="mobile" today={TODAY} />
        </Input>
      </div>
    </DeviceFrame>
  );
};

/**
 * The mobile integration: tapping the DateField opens the DRAWER — the
 * calendar plus, below a divider, the DateField (auto-focused, for manual
 * typing) and an Apply button. Never the inline card.
 */
export const Mobile: Story = { render: () => <MobileDrawerDemo /> };

/**
 * Standalone drawer with NO footer — the "opened from a plain Button" case
 * (the docs: the DateField section only appears when the trigger is a
 * DateField).
 */
export const MobileButtonTrigger: Story = {
  render: () => {
    const [value, setValue] = useState<Date | null>(SELECTED);
    return (
      <DeviceFrame homeIndicator pageText="Button-triggered DatePicker drawer.">
        <DatePicker breakpoint="mobile" open today={TODAY} value={value} onChange={setValue} onClose={noop} />
      </DeviceFrame>
    );
  },
};
