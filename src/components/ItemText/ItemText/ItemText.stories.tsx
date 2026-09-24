import { CSSProperties, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import ItemText from "./ItemText";
import ItemTextBlock from "./ItemTextBlock";
import ItemTextLine from "./ItemTextLine";
import { ItemTextProps } from "./ItemText.types";

import AvatarUser from "../../Avatar/AvatarUser";
import Badge from "../../Badge/Badge";
import BadgeColor from "../../Badge/BadgeColor";
import Counter from "../../Counter/Counter";
import HintTrigger from "../../Hint/HintTrigger";
import { Icon } from "../../Icon/Icon";

import { cap, docsFrame } from "../../../stories/helpers";

// The examples live in a fixed-width box so truncation and the left/right
// priority are visible — a row component would provide the width in real use.
const box: CSSProperties = { width: 360, margin: "0 auto" };
const narrow: CSSProperties = { width: 260, margin: "0 auto" };
const full: CSSProperties = { width: "100%" };
const column: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-6)" };

// Line examples spread across the preview: each hugs its own content and the
// space between them is distributed — Figma's "auto" gap.
const rowAuto: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" };
// Blocks sharing the width equally, --size-20 (80px) apart.
const rowFill: CSSProperties = { display: "flex", alignItems: "center", gap: "var(--size-20)", width: "100%" };
const fillItem: CSSProperties = { flex: "1 1 0", minWidth: 0 };
// Stacked examples, centered on the preview, --size-20 (80px) apart.
const columnCenter: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-20)" };
// Examples side by side, --size-20 (80px) apart, centered on the preview.
const rowCenter: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--size-20)" };

// ItemTextLine fills its container by default. A shrink-to-fit wrapper makes it
// hug its own content instead, which is what the line examples show.
const Hug = ({ children }: { children: ReactNode }) => <span style={{ display: "inline-flex" }}>{children}</span>;

// The stand-in glyph every slot example uses.
const icon = <Icon icon="diamonds-4" size={14} />;
const avatar = <AvatarUser size="xs" />;

const Example = ({ label, width = 360, children }: { label?: string; width?: number; children: ReactNode }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-1_5)" }}>
    {label != null && <span style={cap}>{label}</span>}
    <div style={{ width }}>{children}</div>
  </div>
);

const COLORS = ["strong", "subtle", "placeholder", "warning", "error"];
const LINES = [1, 2, 3, "wrap"];

const node = (description: string) => ({
  description,
  control: false as const,
  table: { type: { summary: "ReactNode" } },
});
const color = (description: string, def: string) => ({
  description,
  options: COLORS,
  control: { type: "select" as const },
  table: { type: { summary: COLORS.join(" | ") }, defaultValue: { summary: def } },
});
const lines = (description: string) => ({
  description,
  options: LINES,
  control: { type: "select" as const },
  table: { type: { summary: "1 | 2 | 3 | \"wrap\"" }, defaultValue: { summary: "1" } },
});
const cls = (line: string) => ({
  description: `Extra class on the ${line} line (escape hatch — prefer \`${line}Color\`).`,
  control: false as const,
  table: { type: { summary: "string" } },
});

// `ItemTextProps` inherits most of its props through `Omit<ItemTextBlockProps,
// …>`, which react-docgen does not follow — so the table is declared by hand
// here, like ListItem's. Keep it in step with the JSDoc in the `.types.ts`.
const meta: Meta<ItemTextProps> = {
  title: "Components/ItemText/ItemText",
  component: ItemText,
  subcomponents: { ItemTextBlock, ItemTextLine },
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div style={docsFrame}>{Story()}</div>],
  argTypes: {
    variant: {
      description: "Which lines the left block holds, and in which order.",
      options: ["title", "titleCaption", "captionTitle", "tag"],
      control: { type: "select" },
      table: { type: { summary: "title | titleCaption | captionTitle | tag" }, defaultValue: { summary: "title" } },
    },
    title: { description: "Title text. Preset: `bodyMedium` / `strong`.", control: { type: "text" }, table: { type: { summary: "ReactNode" } } },
    caption: { description: "Caption text. Preset: `caption` / `subtle`.", control: { type: "text" }, table: { type: { summary: "ReactNode" } } },
    tag: { description: "Tag text — the `tag` variant's single line. Preset: `bodyRegular` / `subtle`.", control: { type: "text" }, table: { type: { summary: "ReactNode" } } },

    titleColor: color("Overrides the title's preset color, e.g. \"error\" for an overdue value.", "strong"),
    captionColor: color("Overrides the caption's preset color, e.g. \"warning\" or \"placeholder\".", "subtle"),
    tagColor: color("Overrides the tag's preset color.", "subtle"),

    titleSlotLeft: node("Icon before the title."),
    titleSlotRight: node("Badge / Counter / HintTrigger / Icon after the title. A Badge is 28px tall, so it is title-only."),
    captionSlotLeft: node("Icon before the caption."),
    captionSlotRight: node("Slot after the caption."),
    tagSlotLeft: node("Icon before the tag."),
    tagSlotRight: node("Slot after the tag."),

    titleLines: lines("Title truncation rule."),
    captionLines: lines("Caption truncation rule."),
    tagLines: lines("Tag truncation rule."),

    isLoading: {
      description: "Every line the variant renders shows a bar instead of its text. Set it on the block, not on the lines, so a block can never end up half loaded.",
      control: { type: "boolean" },
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },

    titleClassName: cls("title"),
    captionClassName: cls("caption"),
    tagClassName: cls("tag"),

    right: node("Right block — an `ItemTextBlock` with `align=\"right\"`. Hugs its content and never truncates."),
    className: { description: "Extra class on the row.", control: false, table: { type: { summary: "string" } } },
  },
};
export default meta;

type Story = StoryObj<ItemTextProps>;

export const Playground: Story = {
  args: {
    variant: "titleCaption",
    title: "Title",
    caption: "Caption",
  },
  render: (args) => (
    <div style={box}>
      <ItemText {...args} />
    </div>
  ),
};

export const Overview: Story = {
  render: () => (
    <div style={box}>
      <ItemText
        variant="titleCaption"
        title="Title"
        caption="Caption"
        right={<ItemTextBlock align="right" variant="titleCaption" title="Title" caption="Caption" />}
      />
    </div>
  ),
};

// ---- Anatomy ----------------------------------------------------------------

// Every part at once: both blocks two-line, and every line carrying a slot on
// each side.
export const Anatomy: Story = {
  render: () => (
    <div style={box}>
      <ItemText
        variant="titleCaption"
        title="Title"
        titleSlotLeft={icon}
        titleSlotRight={icon}
        caption="Caption"
        captionSlotLeft={icon}
        captionSlotRight={icon}
        right={
          <ItemTextBlock
            align="right"
            variant="titleCaption"
            title="Title"
            titleSlotLeft={icon}
            titleSlotRight={icon}
            caption="Caption"
            captionSlotLeft={icon}
            captionSlotRight={icon}
          />
        }
      />
    </div>
  ),
};

// ---- Text blocks ------------------------------------------------------------

// The four layouts side by side, each sharing the width. They name themselves,
// so they need no captions.
export const BlockVariants: Story = {
  render: () => (
    <div style={rowFill}>
      <div style={fillItem}>
        <ItemTextBlock variant="title" title="Title" />
      </div>
      <div style={fillItem}>
        <ItemTextBlock variant="titleCaption" title="Title" caption="Caption" />
      </div>
      <div style={fillItem}>
        <ItemTextBlock variant="captionTitle" title="Title" caption="Caption" />
      </div>
      <div style={fillItem}>
        <ItemTextBlock variant="tag" tag="Tag" />
      </div>
    </div>
  ),
};

export const TextPriority: Story = {
  render: () => (
    <div style={full}>
      <ItemText
        variant="title"
        title="Very long title which does not fit the width and needs to be truncated"
        right={<ItemTextBlock align="right" variant="tag" tag="Tag does not truncate" />}
      />
    </div>
  ),
};

// One ItemText showing both sides at once: the left block fills and aligns
// left, the right one hugs and aligns right.
export const Alignment: Story = {
  render: () => (
    <div style={full}>
      <ItemText
        variant="titleCaption"
        title="Title"
        caption="Caption"
        right={<ItemTextBlock align="right" variant="titleCaption" title="Title" caption="Caption" />}
      />
    </div>
  ),
};

// ---- Text lines -------------------------------------------------------------

export const LineStyles: Story = {
  render: () => (
    <div style={rowAuto}>
      <Hug>
        <ItemTextLine textStyle="bodyMedium" label="bodyMedium" />
      </Hug>
      <Hug>
        <ItemTextLine textStyle="bodyRegular" label="bodyRegular" />
      </Hug>
      <Hug>
        <ItemTextLine textStyle="caption" label="caption" />
      </Hug>
    </div>
  ),
};

export const LineColors: Story = {
  render: () => (
    <div style={rowAuto}>
      {(["strong", "subtle", "placeholder", "warning", "error"] as const).map((color) => (
        <Hug key={color}>
          <ItemTextLine textStyle="caption" color={color} label={color} slotLeft={icon} />
        </Hug>
      ))}
    </div>
  ),
};

// ---- Slots ------------------------------------------------------------------

export const SlotPositions: Story = {
  render: () => (
    <div style={rowAuto}>
      <Hug>
        <ItemTextLine label="Slot left" slotLeft={icon} />
      </Hug>
      <Hug>
        <ItemTextLine label="Slot right" slotRight={icon} />
      </Hug>
      <Hug>
        <ItemTextLine label="Both slots" slotLeft={icon} slotRight={icon} />
      </Hug>
    </div>
  ),
};

// The left slot takes an Avatar or an Icon.
export const SlotLeftInstances: Story = {
  render: () => (
    <div style={rowCenter}>
      <Hug>
        <ItemTextLine label="Avatar" slotLeft={avatar} />
      </Hug>
      <Hug>
        <ItemTextLine label="Icon" slotLeft={icon} />
      </Hug>
    </div>
  ),
};

// The right slot's instances, in the order the doc lists them. Each line hugs
// its content so the stack centers — a line fills its container otherwise, and
// there would be nothing to center.
export const SlotRightInstances: Story = {
  render: () => (
    <div style={columnCenter}>
      <Hug>
        <ItemTextLine label="Avatar" slotRight={avatar} />
      </Hug>
      <Hug>
        <ItemTextLine label="Badge" slotRight={<Badge>Badge</Badge>} />
      </Hug>
      <Hug>
        <ItemTextLine label="BadgeColor" slotRight={<BadgeColor colorScheme="jade">Badge</BadgeColor>} />
      </Hug>
      <Hug>
        <ItemTextLine label="Counter" slotRight={<Counter value={0} />} />
      </Hug>
      <Hug>
        <ItemTextLine label="HintTrigger" slotRight={<HintTrigger />} />
      </Hug>
      <Hug>
        <ItemTextLine label="Icon" slotRight={icon} />
      </Hug>
    </div>
  ),
};

export const IconColor: Story = {
  render: () => (
    <div style={rowAuto}>
      <Hug>
        <ItemTextLine color="strong" label="Strong" slotLeft={icon} />
      </Hug>
      <Hug>
        <ItemTextLine color="warning" label="Warning" slotLeft={icon} />
      </Hug>
      <Hug>
        <ItemTextLine color="strong" label="Overridden" slotLeft={<Icon icon="diamonds-4" size={14} style={{ color: "var(--text-error)" }} />} />
      </Hug>
    </div>
  ),
};

export const BadgeRule: Story = {
  render: () => (
    <div style={columnCenter}>
      <ItemTextBlock variant="title" title="Badge with title only" titleSlotRight={<Badge>Badge</Badge>} />
      <ItemTextBlock variant="titleCaption" title="Not used with caption" titleSlotRight={<Badge>Badge</Badge>} caption="Caption" />
    </div>
  ),
};

// ---- Truncation and wrapping -------------------------------------------------

export const Truncation: Story = {
  render: () => (
    <div style={narrow}>
      <ItemTextLine label="Very long line that does not fit 1 line and needs to be truncated" />
    </div>
  ),
};

export const Wrapping: Story = {
  render: () => (
    <div style={narrow}>
      <ItemTextBlock
        variant="titleCaption"
        title="Wrapping"
        caption="Very long caption that does not fit one line and needs to be wrapped"
        captionLines="wrap"
      />
    </div>
  ),
};

export const SlotHug: Story = {
  render: () => (
    <div style={narrow}>
      <ItemTextLine label="Hugs the content, then truncates" slotRight={<Counter value={0} />} />
    </div>
  ),
};

// ---- Loading -----------------------------------------------------------------

export const Loading: Story = {
  render: () => (
    <div style={box}>
      <ItemText variant="titleCaption" title="Title" caption="Caption" isLoading />
    </div>
  ),
};

export const LoadingPerVariant: Story = {
  render: () => (
    <div style={column}>
      <Example label="title — one bar">
        <ItemTextBlock variant="title" title="Title" isLoading />
      </Example>
      <Example label="titleCaption — two bars">
        <ItemTextBlock variant="titleCaption" title="Title" caption="Caption" isLoading />
      </Example>
    </div>
  ),
};

export const LoadingRightBlock: Story = {
  render: () => (
    <div style={box}>
      <ItemText
        variant="titleCaption"
        title="Title"
        caption="Caption"
        isLoading
        right={<ItemTextBlock align="right" variant="tag" tag="Tag" isLoading />}
      />
    </div>
  ),
};
