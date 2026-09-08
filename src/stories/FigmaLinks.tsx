import figmaLogo from "../assets/figma-logo.svg";
import { Icon } from "../components/Icon/Icon";

interface FigmaLinksProps {
  /** URL of the component node in the Design System Figma file. */
  component?: string;
  /** URL of the component's Documentation page node in the Figma file. */
  doc?: string;
}

/**
 * The Figma resource row on a component docs page (Daniel, 2026-09-08): chip
 * buttons linking to the component's Documentation page and component node in
 * Figma, placed right below the intro paragraph, above the hero preview.
 * Built from Figma 29876-38594 (placement) + 29876-39967 (chip states).
 * Styled globally in src/styles/storybook-docs.css (.docs-figma-links) — no
 * styles here. The logo is the node's exported asset (src/assets/
 * figma-logo.svg), not a hand-drawn copy.
 */
export const FigmaLinks = ({ component, doc }: FigmaLinksProps) => (
  <div className="docs-figma-links">
    {doc && (
      <a href={doc} target="_blank" rel="noreferrer">
        <img src={figmaLogo} width={16} height={16} alt="Figma" />
        Doc
        <Icon icon="arrow-up-right" size={14} />
      </a>
    )}
    {component && (
      <a href={component} target="_blank" rel="noreferrer">
        <img src={figmaLogo} width={16} height={16} alt="Figma" />
        Component
        <Icon icon="arrow-up-right" size={14} />
      </a>
    )}
  </div>
);
