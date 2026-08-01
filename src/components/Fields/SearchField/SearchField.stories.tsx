import { Fragment, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame, DeviceFrame, noop } from "../../../stories/helpers";
import SearchField from "./SearchField";
import { SearchFieldProps, SearchFieldType } from "./SearchField.types";

/**
 * SearchField — a text search input. `field` is a bordered 32px box; `bar` is
 * a filled 36px row with a 1px Divider below. A "Clear" (×) button appears
 * once there is a value.
 */
const meta: Meta<typeof SearchField> = {
  title: "Components/Fields/SearchField",
  component: SearchField,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: { type: "field", placeholder: "Search…", disabled: false, loading: false },
  argTypes: {
    type: { options: ["field", "bar"], control: { type: "inline-radio" } },
    placeholder: { control: { type: "text" } },
    disabled: { control: { type: "boolean" } },
    loading: { control: { type: "boolean" } },
  },
};
export default meta;

type Story = StoryObj<typeof SearchField>;

// Controlled so the input types and the × clears it.
function Demo(props: SearchFieldProps) {
  const [value, setValue] = useState(props.defaultValue ?? "");
  return <SearchField {...props} defaultValue={undefined} value={value} onChange={(e) => setValue(e.target.value)} onClear={() => setValue("")} />;
}

/** Type to search; the × button appears and clears the value. */
export const Playground: Story = {
  render: (args) => (
    <div style={docsFrame}>
      <Demo {...args} />
    </div>
  ),
};

// ---- docs-page stories (one per Figma Documentation example) ---------------

const row = (label: string, field: React.ReactNode) => (
  <div>
    <span style={cap}>{label}</span>
    {field}
  </div>
);

const col = { display: "flex", flexDirection: "column", gap: "var(--size-20)" } as const;

/** The hero — a filled field with the "Clear" button. Live. */
export const Hero: Story = {
  render: () => (
    <div style={docsFrame}>
      <Demo defaultValue="Value" placeholder="Search…" />
    </div>
  ),
};

/** Field anatomy — empty (placeholder) and filled (value + "Clear"). */
export const AnatomyField: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        <SearchField placeholder="Placeholder" onChange={noop} />
        <SearchField defaultValue="Value" onClear={noop} />
      </div>
    </div>
  ),
};

/** Bar anatomy — empty and filled, with the bottom Divider. */
export const AnatomyBar: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        <SearchField type="bar" placeholder="Placeholder" onChange={noop} />
        <SearchField type="bar" defaultValue="Value" onClear={noop} />
      </div>
    </div>
  ),
};

/** The "Clear" button — hover it for the tooltip; click clears the field. */
export const ClearButton: Story = {
  render: () => (
    <div style={docsFrame}>
      <Demo defaultValue="Value" placeholder="Search…" />
    </div>
  ),
};

const stateRows = (type: SearchFieldType, filled: boolean) => (
  <div style={col}>
    {row("default", <SearchField type={type} placeholder="Placeholder" defaultValue={filled ? "Value" : undefined} onChange={noop} />)}
    {row("hovered", <SearchField type={type} className="pseudo-hover-all" placeholder="Placeholder" defaultValue={filled ? "Value" : undefined} onChange={noop} />)}
    {row("active", <SearchField type={type} className="pseudo-focus-within-all" placeholder="Placeholder" defaultValue={filled ? "Value" : undefined} onChange={noop} />)}
    {row("disabled", <SearchField type={type} disabled placeholder="Placeholder" defaultValue={filled ? "Value" : undefined} onChange={noop} />)}
  </div>
);

/** Field, empty — border a7→a8, icon darkens on hover, gray-12 when active. */
export const FieldStates: Story = {
  render: () => <div style={docsFrame}>{stateRows("field", false)}</div>,
};

/** Field, filled — disabled hides the "Clear" button. */
export const FieldStatesFilled: Story = {
  render: () => <div style={docsFrame}>{stateRows("field", true)}</div>,
};

/** Bar, empty — no border; only the icon reacts. */
export const BarStates: Story = {
  render: () => <div style={docsFrame}>{stateRows("bar", false)}</div>,
};

/** Bar, filled — the sm/28 "Clear" button; disabled hides it. */
export const BarStatesFilled: Story = {
  render: () => <div style={docsFrame}>{stateRows("bar", true)}</div>,
};

/** The "search" keyboard — open this story on a phone. */
export const MobileKeyboard: Story = {
  render: () => (
    <div style={{ ...docsFrame, display: "flex", justifyContent: "center" }}>
      <DeviceFrame statusBar pageText="">
        <div style={{ padding: "var(--size-2) var(--size-4)" }}>
          <Demo placeholder="Search…" />
        </div>
      </DeviceFrame>
    </div>
  ),
};

// ---- the compact overview grids (empty + filled side by side, incl. loading)

const STATES: { label: string; pseudo?: string; disabled?: boolean; loading?: boolean }[] = [
  { label: "default" },
  { label: "hover", pseudo: "pseudo-hover-all" },
  { label: "active", pseudo: "pseudo-focus-within-all" },
  { label: "disabled", disabled: true },
  { label: "loading", loading: true },
];

const StateGrid = ({ type }: { type: SearchFieldType }) => (
  <div style={{ display: "grid", gridTemplateColumns: "72px 300px 300px", gap: "var(--size-4)", alignItems: "center" }}>
    <span />
    <span style={cap}>empty</span>
    <span style={cap}>filled</span>
    {STATES.map((s) => (
      <Fragment key={s.label}>
        <span style={cap}>{s.label}</span>
        <div className={s.pseudo}>
          <SearchField type={type} placeholder="Placeholder" disabled={s.disabled} loading={s.loading} onChange={noop} />
        </div>
        <div className={s.pseudo}>
          <SearchField type={type} defaultValue="Value" disabled={s.disabled} loading={s.loading} onClear={noop} />
        </div>
      </Fragment>
    ))}
  </div>
);

/** field — a bordered box. Border darkens on hover, gray-12 on focus. */
export const Field: Story = { parameters: { controls: { disable: true }, layout: "padded" }, render: () => <StateGrid type="field" /> };

/** bar — a filled row with a bottom divider. */
export const Bar: Story = { parameters: { controls: { disable: true }, layout: "padded" }, render: () => <StateGrid type="bar" /> };
