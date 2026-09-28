import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Toaster, { toast } from "../../components/Toast/Toaster";

import FilesModule from "./FilesModule";
import { FileVisibility, ModuleFile } from "./FilesModule.types";

// The shared "Files" display module (Figma "Files" Display Module, file
// C6rO8SKXF9OVZyO7mTgRtE). Extracted from the Job Details prototype on
// 2026-09-28 because every object that holds files shows the SAME module — a
// job, an equipment, a location. Everything that differs is a prop: the files,
// the handlers, the upload cap, and whether the header offers the list/cards
// toggle (a 400px side panel has no room for cards, a details page does).
const meta: Meta = {
  title: 'Modules/"Files" Display Module',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

const META = "Added on Aug 12, 2026 by Lorne R.";

const INITIAL: ModuleFile[] = [
  { id: "1", name: "Nameplate.jpg", type: "image", size: "2 MB", visibility: "public", meta: META },
  { id: "2", name: "Spec sheet.pdf", type: "pdf", size: "4 MB", visibility: "public", meta: META },
  { id: "3", name: "Compressor noise.mp4", type: "video", size: "18 MB", visibility: "public", meta: META },
  { id: "4", name: "Service log.xls", type: "spreadsheet", size: "1 MB", visibility: "private", meta: META },
  { id: "5", name: "Install notes.doc", type: "word", size: "3 MB", visibility: "private", meta: META },
  { id: "6", name: "Site walkthrough.wav", type: "audio", size: "5 MB", visibility: "private", meta: META },
];

/**
 * The consumer owns the array and every mutation — the module only reports
 * what the user did. This demo is the reference wiring.
 */
const Demo = ({
  initial = INITIAL,
  maxFiles,
  showViewToggle = false,
  mobile = false,
}: {
  initial?: ModuleFile[];
  maxFiles?: number;
  showViewToggle?: boolean;
  mobile?: boolean;
}) => {
  const [files, setFiles] = useState(initial);

  // The drag indexes are within ONE group, so map them back onto the flat array.
  const reorder = (visibility: FileVisibility, from: number, to: number) =>
    setFiles((prev) => {
      const group = prev.filter((file) => file.visibility === visibility);
      const moved = [...group];
      const [item] = moved.splice(from, 1);
      moved.splice(to, 0, item);
      let next = 0;
      return prev.map((file) => (file.visibility === visibility ? moved[next++] : file));
    });

  const toggleVisibility = (file: ModuleFile) => {
    const now: FileVisibility = file.visibility === "private" ? "public" : "private";
    setFiles((prev) => prev.map((row) => (row.id === file.id ? { ...row, visibility: now } : row)));
    toast({ type: "neutral", icon: now === "public" ? "globe" : "lock", title: `"${file.name}" is now ${now}` });
  };

  const deleteFile = (file: ModuleFile) => {
    setFiles((prev) => prev.filter((row) => row.id !== file.id));
    toast({ type: "neutral", icon: "trash-can", title: `"${file.name}" deleted` });
  };

  return (
    <div style={{ width: mobile ? 343 : 480 }}>
      <FilesModule
        files={files}
        maxFiles={maxFiles}
        showViewToggle={showViewToggle}
        mobile={mobile}
        onReorder={reorder}
        onToggleVisibility={toggleVisibility}
        onDelete={deleteFile}
        onPreview={() => {}}
        onFilesAdded={(added) => setFiles((prev) => [...prev, ...added])}
      />
      <Toaster />
    </div>
  );
};

/** The details-page setup: list/cards toggle, a 25-file cap. */
export const Desktop: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo showViewToggle maxFiles={25} />,
};

export const Mobile: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo showViewToggle maxFiles={25} mobile />,
};

/**
 * The side-panel setup: no list/cards toggle — a 400px panel has no room for
 * cards (Equipment side panel, Figma 21979-7536).
 */
export const NoViewToggle: Story = {
  name: "Without the view toggle",
  parameters: { layout: "centered" },
  render: () => <Demo maxFiles={25} />,
};

/** One group filled, the other empty — each group states its own emptiness. */
export const OneGroupEmpty: Story = {
  name: "One group empty",
  parameters: { layout: "centered" },
  render: () => <Demo initial={INITIAL.filter((file) => file.visibility === "public")} showViewToggle maxFiles={25} />,
};

/** No files at all — one empty state, and no counter in the header. */
export const Empty: Story = {
  parameters: { layout: "centered" },
  render: () => <Demo initial={[]} showViewToggle maxFiles={25} />,
};

/** From 80% of the cap: the info banner. */
export const ApproachingLimit: Story = {
  name: "Approaching the limit",
  parameters: { layout: "centered" },
  render: () => <Demo showViewToggle maxFiles={7} />,
};

/** At 100%: the warning banner, and the add button disabled with a hint. */
export const AtLimit: Story = {
  name: "At the limit",
  parameters: { layout: "centered" },
  render: () => <Demo showViewToggle maxFiles={6} />,
};

/** No cap at all — no banner can ever show. */
export const NoLimit: Story = {
  name: "Without a limit",
  parameters: { layout: "centered" },
  render: () => <Demo showViewToggle maxFiles={Infinity} />,
};
