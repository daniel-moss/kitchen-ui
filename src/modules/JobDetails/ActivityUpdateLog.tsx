import { Fragment, ReactNode } from "react";

import ActivityLogUpdate from "../../components/ActivityLog/ActivityLogUpdate";
import { ActivityLogFieldChange } from "../../components/ActivityLog/ActivityLogUpdate.types";
import ActivityLogValue from "../../components/ActivityLog/ActivityLogValue";
import AvatarUser from "../../components/Avatar/AvatarUser";
import { Icon } from "../../components/Icon/Icon";

import { FieldChange, LogPerson, ValueIcon } from "./activityEvents";

// The Job Details update logs. Every rule — one field inline, one text field
// as a text change, several fields as a named list with sub-logs, "No value"
// styles, value icons — is the DS's (ActivityLogUpdate, DS doc "Cases"). This
// file only turns the job's own data (FieldChange, ValueIcon, LogPerson) into
// the DS props.

/** A value's glyph (Type / Priority / a time session's status) as a DS icon. */
export const glyph = (icon?: ValueIcon) =>
  icon == null ? undefined : <Icon icon={icon.icon} pack={icon.pack} size={14} container="fixedHeight" />;

/** A person as a log value: their xxs avatar, then their name. */
export const PersonValue = ({ name, avatar }: { name: string; avatar: string }) => (
  <ActivityLogValue icon={<AvatarUser size="xxs" imageSrc={avatar} />} isWhole>
    {name}
  </ActivityLogValue>
);

/** A list of people as ONE value (Assignees). The comma sits tight against the
 *  name before it — the next person's avatar brings the space after it. */
export const PeopleValue = ({ people }: { people: LogPerson[] }) => (
  <>
    {people.map((p, index) => (
      <Fragment key={p.name}>
        {index > 0 && ","}
        <PersonValue name={p.name} avatar={p.avatar} />
      </Fragment>
    ))}
  </>
);

// One side of a change. An EMPTY people list is not a value, so it falls back
// to the text, which may be "" — the DS shows "No value" then.
const side = (text: string, people?: LogPerson[]): ReactNode =>
  people != null && people.length > 0 ? <PeopleValue people={people} /> : text;

const toDs = (change: FieldChange): ActivityLogFieldChange => {
  const oldPeople = change.oldPeople != null && change.oldPeople.length > 0;
  const newPeople = change.newPeople != null && change.newPeople.length > 0;
  return {
    label: change.label,
    isText: change.longText,
    oldValue: side(change.oldValue, change.oldPeople),
    newValue: side(change.newValue, change.newPeople),
    // People carry their avatars inside the value — no extra icon.
    oldIcon: oldPeople ? undefined : glyph(change.oldIcon),
    newIcon: newPeople ? undefined : glyph(change.newIcon),
    newIconColor: change.newIcon?.color,
  };
};

export interface ActivityUpdateLogProps {
  userName: string;
  changes: FieldChange[];
  date: Date;
  /** The timeline symbol. Default: the DS "pen". */
  symbol?: ReactNode;
  /** The words between the user and the change. Default "updated". */
  verb?: string;
  /** Names the object instead of the field list, e.g. a time session. */
  subject?: ReactNode;
}

export default function ActivityUpdateLog({ userName, changes, date, symbol, verb, subject }: ActivityUpdateLogProps) {
  return (
    <ActivityLogUpdate
      person={userName}
      changes={changes.map(toDs)}
      date={date}
      symbol={symbol}
      verb={verb}
      subject={subject}
    />
  );
}
