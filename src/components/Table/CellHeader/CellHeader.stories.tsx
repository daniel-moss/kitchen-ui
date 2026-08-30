import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame, noop } from "../../../stories/helpers";
import { TableRow } from "../TableRow/TableRow";
import { CellHeader } from "./CellHeader";
import { CellDataType } from "./CellHeader.types";

const DATA_TYPES: CellDataType[] = ["alphabetical", "numerical", "timing", "other"];

// The docs frame is 700px wide with --size-20 (80px) padding, so an example has
// FRAME_W of usable width. Every story's cell widths add up to it: the row's
// `min-width: 100%` then resolves to exactly the cells' own total, so the row
// neither stretches past them nor leaves the preview box half empty.
const FRAME_W = 540;
const frame: React.CSSProperties = docsFrame;

const meta: Meta<typeof CellHeader> = {
  title: "Components/Table/CellHeader",
  component: CellHeader,
  // fullscreen — the stories' own `docsFrame` provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: {
    label: "Service",
    align: "left",
    width: FRAME_W,
    isSortable: true,
    dataType: "alphabetical",
    sortOrder: undefined,
    isPinned: false,
    isLastPinned: false,
    isLoading: false,
    onClick: noop,
  },
  argTypes: {
    align: { options: ["left", "right"], control: { type: "inline-radio" } },
    dataType: { options: DATA_TYPES, control: { type: "inline-radio" } },
    sortOrder: { options: [undefined, "ascending", "descending"], control: { type: "inline-radio" } },
    width: { control: { type: "number" } },
    isSortable: { control: { type: "boolean" } },
    isPinned: { control: { type: "boolean" } },
    isLastPinned: { control: { type: "boolean" } },
    isLoading: { control: { type: "boolean" } },
    className: { table: { disable: true } },
  },
};

export default meta;

type Story = StoryObj<typeof CellHeader>;


const stack: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-8)" };
const labelled: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-2)" };
const iconRow: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-2)" };

/** Interactive header cell. */
export const Playground: Story = {
  render: (args) => (
    <div style={frame}>
      <TableRow variant="header">
        <CellHeader {...args} />
      </TableRow>
    </div>
  ),
};

/** Label, optional pin icon before it, and the sort icon after it. */
export const Anatomy: Story = {
  render: () => (
    <div style={frame}>
      <TableRow variant="header">
        <CellHeader label="Service" width={FRAME_W} isPinned isSortable dataType="alphabetical" onClick={noop} />
      </TableRow>
    </div>
  ),
};

/** A label that does not fit is truncated, and shows the full text on hover. */
export const Truncation: Story = {
  render: () => (
    <div style={frame}>
      <TableRow variant="header">
        <CellHeader label="Service" width={240} isSortable dataType="alphabetical" onClick={noop} />
        <CellHeader
          label="Estimated duration of the visit"
          width={300}
          isSortable
          dataType="numerical"
          onClick={noop}
        />
      </TableRow>
    </div>
  ),
};

/** Alignment is a column decision — the body cells below must match it. */
export const Alignment: Story = {
  render: () => (
    <div style={frame}>
      <TableRow variant="header">
        <CellHeader label="Service" width={270} isSortable dataType="alphabetical" onClick={noop} />
        <CellHeader label="Total" width={270} align="right" isSortable dataType="numerical" onClick={noop} />
      </TableRow>
    </div>
  ),
};

/**
 * A pinned column shows a thumbtack. The LAST pinned column also draws the
 * boundary line on its right edge.
 */
export const Pinned: Story = {
  render: () => (
    <div style={frame}>
      <TableRow variant="header">
        <CellHeader label="ID" width={160} isPinned isSortable dataType="alphabetical" onClick={noop} />
        <CellHeader label="Service" width={180} isPinned isLastPinned isSortable dataType="alphabetical" onClick={noop} />
        <CellHeader label="Status" width={200} />
      </TableRow>
    </div>
  ),
};

/**
 * Sortability is the axis that decides everything interactive. A sortable
 * header always carries an icon; a non-sortable one carries none and is inert.
 */
export const Sortable: Story = {
  render: () => (
    <div style={{ ...frame, ...stack }}>
      <div style={labelled}>
        <span style={cap}>isSortable</span>
        <TableRow variant="header">
          <CellHeader label="Service" width={FRAME_W} isSortable dataType="alphabetical" onClick={noop} />
        </TableRow>
      </div>
      <div style={labelled}>
        <span style={cap}>not sortable</span>
        <TableRow variant="header">
          <CellHeader label="Status" width={FRAME_W} />
        </TableRow>
      </div>
    </div>
  ),
};

/**
 * The column the table is sorted by is emphasised — darker label, medium
 * weight, and the directional icon in place of the neutral one.
 */
export const Sorted: Story = {
  render: () => (
    <div style={{ ...frame, ...stack }}>
      <div style={labelled}>
        <span style={cap}>not sorted</span>
        <TableRow variant="header">
          <CellHeader label="Service" width={FRAME_W} isSortable dataType="alphabetical" onClick={noop} />
        </TableRow>
      </div>
      <div style={labelled}>
        <span style={cap}>ascending</span>
        <TableRow variant="header">
          <CellHeader label="Service" width={FRAME_W} isSortable dataType="alphabetical" sortOrder="ascending" onClick={noop} />
        </TableRow>
      </div>
      <div style={labelled}>
        <span style={cap}>descending</span>
        <TableRow variant="header">
          <CellHeader label="Service" width={FRAME_W} isSortable dataType="alphabetical" sortOrder="descending" onClick={noop} />
        </TableRow>
      </div>
    </div>
  ),
};

/** One icon pair per data type, ascending and descending. */
export const SortIcons: Story = {
  render: () => (
    <div style={{ ...frame, ...stack }}>
      {DATA_TYPES.map((dataType) => (
        <div key={dataType} style={iconRow}>
          <span style={cap}>{dataType}</span>
          <TableRow variant="header">
            <CellHeader label="Ascending" width={270} isSortable dataType={dataType} sortOrder="ascending" onClick={noop} />
            <CellHeader label="Descending" width={270} isSortable dataType={dataType} sortOrder="descending" onClick={noop} />
          </TableRow>
        </div>
      ))}
    </div>
  ),
};

/** While the table loads, the label becomes a caption-sized skeleton. */
export const Loading: Story = {
  render: () => (
    <div style={frame}>
      <TableRow variant="header">
        <CellHeader label="Service" width={270} isLoading />
        <CellHeader label="Total" width={270} isLoading />
      </TableRow>
    </div>
  ),
};
