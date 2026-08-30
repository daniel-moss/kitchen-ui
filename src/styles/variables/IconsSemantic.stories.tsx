import type { Meta, StoryObj } from "@storybook/react";
import { useLayoutEffect, useState } from "react";

import { Icon } from "../../components/Icon/Icon";
import { IconPack } from "../../components/Icon/Icon.types";

/**
 * Visual reference for the semantic icon-name tokens in `icons-semantic.css`.
 * Each token is a CSS string holding an icon name, so the meaning ("--job") is
 * decoupled from the glyph ("wrench-simple") — change it in one place. The value
 * is read live from the token here, then rendered through the real Icon.
 */

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

// Names that live only in the kit custom fonts (need pack custom / custom-duotone).
const CUSTOM = new Set([
  "solid-priority-high",
  "solid-priority-none",
  "solid-timeline-view",
  "regular-timeline-view",
  "regular-collapse",
  "microsoft",
]);
const DUOTONE = new Set(["duotone-solid-priority-low", "duotone-solid-priority-medium"]);

function packFor(name: string): IconPack {
  if (DUOTONE.has(name)) return "custom-duotone";
  if (CUSTOM.has(name)) return "custom";
  return "regular";
}

const GROUPS: { group: string; tokens: string[] }[] = [
  {
    group: "Navigation & app chrome",
    tokens: [
      "menu", "dropdown", "context-menu", "contact-support", "settings",
      "help-center", "what-is-new", "request-feature", "log-out", "home",
    ],
  },
  { group: "Files", tokens: ["file-private", "file-public"] },
  { group: "Statuses", tokens: ["active", "review", "inactive"] },
  {
    group: "Entities",
    tokens: [
      "estimate", "job-request", "job", "job-series", "invoice", "credit-note",
      "purchase-order", "bill", "vendor", "client", "client-business",
      "client-individual", "pricebook", "labor", "product", "other", "discount",
      "tax-rate", "equipment", "location", "user", "reports", "warranty", "visit", "label",
    ],
  },
  { group: "Views", tokens: ["table-view", "cards-view", "timeline-view"] },
  { group: "Priority", tokens: ["priority-none", "priority-high", "priority-urgent"] },
  { group: "Progress", tokens: ["progress-0", "progress-25", "progress-50", "progress-75"] },
];

const meta: Meta = {
  title: "Variables/Icons (semantic)",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

const pageStyle: React.CSSProperties = {
  padding: "var(--size-8)",
  background: "var(--surface-level-first, #fff)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--size-8)",
};

const headingStyle: React.CSSProperties = {
  fontFamily: "var(--font-family-base)",
  fontSize: 13,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--text-subtle, var(--gray-11))",
  margin: "0 0 var(--size-4)",
};

function SemCard({ token }: { token: string }) {
  const [value, setValue] = useState("");
  useLayoutEffect(() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${token}`);
    setValue(raw.trim().replace(/^["']|["']$/g, ""));
  }, [token]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--size-3)",
        padding: "var(--size-3)",
        borderRadius: 8,
        border: "1px solid var(--gray-a4)",
        background: "var(--gray-2)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          flexShrink: 0,
          color: "var(--text-strong, var(--gray-12))",
        }}
      >
        {value && <Icon icon={value} pack={packFor(value)} size={20} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <code style={{ display: "block", fontFamily: mono, fontSize: 12, color: "var(--text-strong, var(--gray-12))" }}>
          --{token}
        </code>
        <span style={{ fontFamily: mono, fontSize: 11, color: "var(--gray-11)" }}>{value}</span>
      </div>
    </div>
  );
}

// Name matches the title's last segment so Storybook hoists this single story
// to one sidebar leaf (no extra folder).
export const IconsSemantic: Story = {
  name: "Icons (semantic)",
  render: () => (
    <div style={pageStyle}>
      {GROUPS.map(({ group, tokens }) => (
        <section key={group}>
          <h3 style={headingStyle}>{group}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--size-3)" }}>
            {tokens.map((token) => (
              <SemCard key={token} token={token} />
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
};
