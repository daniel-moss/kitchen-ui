import type { Meta, StoryObj } from "@storybook/react";

import SelectListItemCopy from "./SelectListItemCopy";
import { SelectListItemCopyProps } from "./SelectListItemCopy.types";

type Extra = "none" | "caption" | "tag";

type StoryArgs = {
  label: string;
  extra: Extra;
  extraText: string;
};

const cap: React.CSSProperties = { font: "var(--font-caption-medium-500)", color: "var(--text-subtle)" };
const frame: React.CSSProperties = { width: 273 };

// caption / tag are mutually exclusive.
const extraProps = (extra: Extra, text: string): SelectListItemCopyProps => (extra === "caption" ? { caption: text } : extra === "tag" ? { tag: text } : {});

/**
 * SelectListItemCopy — the text block of a SelectListItem: a label, plus a caption
 * below OR a tag on the right (never both).
 */
const meta: Meta<StoryArgs> = {
  title: "Components/SelectList/SelectListItemCopy",
  component: SelectListItemCopy,
  parameters: { layout: "centered" },
  args: { label: "Option", extra: "none", extraText: "Caption" },
  argTypes: {
    label: { type: "string", control: { type: "text" } },
    extra: { options: ["none", "caption", "tag"], control: { type: "inline-radio" } },
    extraText: { name: "caption / tag text", control: { type: "text" }, if: { arg: "extra", neq: "none" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: ({ label, extra, extraText }) => (
    <div style={frame}>
      <SelectListItemCopy label={label} {...extraProps(extra, extraText)} />
    </div>
  ),
};

/** The copy combinations (Figma's caption × tag matrix). */
export const Combinations: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-4)", ...frame }}>
      <div>
        <span style={cap}>label only</span>
        <SelectListItemCopy label="Option" />
      </div>
      <div>
        <span style={cap}>label + caption</span>
        <SelectListItemCopy label="Option" caption="Caption" />
      </div>
      <div>
        <span style={cap}>label + tag</span>
        <SelectListItemCopy label="Option" tag="Tag" />
      </div>
      <div>
        <span style={cap}>long label truncates (tag stays)</span>
        <SelectListItemCopy label="A very long option name that will not fit on one line" tag="Tag" />
      </div>
    </div>
  ),
};
