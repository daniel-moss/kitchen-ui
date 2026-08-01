import { Fragment } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import Avatar from "./Avatar";
import { AvatarProps, AvatarSize } from "./Avatar.types";
import { users, initials } from "../../data/users";

const SIZES: AvatarSize[] = ["xxs", "xs", "sm", "md", "lg", "xl"];
const RING_COLORS = [
  "crimson",
  "pink",
  "plum",
  "violet",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "orange",
  "amber",
] as const;

/**
 * Avatar — object (square) and user (circle) shapes, with content variants
 * (icon, letters, image, counter, placeholder), corner addOns (statusDot, icon),
 * and a loading state. Stories are grouped by shape.
 */
const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: { layout: "centered" },
  args: {
    size: "md",
    type: "object",
    content: "icon",
    addOn: "none",
    icon: "diamonds-4",
    letter: "AB",
    count: 2,
    isLoading: false,
  },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
    type: { options: ["object", "user", "live"], control: { type: "inline-radio" } },
    ringColor: {
      options: RING_COLORS,
      control: { type: "select" },
      if: { arg: "type", eq: "live" },
    },
    // Live has no loading state.
    isLoading: { if: { arg: "type", neq: "live" } },
    content: {
      options: ["icon", "letters", "image", "counter", "placeholder"],
      control: { type: "select" },
    },
    // live supports no addOns. (Storybook `if` allows only one condition;
    // counter/placeholder also ignore addOns, but the component enforces that.)
    addOn: {
      options: ["none", "statusDot", "icon"],
      control: { type: "inline-radio" },
      if: { arg: "type", neq: "live" },
    },

    // Content-specific controls: only show the ones relevant to the content.
    icon: { if: { arg: "content", eq: "icon" } },
    iconPack: { if: { arg: "content", eq: "icon" } },
    iconClassName: { if: { arg: "content", eq: "icon" } },
    letter: { if: { arg: "content", eq: "letters" } },
    imageSrc: { if: { arg: "content", eq: "image" } },
    imageAlt: { if: { arg: "content", eq: "image" } },
    count: { control: { type: "number" }, if: { arg: "content", eq: "counter" } },

    // AddOn-specific controls: only show when the icon addOn is selected.
    addOnIcon: { if: { arg: "addOn", eq: "icon" } },
    addOnIconPack: { if: { arg: "addOn", eq: "icon" } },
  },
};

export default meta;

type Story = StoryObj<typeof Avatar>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

// A labelled matrix: content rows × size columns. `skip` blanks out cells that
// are not valid for a row (e.g. counter on xxs), keeping the columns aligned.
type MatrixRow = { label: string; props: Partial<AvatarProps>; skip?: AvatarSize[] };

function Matrix({ base, rows }: { base: Partial<AvatarProps>; rows: MatrixRow[] }) {
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
          {SIZES.map((s) => (
            <div key={s}>
              {row.skip?.includes(s) ? null : (
                <Avatar {...(base as AvatarProps)} {...row.props} size={s} />
              )}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

// A labelled row of avatars at one size, each cell tagged with its own label.
function CellRow({
  label,
  cells,
}: {
  label: string;
  cells: { tag: string; props: Partial<AvatarProps> }[];
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--size-4)" }}>
      <span style={{ ...labelStyle, width: 56 }}>{label}</span>
      {cells.map((cell) => (
        <div
          key={cell.tag}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-2)" }}
        >
          <Avatar {...(cell.props as AvatarProps)} size="xl" />
          <span style={labelStyle}>{cell.tag}</span>
        </div>
      ))}
    </div>
  );
}

/** Interactive — all controls. */
export const Playground: Story = {};

/** The size scale (16–36 px). live is md/lg/xl only. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Matrix
      base={{ content: "image", imageSrc: users[0].avatar }}
      rows={[
        { label: "object", props: { type: "object" } },
        { label: "user", props: { type: "user" } },
        { label: "live", props: { type: "live" }, skip: ["xxs", "xs", "sm"] },
      ]}
    />
  ),
};

/** Every content variant (at xl), one per row, object and user side by side. */
export const Content: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)" }}>
      <CellRow
        label="image"
        cells={[
          { tag: "object", props: { type: "object", content: "image" } },
          { tag: "user", props: { type: "user", content: "image", imageSrc: users[0].avatar } },
          { tag: "live", props: { type: "live", content: "image", imageSrc: users[1].avatar } },
        ]}
      />
      <CellRow
        label="letters"
        cells={[
          { tag: "object", props: { type: "object", content: "letters", letter: initials(users[2]) } },
          { tag: "user", props: { type: "user", content: "letters", letter: initials(users[3]) } },
          { tag: "live", props: { type: "live", content: "letters", letter: initials(users[4]) } },
        ]}
      />
      <CellRow
        label="icon"
        cells={[
          { tag: "object", props: { type: "object", content: "icon" } },
          { tag: "user", props: { type: "user", content: "icon" } },
        ]}
      />
      <CellRow
        label="counter"
        cells={[
          { tag: "object", props: { type: "object", content: "counter" } },
          { tag: "user", props: { type: "user", content: "counter" } },
        ]}
      />
      <CellRow
        label="placeholder"
        cells={[{ tag: "user", props: { type: "user", content: "placeholder" } }]}
      />
    </div>
  ),
};

/**
 * Live — circle with a collaboration ring (image content, xl). The ring color
 * can only be a `--live-collaboration-*` token; all ten are shown.
 */
export const Live: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--size-4)", maxWidth: 360 }}>
      {RING_COLORS.map((c, i) => (
        <div
          key={c}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-2)" }}
        >
          <Avatar type="live" content="image" size="xl" ringColor={c} imageSrc={users[i].avatar} />
          <span style={labelStyle}>{c}</span>
        </div>
      ))}
    </div>
  ),
};

/**
 * AddOns (statusDot, icon) for both shapes, xs–xl. The notch is a real hole cut
 * by an SVG mask, so the gap ring shows the surface behind. Not on xxs.
 */
export const AddOns: Story = {
  name: "Add-ons",
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-3)" }}>
        <span style={labelStyle}>statusDot</span>
        <Matrix
          base={{ content: "image", addOn: "statusDot" }}
          rows={[
            { label: "object", props: { type: "object" }, skip: ["xxs"] },
            { label: "user", props: { type: "user" }, skip: ["xxs"] },
          ]}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-3)" }}>
        <span style={labelStyle}>icon</span>
        <Matrix
          base={{ content: "image", addOn: "icon" }}
          rows={[
            { label: "object", props: { type: "object" }, skip: ["xxs"] },
            { label: "user", props: { type: "user" }, skip: ["xxs"] },
          ]}
        />
      </div>
    </div>
  ),
};

/** States — the loading skeleton (both shapes, all sizes). */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-3)" }}>
      <span style={labelStyle}>loading</span>
      <Matrix
        base={{ isLoading: true }}
        rows={[
          { label: "object", props: { type: "object" } },
          { label: "user", props: { type: "user" } },
        ]}
      />
    </div>
  ),
};
