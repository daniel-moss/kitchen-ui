import type { Meta, StoryObj } from "@storybook/react";

import { chargesOf, inventoryProductsOf, jobById } from "../../data/db";

import CancelJobForm from "./CancelJobForm";
import FormStoryFrame from "./FormStoryFrame";
import { defaultScheduling } from "./SchedulingForm";

// The "Cancel job" form (Figma 24048-13210) in every state: the plain text
// dialog, the inventory-products block, and the missing reason.
const meta: Meta = {
  title: 'Modules/Job/"Cancel Job" Form',
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

// JOB-1082 (walk-in cooler repair) has R-404A on it, tracked in inventory.
const job = jobById("JOB-1082");
const INVENTORY = job == null ? [] : inventoryProductsOf(chargesOf(job));

const Demo = ({ mobile = false, products = false, press = false }: { mobile?: boolean; products?: boolean; press?: boolean }) => (
  <FormStoryFrame mobile={mobile} icon="ban" press={press ? "Cancel" : undefined}>
    {(open, close) => (
      <CancelJobForm
        open={open}
        onClose={close}
        onCancel={close}
        scheduling={defaultScheduling()}
        inventoryProducts={products ? INVENTORY : []}
        mobile={mobile}
      />
    )}
  </FormStoryFrame>
);

/** No inventory products: one required "Cancel reason". */
export const Desktop: Story = { render: () => <Demo /> };

/** The same, as a mobile drawer — the field fills it. */
export const Mobile: Story = { render: () => <Demo mobile /> };

/** The job uses products tracked in inventory — they go back to stock. */
export const InventoryProducts: Story = { name: "Inventory products", render: () => <Demo products /> };

/** The same, as a mobile drawer — it hugs its content. */
export const InventoryProductsMobile: Story = { name: "Inventory products / Mobile", render: () => <Demo products mobile /> };

/** "Cancel" pressed empty: "Provide Cancel reason". */
export const ReasonMissing: Story = { name: "Reason missing", render: () => <Demo press /> };
