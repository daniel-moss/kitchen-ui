import { Fragment, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import SelectListHeader from "./SelectListHeader";
import Chip from "../Chip/Chip";

type AddOn = "none" | "chipGroup";

type StoryArgs = {
  placeholder: string;
  addOn: AddOn;
  search: boolean;
  disabled: boolean;
  loading: boolean;
};

const noop = () => {};
const cap: React.CSSProperties = { font: "var(--font-caption-medium-500)", color: "var(--text-subtle)" };
const frame: React.CSSProperties = { width: 352 };

// The chip row Figma draws in the add-on: three md Chips, one selected.
const DemoChips = () => {
  const [selected, setSelected] = useState("All");
  return (
    <>
      {["All", "Active", "Archived"].map((label) => (
        <Chip key={label} isSelected={selected === label} onClick={() => setSelected(label)}>
          {label}
        </Chip>
      ))}
    </>
  );
};

const staticChips = (
  <>
    <Chip isSelected onClick={noop}>
      All
    </Chip>
    <Chip onClick={noop}>Active</Chip>
    <Chip onClick={noop}>Archived</Chip>
  </>
);

// Controlled so the input types and the × clears it.
function Demo({ placeholder, addOn, search, disabled, loading }: StoryArgs) {
  const [value, setValue] = useState("");
  return (
    <div style={frame}>
      <SelectListHeader
        chips={addOn === "chipGroup" ? <DemoChips /> : undefined}
        search={search}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onClear={() => setValue("")}
        placeholder={placeholder}
        disabled={disabled}
        loading={loading}
      />
    </div>
  );
}

const meta: Meta<StoryArgs> = {
  title: "Components/SelectList/SelectListHeader",
  component: SelectListHeader,
  parameters: { layout: "centered" },
  args: { placeholder: "Placeholder", addOn: "none", search: true, disabled: false, loading: false },
  argTypes: {
    placeholder: { type: "string", control: { type: "text" } },
    addOn: { options: ["none", "chipGroup"], control: { type: "inline-radio" } },
    search: { control: { type: "boolean" } },
    disabled: { control: { type: "boolean" } },
    loading: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Type to search; the × button appears and clears the value. The chips toggle live. */
export const Playground: Story = { render: (args) => <Demo {...args} /> };

/** The three variants: search only (41px), chips only (65px), chips over search (97px). */
export const Variants: Story = {
  parameters: { controls: { disable: true }, layout: "padded" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-8)" }}>
      <div>
        <span style={cap}>addOn=none, search=true</span>
        <div style={frame}>
          <SelectListHeader placeholder="Placeholder" onChange={noop} />
        </div>
      </div>
      <div>
        <span style={cap}>addOn=chipGroup, search=false</span>
        <div style={frame}>
          <SelectListHeader chips={staticChips} search={false} />
        </div>
      </div>
      <div>
        <span style={cap}>addOn=chipGroup, search=true</span>
        <div style={frame}>
          <SelectListHeader chips={staticChips} placeholder="Placeholder" onChange={noop} />
        </div>
      </div>
    </div>
  ),
};

const STATES: { label: string; pseudo?: string; disabled?: boolean; loading?: boolean }[] = [
  { label: "default" },
  { label: "hover", pseudo: "pseudo-hover-all" },
  { label: "active", pseudo: "pseudo-focus-within-all" },
  { label: "disabled", disabled: true },
  { label: "loading", loading: true },
];

/** The search bar across its states — empty and filled. */
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
