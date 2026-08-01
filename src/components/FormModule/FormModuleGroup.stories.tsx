import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame } from "../../stories/helpers";
import SelectField from "../Fields/SelectField/SelectField";
import FormModule from "./FormModule";
import FormModuleGroup from "./FormModuleGroup";

const meta: Meta<typeof FormModuleGroup> = {
  title: "Components/FormModule/FormModuleGroup",
  component: FormModuleGroup,
  // fullscreen — the docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  argTypes: { children: { control: false } },
};
export default meta;

type Story = StoryObj<typeof FormModuleGroup>;

/** Two FormModules — 32px apart, low divider between them. */
export const Playground: Story = {
  render: () => (
    <div style={docsFrame}>
      <FormModuleGroup>
        <FormModule title="Scheduling" caption="When the work happens.">
          <SelectField value="January 1, 2026" />
        </FormModule>
        <FormModule title="Assignees">
          <SelectField />
        </FormModule>
      </FormModuleGroup>
    </div>
  ),
};

/** Three modules — a divider sits between each consecutive pair. */
export const ThreeModules: Story = {
  render: () => (
    <div style={docsFrame}>
      <FormModuleGroup>
        <FormModule title="Details">
          <SelectField value="Value" />
        </FormModule>
        <FormModule title="Assignees" caption="Who works on it.">
          <SelectField />
        </FormModule>
        <FormModule title="Attachments" titleCondition="optional">
          <SelectField />
        </FormModule>
      </FormModuleGroup>
    </div>
  ),
};
