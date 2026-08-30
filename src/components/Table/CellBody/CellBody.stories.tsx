import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame, noop } from "../../../stories/helpers";
import AvatarGroup from "../../Avatar/AvatarGroup";
import AvatarUser from "../../Avatar/AvatarUser";
import Badge from "../../Badge/Badge";
import BadgeJobStatus from "../../Badge/BadgeJobStatus";
import { Icon } from "../../Icon/Icon";
import IconButton from "../../IconButton/IconButton";
import { TableRow } from "../TableRow/TableRow";
import { CellBody } from "./CellBody";
import { CellColorScheme } from "./CellBody.types";

const COLOR_SCHEMES: CellColorScheme[] = ["default", "subtle", "success", "warning", "caution", "error"];

// The docs frame is 700px wide with --size-20 (80px) padding, so an example has
// FRAME_W of usable width. Every story's cell widths add up to it: the row's
// `min-width: 100%` then resolves to exactly the cells' own total, so the row
// neither stretches past them nor leaves the preview box half empty.
const FRAME_W = 540;
const frame: React.CSSProperties = docsFrame;

const meta: Meta<typeof CellBody> = {
  title: "Components/Table/CellBody",
  component: CellBody,
  // fullscreen — the stories' own `docsFrame` provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: {
    children: "Walk-in cooler repair",
    align: "left",
    colorScheme: "default",
    isTabular: false,
    width: FRAME_W,
    isLastPinned: false,
    isLoading: false,
  },
  argTypes: {
    align: { options: ["left", "right"], control: { type: "inline-radio" } },
    colorScheme: { options: COLOR_SCHEMES, control: { type: "inline-radio" } },
    isTabular: { control: { type: "boolean" } },
    width: { control: { type: "number" } },
    isLastPinned: { control: { type: "boolean" } },
    isLoading: { control: { type: "boolean" } },
    slotLeft: { control: false },
    slotRight: { control: false },
    tooltip: { control: false },
    className: { table: { disable: true } },
  },
};

export default meta;

type Story = StoryObj<typeof CellBody>;

const stack: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-8)" };
const labelled: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-2)" };

const people = [
  { content: "letters" as const, characters: "DM", name: "Daniel Moss" },
  { content: "letters" as const, characters: "AT", name: "Alex Turner" },
  { content: "letters" as const, characters: "RK", name: "Rosa Klein" },
  { content: "letters" as const, characters: "SP", name: "Sam Price" },
];

/** Interactive cell. */
export const Playground: Story = {
  render: (args) => (
    <div style={frame}>
      <TableRow>
        <CellBody {...args} />
      </TableRow>
    </div>
  ),
};

// ---- Anatomy ---------------------------------------------------------------

/** The value, with 16px of padding on each side. Height comes from the row. */
export const Anatomy: Story = {
  render: () => (
    <div style={frame}>
      <TableRow>
        <CellBody width={FRAME_W}>Walk-in cooler repair</CellBody>
      </TableRow>
    </div>
  ),
};

/**
 * Alignment is a column decision — set the same value on the column's
 * CellHeader.
 */
export const Alignment: Story = {
  render: () => (
    <div style={frame}>
      <TableRow>
        <CellBody width={270}>Walk-in cooler repair</CellBody>
        <CellBody width={270} align="right" isTabular>
          $1,240.00
        </CellBody>
      </TableRow>
    </div>
  ),
};

/**
 * `slotRight` holds a trailing action. It sits outside the truncating value, so
 * it is never clipped by a long string.
 */
export const SlotRight: Story = {
  render: () => (
    <div style={frame}>
      <TableRow>
        <CellBody
          width={FRAME_W}
          slotRight={<IconButton icon="copy" size="md" variant="muted" aria-label="Copy link" onClick={noop} />}
        >
          https://roopairs.com/clients/wildwood-kitchen
        </CellBody>
      </TableRow>
    </div>
  ),
};

/**
 * The pinned boundary sits on the trailing edge of the LAST pinned column, so
 * it travels with the frozen region and lines up with the header above.
 */
export const LastPinned: Story = {
  render: () => (
    <div style={frame}>
      {["JOB-1043", "JOB-1044"].map((id) => (
        <TableRow key={id}>
          <CellBody width={160} isTabular isLastPinned>
            {id}
          </CellBody>
          <CellBody width={380}>Walk-in cooler repair</CellBody>
        </TableRow>
      ))}
    </div>
  ),
};

// ---- Content: Text ---------------------------------------------------------

/** A string in the cell's own typography — `body-400-compact`, unchangeable. */
export const Text: Story = {
  render: () => (
    <div style={frame}>
      <TableRow>
        <CellBody width={FRAME_W}>Walk-in cooler repair</CellBody>
      </TableRow>
    </div>
  ),
};

/** Hover the second cell: the copy does not fit, so the cell shows all of it. */
export const TextTruncated: Story = {
  render: () => (
    <div style={frame}>
      <TableRow>
        <CellBody width={270}>Walk-in cooler repair</CellBody>
        <CellBody width={270}>A service name long enough that it will not fit its column</CellBody>
      </TableRow>
    </div>
  ),
};

/** Hover the cell: the copy fits, and the tooltip still carries extra data. */
export const TextTooltip: Story = {
  render: () => (
    <div style={frame}>
      <TableRow>
        <CellBody width={FRAME_W} tooltip="Created by Rosa Klein on 12 Aug 2026">
          Walk-in cooler repair
        </CellBody>
      </TableRow>
    </div>
  ),
};

/** The left slot takes an icon or an avatar. Both keep their own size. */
export const TextSlotLeft: Story = {
  render: () => (
    <div style={{ ...frame, ...stack }}>
      <div style={labelled}>
        <span style={cap}>icon</span>
        <TableRow>
          <CellBody width={FRAME_W} slotLeft={<Icon icon="wrench-simple" size={14} />}>
            Walk-in cooler repair
          </CellBody>
        </TableRow>
      </div>
      <div style={labelled}>
        <span style={cap}>avatar</span>
        <TableRow>
          <CellBody width={FRAME_W} slotLeft={<AvatarUser size="md" content="letters" characters="RK" />}>
            Rosa Klein
          </CellBody>
        </TableRow>
      </div>
    </div>
  ),
};

/** The icon takes the scheme's colour on every variant but default and subtle. */
export const ColorSchemes: Story = {
  render: () => (
    <div style={frame}>
      {COLOR_SCHEMES.map((scheme) => (
        <TableRow key={scheme}>
          <CellBody width={200} colorScheme="subtle">
            {scheme}
          </CellBody>
          <CellBody width={340} colorScheme={scheme} slotLeft={<Icon icon="diamonds-4" size={14} />}>
            Low stock
          </CellBody>
        </TableRow>
      ))}
    </div>
  ),
};

/**
 * A cell with no value draws the placeholder itself, in the cell's own
 * alignment — so an empty row can never break the column's edge.
 */
export const Empty: Story = {
  render: () => (
    <div style={{ ...frame, ...stack }}>
      <div style={labelled}>
        <span style={cap}>left-aligned column</span>
        <TableRow>
          <CellBody width={FRAME_W} />
        </TableRow>
      </div>
      <div style={labelled}>
        <span style={cap}>right-aligned column</span>
        <TableRow>
          <CellBody width={FRAME_W} align="right" />
        </TableRow>
      </div>
    </div>
  ),
};

/** A typography skeleton, filling the width. */
export const Loading: Story = {
  render: () => (
    <div style={frame}>
      {[0, 1, 2].map((row) => (
        <TableRow key={row}>
          <CellBody width={200} isLoading />
          <CellBody width={340} isLoading />
        </TableRow>
      ))}
    </div>
  ),
};

// ---- Content: Badge --------------------------------------------------------

/** Any badge is accepted, at its own fixed size. */
export const BadgeContent: Story = {
  render: () => (
    <div style={frame}>
      <TableRow>
        <CellBody width={200} colorScheme="subtle">
          Status
        </CellBody>
        <CellBody width={340} content="badge">
          <BadgeJobStatus status="active" />
        </CellBody>
      </TableRow>
      <TableRow>
        <CellBody width={200} colorScheme="subtle">
          Labels
        </CellBody>
        <CellBody width={340} content="badge">
          <Badge>Refrigeration</Badge>
          <Badge>Warranty</Badge>
        </CellBody>
      </TableRow>
    </div>
  ),
};

/** Three or more: the first badge stays, the rest become "+N". Hover for all. */
export const BadgeOverflow: Story = {
  render: () => (
    <div style={frame}>
      <TableRow>
        <CellBody width={FRAME_W} content="badge">
          <Badge>🔥 Hot side</Badge>
          <Badge>🚘 Long distance</Badge>
          <Badge>📍 Inconvenient location</Badge>
        </CellBody>
      </TableRow>
    </div>
  ),
};

/** A badge cell can carry extra data too, with nothing collapsed. */
export const BadgeTooltip: Story = {
  render: () => (
    <div style={frame}>
      <TableRow>
        <CellBody width={FRAME_W} content="badge" tooltip="Set by dispatch">
          <BadgeJobStatus status="active" />
        </CellBody>
      </TableRow>
    </div>
  ),
};

/** No badges — the same placeholder as a text cell. */
export const BadgeEmpty: Story = {
  render: () => (
    <div style={frame}>
      <TableRow>
        <CellBody width={FRAME_W} content="badge" />
      </TableRow>
    </div>
  ),
};

/** One badge in its loading state — not a text skeleton. */
export const BadgeLoading: Story = {
  render: () => (
    <div style={frame}>
      {[0, 1, 2].map((row) => (
        <TableRow key={row}>
          <CellBody width={FRAME_W} content="badge" isLoading />
        </TableRow>
      ))}
    </div>
  ),
};

// ---- Content: Assignee -----------------------------------------------------

/** One assignee, at the fixed avatar size. Hover to see the name. */
export const AssigneeContent: Story = {
  render: () => (
    <div style={frame}>
      <TableRow>
        <CellBody width={200} colorScheme="subtle">
          Tech
        </CellBody>
        <CellBody width={340} content="assignee">
          <AvatarGroup size="md" items={people.slice(0, 1)} />
        </CellBody>
      </TableRow>
    </div>
  ),
};

/**
 * The cell sizes the group to the width it has — the narrow column keeps fewer
 * faces and counts the rest. Hover either to see everyone.
 */
export const AssigneeGroup: Story = {
  render: () => (
    <div style={frame}>
      <TableRow>
        <CellBody width={90} content="assignee">
          <AvatarGroup size="md" items={people} />
        </CellBody>
        <CellBody width={450} content="assignee">
          <AvatarGroup size="md" items={people} />
        </CellBody>
      </TableRow>
    </div>
  ),
};

/** Nobody assigned: a dashed avatar, and hovering says so. */
export const AssigneeEmpty: Story = {
  render: () => (
    <div style={frame}>
      <TableRow>
        <CellBody width={FRAME_W} content="assignee" />
      </TableRow>
    </div>
  ),
};

/** A single avatar in its loading state — not a text skeleton. */
export const AssigneeLoading: Story = {
  render: () => (
    <div style={frame}>
      {[0, 1, 2].map((row) => (
        <TableRow key={row}>
          <CellBody width={FRAME_W} content="assignee" isLoading />
        </TableRow>
      ))}
    </div>
  ),
};

// ---- Content: Number -------------------------------------------------------

/**
 * Numbers are right-aligned and tabular, so the digits line up down the column.
 * The left column below is the same values without `isTabular`.
 */
export const NumberContent: Story = {
  render: () => (
    <div style={frame}>
      {["$1,240.00", "$980.50", "$45.00"].map((value) => (
        <TableRow key={value}>
          <CellBody width={270} align="right">
            {value}
          </CellBody>
          <CellBody width={270} content="number">
            {value}
          </CellBody>
        </TableRow>
      ))}
    </div>
  ),
};

/** A number's left slot takes an icon only — never an avatar. */
export const NumberSlotLeft: Story = {
  render: () => (
    <div style={frame}>
      <TableRow>
        <CellBody width={FRAME_W} content="number" slotLeft={<Icon icon="arrow-up" size={14} />}>
          $1,240.00
        </CellBody>
      </TableRow>
    </div>
  ),
};

/** The same six schemes, and the same rule for the icon. */
export const NumberColorSchemes: Story = {
  render: () => (
    <div style={frame}>
      {COLOR_SCHEMES.map((scheme) => (
        <TableRow key={scheme}>
          <CellBody width={200} colorScheme="subtle">
            {scheme}
          </CellBody>
          <CellBody
            width={340}
            content="number"
            colorScheme={scheme}
            slotLeft={<Icon icon="diamonds-4" size={14} />}
          >
            $45.00
          </CellBody>
        </TableRow>
      ))}
    </div>
  ),
};
