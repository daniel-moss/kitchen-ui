import { Fragment } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import Avatar from "./Avatar";
import { AvatarProps, AvatarSize } from "./Avatar.types";
import { users, initials } from "../../data/users";

const SIZES: AvatarSize[] = ["xxs", "xs", "sm", "md", "lg", "xl"];

/**
 * Avatar — square and circle shapes, with content variants (icon, letters,
 * image, counter), corner addOns (statusDot, icon), and a loading state.
 * Live avatars are their own component (AvatarLive).
 */
const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: { layout: "centered" },
  args: {
    size: "md",
    shape: "square",
    content: "icon",
    addOn: "none",
    icon: "diamonds-4",
    characters: "AB",
    count: 2,
    isLoading: false,
  },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
    shape: { options: ["square", "circle"], control: { type: "inline-radio" } },
    content: {
      options: ["icon", "letters", "image", "counter"],
      control: { type: "select" },
    },
    addOn: { options: ["none", "statusDot", "icon"], control: { type: "inline-radio" } },

    // Content-specific controls: only show the ones relevant to the content.
    icon: { if: { arg: "content", eq: "icon" } },
    iconPack: { if: { arg: "content", eq: "icon" } },
    iconClassName: { if: { arg: "content", eq: "icon" } },
    characters: { if: { arg: "content", eq: "letters" } },
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

// A labeled matrix: content rows × size columns. `skip` blanks out cells that
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

// A labeled row of avatars at one size, each cell tagged with its own label.
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

/** The size scale (16–36 px), both shapes. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Matrix
      base={{ content: "image", imageSrc: users[0].avatar }}
      rows={[
        { label: "square", props: { shape: "square" } },
        { label: "circle", props: { shape: "circle" } },
      ]}
    />
  ),
};

/**
 * Every content variant (at xl), one per row. The circle's icon is locked to
 * the `user` glyph — only the square takes a free icon.
 */
export const Content: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)" }}>
      <CellRow
        label="image"
        cells={[
          { tag: "square", props: { shape: "square", content: "image" } },
          { tag: "circle", props: { shape: "circle", content: "image", imageSrc: users[0].avatar } },
        ]}
      />
      <CellRow
        label="letters"
        cells={[
          { tag: "square", props: { shape: "square", content: "letters", characters: initials(users[2]) } },
          { tag: "circle", props: { shape: "circle", content: "letters", characters: initials(users[3]) } },
        ]}
      />
      <CellRow
        label="icon"
        cells={[
          { tag: "square", props: { shape: "square", content: "icon" } },
          { tag: "circle", props: { shape: "circle", content: "icon" } },
        ]}
      />
      <CellRow
        label="counter"
        cells={[
          { tag: "square", props: { shape: "square", content: "counter" } },
          { tag: "circle", props: { shape: "circle", content: "counter" } },
        ]}
      />
    </div>
  ),
};

/**
 * Letters — one letter on xxs/xs, two from sm up. The rule and the font sizes
 * are the same on both shapes.
 */
export const Letters: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Matrix
      base={{ content: "letters", characters: "AB" }}
      rows={[
        { label: "square", props: { shape: "square" } },
        { label: "circle", props: { shape: "circle" } },
      ]}
    />
  ),
};

/**
 * AddOns (statusDot, icon). The notch is a real hole cut by an SVG mask, so the
 * gap ring shows the surface behind. The statusDot works at every size; the icon
 * addOn is not used on xxs.
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
            { label: "square", props: { shape: "square" } },
            { label: "circle", props: { shape: "circle" } },
          ]}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-3)" }}>
        <span style={labelStyle}>icon</span>
        <Matrix
          base={{ content: "image", addOn: "icon" }}
          rows={[
            { label: "square", props: { shape: "square" }, skip: ["xxs"] },
            { label: "circle", props: { shape: "circle" }, skip: ["xxs"] },
          ]}
        />
      </div>
    </div>
  ),
};

/** States — the loading shape (both shapes, all sizes). */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-3)" }}>
      <span style={labelStyle}>loading</span>
      <Matrix
        base={{ isLoading: true }}
        rows={[
          { label: "square", props: { shape: "square" } },
          { label: "circle", props: { shape: "circle" } },
        ]}
      />
    </div>
  ),
};
