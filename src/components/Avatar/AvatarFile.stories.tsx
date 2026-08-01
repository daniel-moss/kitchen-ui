import { Fragment } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import AvatarFile from "./AvatarFile";
import { AvatarFileType } from "./AvatarFile.types";
import { AvatarSize } from "./Avatar.types";

const SIZES: AvatarSize[] = ["xxs", "xs", "sm", "md", "lg", "xl"];
const TYPES: AvatarFileType[] = [
  "generic",
  "image",
  "imagePlaceholder",
  "gif",
  "audio",
  "video",
  "pdf",
  "word",
  "spreadsheet",
  "presentation",
  "markdown",
  "vector",
  "archive",
];

/**
 * AvatarFile — an Avatar template for file types. Each type is a solid scale-9
 * fill with a scale-1 icon. Always renders in LIGHT mode (even on dark
 * surfaces). No statuses or addOns.
 */
const meta: Meta<typeof AvatarFile> = {
  title: "Components/Avatar/AvatarFile",
  component: AvatarFile,
  parameters: { layout: "centered" },
  args: { size: "md", type: "pdf" },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
    type: { options: TYPES, control: { type: "select" } },
    imageSrc: { if: { arg: "type", eq: "image" } },
  },
};

export default meta;

type Story = StoryObj<typeof AvatarFile>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

export const Playground: Story = {};

/** Every type × size. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
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
      {TYPES.map((type) => (
        <Fragment key={type}>
          <span style={{ ...labelStyle, justifySelf: "start" }}>{type}</span>
          {SIZES.map((size) => (
            <div key={size}>
              <AvatarFile size={size} type={type} />
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  ),
};
