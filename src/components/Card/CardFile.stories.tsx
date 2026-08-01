import type { Meta, StoryObj } from "@storybook/react";
import { CSSProperties } from "react";

import { cap, docsFrame, noop } from "../../stories/helpers";

import CardFile from "./CardFile";
import { FileType } from "./CardFile.types";

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

// The 12 file types, in the Figma "Unsupported preview" documentation order,
// with the label + sample file name each preview uses.
const DOC_TYPES: { type: FileType; name: string; label: string }[] = [
  { type: "generic", name: "File.xyz", label: "Generic files (unknown file type)" },
  { type: "word", name: "File.doc", label: "Word" },
  { type: "pdf", name: "File.pdf", label: "PDF" },
  { type: "spreadsheet", name: "File.xls", label: "Spreadsheet" },
  { type: "presentation", name: "File.pptx", label: "Presentation" },
  { type: "image", name: "File.png", label: "Image (unsupported preview)" },
  { type: "audio", name: "File.mp3", label: "Audio" },
  { type: "video", name: "File.mp4", label: "Video (unsupported preview)" },
  { type: "vector", name: "File.svg", label: "Vector" },
  { type: "gif", name: "File.gif", label: "GIF" },
  { type: "markdown", name: "File.md", label: "Markdown" },
  { type: "archive", name: "File.zip", label: "Archive" },
];

const FILE_TYPES = DOC_TYPES.map((t) => t.type);

// Default card width. CardFile fills its container, so each preview sits in a
// fixed-width cell (place CardFile in a grid in real use).
const CELL = 150;

// A name too long to fit — the footer truncates it (hover for the tooltip) and
// the no-preview tile wraps it, then truncates.
const LONG_NAME = "A very long file name which doesn't fit 1 line and needs to be truncated.xyz";

// Docs stories center their content in a vertical column, --size-20 apart.
const frameCol: CSSProperties = {
  ...docsFrame,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "var(--size-20)",
};
// The Actions story is the exception — a centered row.
const frameRow: CSSProperties = {
  ...docsFrame,
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: "var(--size-20)",
};
// A label above a preview, centered.
const labeled: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "var(--size-2)",
};

type PlaygroundArgs = {
  name: string;
  fileType: FileType;
  hasPreview: boolean;
  hasMenu: boolean;
  actionDanger: boolean;
  state: "default" | "disabled" | "loading";
};

/**
 * CardFile — a file card built on Card: a square preview tile (a real image /
 * video thumbnail, or a colored file-type placeholder) above a footer with the
 * file name and an action button. It fills its container's width; place it in a
 * grid. The whole card is clickable; the action button runs its own action.
 */
const meta: Meta<PlaygroundArgs> = {
  title: "Components/Card/CardFile",
  component: CardFile,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Use the controls to preview file types, the preview / no-preview tile, and states. */
export const Playground: Story = {
  // Synthetic playground args live on THIS story (not the meta) so the docs-page
  // ArgTypes table stays pure docgen from CardFile.types.ts.
  parameters: { layout: "centered" },
  args: { name: "File name", fileType: "pdf", hasPreview: false, hasMenu: true, actionDanger: false, state: "default" },
  argTypes: {
    fileType: { options: FILE_TYPES, control: { type: "select" } },
    state: { options: ["default", "disabled", "loading"], control: { type: "inline-radio" } },
    hasPreview: { control: { type: "boolean" } },
    hasMenu: { control: { type: "boolean" } },
    actionDanger: { control: { type: "boolean" } },
    name: { control: { type: "text" } },
  },
  render: ({ name, fileType, hasPreview, hasMenu, actionDanger, state }) => (
    <div style={{ width: CELL }}>
      <CardFile
        name={name}
        fileType={fileType}
        previewSrc={hasPreview ? SAMPLE_IMG : undefined}
        onClick={noop}
        onMenuClick={hasMenu ? noop : undefined}
        actionDanger={actionDanger}
        actionIcon={actionDanger ? "trash-can" : undefined}
        actionLabel={actionDanger ? "Delete file" : undefined}
        disabled={state === "disabled"}
        loading={state === "loading"}
      />
    </div>
  ),
};

/** The full anatomy: a square preview tile above the footer (name + action). */
export const Hero: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frameCol}>
      <div style={{ width: CELL }}>
        <CardFile name="Kitchen.jpg" fileType="image" previewSrc={SAMPLE_IMG} onClick={noop} onMenuClick={noop} />
      </div>
    </div>
  ),
};

/** A video file — a dark overlay + a centered play icon over the thumbnail. */
export const AnatomyVideo: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frameCol}>
      <div style={{ width: CELL }}>
        <CardFile name="Walkthrough.mp4" fileType="video" previewSrc={SAMPLE_IMG} onClick={noop} onMenuClick={noop} />
      </div>
    </div>
  ),
};

/** No preview — the colored file-type placeholder (file name + type icon). */
export const AnatomyNoPreview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frameCol}>
      <div style={{ width: CELL }}>
        <CardFile name="Service report.pdf" fileType="pdf" onClick={noop} onMenuClick={noop} />
      </div>
    </div>
  ),
};

/**
 * Min (106px) and max (184px) width — the tile keeps its 1:1 ratio; the name
 * truncates and, when truncated, hovering the title shows a tooltip.
 */
export const Responsiveness: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frameCol}>
      <div style={labeled}>
        <span style={cap}>min — 106px</span>
        <div style={{ width: 106 }}>
          <CardFile name="Kitchen renovation.jpg" fileType="image" previewSrc={SAMPLE_IMG} onClick={noop} onMenuClick={noop} />
        </div>
      </div>
      <div style={labeled}>
        <span style={cap}>max — 184px</span>
        <div style={{ width: 184 }}>
          <CardFile name="Kitchen renovation.jpg" fileType="image" previewSrc={SAMPLE_IMG} onClick={noop} onMenuClick={noop} />
        </div>
      </div>
    </div>
  ),
};

/** The action button runs its own action — a context menu (`ellipsis`) or a delete (`trash-can`, danger). */
export const Actions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frameRow}>
      <div style={labeled}>
        <span style={cap}>context menu</span>
        <div style={{ width: CELL }}>
          <CardFile name="Kitchen.jpg" fileType="image" previewSrc={SAMPLE_IMG} onClick={noop} onMenuClick={noop} />
        </div>
      </div>
      <div style={labeled}>
        <span style={cap}>delete</span>
        <div style={{ width: CELL }}>
          <CardFile
            name="Kitchen.jpg"
            fileType="image"
            previewSrc={SAMPLE_IMG}
            onClick={noop}
            onMenuClick={noop}
            actionIcon="trash-can"
            actionLabel="Delete file"
            actionDanger
          />
        </div>
      </div>
    </div>
  ),
};

/** The placeholder file name wraps until it fills the tile, then truncates — shown at min and max width. */
export const Wrapping: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frameCol}>
      <div style={labeled}>
        <span style={cap}>min — 106px</span>
        <div style={{ width: 106 }}>
          <CardFile name={LONG_NAME} fileType="generic" onClick={noop} onMenuClick={noop} />
        </div>
      </div>
      <div style={labeled}>
        <span style={cap}>max — 184px</span>
        <div style={{ width: 184 }}>
          <CardFile name={LONG_NAME} fileType="generic" onClick={noop} onMenuClick={noop} />
        </div>
      </div>
    </div>
  ),
};

/** Each file type has its own placeholder — icon + color. The name wraps, then truncates. */
export const FileTypes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frameCol}>
      {DOC_TYPES.map(({ type, name, label }) => (
        <div key={type} style={labeled}>
          <span style={cap}>{label}</span>
          <div style={{ width: CELL }}>
            <CardFile name={name} fileType={type} onClick={noop} onMenuClick={noop} />
          </div>
        </div>
      ))}
    </div>
  ),
};

/** Loading — non-interactive; skeletons replace the text and the action button is hidden. */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frameCol}>
      <div style={{ width: CELL }}>
        <CardFile name="Kitchen.jpg" fileType="generic" loading />
      </div>
    </div>
  ),
};
