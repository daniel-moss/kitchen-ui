import { ReactNode } from "react";

import Toaster from "../../../components/Toast/Toaster";
import { chargesOf, discountsOf, jobById } from "../../../data/db";
import type { Charge, ChargeGroup, Job } from "../../../data/db";
import { PhoneViewport } from "../../../stories/helpers";

// Shared by every "Charges" concept, so the concepts are always compared on
// the same job and the same frame. NOT a *.stories.tsx file on purpose —
// Storybook only picks those up, so this helper stays out of the sidebar.

/** The job the Job Details page opens on (an active job with charges). */
export const JOB: Job = jobById("JOB-1201")!;

/** That job's charges. */
export const JOB_CHARGES: ChargeGroup[] = chargesOf(JOB);

/** That job's discount lines — only Concept 2 reads them (see `discountsOf`). */
export const JOB_DISCOUNTS: Charge[] = discountsOf(JOB);

/** Shared meta — every concept's stories file spreads this. */
export const conceptMeta = {
  parameters: { layout: "fullscreen" as const, controls: { disable: true } },
};

// The app surface, with the module at the width it has in the Job Details
// content column: 608px on desktop, 343px on mobile (a 375px screen). It scrolls
// by itself: PhoneViewport is one screen tall and clips what overflows, so open
// lines would otherwise run off the bottom with no way to reach them.
export const Frame = ({ mobile = false, children }: { mobile?: boolean; children: ReactNode }) => (
  <PhoneViewport>
    <div
      style={{
        boxSizing: "border-box",
        height: "100%",
        overflowY: "auto",
        maxWidth: mobile ? 375 : undefined,
        padding: "var(--size-4)",
        background: "var(--surface-level-first)",
      }}
    >
      <div style={{ maxWidth: 608, margin: "0 auto" }}>{children}</div>
    </div>
    <Toaster breakpoint={mobile ? "mobile" : "desktop"} />
  </PhoneViewport>
);
