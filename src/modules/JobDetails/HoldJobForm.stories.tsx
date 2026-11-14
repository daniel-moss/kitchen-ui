import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { jobById } from "../../data/db";
import { CurrentJobIdProvider } from "./currentJob";
import { Equipment, equipmentPoolOf } from "./equipment";
import FormStoryFrame from "./FormStoryFrame";
import HoldJobDetailedForm from "./HoldJobDetailedForm";
import PauseJobForm from "./PauseJobForm";

// The "Hold job" form, DEFAULT variant (Figma 24963-43684) — the Pause job
// build with the Hold copy: Hold status (External then Internal, A to Z),
// Hold reason and Check In / Out. The DETAILED variant (Figma 27210-61490,
// Equipment → Summary → Charges → Status, built 2026-11-14) is the "Detailed /"
// stories, on the demo's JOB-1201. The three viewers:
// a checked-in assignee ("Check out" by default), a checked-out one ("Stay
// checked out") and someone who is not an assignee (no Check In / Out).
const meta: Meta = {
  title: "Modules/Job/Details/Forms/Hold Job",
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const Demo = ({
  mobile = false,
  viewer = "checkedIn",
  press = false,
}: {
  mobile?: boolean;
  viewer?: "checkedIn" | "checkedOut" | "notAssignee";
  press?: boolean;
}) => (
  <FormStoryFrame mobile={mobile} icon="circle-stop" press={press ? "Hold" : undefined}>
    {(open, close) => (
      <PauseJobForm
        open={open}
        onClose={close}
        onPause={close}
        type="on-hold"
        showCheckIn={viewer !== "notAssignee"}
        runningSession={viewer === "checkedIn" ? "Working: 01:30:05" : null}
        mobile={mobile}
      />
    )}
  </FormStoryFrame>
);

/** A checked-in assignee: "Check out" picked, side by side. */
export const Desktop: Story = { render: () => <Demo /> };

/** The same, as a mobile drawer — the two options stack. */
export const Mobile: Story = { render: () => <Demo mobile /> };

/** A checked-out assignee: "Stay checked out" picked. */
export const CheckedOut: Story = { name: "Checked out", render: () => <Demo viewer="checkedOut" /> };

/** The viewer is not an assignee — no Check In / Out. */
export const NotAssignee: Story = { name: "Not an assignee", render: () => <Demo viewer="notAssignee" /> };

/** "Hold" pressed with nothing filled: "Choose Hold status". */
export const MissingValues: Story = { name: "Missing values", render: () => <Demo press /> };

// ---- the Detailed flow (Figma 27210-61490) ------------------------------------

const JOB = jobById("JOB-1201")!;
const POOL: Equipment[] = equipmentPoolOf(JOB.locationId);

function DetailedDemo({ mobile = false, noEquipment = false }: { mobile?: boolean; noEquipment?: boolean }) {
  // The step edits the job's equipment live, so the story keeps it.
  const [equipmentIds, setEquipmentIds] = useState(() =>
    noEquipment ? [] : JOB.equipmentIds.filter((id) => POOL.some((piece) => piece.id === id)),
  );
  return (
  <CurrentJobIdProvider id={JOB.id}>
    <FormStoryFrame mobile={mobile} icon="circle-stop">
      {(open, close) => (
        <HoldJobDetailedForm
          open={open}
          onClose={close}
          onHold={close}
          job={JOB}
          equipmentIds={equipmentIds}
          onEquipmentIdsChange={setEquipmentIds}
          equipmentPool={POOL}
          isEquipmentRequired={noEquipment}
          // A story has no pool to grow — "Add equipment" hands back the first piece.
          onCreateEquipment={() => POOL[0]}
          locationLabel="Wildwood Kitchen"
          runningSession="Working: 01:30:05"
          mobile={mobile}
        />
      )}
    </FormStoryFrame>
  </CurrentJobIdProvider>
  );
}

/** The Detailed flow on JOB-1201: Equipment → Summary (summary required) → Charges → Status. A checked-in assignee. */
export const DetailedDesktop: Story = { name: "Detailed / Desktop", render: () => <DetailedDemo /> };

/** The same, full screen on mobile. */
export const DetailedMobile: Story = { name: "Detailed / Mobile", render: () => <DetailedDemo mobile /> };

/** No equipment on a job that requires it: "No equipment", and Next shows "Choose Equipment" (Figma 29570-48030). */
export const DetailedNoEquipment: Story = {
  name: "Detailed / No equipment (required)",
  render: () => <DetailedDemo noEquipment />,
};
