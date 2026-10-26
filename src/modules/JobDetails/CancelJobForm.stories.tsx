import type { Meta, StoryObj } from "@storybook/react";

import { chargesOf, inventoryProductsOf, jobById } from "../../data/db";

import CancelJobForm from "./CancelJobForm";
import FormStoryFrame from "./FormStoryFrame";
import { defaultScheduling } from "./SchedulingForm";

// The "Cancel job" form (Figma 24048-13210) in every state: the reason alone,
// the inventory-products block (one product / several, one with no
// description), and the missing reason.
const meta: Meta = {
  title: 'Modules/Job/Details/Forms/Cancel Job',
  parameters: { controls: { disable: true }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const inventoryOf = (id: string) => {
  const job = jobById(id);
  return job == null ? [] : inventoryProductsOf(chargesOf(job));
};
// JOB-1082 (walk-in cooler repair): R-404A, the one tracked product.
const ONE = inventoryOf("JOB-1082");
// JOB-1203 (walk-in freezer door repair): gasket + hinge kit; the hinge's
// product has no description.
const SEVERAL = inventoryOf("JOB-1203");

const Demo = ({ mobile = false, products, press = false }: { mobile?: boolean; products?: "one" | "several"; press?: boolean }) => (
  <FormStoryFrame mobile={mobile} icon="ban" press={press ? "Cancel" : undefined}>
    {(open, close) => (
      <CancelJobForm
        open={open}
        onClose={close}
        onCancel={close}
        scheduling={defaultScheduling()}
        inventoryProducts={products === "one" ? ONE : products === "several" ? SEVERAL : []}
        mobile={mobile}
      />
    )}
  </FormStoryFrame>
);

/** No inventory products: one required "Cancel reason". */
export const Desktop: Story = { render: () => <Demo /> };

/** The same, as a mobile drawer with a drag handle — it hugs its content. */
export const Mobile: Story = { render: () => <Demo mobile /> };

/** One product tracked in inventory goes back to stock. */
export const OneProduct: Story = { name: "Inventory products / One", render: () => <Demo products="one" /> };

/** Several products — the second has no description. */
export const SeveralProducts: Story = { name: "Inventory products / Several", render: () => <Demo products="several" /> };

/** Several products, as a mobile drawer. */
export const SeveralProductsMobile: Story = {
  name: "Inventory products / Several / Mobile",
  render: () => <Demo products="several" mobile />,
};

/** "Cancel" pressed empty: "Provide Cancel reason". */
export const ReasonMissing: Story = { name: "Reason missing", render: () => <Demo press /> };
