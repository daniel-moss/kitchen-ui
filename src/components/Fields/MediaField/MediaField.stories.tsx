import { ComponentProps, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame, noop } from "../../../stories/helpers";
import CardFile from "../../Card/CardFile";
import { FileType } from "../../Card/CardFile.types";
import Input from "../../Input/Input";
import TextArea from "../TextArea/TextArea";
import MediaField from "./MediaField";

// A stand-in thumbnail (an SVG mesh gradient) so the preview stories need no
// network image.
const SAMPLE_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>
       <defs>
         <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
           <stop offset='0' stop-color='#f4a340'/>
           <stop offset='0.5' stop-color='#e86ca3'/>
           <stop offset='1' stop-color='#8b5cf6'/>
         </linearGradient>
       </defs>
       <rect width='240' height='240' fill='url(#g)'/>
     </svg>`,
  );

/**
 * MediaField — the file-upload field: a dashed upload trigger that opens the
 * native picker (on mobile the OS offers browse / take a shot), plus the
 * uploaded files as CardFile tiles in a wrapping grid. The field is bare —
 * label and help text come from the Input wrapper.
 */
const meta: Meta<typeof MediaField> = {
  title: "Components/Fields/MediaField",
  component: MediaField,
  parameters: { layout: "fullscreen" },
  args: {
    multiple: true,
    isValid: true,
    disabled: false,
    breakpoint: "desktop",
  },
  argTypes: {
    breakpoint: { options: ["auto", "desktop", "mobile"], control: { type: "inline-radio" } },
    errorMessage: { control: { type: "text" } },
    accept: { control: { type: "text" } },
    children: { control: false },
  },
};
export default meta;

type Story = StoryObj<typeof MediaField>;

// Map a picked File to the CardFile props the demo shows for it.
const fileTypeOf = (file: File): FileType => {
  if (file.type === "image/gif") return "gif";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type === "application/pdf") return "pdf";
  return "generic";
};

// A working uploader: picked files become CardFiles (images/videos get a real
// object-URL thumbnail). The consumer owns the list — MediaField only reports
// the picks.
const Uploader = (args: ComponentProps<typeof MediaField>) => {
  const [files, setFiles] = useState<{ name: string; type: FileType; src?: string }[]>([]);
  return (
    <MediaField
      {...args}
      onFilesSelected={(picked) =>
        setFiles((current) => [
          ...current,
          ...picked.map((file) => ({
            name: file.name,
            type: fileTypeOf(file),
            src:
              file.type.startsWith("image/") || file.type.startsWith("video/")
                ? URL.createObjectURL(file)
                : undefined,
          })),
        ])
      }
    >
      {files.map((file, index) => (
        <CardFile
          key={`${file.name}-${index}`}
          name={file.name}
          fileType={file.type}
          previewSrc={file.src}
          onClick={noop}
          onMenuClick={noop}
        />
      ))}
    </MediaField>
  );
};

/** Pick real files — they appear as CardFile tiles and the trigger shrinks. */
export const Playground: Story = {
  render: (args) => (
    <div style={docsFrame}>
      <Uploader {...args} />
    </div>
  ),
};

/** The valid trigger's state ladder (the Figma "Upload area — Valid" order). */
export const TriggerValid: Story = {
  render: () => (
    <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <span style={cap}>default</span>
        <MediaField breakpoint="desktop" />
      </div>
      <div>
        <span style={cap}>focused (keyboard only)</span>
        <MediaField breakpoint="desktop" className="pseudo-focus-visible-all" />
      </div>
      <div>
        <span style={cap}>hovered</span>
        <MediaField breakpoint="desktop" className="pseudo-hover-all" />
      </div>
      <div>
        <span style={cap}>pressed</span>
        <MediaField breakpoint="desktop" className="pseudo-active-all" />
      </div>
      <div>
        <span style={cap}>disabled</span>
        <MediaField breakpoint="desktop" disabled />
      </div>
    </div>
  ),
};

/** The invalid trigger — ONE look for default, hover, press and focus. */
export const TriggerInvalid: Story = {
  render: () => (
    <div style={docsFrame}>
      <span style={cap}>invalid — one look for every state</span>
      <MediaField breakpoint="desktop" isValid={false} />
    </div>
  ),
};

/** The desktop size: 180px empty trigger, fixed 135px cards, wrapping. */
export const Desktop: Story = {
  render: () => (
    <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <span style={cap}>empty</span>
        <MediaField breakpoint="desktop" />
      </div>
      <div>
        <span style={cap}>filled</span>
        <MediaField breakpoint="desktop">
          <CardFile name="Kitchen.jpg" fileType="image" previewSrc={SAMPLE_IMG} onClick={noop} onMenuClick={noop} />
          <CardFile name="Walkthrough.mp4" fileType="video" previewSrc={SAMPLE_IMG} onClick={noop} onMenuClick={noop} />
          <CardFile name="Service report.pdf" fileType="pdf" onClick={noop} onMenuClick={noop} />
          <CardFile name="Warranty terms.doc" fileType="word" onClick={noop} onMenuClick={noop} />
        </MediaField>
      </div>
    </div>
  ),
};

/** The mobile size: 106px cards, 151px trigger. */
export const Mobile: Story = {
  render: () => (
    <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <span style={cap}>empty</span>
        <MediaField breakpoint="mobile" />
      </div>
      <div>
        <span style={cap}>filled</span>
        <MediaField breakpoint="mobile">
          <CardFile name="Kitchen.jpg" fileType="image" previewSrc={SAMPLE_IMG} onClick={noop} onMenuClick={noop} />
          <CardFile name="Service report.pdf" fileType="pdf" onClick={noop} onMenuClick={noop} />
        </MediaField>
      </div>
    </div>
  ),
};

/** Required + empty on submit: the "Add [Label]" error, derived from the Input label. */
export const Invalid: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="Photos">
        <MediaField breakpoint="desktop" isValid={false} />
      </Input>
    </div>
  ),
};

/** Inside an Input: shared label, derived "Add [Label]", invalid, loading. */
export const InsideInput: Story = {
  render: () => (
    <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: 24 }}>
      <Input label="Photos" helpText="Photos of the equipment">
        <MediaField breakpoint="desktop" />
      </Input>
      <Input label="Photos">
        <MediaField breakpoint="desktop" isValid={false} />
      </Input>
      <Input label="Photos" isLoading>
        <MediaField breakpoint="desktop" />
      </Input>
    </div>
  ),
};
