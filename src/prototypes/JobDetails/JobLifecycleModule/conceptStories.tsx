import type { StoryObj } from "@storybook/react";
import { ComponentType, CSSProperties, ReactNode } from "react";

import { FRESH_ROWS, IN_PROGRESS_ROWS, LifecycleRow } from "./lifecycleData";
import { LifecycleConceptProps } from "./shared";

// The five states every concept is shown in. Each concept has its own stories
// file (one sidebar folder per concept) and gets them from here, so the
// concepts are always compared on identical data.
//
// NOT a *.stories.tsx file on purpose — Storybook only picks those up, so this
// helper stays out of the sidebar.

const hours = (h: number) => h * 3600;
const days = (d: number) => d * 86400;

// A concept fills its container, so each story sets the width the design uses:
// 608px on desktop, 343px on mobile.
const frame = (width: number): CSSProperties => ({
  boxSizing: "border-box",
  width,
  margin: "0 auto",
  padding: "var(--size-10) 0",
});
const Frame = ({ width, children }: { width: number; children: ReactNode }) => (
  <div style={frame(width)}>{children}</div>
);

/** Shared meta — every concept's stories file spreads this. */
export const conceptMeta = {
  parameters: { layout: "fullscreen" as const, controls: { disable: true } },
};

type Story = StoryObj;

/**
 * Builds the five stories for one concept.
 *
 * `full` is the concept's own full-history sample: Concepts 1–4 aggregate per
 * status, Concept 5 lists every stretch in time order, so it passes the
 * chronological rows instead.
 *
 * Every story sets `defaultOpen` itself: the product module starts COLLAPSED
 * (Figma 24575-146246), but the four filled states exist to compare the lists,
 * so they open them.
 */
export const conceptStates = (Component: ComponentType<LifecycleConceptProps>, full: LifecycleRow[]) => ({
  /**
   * A fresh job: only "Upcoming" has any time, so it is the only row. This is
   * what the live module shows before the job is driven — the list grows as
   * statuses are entered.
   */
  FreshJob: {
    name: "Fresh job",
    render: () => (
      <Frame width={608}>
        <Component billableSec={0} lifecycleSec={8 * 60} breakdown={FRESH_ROWS} defaultOpen />
      </Frame>
    ),
  } as Story,

  /**
   * Mid-job: scheduled, started, paused for lunch, active again. "Active" has
   * TWO stretches, so the concepts that expand show two sub-rows.
   */
  InProgress: {
    name: "In progress",
    render: () => (
      <Frame width={608}>
        <Component billableSec={hours(3) + 25 * 60} lifecycleSec={days(2) + hours(7)} breakdown={IN_PROGRESS_ROWS} defaultOpen />
      </Frame>
    ),
  } as Story,

  /** The full sample history — every status the design shows. */
  FullHistory: {
    name: "Full history",
    render: () => (
      <Frame width={608}>
        <Component billableSec={hours(3) + 45 * 60} lifecycleSec={days(19)} breakdown={full} defaultOpen />
      </Frame>
    ),
  } as Story,

  /**
   * The list closed: Concepts 1 and 2 collapse the whole "Time in statuses"
   * group, Concepts 3 and 4 close every row, Concept 5 truncates behind
   * "Show N more".
   */
  Collapsed: {
    name: "Collapsed",
    render: () => (
      <Frame width={608}>
        <Component billableSec={hours(3) + 45 * 60} lifecycleSec={days(19)} breakdown={full} defaultOpen={false} />
      </Frame>
    ),
  } as Story,

  /** Mobile: the two highlight boxes stack instead of sitting side by side. */
  Mobile: {
    name: "Mobile",
    render: () => (
      <Frame width={343}>
        <Component billableSec={hours(3) + 45 * 60} lifecycleSec={days(19)} breakdown={full} defaultOpen mobile />
      </Frame>
    ),
  } as Story,
});
