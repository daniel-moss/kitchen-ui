import { CSSProperties, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import ItemText from "../components/ItemText/ItemText/ItemText";

import { cap, docsFrame } from "../stories/helpers";
import { TEXT_SEPARATOR, joinWithSeparator } from "../utils/textSeparator";

// Examples for the "Content/Text separator" documentation page, section for
// section with the Figma doc (31379:24831). This is a RULE page, not a
// component page — there is no `component` in the meta and no Props section.
// Every example renders real ItemText rows, because a caption is where the
// separator actually lives.

// Full-width rows stacked --size-20 (80px) apart.
const columnRows: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--size-20)",
  width: "100%",
};
// A tighter stack for rows that belong to one labelled group.
const group: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-6)", width: "100%" };
// The label + its rows.
const labelled: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-3)", width: "100%" };
// A narrow column, to force the caption to wrap.
const narrow: CSSProperties = { width: 180 };

/** A caption label above one example. */
const Labelled = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={labelled}>
    <span style={cap}>{label}</span>
    {children}
  </div>
);

/** The placeholder half of a caption — a value that is missing. */
const Missing = ({ children }: { children: ReactNode }) => (
  <span style={{ color: "var(--text-placeholder)" }}>{children}</span>
);

const meta: Meta = {
  title: "Content/Text separator",
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div style={docsFrame}>{Story()}</div>],
};
export default meta;

type Story = StoryObj;

/** The separator doing its job: two unrelated values on one caption line. */
export const Anatomy: Story = {
  render: () => (
    <ItemText
      variant="titleCaption"
      title="Bayside Grill"
      caption={joinWithSeparator("Restaurant", "Casual dining")}
    />
  ),
};

/** Real object-row pairs, all joined the same way. */
export const Pairs: Story = {
  render: () => (
    <div style={columnRows}>
      <Labelled label="Client — type and industry">
        <ItemText variant="titleCaption" title="Bayside Grill" caption={joinWithSeparator("Restaurant", "Casual dining")} />
      </Labelled>
      <Labelled label="Contact — phone number and email address">
        <ItemText variant="titleCaption" title="Marcus Webb" caption={joinWithSeparator("(415) 555-0142", "marcus@baysidegrill.com")} />
      </Labelled>
      <Labelled label="Equipment — name and manufacturer, then serial and model">
        <ItemText
          variant="titleCaption"
          title={joinWithSeparator("Walk-in cooler", "Trane")}
          caption={joinWithSeparator("Serial: 4182-KD", "Model: WIC-220")}
        />
      </Labelled>
      <Labelled label="Location — name and address on one line">
        <ItemText
          variant="titleCaption"
          title="Bayside Grill"
          caption={joinWithSeparator("Mission District", "2201 Bryant Street, San Francisco, CA 94110")}
        />
      </Labelled>
    </div>
  ),
};

/** A date with its time is ONE value — a comma joins it, or "at". */
export const DateWithTime: Story = {
  render: () => (
    <div style={group}>
      <ItemText variant="titleCaption" title="Status changed" caption="Aug 12, 2026, 9:00 AM" />
      <ItemText variant="titleCaption" title="Created" caption="Mon, Aug 12, 2026 at 9:00 AM" />
    </div>
  ),
};

/** A file name and its extension join with a dot and no spaces. */
export const FileName: Story = {
  render: () => <ItemText variant="titleCaption" title="Service report.pdf" caption="Added on Aug 12, 2026 by Marcus W." />,
};

/** The parts of an address join with commas. */
export const AddressParts: Story = {
  render: () => (
    <ItemText variant="titleCaption" title="2201 Bryant Street, Suite 4, San Francisco, CA 94110" caption="Mission District" />
  ),
};

/** A range is directional, so it takes an arrow. */
export const Range: Story = {
  render: () => <ItemText variant="titleCaption" title="Compressor parts" caption="Jan 1, 2026 → Jan 1, 2027" />,
};

/** A caption that reads as a sentence needs no separator. */
export const SentenceCaption: Story = {
  render: () => <ItemText variant="titleCaption" title="EST-1042" caption="Jobbed on Jan 1, 2026 by Lorne R." />,
};

/** The same three values, joined wrongly — the separator splits one value in two. */
export const IncorrectUsage: Story = {
  render: () => (
    <div style={group}>
      <ItemText variant="titleCaption" title="Date" caption={joinWithSeparator("Jan 1", "2026")} />
      <ItemText variant="titleCaption" title="Date and time" caption={joinWithSeparator("Jan 1, 2026", "9:00 AM")} />
      <ItemText variant="titleCaption" title="Range" caption={joinWithSeparator("Jan 1, 2026", "Jan 1, 2027")} />
    </div>
  ),
};

/**
 * A missing value either drops out of the line entirely (`joinWithSeparator`)
 * or keeps its slot as a placeholder — never both.
 */
export const MissingValues: Story = {
  render: () => (
    <div style={columnRows}>
      <Labelled label="Both values present">
        <ItemText variant="titleCaption" title="Bayside Grill" caption={joinWithSeparator("Restaurant", "Casual dining")} />
      </Labelled>
      <Labelled label="Dropped">
        <ItemText variant="titleCaption" title="Bayside Grill" caption={joinWithSeparator("Restaurant", null)} />
      </Labelled>
      <Labelled label="Placeholder">
        <ItemText
          variant="titleCaption"
          title="Bayside Grill"
          caption={
            <>
              Restaurant{TEXT_SEPARATOR}
              <Missing>No Industry</Missing>
            </>
          }
        />
      </Labelled>
    </div>
  ),
};

/** The no-break space keeps the dot glued to the value before it when a caption wraps. */
export const Wrapping: Story = {
  render: () => (
    <div style={narrow}>
      <ItemText
        variant="titleCaption"
        title="Marcus Webb"
        caption={joinWithSeparator("(415) 555-0142", "marcus@baysidegrill.com")}
        captionLines={2}
      />
    </div>
  ),
};
