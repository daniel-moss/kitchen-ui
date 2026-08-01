import { Fragment } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import AvatarClient from "./AvatarClient";
import { AvatarClientProps } from "./AvatarClient.types";
import { AvatarSize } from "./Avatar.types";

const SIZES: AvatarSize[] = ["xxs", "xs", "sm", "md", "lg", "xl"];

/**
 * AvatarClient — an Avatar template: the icon depends on the client type
 * (generic / business / individual). Business and individual also support an
 * image (logo) and a status addOn (active / inactive); generic is icon-only,
 * no addOns.
 */
const meta: Meta<typeof AvatarClient> = {
  title: "Components/Avatar/AvatarClient",
  component: AvatarClient,
  parameters: { layout: "centered" },
  args: { size: "md", type: "business", content: "icon", status: "none" },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
    type: { options: ["generic", "business", "individual"], control: { type: "inline-radio" } },
    // generic is icon-only with no addOns.
    content: {
      options: ["icon", "image"],
      control: { type: "inline-radio" },
      if: { arg: "type", neq: "generic" },
    },
    status: {
      options: ["none", "active", "inactive"],
      control: { type: "inline-radio" },
      if: { arg: "type", neq: "generic" },
    },
    imageSrc: { if: { arg: "content", eq: "image" } },
  },
};

export default meta;

type Story = StoryObj<typeof AvatarClient>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

type Row = { label: string; props: Partial<AvatarClientProps>; skip?: AvatarSize[] };

function Grid({ rows }: { rows: Row[] }) {
  return (
    <div
      style={{
        display: "inline-grid",
        gridTemplateColumns: `auto repeat(${SIZES.length}, 44px)`,
        gap: "var(--size-3)",
        alignItems: "center",
        justifyItems: "center",
      }}
    >
      <span />
      {SIZES.map((s) => (
        <span key={s} style={labelStyle}>
          {s}
        </span>
      ))}
      {rows.map((row) => (
        <Fragment key={row.label}>
          <span style={{ ...labelStyle, justifySelf: "start" }}>{row.label}</span>
          {SIZES.map((size) => (
            <div key={size}>
              {row.skip?.includes(size) ? null : <AvatarClient size={size} {...row.props} />}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

export const Playground: Story = {};

/** The three client types (icon content), across all sizes. */
export const Types: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid
      rows={[
        { label: "generic", props: { type: "generic" } },
        { label: "business", props: { type: "business" } },
        { label: "individual", props: { type: "individual" } },
      ]}
    />
  ),
};

/** Status addOns (active/inactive) for business and individual. xxs has none. */
export const Status: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid
      rows={[
        { label: "business active", props: { type: "business", status: "active" }, skip: ["xxs"] },
        { label: "business inactive", props: { type: "business", status: "inactive" }, skip: ["xxs"] },
        { label: "individual active", props: { type: "individual", status: "active" }, skip: ["xxs"] },
        { label: "individual inactive", props: { type: "individual", status: "inactive" }, skip: ["xxs"] },
      ]}
    />
  ),
};

/** Image (logo) content for business and individual, across all sizes. */
export const Image: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid
      rows={[
        { label: "business", props: { type: "business", content: "image" } },
        { label: "individual", props: { type: "individual", content: "image" } },
      ]}
    />
  ),
};
