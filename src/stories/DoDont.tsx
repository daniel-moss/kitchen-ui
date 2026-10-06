import { ReactNode } from "react";

import { Icon } from "../components/Icon/Icon";

interface DoDontItemProps {
  /** Short copy on the coloured bar — what this example gets right or wrong. */
  caption: string;
  /**
   * Tinted body (`--gray-5`), for an example whose content is itself a
   * surface — a device frame, a card — and would disappear on the plain one.
   */
  tinted?: boolean;
  children: ReactNode;
}

const Item = ({ variant, caption, tinted = false, children }: DoDontItemProps & { variant: "do" | "dont" }) => (
  <div className="docs-dodont-item" data-variant={variant}>
    <p className="docs-dodont-caption">
      <span className="docs-dodont-icon">
        <Icon icon={variant === "do" ? "check" : "close"} size={14} pack="solid" />
      </span>
      {caption}
    </p>
    <div className="docs-dodont-body" data-dodont-tinted={tinted || undefined}>
      {children}
    </div>
  </div>
);

/** The green example — what to do. */
export const Do = (props: DoDontItemProps) => <Item variant="do" {...props} />;

/** The red example — what not to do. */
export const Dont = (props: DoDontItemProps) => <Item variant="dont" {...props} />;

/**
 * A Do / Don't pair on a component docs page, from Figma `_DoDon'tCaption`
 * (31498-109348) and `_PreviewSurface` do/don't (31498-109342), laid out like
 * the reference pair 22623-9230.
 *
 * The two examples are ONE story so they sit side by side and stay the same
 * width — 24px apart, each with 80px padding, the block hugging its content
 * and growing equally past the 600px text column. A lone `Do` or `Dont` takes
 * the full width instead of leaving an empty column.
 *
 * ```tsx
 * <DoDont>
 *   <Do caption="One control, two states">…</Do>
 *   <Dont caption="Two rows, one style">…</Dont>
 * </DoDont>
 * ```
 *
 * The story's meta needs `parameters: { layout: "fullscreen" }` like every
 * other docs story — this block owns its padding. Do NOT also wrap it in
 * `docsFrame`. Styled ONLY in src/styles/storybook-docs.css.
 */
export const DoDont = ({ children }: { children: ReactNode }) => (
  <div className="docs-dodont">
    {children}
  </div>
);
