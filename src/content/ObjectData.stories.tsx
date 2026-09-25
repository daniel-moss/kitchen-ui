import { CSSProperties, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import AvatarClient from "../components/Avatar/AvatarClient";
import AvatarEquipment from "../components/Avatar/AvatarEquipment";
import AvatarEstimate from "../components/Avatar/AvatarEstimate";
import AvatarFile from "../components/Avatar/AvatarFile";
import AvatarLocation from "../components/Avatar/AvatarLocation";
import AvatarTaxRate from "../components/Avatar/AvatarTaxRate";
import AvatarUser from "../components/Avatar/AvatarUser";
import AvatarWarning from "../components/Avatar/AvatarWarning";
import AvatarWarranty from "../components/Avatar/AvatarWarranty";
import ItemText from "../components/ItemText/ItemText/ItemText";

import {
  clientRow,
  contactRow,
  equipmentRow,
  fileRow,
  locationRow,
  ObjectRow,
  taxRateRow,
  warrantyRow,
  workflowObjectRow,
} from "./objectRows";
import { cap, docsFrame } from "../stories/helpers";

// Examples for the "Content/Object data" documentation page. Every row is
// rendered by the real formatters in objectRows.tsx — the page shows what the
// code does, not a re-typed copy of it.

const columnRows: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-20)", width: "100%" };
const pair: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-3)", width: "100%" };
const row: CSSProperties = { display: "flex", alignItems: "center", gap: "var(--size-3)", width: "100%" };

/** One object row: its avatar (or AvatarWarning when the issue rule fired) and its text. */
const Row = ({ avatar, data }: { avatar: ReactNode; data: ObjectRow }) => (
  <div style={row}>
    {data.hasIssue ? <AvatarWarning size="xl" /> : avatar}
    <ItemText variant="titleCaption" title={data.title} caption={data.caption} />
  </div>
);

/** A labelled pair of rows: complete data, then the same object with gaps. */
const Case = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={pair}>
    <span style={cap}>{label}</span>
    {children}
  </div>
);

const CLIENT_AVATAR = <AvatarClient size="xl" type="business" />;
const CONTACT_AVATAR = <AvatarUser size="xl" />;
const EQUIPMENT_AVATAR = <AvatarEquipment size="xl" />;
const FILE_AVATAR = <AvatarFile size="xl" />;
const LOCATION_AVATAR = <AvatarLocation size="xl" />;
const TAX_RATE_AVATAR = <AvatarTaxRate size="xl" />;
const WARRANTY_AVATAR = <AvatarWarranty size="xl" />;
const ESTIMATE_AVATAR = <AvatarEstimate size="xl" status="jobbed" />;

const MARCUS = { firstName: "Marcus", lastName: "Webb" };
const ADDED_ON = new Date(2026, 7, 12);

const meta: Meta = {
  title: "Content/Object data",
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div style={docsFrame}>{Story()}</div>],
};
export default meta;

type Story = StoryObj;

/** The shape every object row shares: an avatar, a title and a caption. */
export const Anatomy: Story = {
  render: () => (
    <Row avatar={CLIENT_AVATAR} data={clientRow({ name: "Bayside Grill", type: "Restaurant", industry: "Casual dining" })} />
  ),
};

export const Client: Story = {
  render: () => (
    <div style={columnRows}>
      <Case label="Complete">
        <Row avatar={CLIENT_AVATAR} data={clientRow({ name: "Bayside Grill", type: "Restaurant", industry: "Casual dining" })} />
      </Case>
      <Case label="No industry — a placeholder, never an issue">
        <Row avatar={CLIENT_AVATAR} data={clientRow({ name: "Bayside Grill", type: "Restaurant" })} />
      </Case>
    </div>
  ),
};

export const Contact: Story = {
  render: () => (
    <div style={columnRows}>
      <Case label="Complete">
        <Row
          avatar={CONTACT_AVATAR}
          data={contactRow({ name: "Marcus Webb", phone: "(415) 555-0142", email: "marcus@baysidegrill.com" })}
        />
      </Case>
      <Case label="One way to reach them is enough — a placeholder, no warning">
        <Row avatar={CONTACT_AVATAR} data={contactRow({ name: "Marcus Webb", phone: "(415) 555-0142" })} />
      </Case>
      <Case label="Neither phone nor email — the issue rule fires">
        <Row avatar={CONTACT_AVATAR} data={contactRow({})} />
      </Case>
    </div>
  ),
};

export const Equipment: Story = {
  render: () => (
    <div style={columnRows}>
      <Case label="Complete">
        <Row
          avatar={EQUIPMENT_AVATAR}
          data={equipmentRow({ name: "Walk-in cooler", manufacturer: "Trane", serial: "4182-KD", model: "WIC-220" })}
        />
      </Case>
      <Case label="Any one of manufacturer, serial or model missing is an issue">
        <Row avatar={EQUIPMENT_AVATAR} data={equipmentRow({ name: "Walk-in cooler", manufacturer: "Trane", serial: "4182-KD" })} />
      </Case>
      <Case label="Nothing but the name">
        <Row avatar={EQUIPMENT_AVATAR} data={equipmentRow({})} />
      </Case>
    </div>
  ),
};

export const File: Story = {
  render: () => (
    <div style={columnRows}>
      <Case label="Complete">
        <Row
          avatar={FILE_AVATAR}
          data={fileRow({ name: "Service report", extension: "pdf", addedOn: ADDED_ON, addedBy: MARCUS })}
        />
      </Case>
      <Case label="No attributed user — “Someone”">
        <Row avatar={FILE_AVATAR} data={fileRow({ name: "Service report", extension: "pdf", addedOn: ADDED_ON })} />
      </Case>
    </div>
  ),
};

export const Location: Story = {
  render: () => (
    <div style={columnRows}>
      <Case label="Complete">
        <Row
          avatar={LOCATION_AVATAR}
          data={locationRow({
            name: "Mission District",
            street: "2201 Bryant Street",
            suite: "Suite 4",
            city: "San Francisco",
            state: "CA",
            postalCode: "94110",
          })}
        />
      </Case>
      <Case label="No name — a placeholder, and not an issue">
        <Row
          avatar={LOCATION_AVATAR}
          data={locationRow({
            street: "2201 Bryant Street",
            suite: "Suite 4",
            city: "San Francisco",
            state: "CA",
            postalCode: "94110",
          })}
        />
      </Case>
    </div>
  ),
};

export const TaxRate: Story = {
  render: () => <Row avatar={TAX_RATE_AVATAR} data={taxRateRow({ name: "San Francisco county", percentage: 8.625 })} />,
};

export const Warranty: Story = {
  render: () => (
    <div style={columnRows}>
      <Case label="Complete">
        <Row
          avatar={WARRANTY_AVATAR}
          data={warrantyRow({ name: "Compressor parts", startDate: new Date(2026, 0, 1), endDate: new Date(2028, 0, 1) })}
        />
      </Case>
      <Case label="The end date is optional — a placeholder, not an issue">
        <Row avatar={WARRANTY_AVATAR} data={warrantyRow({ name: "Compressor parts", startDate: new Date(2026, 0, 1) })} />
      </Case>
    </div>
  ),
};

export const WorkflowObjects: Story = {
  render: () => (
    <div style={columnRows}>
      <Case label="Complete">
        <Row
          avatar={ESTIMATE_AVATAR}
          data={workflowObjectRow({
            id: "EST-1042",
            status: "Jobbed",
            statusChangedOn: new Date(2026, 0, 1),
            statusChangedBy: { firstName: "Lorne", lastName: "Reed" },
          })}
        />
      </Case>
      <Case label="No attributed user — “Someone”">
        <Row
          avatar={ESTIMATE_AVATAR}
          data={workflowObjectRow({ id: "EST-1042", status: "Jobbed", statusChangedOn: new Date(2026, 0, 1) })}
        />
      </Case>
    </div>
  ),
};

/** Only the missing half turns placeholder — the value beside it is untouched. */
export const PlaceholderColor: Story = {
  render: () => (
    <div style={columnRows}>
      <Case label="One value missing">
        <Row avatar={CLIENT_AVATAR} data={clientRow({ name: "Bayside Grill", type: "Restaurant" })} />
      </Case>
      <Case label="Both values missing">
        <Row avatar={CLIENT_AVATAR} data={clientRow({ name: "Bayside Grill" })} />
      </Case>
    </div>
  ),
};
