import { Children, isValidElement, ReactElement, useMemo } from "react";

import clsx from "clsx";

import useIsDesktop from "../../hooks/useIsDesktop";
import InputHelpText from "../InputHelpText/InputHelpText";
import Label from "../Label/Label";
import { Skeleton } from "../Skeleton/Skeleton";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";
import MediaField from "../Fields/MediaField/MediaField";
import TextArea from "../Fields/TextArea/TextArea";
import { InputProvider } from "./InputContext";
import StrengthIndicator from "./StrengthIndicator";

import styles from "./Input.module.scss";
import { InputProps } from "./Input.types";

// Input — the shared field header: an optional Label (with condition, hint
// trigger, and the password strength indicator) plus neutral help text, stacked
// above ONE bare field (TextField, TextArea, SelectField, DateField,
// PasswordField, InputGroup, CheckboxGroup, RadioGroup, MediaField). The field
// carries no label/help text of its own — Input owns everything above it.
// (The old TextArea + MediaField pair was removed 2026-08-06, Daniel: one
// Input = one field, and every field keeps its own label.)
//
// A STRING label also flows down through InputContext, so the field derives
// its label-based copy automatically: the default missing-value message
// ("Enter/Choose/Provide/Add [Label]"), TextArea's clear-Prompt copy, and
// DateField's mobile picker label. See Figma "Input".

// The loading stand-in for the field.
const fieldSkeleton = (el: ReactElement | null, isDesktop: boolean) => {
  const isMedia = el?.type === MediaField;
  const height = el?.type === TextArea ? 102 : isMedia ? (isDesktop ? 180 : 151) : 36;
  return <Skeleton height={height} borderRadius={isMedia ? "var(--border-radius-2)" : "var(--border-radius-1_5)"} />;
};

export default function Input({
  label,
  labelCondition,
  labelHint = false,
  labelHintContent,
  helpText,
  strength,
  isLoading = false,
  children,
  className,
}: InputProps) {
  const hasLabel = label != null;
  const hasHelp = helpText != null;
  const hasHeader = hasLabel || hasHelp || strength != null;

  // MediaField's skeleton is breakpoint-sized, like its empty trigger.
  const isDesktop = useIsDesktop();

  // Exactly ONE field.
  const fields = Children.toArray(children).filter(isValidElement) as ReactElement[];

  // "(read-only)" on the label may ONLY come from the field's real readOnly
  // prop — a manually passed "readOnly" condition is ignored (the type
  // discourages it, but ReactNode can not exclude the string).
  const field = fields.length === 1 ? fields[0] : null;
  const readOnly = (field?.props as { readOnly?: boolean } | undefined)?.readOnly === true;
  const effectiveCondition = readOnly ? "readOnly" : labelCondition === "readOnly" ? undefined : labelCondition;

  const context = useMemo(() => ({ label: typeof label === "string" ? label : undefined }), [label]);

  return (
    <div className={clsx(styles.input, className)}>
      {hasHeader && (
        <div className={styles.header}>
          {(hasLabel || strength != null) && (
            <div className={styles.labelRow}>
              {isLoading ? (
                <SkeletonTypography variant="bodyCompact" />
              ) : (
                <>
                  {hasLabel && (
                    // A span: the fields wrap their inputs in their own
                    // <label> (nested labels are invalid HTML).
                    <Label
                      as="span"
                      className={styles.label}
                      variant="subtle"
                      condition={effectiveCondition}
                      hintTrigger={labelHint}
                      hintContent={labelHintContent}
                    >
                      {label}
                    </Label>
                  )}
                  {strength != null && <StrengthIndicator state={strength} className={styles.strength} />}
                </>
              )}
            </div>
          )}
          {hasHelp &&
            (isLoading ? (
              <SkeletonTypography variant="captionMD" />
            ) : (
              <InputHelpText status="neutral">{helpText}</InputHelpText>
            ))}
        </div>
      )}

      {isLoading ? (
        // The field skeleton — TextArea is 4 rows (102px), MediaField its
        // empty trigger box (151/180px by breakpoint, radius 8), else 36px.
        fieldSkeleton(field, isDesktop)
      ) : (
        <InputProvider value={context}>{children}</InputProvider>
      )}
    </div>
  );
}
