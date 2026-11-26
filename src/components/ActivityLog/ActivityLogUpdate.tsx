import { ReactNode } from "react";

import { Icon } from "../Icon/Icon";

import ActivityLogItem from "./ActivityLogItem";
import Removed from "./ActivityLogRemoved";
import ActivityLogSubItem from "./ActivityLogSubItem";
import Subtle from "./ActivityLogSubtle";
import ActivityLogTextChange from "./ActivityLogTextChange";
import ActivityLogValue from "./ActivityLogValue";
import { ActivityLogUpdateProps } from "./ActivityLogUpdate.types";
import { formatFieldList } from "./fieldList";

const isEmpty = (value: ReactNode) => value == null || value === "";

// ActivityLogUpdate — the log for "someone changed fields", built by the rules
// of the DS doc "Cases":
//  · one field        → a plain log; the sentence names the person, the field,
//                       the old value and the new value. No sub-logs.
//  · one text field   → an accordion; its one sub-log has no title and shows
//                       how the text was edited.
//  · several fields   → an accordion; the sentence names the fields (up to
//                       three, else the first two and "and N more"); one
//                       sub-log per field, with its name.
// A missing old value reads "No value" struck through; a missing new value
// reads "No value" plain.
export default function ActivityLogUpdate({
  person,
  changes,
  verb = "updated",
  subject,
  symbol = <Icon icon="pen" size={14} />,
  emptyText = "No value",
  ...itemProps
}: ActivityLogUpdateProps) {
  if (changes.length === 0) return null;
  const single = changes.length === 1 ? changes[0] : null;

  // One ordinary field — the whole change fits in the sentence.
  if (single && !single.isText) {
    const oldEmpty = isEmpty(single.oldValue);
    const newEmpty = isEmpty(single.newValue);
    const oldIcon = oldEmpty ? undefined : single.oldIcon;
    const newIcon = newEmpty ? undefined : single.newIcon;
    return (
      <ActivityLogItem
        {...itemProps}
        symbol={symbol}
        text={
          <>
            {person}
            <Subtle> {verb} </Subtle>
            {single.label}:{/* A value with an icon brings its own 6px — no word space. */}
            {oldIcon != null ? "" : " "}
            <Removed>
              <ActivityLogValue icon={oldIcon}>{oldEmpty ? emptyText : single.oldValue}</ActivityLogValue>
            </Removed>
            {newIcon != null ? " →" : " → "}
            {newEmpty ? (
              // Cleared: an empty field is not a new value, so it stays plain.
              <Subtle>{emptyText}</Subtle>
            ) : (
              <ActivityLogValue icon={newIcon} iconColor={single.newIconColor}>
                {single.newValue}
              </ActivityLogValue>
            )}
          </>
        }
      />
    );
  }

  // One text field — the sentence names it; the sub-log shows the edit.
  if (single) {
    return (
      <ActivityLogItem
        {...itemProps}
        symbol={symbol}
        text={
          <>
            {person}
            <Subtle> {verb} </Subtle>
            {single.label}
          </>
        }
      >
        <ActivityLogSubItem
          caption={<ActivityLogTextChange oldText={String(single.oldValue ?? "")} newText={String(single.newValue ?? "")} />}
        />
      </ActivityLogItem>
    );
  }

  // Several fields — name them, then one sub-log per field.
  return (
    <ActivityLogItem
      {...itemProps}
      symbol={symbol}
      text={
        <>
          {person}
          <Subtle> {verb} </Subtle>
          {subject ?? formatFieldList(changes.map((change) => change.label))}
        </>
      }
    >
      {changes.map((change) =>
        change.isText ? (
          <ActivityLogSubItem
            key={change.label}
            title={change.label}
            caption={<ActivityLogTextChange oldText={String(change.oldValue ?? "")} newText={String(change.newValue ?? "")} />}
          />
        ) : (
          <ActivityLogSubItem
            key={change.label}
            title={change.label}
            oldValue={change.oldValue}
            oldIcon={change.oldIcon}
            newValue={change.newValue}
            newIcon={change.newIcon}
            newIconColor={change.newIconColor}
            emptyText={emptyText}
          />
        ),
      )}
    </ActivityLogItem>
  );
}
