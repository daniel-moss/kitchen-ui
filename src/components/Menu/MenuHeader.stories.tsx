import { Fragment, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { cap, noop } from "../../stories/helpers";

import MenuHeader from "./MenuHeader";

type StoryArgs = {
  placeholder: string;
  disabled: boolean;
  loading: boolean;
};

// 352px — the width the Figma component page draws the header at (node 29422-6849).
const frame: React.CSSProperties = { width: 352 };

// Controlled so the input types and the × clears it.
function Demo({ placeholder, disabled, loading }: StoryArgs) {
  const [value, setValue] = useState("");
  return (
    <div style={frame}>
      <MenuHeader value={value} onChange={(e) => setValue(e.target.value)} onClear={() => setValue("")} placeholder={placeholder} disabled={disabled} loading={loading} />
    </div>
  );
}

const meta: Meta<StoryArgs> = {
  title: "Components/Menu/MenuHeader",
  component: MenuHeader,
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
          {/* autoFocusSearch off across the matrix: the default is ON, and ten
              headers mounting together would leave the last one focused and
              make that row read as a state it is not. */}
          <div className={s.pseudo}>
            <MenuHeader placeholder="Placeholder" disabled={s.disabled} loading={s.loading} onChange={noop} autoFocusSearch={false} />
          </div>
          <div className={s.pseudo}>
            <MenuHeader defaultValue="Value" disabled={s.disabled} loading={s.loading} onClear={noop} autoFocusSearch={false} />
          </div>
        </Fragment>
      ))}
    </div>
  ),
};
