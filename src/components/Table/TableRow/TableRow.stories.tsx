import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame, noop } from "../../../stories/helpers";
import Badge from "../../Badge/Badge";
import { CellBody } from "../CellBody/CellBody";
import { CellHeader } from "../CellHeader/CellHeader";
import { TableRow } from "./TableRow";

// The docs frame is 700px wide with --size-20 (80px) padding, so an example has
// FRAME_W of usable width. Every story's cell widths add up to it: the row's
// `min-width: 100%` then resolves to exactly the cells' own total, so the row
// neither stretches past them nor leaves the preview box half empty.
const FRAME_W = 540;
const frame: React.CSSProperties = docsFrame;

const meta: Meta<typeof TableRow> = {
  title: "Components/Table/TableRow",
  component: TableRow,
  // fullscreen — the stories' own `docsFrame` provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: { variant: "body", isClickable: false, onClick: noop },
  argTypes: {
    variant: { options: ["header", "body"], control: { type: "inline-radio" } },
    isClickable: { control: { type: "boolean" } },
    children: { control: false },
    className: { table: { disable: true } },
  },
};

export default meta;

type Story = StoryObj<typeof TableRow>;


const stack: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-8)" };
const labelled: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-2)" };

const headerCells = (
  <>
    <CellHeader label="ID" width={130} isSortable dataType="alphabetical" onClick={noop} />
    <CellHeader label="Service" width={270} isSortable dataType="alphabetical" onClick={noop} />
    <CellHeader label="Total" width={140} align="right" isSortable dataType="numerical" onClick={noop} />
  </>
);

const bodyCells = (
  <>
    <CellBody width={130}>
      JOB-1043
    </CellBody>
    <CellBody width={270}>Walk-in cooler repair</CellBody>
    <CellBody width={140} align="right" isTabular>
      $1,240.00
    </CellBody>
  </>
);

/** Interactive row. Switch `variant` to compare the two heights. */
export const Playground: Story = {
  render: (args) => (
    <div style={frame}>
      <TableRow {...args}>{args.variant === "header" ? headerCells : bodyCells}</TableRow>
    </div>
  ),
};

/** The header row: 40px of cells plus the 1px divider below — 41px in total. */
export const HeaderRow: Story = {
  render: () => (
    <div style={frame}>
      <TableRow variant="header">{headerCells}</TableRow>
    </div>
  ),
};

/** The body row: 48px of cells plus the 1px divider below — 49px in total. */
export const BodyRow: Story = {
  render: () => (
    <div style={frame}>
      <TableRow>{bodyCells}</TableRow>
    </div>
  ),
};

/** A header row is never interactive, whatever its cells do. */
export const HeaderInteraction: Story = {
  render: () => (
    <div style={frame}>
      <TableRow variant="header">{headerCells}</TableRow>
    </div>
  ),
};

/**
 * Only a clickable body row reacts. A static row has no hover, no pressed
 * state, and no keyboard focus.
 */
export const Clickable: Story = {
  render: () => (
    <div style={{ ...frame, ...stack }}>
      <div style={labelled}>
        <span style={cap}>isClickable</span>
        <TableRow isClickable onClick={noop}>
          <CellBody width={200}>Walk-in cooler repair</CellBody>
          <CellBody width={340} colorScheme="subtle">
            hover, press and focus
          </CellBody>
        </TableRow>
      </div>
      <div style={labelled}>
        <span style={cap}>static</span>
        <TableRow>
          <CellBody width={200}>Fryer service</CellBody>
          <CellBody width={340} colorScheme="subtle">
            no states, not focusable
          </CellBody>
        </TableRow>
      </div>
    </div>
  ),
};

/** Rows stacked into a small table — one header row, three body rows. */
export const Table: Story = {
  render: () => (
    <div style={frame}>
      <TableRow variant="header">
        <CellHeader label="ID" width={120} isPinned isLastPinned isSortable dataType="alphabetical" onClick={noop} />
        <CellHeader label="Service" width={190} isSortable dataType="alphabetical" sortOrder="ascending" onClick={noop} />
        <CellHeader label="Status" width={120} />
        <CellHeader label="Total" width={110} align="right" isSortable dataType="numerical" onClick={noop} />
      </TableRow>
      {[
        { id: "JOB-1043", service: "Walk-in cooler repair", status: "Scheduled", total: "$1,240.00" },
        { id: "JOB-1044", service: "Fryer service", status: "In progress", total: "$980.50" },
        { id: "JOB-1045", service: "Ice machine descale", status: "Complete", total: "$45.00" },
      ].map((job) => (
        <TableRow key={job.id} isClickable onClick={noop}>
          <CellBody width={120} isLastPinned>
            {job.id}
          </CellBody>
          <CellBody width={190}>{job.service}</CellBody>
          <CellBody width={120}>
            <Badge>{job.status}</Badge>
          </CellBody>
          <CellBody width={110} align="right" isTabular>
            {job.total}
          </CellBody>
        </TableRow>
      ))}
    </div>
  ),
};

/** Loading: the header and every body cell take their own skeleton. */
export const Loading: Story = {
  render: () => (
    <div style={frame}>
      <TableRow variant="header">
        <CellHeader label="ID" width={130} isLoading />
        <CellHeader label="Service" width={270} isLoading />
        <CellHeader label="Total" width={140} isLoading />
      </TableRow>
      {[0, 1, 2, 3].map((row) => (
        <TableRow key={row}>
          <CellBody width={130} isLoading />
          <CellBody width={270} isLoading />
          <CellBody width={140} isLoading />
        </TableRow>
      ))}
    </div>
  ),
};
