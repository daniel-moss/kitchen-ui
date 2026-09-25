import { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import ItemText from "../components/ItemText/ItemText/ItemText";
import ValueDisplay from "../components/ValueDisplay/ValueDisplay";

import SourceAvatar, { SOURCE_LOGOS } from "./sources";
import { cap, docsFrame } from "../stories/helpers";

// Examples for the "Content/Source avatars" documentation page.

const columnRows: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-20)", width: "100%" };
const gallery: CSSProperties = { display: "flex", flexWrap: "wrap", gap: "var(--size-8)" };
const tile: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-2)" };
const sizeRow: CSSProperties = { display: "flex", alignItems: "center", gap: "var(--size-6)" };
const withText: CSSProperties = { display: "flex", alignItems: "center", gap: "var(--size-3)", width: "100%" };

const IDS = Object.keys(SOURCE_LOGOS);

const meta: Meta = {
  title: "Content/Source avatars",
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div style={docsFrame}>{Story()}</div>],
};
export default meta;

type Story = StoryObj;

/** Every source, at xl. */
export const Gallery: Story = {
  render: () => (
    <div style={gallery}>
      {IDS.map((id) => (
        <div key={id} style={tile}>
          <SourceAvatar source={id} size="xl" showTooltip={false} />
          <span style={cap}>{SOURCE_LOGOS[id].name}</span>
        </div>
      ))}
    </div>
  ),
};

/** The artwork follows the theme — switch the theme in the toolbar to see it. */
export const Themes: Story = {
  render: () => (
    <div style={columnRows}>
      {IDS.map((id) => (
        <div key={id} style={withText}>
          <SourceAvatar source={id} size="xl" showTooltip={false} />
          <ItemText
            variant="titleCaption"
            title={SOURCE_LOGOS[id].name}
            caption={SOURCE_LOGOS[id].dark == null ? "One artwork, both themes" : "Separate light and dark artwork"}
          />
        </div>
      ))}
    </div>
  ),
};

/** The same logo at every avatar size. */
export const Sizes: Story = {
  render: () => (
    <div style={sizeRow}>
      {(["xxs", "xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} style={tile}>
          <SourceAvatar source="service-channel" size={size} showTooltip={false} />
          <span style={cap}>{size}</span>
        </div>
      ))}
    </div>
  ),
};

/** Hovering the avatar names the source. */
export const Tooltip: Story = {
  render: () => (
    <div style={sizeRow}>
      {IDS.map((id) => (
        <SourceAvatar key={id} source={id} size="xl" />
      ))}
    </div>
  ),
};

/** Where it is used — the job's "Source" field. */
export const InAField: Story = {
  render: () => (
    <div style={columnRows}>
      <ValueDisplay label="Source" value="ServiceChannel" slotLeft={<SourceAvatar source="service-channel" size="xs" />} />
      <ValueDisplay label="Source" value="Corrigo" slotLeft={<SourceAvatar source="corrigo" size="xs" />} />
    </div>
  ),
};
