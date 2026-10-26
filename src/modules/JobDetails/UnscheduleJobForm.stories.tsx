import type { Meta, StoryObj } from "@storybook/react";

import { useEffect, useState } from "react";

import { usersById } from "../../data/users";

import FormStoryFrame from "./FormStoryFrame";
import UnscheduleJobForm, { CheckedInAssignee } from "./UnscheduleJobForm";

// The "Unschedule job" form (Figma 27154-49578) in every state: one required
// "Unschedule reason", the reason missing, and the warning block listing the
// assignees who are still checked in (Figma 27263-65227).
const meta: Meta = {
  title: 'Modules/Job/Details/Forms/Unschedule Job',
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

// Assignees whose clocks run — the times keep counting, as on the page.
const session = (id: number, elapsedSec: number): CheckedInAssignee => {
  const user = usersById.get(id)!;
  return { id, name: user.name, avatar: user.avatar, status: "Working", elapsedSec };
};
const ONE = [session(1, 5445)];
const TWO = [session(1, 5445), session(2, 2724)];

function useTicking(list: CheckedInAssignee[]) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  return list.map((a) => ({ ...a, elapsedSec: a.elapsedSec + tick }));
}

const Demo = ({ mobile = false, press = false, checkedIn = [] }: { mobile?: boolean; press?: boolean; checkedIn?: CheckedInAssignee[] }) => {
  const live = useTicking(checkedIn);
  return (
    <FormStoryFrame mobile={mobile} icon="calendar-xmark" press={press ? "Unschedule" : undefined}>
      {(open, close) => <UnscheduleJobForm open={open} onClose={close} onUnschedule={close} checkedIn={live} mobile={mobile} />}
    </FormStoryFrame>
  );
};

/** One required "Unschedule reason". */
export const Desktop: Story = { render: () => <Demo /> };

/** The same, as a mobile drawer with a drag handle — the field keeps its default size. */
export const Mobile: Story = { render: () => <Demo mobile /> };

/** "Unschedule" pressed empty: "Provide Unschedule reason". */
export const ReasonMissing: Story = { name: "Reason missing", render: () => <Demo press /> };

/** One assignee is checked in — the warning block lists them. */
export const OneCheckedIn: Story = {
  name: "One assignee checked in",
  render: () => <Demo checkedIn={ONE} />,
};

/** Several assignees are checked in. */
export const SeveralCheckedIn: Story = {
  name: "Several assignees checked in",
  render: () => <Demo checkedIn={TWO} />,
};

/** The banner in the mobile drawer — it sits under the field. */
export const MobileCheckedIn: Story = {
  name: "Mobile, assignee checked in",
  render: () => <Demo mobile checkedIn={ONE} />,
};
