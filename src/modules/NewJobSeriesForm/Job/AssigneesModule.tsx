import FormModule from "../../../components/FormModule/FormModule";
import AssigneesField from "../../shared/AssigneesField";

// Schedule step — the "Assignees" module (Figma 17241-71044): an optional
// multi-select of technicians. The field itself (list, badges, layout freeze)
// is the shared AssigneesField — the Job Details "Reschedule job" form uses
// the same one. Since 2026-10-22 the picks are dismissable Badges (the
// design's Badge group), no longer a card of list rows.

export interface AssigneesModuleProps {
  /** Selected user ids, latest pick first. */
  value: number[];
  onChange: (next: number[]) => void;
  mobile: boolean;
}

export default function AssigneesModule({ value, onChange, mobile }: AssigneesModuleProps) {
  return (
    <FormModule title="Assignees" titleCondition="optional">
      <AssigneesField value={value} onChange={onChange} mobile={mobile} />
    </FormModule>
  );
}
