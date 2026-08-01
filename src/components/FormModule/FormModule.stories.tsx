import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame, noop } from "../../stories/helpers";
import AlertBanner from "../AlertBanner/AlertBanner";
import Button from "../Button/Button";
import SelectField from "../Fields/SelectField/SelectField";
import TextField from "../Fields/TextField/TextField";
import Input from "../Input/Input";
import FormModule from "./FormModule";

const meta: Meta<typeof FormModule> = {
  title: "Components/FormModule/FormModule",
  component: FormModule,
  // fullscreen — the stories' own `frame` provides the (only) padding;
  // "padded" would stack Storybook's padding on top of it.
  parameters: { layout: "fullscreen" },
  args: {
    title: "Location",
    caption: "Select the location where the equipment needing service is installed.",
    titleCondition: undefined,
    titleHint: false,
  },
  argTypes: {
    caption: { control: { type: "text" } },
    banner: { control: false },
    children: { control: false },
    titleCondition: { options: [undefined, "optional"], control: { type: "inline-radio" } },
  },
};
export default meta;

type Story = StoryObj<typeof FormModule>;

const bannerCopy =
  "Always pick the end-client location, no matter who called or is footing the bill for this work. " +
  "Don’t worry — you’ll get to add those third-party billers and whoever called it in later on!";

const infoBanner = (
  <AlertBanner orientation="vertical" status="info" onDismiss={() => {}}>
    {bannerCopy}
  </AlertBanner>
);

const locationCaption = "Select the location where the equipment needing service is installed.";

export const Playground: Story = {
  render: (args) => (
    <div style={docsFrame}>
      <FormModule {...args} banner={infoBanner}>
        <SelectField />
      </FormModule>
    </div>
  ),
};

/** The full anatomy: title + caption + AlertBanner header above the body slot. */
export const WithBanner: Story = {
  render: () => (
    <div style={docsFrame}>
      <FormModule title="Location" caption={locationCaption} banner={infoBanner}>
        <SelectField onClick={noop} />
      </FormModule>
    </div>
  ),
};

/** Caption and banner are optional — the title alone above the body. */
export const TitleOnly: Story = {
  render: () => (
    <div style={docsFrame}>
      <FormModule title="Location">
        <SelectField onClick={noop} />
      </FormModule>
    </div>
  ),
};

/** A module with no inputs marked optional via titleCondition="optional". */
export const OptionalModule: Story = {
  render: () => (
    <div style={docsFrame}>
      <FormModule title="Labels" titleCondition="optional">
        {/* Body children stretch by default — a hugging child opts out. */}
        <Button variant="ghost" size="md" leftIcon="plus" style={{ alignSelf: "flex-start" }} onClick={noop}>
          Add labels
        </Button>
      </FormModule>
    </div>
  ),
};

/** The condition caption also takes custom copy, passed with its parentheses. */
export const CustomCondition: Story = {
  render: () => (
    <div style={docsFrame}>
      <FormModule title="Title" titleCondition="(if applicable)">
        <Input label="Label">
          <TextField />
        </Input>
      </FormModule>
    </div>
  ),
};

/**
 * Both title and caption wrap; the condition caption and hint trigger do not —
 * top alignment keeps them on the first title line.
 */
export const TextWraps: Story = {
  render: () => (
    <div style={docsFrame}>
      <FormModule
        title="Very long title which doesn’t fit 1 line and should be truncated"
        titleCondition="optional"
        titleHint
        caption={locationCaption}
      >
        <SelectField onClick={noop} />
      </FormModule>
    </div>
  ),
};

/** The inputs validate, not the module — title and caption stay unchanged. */
export const Validation: Story = {
  render: () => (
    <div style={docsFrame}>
      <FormModule title="Billing intention" caption="Select who will likely be billed for this service.">
        <SelectField isValid={false} errorMessage="Choose Billing intention" onClick={noop} />
      </FormModule>
    </div>
  ),
};

// The banner → hint swap is the CONSUMER's job — FormModule does not do it by
// itself. This demo shows the wiring: onDismiss hides the banner and moves its
// copy into titleHintContent.
function BannerDismissalDemo() {
  const [dismissed, setDismissed] = useState(false);
  return (
    <div style={docsFrame}>
      <FormModule
        title="Location"
        caption={locationCaption}
        titleHintContent={dismissed ? bannerCopy : undefined}
        banner={
          dismissed ? undefined : (
            <AlertBanner orientation="vertical" status="info" onDismiss={() => setDismissed(true)}>
              {bannerCopy}
            </AlertBanner>
          )
        }
      >
        <SelectField onClick={noop} />
      </FormModule>
    </div>
  );
}

/** Live: dismissing the AlertBanner moves its copy into the title's hover Hint. */
export const BannerDismissal: Story = {
  render: () => <BannerDismissalDemo />,
};

/** Title alone, + caption, + banner, and the "(optional)" module. */
export const Overview: Story = {
  // Not frame-wrapped — keeps Storybook's own padding.
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 560 }}>
      <div>
        <span style={cap}>title only</span>
        <FormModule title="Location">
          <SelectField />
        </FormModule>
      </div>
      <div>
        <span style={cap}>title + caption</span>
        <FormModule title="Location" caption="Select the location where the equipment needing service is installed.">
          <SelectField />
        </FormModule>
      </div>
      <div>
        <span style={cap}>title + caption + banner</span>
        <FormModule
          title="Location"
          caption="Select the location where the equipment needing service is installed."
          banner={infoBanner}
        >
          <SelectField />
        </FormModule>
      </div>
      <div>
        <span style={cap}>optional module</span>
        <FormModule title="Labels" titleCondition="optional">
          <Button variant="ghost" size="md" leftIcon="plus" style={{ alignSelf: "flex-start" }} onClick={noop}>
            Add labels
          </Button>
        </FormModule>
      </div>
      <div>
        <span style={cap}>two fields (body stacks 24px)</span>
        <FormModule title="Details">
          <SelectField value="First" />
          <SelectField value="Second" />
        </FormModule>
      </div>
    </div>
  ),
};
