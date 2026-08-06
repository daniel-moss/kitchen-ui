import type { Meta, StoryObj } from "@storybook/react";
import { ComponentType, CSSProperties, ReactNode } from "react";

import Concept1 from "./Concept1";
import Concept2 from "./Concept2";
import Concept3 from "./Concept3";
import Concept4 from "./Concept4";
import Concept5 from "./Concept5";
import {
  FRESH_ROWS,
  FULL_CHRONO_ROWS,
  FULL_ROWS,
  IN_PROGRESS_ROWS,
  LifecycleRow,
} from "./lifecycleData";
import { LifecycleConceptProps } from "./shared";

// Five ways to show the same job lifecycle, each with the same set of states
// so they can be compared side by side. The data is FIXED here — the live
// module in the Job Details Activity tab only lists statuses the job really
// entered, so the filled states are otherwise unreachable.

const meta: Meta = {
  title: "Prototypes/Job Lifecycle",
  parameters: { layout: "fullscreen", controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

const hours = (h: number) => h * 3600;
const days = (d: number) => d * 86400;

// The module fills its container, so each story sets the width the design
// uses: 608px on desktop, 343px on mobile.
const frame = (width: number): CSSProperties => ({
  boxSizing: "border-box",
  width,
  margin: "0 auto",
  padding: "var(--size-10) 0",
});
const Frame = ({ width, children }: { width: number; children: ReactNode }) => (
  <div style={frame(width)}>{children}</div>
);

// ---- one state set, applied to every concept --------------------------------

type Concept = ComponentType<LifecycleConceptProps>;

/** The five states each concept is shown in. */
const states = (Component: Concept, chrono: LifecycleRow[]) => ({
  /**
   * A fresh job: only "Upcoming" has any time, so it is the only row. This is
   * what the live module shows before the job is driven — the list grows as
   * statuses are entered.
   */
  FreshJob: {
    render: () => (
      <Frame width={608}>
        <Component billableSec={0} lifecycleSec={8 * 60} breakdown={FRESH_ROWS} />
      </Frame>
    ),
  } as Story,

  /**
   * Mid-job: scheduled, started, paused for lunch, active again. "Active" has
   * TWO stretches, so the concepts that expand show two sub-rows.
   */
  InProgress: {
    render: () => (
      <Frame width={608}>
        <Component billableSec={hours(3) + 25 * 60} lifecycleSec={days(2) + hours(7)} breakdown={IN_PROGRESS_ROWS} />
      </Frame>
    ),
  } as Story,

  /** The full sample history — every status the design shows. */
  FullHistory: {
    render: () => (
      <Frame width={608}>
        <Component billableSec={hours(3) + 45 * 60} lifecycleSec={days(19)} breakdown={chrono} />
      </Frame>
    ),
  } as Story,

  /**
   * The list closed: Concepts 1 and 2 collapse the whole "Statuses break down"
   * group, Concepts 3 and 4 close every row, Concept 5 truncates behind
   * "Show N more".
   */
  Collapsed: {
    render: () => (
      <Frame width={608}>
        <Component billableSec={hours(3) + 45 * 60} lifecycleSec={days(19)} breakdown={chrono} defaultOpen={false} />
      </Frame>
    ),
  } as Story,

  /** Mobile: the two highlight boxes stack instead of sitting side by side. */
  Mobile: {
    render: () => (
      <Frame width={343}>
        <Component billableSec={hours(3) + 45 * 60} lifecycleSec={days(19)} breakdown={chrono} mobile />
      </Frame>
    ),
  } as Story,
});

// Concepts 1–4 aggregate per status; Concept 5 lists every stretch in time
// order, so it gets the chronological sample (which also carries "Working" and
// the terminal "Finalized").
const c1 = states(Concept1, FULL_ROWS);
const c2 = states(Concept2, FULL_ROWS);
const c3 = states(Concept3, FULL_ROWS);
const c4 = states(Concept4, FULL_ROWS);
const c5 = states(Concept5, FULL_CHRONO_ROWS);

// ---- Concept 1 — ActivityLog accordion (the built one) ----------------------

export const Concept1FreshJob: Story = { ...c1.FreshJob, name: "Concept 1 / Fresh job" };
export const Concept1InProgress: Story = { ...c1.InProgress, name: "Concept 1 / In progress" };
export const Concept1FullHistory: Story = { ...c1.FullHistory, name: "Concept 1 / Full history" };
export const Concept1Collapsed: Story = { ...c1.Collapsed, name: "Concept 1 / Collapsed" };
export const Concept1Mobile: Story = { ...c1.Mobile, name: "Concept 1 / Mobile" };

// ---- Concept 2 — the same rows, flattened ----------------------------------

export const Concept2FreshJob: Story = { ...c2.FreshJob, name: "Concept 2 / Fresh job" };
export const Concept2InProgress: Story = { ...c2.InProgress, name: "Concept 2 / In progress" };
export const Concept2FullHistory: Story = { ...c2.FullHistory, name: "Concept 2 / Full history" };
export const Concept2Collapsed: Story = { ...c2.Collapsed, name: "Concept 2 / Collapsed" };
export const Concept2Mobile: Story = { ...c2.Mobile, name: "Concept 2 / Mobile" };

// ---- Concept 3 — one ItemGroup accordion per status -------------------------

export const Concept3FreshJob: Story = { ...c3.FreshJob, name: "Concept 3 / Fresh job" };
export const Concept3InProgress: Story = { ...c3.InProgress, name: "Concept 3 / In progress" };
export const Concept3FullHistory: Story = { ...c3.FullHistory, name: "Concept 3 / Full history" };
export const Concept3Collapsed: Story = { ...c3.Collapsed, name: "Concept 3 / Collapsed" };
export const Concept3Mobile: Story = { ...c3.Mobile, name: "Concept 3 / Mobile" };

// ---- Concept 4 — accordion ListItems ---------------------------------------

export const Concept4FreshJob: Story = { ...c4.FreshJob, name: "Concept 4 / Fresh job" };
export const Concept4InProgress: Story = { ...c4.InProgress, name: "Concept 4 / In progress" };
export const Concept4FullHistory: Story = { ...c4.FullHistory, name: "Concept 4 / Full history" };
export const Concept4Collapsed: Story = { ...c4.Collapsed, name: "Concept 4 / Collapsed" };
export const Concept4Mobile: Story = { ...c4.Mobile, name: "Concept 4 / Mobile" };

// ---- Concept 5 — the chronological break-down ------------------------------

export const Concept5FreshJob: Story = { ...c5.FreshJob, name: "Concept 5 / Fresh job" };
export const Concept5InProgress: Story = { ...c5.InProgress, name: "Concept 5 / In progress" };
export const Concept5FullHistory: Story = { ...c5.FullHistory, name: "Concept 5 / Full history" };
export const Concept5Collapsed: Story = { ...c5.Collapsed, name: "Concept 5 / Truncated" };
export const Concept5Mobile: Story = { ...c5.Mobile, name: "Concept 5 / Mobile" };
