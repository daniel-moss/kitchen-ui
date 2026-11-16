import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import type { JobChargeLines } from "../../../app/store/AppStore";
import { conceptMeta, Frame, JOB } from "../ChargesModule/conceptStories";

import ChargesSegment, { useJobChargeLines } from "./ChargesSegment";

// The CURRENT line-item modules — the ones Job Details renders (Summary →
// Charges, Figma 29380-42876). The "Concept 1–4" folders next to this one are
// the frozen copies from the user test; this folder is what the real page
// uses, line-item modules only (the Profitability module has its own stories).
// Every story is the demo job (JOB-1201) with its own lines.
const meta: Meta = {
  title: "Modules/Job/Details/Modules/Line-items/Current",
  ...conceptMeta,
};

export default meta;
type Story = StoryObj;

const EMPTY: JobChargeLines = { labor: [], products: [], other: [], discounts: [] };

/**
 * The segment with lines kept locally, so a story starts fresh on every load.
 * No line is locked unless `locked` — the stories do not follow the database's
 * locks (`editingLocksOf`), so each one shows exactly its own case.
 */
function Segment({ mobile = false, readOnly = false, empty = false, locked = false }: { mobile?: boolean; readOnly?: boolean; empty?: boolean; locked?: boolean }) {
  const seed = useJobChargeLines(JOB);
  const [lines, setLines] = useState<JobChargeLines>(empty ? EMPTY : seed);
  // Two people editing at once, in two modules (users 2 and 3 — never the viewer).
  const editingLocks: Record<string, number> = {};
  if (locked && lines.labor[0] != null) editingLocks[lines.labor[0].id] = 2;
  if (locked && lines.products[0] != null) editingLocks[lines.products[0].id] = 3;
  return (
    <Frame mobile={mobile}>
      {/* Line-item modules only — Profitability has its own stories (Daniel, 2026-11-16). */}
      <ChargesSegment job={JOB} mobile={mobile} readOnly={readOnly} lines={lines} onLinesChange={setLines} editingLocks={editingLocks} showProfitability={false} />
    </Frame>
  );
}

/** The demo job's lines. Open a row for its Edit button; the ⋯ holds Edit, View pricebook item and Delete. */
export const Desktop: Story = { render: () => <Segment /> };

/** The same at the mobile width: the menu, lists and forms are drawers. */
export const Mobile: Story = { render: () => <Segment mobile /> };

/**
 * Other people are editing the first labor rate line and the first product
 * (Figma "Shared Behavior" → "Locked Editing", 29733-56399 — the same in every
 * module). The editor's live avatar sits before the ⋯ — hover it for "Thiago
 * C. is editing...". The open row has no Edit, and the menu has only "View
 * pricebook item".
 */
export const EditingLocked: Story = { name: "Editing locked", render: () => <Segment locked /> };

/** The locked lines at the mobile width. */
export const EditingLockedMobile: Story = { name: "Editing locked / Mobile", render: () => <Segment mobile locked /> };

/** A finalized or cancelled job: no plus, no re-order, no Edit, and the menu has only "View pricebook item". */
export const ReadOnly: Story = { name: "Read-only", render: () => <Segment readOnly /> };

/** No lines yet: every module shows its empty state and a "$0.00" total. */
export const Empty: Story = { render: () => <Segment empty /> };
