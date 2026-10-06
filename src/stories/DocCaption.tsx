import { ReactNode } from "react";

interface DocCaptionProps {
  /**
   * The caption copy — the variant this preview shows, written in the
   * component's own property vocabulary (`isSelected = false`, `size = md`).
   */
  children: ReactNode;
}

/**
 * The caption block on a component docs page (Figma 31479-94199): the small
 * label above a preview naming the variant it shows. Every preview on a doc
 * page carries one, and one convention per page.
 *
 * It is NOT prose — 14/20 Regular with 48px above and only 8px below, so it
 * sits tight to the preview it labels. Styled ONLY in
 * src/styles/storybook-docs.css (`.docs-caption`), like FigmaLinks.
 *
 * For labels drawn INSIDE a preview (several examples in one story), use the
 * `cap` style from helpers.tsx instead — that one sits on the preview surface,
 * not in the text column.
 */
export const DocCaption = ({ children }: DocCaptionProps) => <p className="docs-caption">{children}</p>;
