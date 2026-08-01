import { Fragment, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import SelectListHeader from "./SelectListHeader";

type StoryArgs = {
  placeholder: string;
  disabled: boolean;
  loading: boolean;
};

const noop = () => {};
const cap: React.CSSProperties = { font: "var(--font-caption-medium-500)", color: "var(--text-subtle)" };
const frame: React.CSSProperties = { width: 352 };

// Controlled so the input types and the × clears it.
function Demo({ placeholder, disabled, loading }: StoryArgs) {
  const [value, setValue] = useState("");
  return (
    <div style={frame}>
      <SelectListHeader value={value} onChange={(e) => setValue(e.target.value)} onClear={() => setValue("")} placeholder={placeholder} disabled={disabled} loading={loading} />
    </div>
  );
}

const meta: Meta<StoryArgs> = {
  title: "Components/SelectList/SelectListHeader",
  component: SelectListHeader,
  parameters: { layout: "centered" },
  args: { placeholder: "Placeholder", disabled: false, loading: false },
  argTypes: {
    placeholder: { type: "string", control: { type: "text" } },
    disabled: { control: { type: "boolean" } },
    loading: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Type to search; the × button appears and clears the value. */
export const Playground: Story = { render: (args) => <Demo {...args} /> };

const STATES: { label: string; pseudo?: string; disabled?: boolean; loading?: boolean }[] = [
  { label: "default" },
  { label: "hover", pseudo: "pseudo-hover-all" },
  { label: "active", pseudo: "pseudo-focus-within-all" },
  { label: "disabled", disabled: true },
  { label: "loading", loading: true },
];

/** The single variant — a SearchField bar. */
export const Overview: Story = {
  parameters: { controls: { disable: true }, layout: "padded" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "72px 352px 352px", gap: "var(--size-4)", alignItems: "center" }}>
      <span />
      <span style={cap}>empty</span>
      <span style={cap}>filled</span>
      {STATES.map((s) => (
        <Fragment key={s.label}>
          <span style={cap}>{s.label}</span>
          <div className={s.pseudo}>
            <SelectListHeader placeholder="Placeholder" disabled={s.disabled} loading={s.loading} onChange={noop} />
          </div>
          <div className={s.pseudo}>
            <SelectListHeader defaultValue="Value" disabled={s.disabled} loading={s.loading} onClear={noop} />
          </div>
        </Fragment>
      ))}
    </div>
  ),
};
