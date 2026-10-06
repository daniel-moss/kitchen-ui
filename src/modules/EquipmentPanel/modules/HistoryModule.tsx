import { MouseEvent, useState } from "react";

import Avatar from "../../../components/Avatar/Avatar";
import AvatarEstimate from "../../../components/Avatar/AvatarEstimate";
import { AvatarEstimateStatus } from "../../../components/Avatar/AvatarEstimate.types";
import AvatarInvoice from "../../../components/Avatar/AvatarInvoice";
import { AvatarInvoiceStatus } from "../../../components/Avatar/AvatarInvoice.types";
import AvatarJob from "../../../components/Avatar/AvatarJob";
import { AvatarJobStatus } from "../../../components/Avatar/AvatarJob.types";
import Button from "../../../components/Button/Button";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import EmptyState from "../../../components/EmptyState/EmptyState";
import GroupLabel from "../../../components/GroupLabel/GroupLabel";
import { Icon } from "../../../components/Icon/Icon";
import ItemGroup from "../../../components/ItemGroup/ItemGroup";
import ListItem from "../../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../../components/ListItem/ListItemSlotIcon";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import HiddenBar, { HiddenBarGroup } from "../../HiddenBar/HiddenBar";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";
import { HISTORY_KIND_META, HISTORY_KINDS, HistoryKind, HistoryRow } from "../equipmentData";

import styles from "../EquipmentPanel.module.scss";

// The "History" module (Figma 22106-17456). Every estimate, job and invoice
// that touched this equipment, grouped by object type in that fixed order and
// sorted inside each group by the object's own status-change date, newest
// first. A filter in the header narrows it to one type.

/** "All" plus the three object types — the filter's options. */
type HistoryFilter = "all" | HistoryKind;

const FILTER_LABEL: Record<HistoryFilter, string> = {
  all: "All",
  estimate: HISTORY_KIND_META.estimate.label,
  job: HISTORY_KIND_META.job.label,
  invoice: HISTORY_KIND_META.invoice.label,
};

/** The object's avatar, typed per kind (each set has its own status union). */
const rowAvatar = (row: HistoryRow) => {
  if (row.kind === "estimate") return <AvatarEstimate size="xl" status={row.status as AvatarEstimateStatus} />;
  if (row.kind === "job") return <AvatarJob size="xl" status={row.status as AvatarJobStatus} />;
  return <AvatarInvoice size="xl" status={row.status as AvatarInvoiceStatus} />;
};

interface HistoryModuleProps {
  rows: HistoryRow[];
  mobile: boolean;
  /** Opens the object on a separate tab (the row's own annotation). */
  onOpen: (row: HistoryRow) => void;
  /** Initial filter. Default "all" — set it to show the filtered state. */
  defaultFilter?: HistoryFilter;
  isLoading?: boolean;
}

/** The Loading frame shows five rows — the count is not known in advance. */
const LOADING_ROWS = 5;

export default function HistoryModule({ rows, mobile, onOpen, defaultFilter = "all", isLoading = false }: HistoryModuleProps) {
  const [filter, setFilter] = useState<HistoryFilter>(defaultFilter);
  // "belowEnd": the trigger is a small ghost Button, so the list must hug its
  // own rows and hang from the button's RIGHT edge — "below" would size it to
  // the 56px button (Figma 22110-9884).
  const filterPop = useSelectPopover(mobile, "belowEnd");

  const shown = filter === "all" ? rows : rows.filter((row) => row.kind === filter);
  const hidden = rows.length - shown.length;

  const pick = (next: HistoryFilter) => {
    setFilter(next);
    filterPop.close();
  };

  const filterList = (
    <SelectPopoverList pop={filterPop} mobile={mobile} title="Filter">
      <SelectListItemGroup>
        {(["all", ...HISTORY_KINDS] as HistoryFilter[]).map((option) => (
          <SelectListItem
            key={option}
            label={FILTER_LABEL[option]}
            slotLeft={option === "all" ? undefined : <Icon icon={HISTORY_KIND_META[option as HistoryKind].icon} container="square" />}
            selected={filter === option}
            onClick={() => pick(option)}
          />
        ))}
      </SelectListItemGroup>
    </SelectPopoverList>
  );

  // One group per object type, in the fixed Estimates → Jobs → Invoices order.
  // "Only shown, if there are related items" (the group's own annotation).
  const groups = HISTORY_KINDS.map((kind) => ({ kind, rows: shown.filter((row) => row.kind === kind) })).filter((group) => group.rows.length > 0);

  const content = isLoading ? (
    <div className={styles.listBody}>
      <ItemGroup>
        {Array.from({ length: LOADING_ROWS }, (unused, index) => (
          // The row's object type is not known yet, so the avatar is the plain
          // LOADING avatar, not a typed one (node 22012-21028 draws
          // `content=skeleton`) — unlike Warranties and Files, whose rows can
          // only ever hold one kind of object.
          <ListItem key={index} variant="titleCaption" title="" caption="" avatar={<Avatar shape="square" size="xl" isLoading />} isLoading />
        ))}
      </ItemGroup>
    </div>
  ) : rows.length === 0 ? (
    <EmptyState caption="No history objects here yet" />
  ) : (
    <div className={styles.listBody}>
      {groups.map((group, index) => (
        <ItemGroup
          key={group.kind}
          label={<GroupLabel variant="primary" label={HISTORY_KIND_META[group.kind].label} />}
          divider={index < groups.length - 1}
        >
          {group.rows.map((row) => (
            <ListItem
              key={row.id}
              variant="titleCaption"
              title={row.id}
              caption={row.caption}
              avatar={rowAvatar(row)}
              isClickable
              onClick={() => onOpen(row)}
              slotRight={<ListItemSlotIcon icon="arrow-up-right" />}
            />
          ))}
        </ItemGroup>
      ))}
      {/* "Only shown, if there are hidden objects" — the bar's annotation. */}
      {hidden > 0 && (
        <HiddenBar>
          <HiddenBarGroup action={{ label: "Show objects", onClick: () => setFilter("all") }}>
            <strong>
              {hidden} object{hidden === 1 ? "" : "s"}
            </strong>{" "}
            hidden by filter
          </HiddenBarGroup>
        </HiddenBar>
      )}
    </div>
  );

  return (
    <>
      <DisplayModule
        title="History"
        slotRight={
          isLoading ? undefined : (
            <Button
              variant="ghost"
              size="md"
              rightIcon="angles-up-down"
              leftIcon={filter === "all" ? undefined : HISTORY_KIND_META[filter].icon}
              isPressed={filterPop.open}
              onClick={(event: MouseEvent<HTMLButtonElement>) => filterPop.toggle(event.currentTarget)}
            >
              {FILTER_LABEL[filter]}
            </Button>
          )
        }
        bodyPadded={false}
        content={content}
      />
      {filterList}
    </>
  );
}
