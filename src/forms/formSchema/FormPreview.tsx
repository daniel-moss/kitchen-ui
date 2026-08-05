import FormModule from "../../components/FormModule/FormModule";
import FormModuleGroup from "../../components/FormModule/FormModuleGroup";
import ValueDisplay from "../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../components/ValueDisplay/ValueDisplayGroup";

import { buildFormPreview } from "./answerText";
import { FormPreviewProps } from "./FormPreview.types";
import { PreviewAnswer } from "./schema.types";

type TextAnswer = Extract<PreviewAnswer, { kind: "text" }>;
// Media answers are BUILT already, but nothing renders them yet: the design
// (Figma 24469-38229) puts CardFile tiles inside a vertical ValueDisplay, and
// the DS component has no file value kind — Daniel is updating ValueDisplay
// first (2026-08-05). Dropping this filter is all that is needed afterwards.
const isTextAnswer = (answer: PreviewAnswer): answer is TextAnswer => answer.kind === "text";

// FormPreview — a completed form, read-only. The structure mirrors the form
// one-to-one (Figma "Mapping / FormModuleGroup -> Preview" 24470-39311):
// FormModuleGroup (32px + Divider between modules) → FormModule (title +
// caption) → ValueDisplayGroup (answers 12px apart, Divider between each) →
// a vertical ValueDisplay per answer. What the form shows and the preview does
// NOT: the AlertBanner, help texts, the "(optional)" tags and the title's hint
// icon. A module title is dropped only when the form itself has no modules
// (a flat form like Hot Side - Repair) — that case is not in Figma.
export default function FormPreview({ schema, answers, className }: FormPreviewProps) {
  const modules = buildFormPreview(schema, answers)
    .map((module) => ({ ...module, answers: module.answers.filter(isTextAnswer) }))
    .filter((module) => module.answers.length > 0);

  // A completed form always has answers, so this is a guard, not a state.
  if (modules.length === 0) return null;

  return (
    <FormModuleGroup className={className}>
      {modules.map((module) => {
        const body = (
          <ValueDisplayGroup key={module.id}>
            {module.answers.map((answer) => (
              <ValueDisplay key={answer.key} orientation="vertical" label={answer.label} value={answer.value} />
            ))}
          </ValueDisplayGroup>
        );
        if (module.title == null) return body;
        return (
          <FormModule key={module.id} title={module.title} caption={module.caption}>
            {body}
          </FormModule>
        );
      })}
    </FormModuleGroup>
  );
}
