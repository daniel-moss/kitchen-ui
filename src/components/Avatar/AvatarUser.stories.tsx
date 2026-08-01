import { Fragment } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import AvatarUser from "./AvatarUser";
import { AvatarUserContent } from "./AvatarUser.types";
import { AvatarSize } from "./Avatar.types";

const SIZES: AvatarSize[] = ["xxs", "xs", "sm", "md", "lg", "xl"];
const CONTENT: AvatarUserContent[] = ["image", "letters", "icon", "counter", "placeholder"];

/**
 * AvatarUser — an Avatar template: a user (circle) avatar. Content mirrors
 * Avatar `type=user`; a primary user gets a crown icon addOn (image/icon/letters
 * only).
 */
const meta: Meta<typeof AvatarUser> = {
  title: "Components/Avatar/AvatarUser",
  component: AvatarUser,
  parameters: { layout: "centered" },
  args: { size: "md", content: "image", letter: "AB", count: 2, isPrimary: false },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
    content: { options: CONTENT, control: { type: "select" } },
    letter: { if: { arg: "content", eq: "letters" } },
    imageSrc: { if: { arg: "content", eq: "image" } },
    count: { control: { type: "number" }, if: { arg: "content", eq: "counter" } },
  },
};

export default meta;

type Story = StoryObj<typeof AvatarUser>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

export const Playground: Story = {};

/** Every content variant across sizes. counter skips xxs. */
export const Content: Story = {
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
      {CONTENT.map((content) => (
        <Fragment key={content}>
          <span style={{ ...labelStyle, justifySelf: "start" }}>{content}</span>
          {SIZES.map((size) => (
            <div key={size}>
              {content === "counter" && size === "xxs" ? null : (
                <AvatarUser size={size} content={content} />
              )}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  ),
};

/** isPrimary (crown addOn) for image/icon/letters, xs–xl. */
export const Primary: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const sizes = SIZES.filter((s) => s !== "xxs");
    const contents: AvatarUserContent[] = ["image", "letters", "icon"];
    return (
      <div
        style={{
          display: "inline-grid",
          gridTemplateColumns: `auto repeat(${sizes.length}, 44px)`,
          gap: "var(--size-3)",
          alignItems: "center",
          justifyItems: "center",
        }}
      >
        <span />
        {sizes.map((s) => (
          <span key={s} style={labelStyle}>
            {s}
          </span>
        ))}
        {contents.map((content) => (
          <Fragment key={content}>
            <span style={{ ...labelStyle, justifySelf: "start" }}>{content}</span>
            {sizes.map((size) => (
              <div key={size}>
                <AvatarUser size={size} content={content} isPrimary />
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    );
  },
};
