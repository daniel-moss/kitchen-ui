import { Fragment, ReactNode, useMemo } from "react";

import ActivityLogItem from "../../components/ActivityLog/ActivityLogItem";
import Em from "../../components/ActivityLog/ActivityLogEmphasis";
import AvatarUser from "../../components/Avatar/AvatarUser";
import { Divider } from "../../components/Divider/Divider";
import { Icon } from "../../components/Icon/Icon";

import { FieldChange, LogPerson, ValueIcon } from "./activityEvents";
import { diffWords } from "./textDiff";

import styles from "./ActivityUpdateLog.module.scss";

// The three update-log shapes Daniel is testing (Figma 24442-56041 / 24442-56092
// / 24435-55755 and 24509-62472):
//   1 short field  → a plain row, values inline, no accordion
//   1 TextArea     → an accordion whose body is just the two versions
//   2+ fields      → an accordion naming the CHANGED PROPERTIES, one sub-log
//                    per field
// All PROTOTYPE-LOCAL — the DS ActivityLog is untouched.

const EMPTY = "No value";

// The multi-field row lists the properties that changed (Figma 24509-62472,
// which replaced the older '"<module>" module' wording). Past this many the
// tail collapses to "and N more" so a big edit cannot push the row to three
// lines (Daniel, 2026-08-06).
const MAX_LISTED_PROPERTIES = 3;

/** `A, B, C` · `A, B, C and 2 more` — the changed properties, in change order. */
const propertyList = (changes: FieldChange[]) => {
  const labels = changes.map((change) => change.label);
  if (labels.length <= MAX_LISTED_PROPERTIES) return labels.join(", ");
  const shownLabels = labels.slice(0, MAX_LISTED_PROPERTIES).join(", ");
  return `${shownLabels} and ${labels.length - MAX_LISTED_PROPERTIES} more`;
};

const shown = (value: string) => (value === "" ? EMPTY : value);

// The separator before the new value. A glyph brings its own 6px leading gap,
// so the trailing word space is dropped — otherwise the two would stack and the
// gap would read wider before an icon than before plain text.
const arrow = (hasIcon: boolean) => (hasIcon ? " →" : " → ");

/** A de-emphasised run in a log sentence — the value that was replaced. */
export const Muted = ({ children }: { children: ReactNode }) => <span className={styles.muted}>{children}</span>;

// A value's glyph (Type / Priority / a time session's status). The OLD side is
// always muted, so it drops the icon's own tint; the NEW side keeps it (Urgent's
// orange, No-priority's gray). Only values that carry a glyph render one.
export const ValueGlyph = ({ icon, muted = false }: { icon?: ValueIcon; muted?: boolean }) =>
  icon == null ? null : (
    <span className={styles.valueIcon} style={muted || icon.color == null ? undefined : { color: icon.color }}>
      <Icon icon={icon.icon} pack={icon.pack} size={14} container="fixedHeight" />
    </span>
  );

// A PERSON in a log value: their xxs avatar then their name (Daniel,
// 2026-08-04 — the same idea as a value's glyph; used by the job-contact logs
// and by the Assignees list. xs was tried and reverted, it made the sentence
// wrap too early).
// The avatar keeps its full colour on the OLD side too: the struck-through
// name already says the value was replaced, and a faded photo just looks
// muddy. Like the glyph, it brings its own 6px gaps, so the sentence around it
// carries no plain spaces.
export const PersonValue = ({ name, avatar }: { name: string; avatar: string }) => (
  <span className={styles.valuePair}>
    <span className={styles.valueAvatar}>
      <AvatarUser size="xxs" imageSrc={avatar} />
    </span>
    {name}
  </span>
);

// A list of people as ONE value (Assignees). The comma sits tight against the
// name before it — the next person's avatar supplies the gap after it.
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

// A value with its glyph. The pair never breaks across a line — otherwise the
// icon can be left stranded at the end of a line with its value on the next one.
// Only short values carry glyphs (Type / Priority), so nowrap costs nothing.
const ValueWithIcon = ({ icon, text, muted = false }: { icon?: ValueIcon; text: string; muted?: boolean }) =>
  icon == null ? (
    <>{text}</>
  ) : (
    <span className={styles.valuePair}>
      <ValueGlyph icon={icon} muted={muted} />
      {text}
    </span>
  );

// One side of a change: a list of people, or a value with its optional glyph.
// An EMPTY people list is not a value at all, so it falls back to the text —
// which `shown` turns into the "No value" placeholder.
const ChangeValue = ({
  people,
  icon,
  text,
  muted = false,
}: {
  people?: LogPerson[];
  icon?: ValueIcon;
  text: string;
  muted?: boolean;
}) =>
  people != null && people.length > 0 ? (
    <PeopleValue people={people} />
  ) : (
    <ValueWithIcon icon={icon} text={text} muted={muted} />
  );

/** Does this side OPEN with a glyph or an avatar? Both bring their own 6px
 *  gap, so the sentence before them must not add a plain space. */
const leads = (icon?: ValueIcon, people?: LogPerson[]) => icon != null || (people != null && people.length > 0);

// old → new on one line, for a short value.
const ShortChange = ({ change }: { change: FieldChange }) => (
  <span className={styles.shortValue}>
    <span className={styles.old}>
      <ChangeValue people={change.oldPeople} icon={change.oldIcon} text={shown(change.oldValue)} muted />
    </span>
    {arrow(leads(change.newIcon, change.newPeople))}
    <span className={styles.new}>
      <ChangeValue people={change.newPeople} icon={change.newIcon} text={shown(change.newValue)} />
    </span>
  </span>
);

// A TextArea value: ONE merged paragraph with the edit marked inside it
// (Figma 24489-50029, Daniel's Linear-style idea, 2026-08-04) — removed words
// struck through, added words on an amber highlight, the rest plain. It
// replaced the old "old ↓ new" stack: two full paragraphs made the reader find
// the difference themselves.
const StackedChange = ({ change }: { change: FieldChange }) => {
  // The whole log list re-renders on any job change, and a symbol diff is the
  // one thing here that is not free — keep it until the text itself changes.
  const runs = useMemo(() => diffWords(change.oldValue, change.newValue), [change.oldValue, change.newValue]);
  return (
    <span className={styles.stackedValue}>
      {runs.map((run, index) => (
        <span
          // Runs have no id of their own and the list is rebuilt whole on every
          // render, so the index IS the identity here.
          key={index}
          className={run.kind === "removed" ? styles.diffRemoved : run.kind === "added" ? styles.diffAdded : undefined}
        >
          {run.text}
        </span>
      ))}
    </span>
  );
};

/**
 * A sub-log holding one FREE-TEXT value — the job's Start / Pause / Resume /
 * Cancel reason (Figma 24515-63361 / 63391 / 63421 / 63451). Same shape as a
 * changed field, but the value is a paragraph instead of an old → new pair.
 */
export const ReasonSubLog = ({ title, value }: { title: string; value: string }) => (
  <div className={styles.subStack}>
    <div className={styles.subItem}>
      <span className={styles.subIcon}>
        <Icon icon="arrow-turn-down-right" size={14} />
      </span>
      <div className={styles.subText}>
        <span className={styles.subTitle}>{title}</span>
        <span className={styles.stackedValue}>{value}</span>
      </div>
    </div>
  </div>
);

// One changed field: its name over the change.
const SubItem = ({ change }: { change: FieldChange }) => (
  <div className={styles.subItem}>
    <span className={styles.subIcon}>
      <Icon icon="arrow-turn-down-right" size={14} />
    </span>
    <div className={styles.subText}>
      <span className={styles.subTitle}>{change.label}</span>
      {change.longText ? <StackedChange change={change} /> : <ShortChange change={change} />}
    </div>
  </div>
);

export interface ActivityUpdateLogProps {
  userName: string;
  changes: FieldChange[];
  date: Date;
  /** The timeline glyph. Default: the `pen` of a module edit. */
  symbol?: ReactNode;
  /** The words between the user and the change. Default "updated". */
  verb?: string;
  /**
   * What the multi-field row names instead of the property list, e.g. the time
   * session's own "Travelling: Mon, Jan 1 at 11:30 AM → …" (Figma 24511-62572).
   */
  subject?: ReactNode;
}

export default function ActivityUpdateLog({
  userName,
  changes,
  date,
  symbol = <Icon icon="pen" size={14} />,
  verb = "updated",
  subject,
}: ActivityUpdateLogProps) {
  const single = changes.length === 1 ? changes[0] : null;

  // Rule 1 — one short field: the whole change fits in the row, so there is
  // nothing to expand and the module name is not needed.
  if (single && !single.longText) {
    return (
      <ActivityLogItem
        symbol={symbol}
        date={date}
        text={
          <>
            <Em>{userName}</Em> {verb} <Em>{single.label}:</Em>
            {leads(single.oldIcon, single.oldPeople) ? "" : " "}
            <Muted>
              <ChangeValue people={single.oldPeople} icon={single.oldIcon} text={shown(single.oldValue)} muted />
            </Muted>
            <Em>
              {arrow(leads(single.newIcon, single.newPeople))}
              <ChangeValue people={single.newPeople} icon={single.newIcon} text={shown(single.newValue)} />
            </Em>
          </>
        }
      />
    );
  }

  // Rule 2 — one TextArea field: the values are paragraphs, so the row names
  // only the field and the body holds the two versions bare (no icon, no label
  // — the row already said which field it is).
  if (single) {
    return (
      <ActivityLogItem
        symbol={symbol}
        date={date}
        text={
          <>
            <Em>{userName}</Em> {verb} <Em>{single.label}</Em>
          </>
        }
      >
        <div className={styles.subStack}>
          <StackedChange change={single} />
        </div>
      </ActivityLogItem>
    );
  }

  // Rule 3 — more than one field: name the changed properties, then list every
  // field in the body.
  return (
    <ActivityLogItem
      symbol={symbol}
      date={date}
      text={
        <>
          <Em>{userName}</Em> {verb} <Em>{subject ?? propertyList(changes)}</Em>
        </>
      }
    >
      <div className={styles.subStack}>
        {changes.map((change, index) => (
          <Fragment key={change.label}>
            {/* Between sub-logs only. Inset 28px (20px icon + 8px gap) so the
                line starts under the sub-log TEXT, not under its icon. */}
            {index > 0 && <Divider padding="0 0 0 var(--size-7)" />}
            <SubItem change={change} />
          </Fragment>
        ))}
      </div>
    </ActivityLogItem>
  );
}
