import FormModule from "../../../components/FormModule/FormModule";
import { JOB_LABELS } from "../../../data/db";
import LabelsField from "../../shared/LabelsField";

// The "Labels" module of the "New Job" form (Figma 17216-69650): an optional
// FormModule holding the shared Labels field (field + badges + the shared
// "Labels" SelectList, file XBFKW2ThcuVxPbQQHw1XY2).

// Labels created in the flow — module scope, like the created sources, so they
// outlive one form.
const sessionLabels: string[] = [];

export interface LabelsModuleProps {
  value: string[];
  onChange: (labels: string[]) => void;
  mobile: boolean;
}

export default function LabelsModule({ value, onChange, mobile }: LabelsModuleProps) {
  return (
    <FormModule title="Labels" titleCondition="optional">
      <LabelsField
        value={value}
        onChange={onChange}
        pool={[...JOB_LABELS.map((row) => row.name), ...sessionLabels]}
        onCreate={(name) => {
          if (!sessionLabels.includes(name)) sessionLabels.push(name);
        }}
        mobile={mobile}
      />
    </FormModule>
  );
}
