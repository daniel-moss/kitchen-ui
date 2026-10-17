import { ReactNode, useEffect, useState } from "react";

import EmptyState from "../../../components/EmptyState/EmptyState";
import GroupLabel from "../../../components/GroupLabel/GroupLabel";
import SelectList from "../../../components/SelectList/SelectList";
import SelectListHeader from "../../../components/SelectList/SelectListHeader";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";

// The picker both "add a card" fields of the form open — Vendors (Figma
// 4066-17583) and Inventory locations (4116-30835). They share one rule set
// that SelectList's built-in search cannot express, because it depends on
// what the query matched:
//
//   1. Only ACTIVE options can be picked, A → Z, minus those already added.
//   2. INACTIVE ones appear only when they match the search — disabled, under
//      an "Inactive" group, below the matching active ones.
//   3. With NO active option at all, the inactive ones show without a search
//      ("No active vendors" above them), and the list has no search bar.
//   4. Every dead end has its own caption: "No vendors", "No vendors match",
//      "No active vendors match".
//
// So this list owns its query (a custom SelectListHeader) and builds the
// groups itself.

export interface ActiveInactiveOption {
  id: string;
  label: string;
  caption?: ReactNode;
  avatar: ReactNode;
  /** What the search matches. Default: the label. */
  searchText?: string;
  /** What the A → Z order reads. Default: the label. A location sorts by its NAME, not its plate. */
  sortText?: string;
}

export interface ActiveInactiveListProps {
  open: boolean;
  onClose: () => void;
  mobile: boolean;
  title: string;
  searchPlaceholder: string;
  /** The plural noun the empty captions use — "vendors", "locations". */
  noun: string;
  /** The pickable options — active, not yet added. Sorted here. */
  active: ActiveInactiveOption[];
  /** The inactive ones. Sorted here, never pickable. */
  inactive: ActiveInactiveOption[];
  onPick: (id: string) => void;
  /** Appended to the two "nothing to pick" captions (the no-permission copy). */
  emptySuffix?: string;
  footer?: ReactNode;
}

const byLabel = (a: ActiveInactiveOption, b: ActiveInactiveOption) =>
  (a.sortText ?? a.label).localeCompare(b.sortText ?? b.label);

export default function ActiveInactiveList({
  open,
  onClose,
  mobile,
  title,
  searchPlaceholder,
  noun,
  active,
  inactive,
  onPick,
  emptySuffix = "",
  footer,
}: ActiveInactiveListProps) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();
  const matches = (option: ActiveInactiveOption) => (option.searchText ?? option.label).toLowerCase().includes(q);

  const activeSorted = [...active].sort(byLabel);
  const inactiveSorted = [...inactive].sort(byLabel);
  const hasActive = activeSorted.length > 0;

  const item = (option: ActiveInactiveOption, disabled: boolean) => (
    <SelectListItem
      key={option.id}
      variant="object"
      label={option.label}
      caption={option.caption}
      avatar={option.avatar}
      disabled={disabled}
      onClick={
        disabled
          ? undefined
          : () => {
              onPick(option.id);
              onClose();
            }
      }
    />
  );

  const inactiveGroup = (rows: ActiveInactiveOption[]) => (
    <SelectListItemGroup key="inactive" label={<GroupLabel variant="primary" label="Inactive" />} divider={false}>
      {rows.map((option) => item(option, true))}
    </SelectListItemGroup>
  );

  const emptyGroup = (caption: string, divider: boolean) => (
    <SelectListItemGroup key="empty" divider={divider}>
      <EmptyState caption={caption} />
    </SelectListItemGroup>
  );

  // A list with NOTHING in it ("No vendors", "No vendors match") draws its
  // caption the way every SelectList draws its no-match state — centred in
  // the body — rather than as a group at the top.
  let body: ReactNode;
  let onlyCaption: string | undefined;
  if (!hasActive) {
    // Nothing to pick: no search, and the inactive rows (if any) shown as they are.
    if (inactiveSorted.length === 0) onlyCaption = `No ${noun}${emptySuffix}`;
    else body = [emptyGroup(`No active ${noun}${emptySuffix}`, true), inactiveGroup(inactiveSorted)];
  } else if (q === "") {
    body = (
      <SelectListItemGroup key="active" divider={false}>
        {activeSorted.map((option) => item(option, false))}
      </SelectListItemGroup>
    );
  } else {
    const activeHits = activeSorted.filter(matches);
    const inactiveHits = inactiveSorted.filter(matches);
    if (activeHits.length === 0 && inactiveHits.length === 0) onlyCaption = `No ${noun} match`;
    else
      body = [
        activeHits.length > 0 ? (
          <SelectListItemGroup key="active" divider={inactiveHits.length > 0}>
            {activeHits.map((option) => item(option, false))}
          </SelectListItemGroup>
        ) : (
          emptyGroup(`No active ${noun} match`, true)
        ),
        inactiveHits.length > 0 ? inactiveGroup(inactiveHits) : null,
      ];
  }

  return (
    <SelectList
      variant={mobile ? "drawer" : "dialog"}
      breakpoint={mobile ? "mobile" : "desktop"}
      open={open}
      onClose={onClose}
      title={title}
      header={
        hasActive ? (
          <SelectListHeader
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery("")}
            placeholder={searchPlaceholder}
          />
        ) : undefined
      }
      footer={footer}
      state={onlyCaption != null ? "noResults" : "default"}
      noResultsState={onlyCaption != null ? <EmptyState caption={onlyCaption} /> : undefined}
    >
      {body ?? <SelectListItemGroup divider={false}>{null}</SelectListItemGroup>}
    </SelectList>
  );
}
