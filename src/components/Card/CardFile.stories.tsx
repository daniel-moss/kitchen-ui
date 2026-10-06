import type { Meta, StoryObj } from "@storybook/react";
import { CSSProperties } from "react";

import Counter from "../Counter/Counter";
import DisplayModule from "../DisplayModule/DisplayModule";
import { Icon } from "../Icon/Icon";
import Segment from "../SegmentedControl/Segment";
import SegmentedControl from "../SegmentedControl/SegmentedControl";

import { PSEUDO_SELF, cap, docsFrame, noop } from "../../stories/helpers";

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

const FILE_TYPES: FileType[] = [
  "generic",
  "word",
  "pdf",
  "spreadsheet",
  "presentation",
  "image",
  "audio",
  "video",
  "vector",
  "gif",
  "markdown",
  "archive",
];

// Default card width. CardFile fills its container, so each preview sits in a
// fixed-width cell (place CardFile in a grid in real use).
const CELL = 150;

// The Figma documentation page's own placeholder name — a preview of the
// component shows the component, not a scene.
const NAME = "File name";

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
// A centered row — two or more cards side by side.
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
  args: { name: NAME, fileType: "pdf", hasPreview: false, hasMenu: true, actionDanger: false, state: "default" },
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
        isLoading={state === "loading"}
      />
    </div>
  ),
};

// One card at the default width — the shape most previews need.
const card = (props: Partial<Parameters<typeof CardFile>[0]> = {}, width: number = CELL) => (
  <div style={{ width }}>
    <CardFile name={NAME} onClick={noop} onMenuClick={noop} {...props} />
  </div>
);

const simple = (render: () => JSX.Element): Story => ({
  parameters: { controls: { disable: true } },
  render,
});

/** The default card — an image preview above the footer. */
export const Hero: Story = simple(() => (
  <div style={frameCol}>{card({ fileType: "image", previewSrc: SAMPLE_IMG })}</div>
));

/** The anatomy: the square tile, the divider, and the footer (name + action). */
export const Anatomy: Story = simple(() => (
  <div style={frameCol}>{card({ fileType: "image", previewSrc: SAMPLE_IMG })}</div>
));

/** A files module in its cards view — where CardFile lives in the product. */
export const WhenToUse: Story = simple(() => (
  <div style={docsFrame}>
    <DisplayModule
      title="Files"
      titleSlotRight={<Counter value={6} />}
      slotRight={
        <SegmentedControl size="md" value="cards" onChange={noop}>
          <Segment value="list" slotLeft={<Icon icon="list" size={14} />} aria-label="List view" />
          <Segment value="cards" slotLeft={<Icon icon="grid-2" size={14} />} aria-label="Cards view" />
        </SegmentedControl>
      }
      content={
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(106px, 1fr))",
            gap: "var(--size-3)",
          }}
        >
          <CardFile name={NAME} fileType="image" previewSrc={SAMPLE_IMG} onClick={noop} onMenuClick={noop} />
          <CardFile name={NAME} fileType="video" previewSrc={SAMPLE_IMG} onClick={noop} onMenuClick={noop} />
          <CardFile name={NAME} fileType="pdf" onClick={noop} onMenuClick={noop} />
          <CardFile name={NAME} fileType="image" previewSrc={SAMPLE_IMG} onClick={noop} onMenuClick={noop} />
          <CardFile name={NAME} fileType="spreadsheet" onClick={noop} onMenuClick={noop} />
          <CardFile name={NAME} fileType="image" previewSrc={SAMPLE_IMG} onClick={noop} onMenuClick={noop} />
        </div>
      }
    />
  </div>
));

/** An image preview — it fills the tile and is cropped to the square. */
export const PreviewImage: Story = simple(() => (
  <div style={frameCol}>{card({ fileType: "image", previewSrc: SAMPLE_IMG })}</div>
));

/** A video preview — a dark overlay and a centered play icon over the thumbnail. */
export const PreviewVideo: Story = simple(() => (
  <div style={frameCol}>{card({ fileType: "video", previewSrc: SAMPLE_IMG })}</div>
));

/** No preview — the file-type placeholder: an icon above the file name. */
export const PreviewPlaceholder: Story = simple(() => <div style={frameCol}>{card({ fileType: "generic" })}</div>);

/** The placeholder name wraps over as many lines as fit, then truncates. */
export const PreviewWrapping: Story = simple(() => (
  <div style={frameCol}>{card({ name: LONG_NAME, fileType: "generic" })}</div>
));

// The twelve file types, each its own preview — the documentation page's order
// and its sample names.
const fileType = (type: FileType, name: string): Story =>
  simple(() => <div style={frameCol}>{card({ name, fileType: type })}</div>);

export const FileTypeGeneric = fileType("generic", "File.xyz");
export const FileTypeWord = fileType("word", "File.doc");
export const FileTypePdf = fileType("pdf", "File.pdf");
export const FileTypeSpreadsheet = fileType("spreadsheet", "File.xls");
export const FileTypePresentation = fileType("presentation", "File.pptx");
export const FileTypeImage = fileType("image", "File.png");
export const FileTypeAudio = fileType("audio", "File.mp3");
export const FileTypeVideo = fileType("video", "File.mp4");
export const FileTypeVector = fileType("vector", "File.svg");
export const FileTypeGif = fileType("gif", "File.gif");
export const FileTypeMarkdown = fileType("markdown", "File.md");
export const FileTypeArchive = fileType("archive", "File.zip");

/** With an action — the name truncates and hovering it shows the full name. */
export const FooterAction: Story = simple(() => (
  <div style={frameCol}>
    {card({ name: "Image file name.png", fileType: "image", previewSrc: SAMPLE_IMG })}
  </div>
));

/** Without an action — the name uses the full width. */
export const FooterNoAction: Story = simple(() => (
  <div style={frameCol}>
    {card({ name: "Image file name.png", fileType: "image", previewSrc: SAMPLE_IMG, onMenuClick: undefined })}
  </div>
));

/** The action button can also run a destructive action, in the danger style. */
export const FooterDanger: Story = simple(() => (
  <div style={frameRow}>
    {card({ fileType: "image", previewSrc: SAMPLE_IMG })}
    {card({
      fileType: "image",
      previewSrc: SAMPLE_IMG,
      actionIcon: "trash-can",
      actionLabel: "Delete file",
      actionDanger: true,
    })}
  </div>
));

/** The same card at its smallest and its largest width — the tile stays square. */
export const Responsiveness: Story = simple(() => (
  <div style={frameRow}>
    {card({ fileType: "image", previewSrc: SAMPLE_IMG }, 106)}
    {card({ fileType: "image", previewSrc: SAMPLE_IMG }, 184)}
  </div>
));

/** Loading — non-interactive; skeletons replace the name and the picture. */
export const Loading: Story = simple(() => (
  <div style={frameCol}>
    <div style={{ width: CELL }}>
      <CardFile name={NAME} isLoading />
    </div>
  </div>
));

// The five interactive states, side by side — wider than the text column, so
// the frame hugs its content (data-hug).
// Card reaches its fill through :has(.body:hover), so the pseudo class goes on
// the BODY (Card's own stories do the same) — marking the root would do nothing.
const STATES: { label: string; props: Partial<Parameters<typeof CardFile>[0]> }[] = [
  { label: "Hovered", props: { bodyClassName: PSEUDO_SELF.hover } },
  { label: "Pressed", props: { bodyClassName: PSEUDO_SELF.press } },
  { label: "Focused", props: { bodyClassName: PSEUDO_SELF.focus } },
  { label: "Disabled", props: { disabled: true } },
  { label: "Dragging", props: { dragging: true } },
];

/** Hover, press, focus, disabled and dragging — all of them Card's. */
export const States: Story = simple(() => (
  <div
    data-hug
    style={{ ...docsFrame, maxWidth: "none", display: "flex", justifyContent: "center", gap: "var(--size-4)" }}
  >
    {STATES.map(({ label, props }) => (
      <div key={label} style={labeled}>
        <span style={cap}>{label}</span>
        {card({ fileType: "image", previewSrc: SAMPLE_IMG, ...props }, 106)}
      </div>
    ))}
  </div>
));
