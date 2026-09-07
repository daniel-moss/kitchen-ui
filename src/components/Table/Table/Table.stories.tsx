import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame, noop } from "../../../stories/helpers";
import Badge from "../../Badge/Badge";
import { CellBody } from "../CellBody/CellBody";
import { CellHeader } from "../CellHeader/CellHeader";
import { TableRow } from "../TableRow/TableRow";
import { Table } from "./Table";

// The docs frame is 700px wide with --size-20 (80px) padding, so an example has
// FRAME_W of usable width. The columns add up to it, except in Scrolling, which
// is deliberately wider so the sideways scroll is visible.
const FRAME_W = 540;
// 520, not FRAME_W: a vertical scrollbar steals ~15px, and columns filling the
// full width would then force a horizontal scrollbar as well.
const COLS = { id: 130, service: 170, status: 110, total: 110 };
const frame: React.CSSProperties = docsFrame;

const meta: Meta<typeof Table> = {
  title: "Components/Table/Table",
  component: Table,
  // fullscreen — the stories' own `docsFrame` provides the (only) padding.
  parameters: { layout: "fullscreen" },
  argTypes: {
    header: { control: false },
    children: { control: false },
    className: { table: { disable: true } },
  },
};

export default meta;

type Story = StoryObj<typeof Table>;

const JOBS = [
  { id: "JOB-1043", service: "Walk-in cooler repair", status: "Scheduled", total: "$1,240.00" },
  { id: "JOB-1044", service: "Fryer service", status: "In progress", total: "$980.50" },
  { id: "JOB-1045", service: "Ice machine descale", status: "Complete", total: "$45.00" },
  { id: "JOB-1046", service: "Dishwasher inspection", status: "Scheduled", total: "$320.00" },
];

const header = (
  <TableRow variant="header">
    <CellHeader label="ID" width={COLS.id} isSortable dataType="alphabetical" onClick={noop} />
    <CellHeader label="Service" width={COLS.service} isSortable dataType="alphabetical" sortOrder="ascending" onClick={noop} />
    <CellHeader label="Status" width={COLS.status} />
    <CellHeader label="Total" width={COLS.total} align="right" isSortable dataType="numerical" onClick={noop} />
  </TableRow>
);

const rows = JOBS.map((job) => (
  <TableRow key={job.id} isClickable onClick={noop}>
    <CellBody width={COLS.id}>
      {job.id}
    </CellBody>
    <CellBody width={COLS.service}>{job.service}</CellBody>
    <CellBody width={COLS.status}>
      <Badge>{job.status}</Badge>
    </CellBody>
    <CellBody width={COLS.total} align="right" isTabular>
      {job.total}
    </CellBody>
  </TableRow>
));

/** A header row above a set of body rows. */
export const Playground: Story = {
  render: () => (
    <div style={frame}>
      <Table header={header}>{rows}</Table>
    </div>
  ),
};

/**
 * The header sticks to the top while the rows scroll under it. The row's opaque
 * fill is what keeps the scrolling content from showing through.
 */
export const StickyHeader: Story = {
  render: () => (
    <div style={frame}>
      <div style={{ height: 260 }}>
        <Table header={header}>
        {[0, 1, 2].map((pass) =>
          JOBS.map((job) => (
            <TableRow key={`${pass}-${job.id}`} isClickable onClick={noop}>
              <CellBody width={COLS.id}>
                {job.id}
              </CellBody>
              <CellBody width={COLS.service}>{job.service}</CellBody>
              <CellBody width={COLS.status}>
                <Badge>{job.status}</Badge>
              </CellBody>
              <CellBody width={COLS.total} align="right" isTabular>
                {job.total}
              </CellBody>
            </TableRow>
          )),
          )}
        </Table>
      </div>
    </div>
  ),
};

/**
 * When the columns are wider than the space, the table scrolls sideways. The
 * `isLastPinned` boundary marks where the frozen region ends — here after the
 * ID column.
 */
export const Scrolling: Story = {
  render: () => (
    <div style={{ ...frame, width: FRAME_W + 160 }}>
      <Table
        header={
          <TableRow variant="header">
            <CellHeader label="ID" width={COLS.id} isPinned isLastPinned isSortable dataType="alphabetical" onClick={noop} />
            <CellHeader label="Service" width={220} isSortable dataType="alphabetical" onClick={noop} />
            <CellHeader label="Status" width={140} />
            <CellHeader label="Source" width={160} isSortable dataType="alphabetical" onClick={noop} />
            <CellHeader label="Total" width={130} align="right" isSortable dataType="numerical" onClick={noop} />
          </TableRow>
        }
      >
        {JOBS.map((job) => (
          <TableRow key={job.id} isClickable onClick={noop}>
            <CellBody width={130} isLastPinned>
              {job.id}
            </CellBody>
            <CellBody width={220}>{job.service}</CellBody>
            <CellBody width={140}>
              <Badge>{job.status}</Badge>
            </CellBody>
            <CellBody width={160}>Phone call</CellBody>
            <CellBody width={130} align="right" isTabular>
              {job.total}
            </CellBody>
          </TableRow>
        ))}
      </Table>
    </div>
  ),
};

/** Loading is composed, not a table state: every cell takes its own skeleton. */
export const Loading: Story = {
  render: () => (
    <div style={frame}>
      <Table
        header={
          <TableRow variant="header">
            <CellHeader label="ID" width={COLS.id} isLoading />
            <CellHeader label="Service" width={COLS.service} isLoading />
            <CellHeader label="Status" width={COLS.status} isLoading />
            <CellHeader label="Total" width={COLS.total} isLoading />
          </TableRow>
        }
      >
        {[0, 1, 2, 3].map((row) => (
          <TableRow key={row}>
            <CellBody width={COLS.id} isLoading />
            <CellBody width={COLS.service} isLoading />
            <CellBody width={COLS.status} isLoading />
            <CellBody width={COLS.total} isLoading />
          </TableRow>
        ))}
      </Table>
    </div>
  ),
};
