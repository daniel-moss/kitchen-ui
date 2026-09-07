import { useState } from "react";

import ViewMenu from "./ViewMenu";
import {
  ViewMenuColumn,
  ViewMenuAttribute,
  ViewMenuColumnsState,
  ViewMenuSort,
  ViewMenuTimelineState,
  ViewMenuView,
} from "./ViewMenu.types";
import { defaultTimelineState } from "./viewMenuData";

import styles from "./ViewMenuDemo.module.scss";

// The module's DEMO — the stories' stage. A CLEAN showcase (Daniel,
// 2026-09-04): the menu alone, permanently open — no trigger button, no
// outside-click close, no fullscreen phone story. What a real consumer owns
// (the trigger, the card's position, closing, the state) is shown for real in
// the Filters prototype; here the state is plain useState so every control
// works.
//
// The DEFAULT demo is the version every object type gets (Daniel,
// 2026-09-04: "the version for other objects should be considered as a
// default one") — no Schedule horizon row, no Timeline view. `jobs` opts the
// two jobs-only sections in, the way a real jobs consumer passes the
// `scheduled` and `timeline` props.

// Demo table columns and Cards attributes.
const DEMO_COLUMNS: ViewMenuColumn[] = [
  { key: "id", label: "ID", type: "number" },
  { key: "client", label: "Client", type: "text" },
  { key: "status", label: "Status", type: "text" },
  { key: "service", label: "Service", type: "text" },
  { key: "locationName", label: "Location name", type: "text" },
  { key: "labels", label: "Labels", type: "text" },
  { key: "terms", label: "Terms", type: "generic" },
  { key: "statusChanged", label: "Status changed", type: "date" },
  { key: "lastModified", label: "Last modified", type: "date" },
  { key: "expires", label: "Expires", type: "date" },
  { key: "seen", label: "Seen", type: "date" },
];

const DEMO_ATTRIBUTES: ViewMenuAttribute[] = [
  { key: "price", label: "Price" },
  { key: "inventory", label: "Inventory" },
  { key: "taxability", label: "Taxability" },
  { key: "duration", label: "Duration" },
  { key: "lastModified", label: "Last modified" },
  { key: "labels", label: "Labels" },
  { key: "inventoryLevel", label: "Inventory level" },
  { key: "inventoryValue", label: "Inventory value" },
  { key: "onOrder", label: "On order" },
];

/** Active by default in the design. */
const DEFAULT_ACTIVE_ATTRIBUTES = ["price", "inventory", "duration", "inventoryLevel", "inventoryValue"];

export default function ViewMenuDemo({ mobile = false, jobs = false }: { mobile?: boolean; jobs?: boolean }) {
  const [view, setView] = useState<ViewMenuView>("table");
  // Column order and state. Mobile has no pinning — everything is unpinned.
  const [columnsState, setColumnsState] = useState<ViewMenuColumnsState>(() => ({
    pinned: mobile ? [] : ["id", "client"],
    unpinned: DEMO_COLUMNS.map((c) => c.key).filter((k) => (mobile ? true : k !== "id" && k !== "client")),
    hidden: [],
  }));
  const [sort, setSort] = useState<ViewMenuSort>({ key: "id", ascending: true });
  const [activeAttrs, setActiveAttrs] = useState<string[]>(DEFAULT_ACTIVE_ATTRIBUTES);
  const [scheduledKey, setScheduledKey] = useState("all");
  const [timeline, setTimeline] = useState<ViewMenuTimelineState>(defaultTimelineState);

  const menu = (
    <ViewMenu
      // Permanently open — the demo has nothing to close INTO. Dismissing the
      // mobile drawer is a no-op for the same reason.
      open
      onClose={() => undefined}
      breakpoint={mobile ? "mobile" : "desktop"}
      columns={DEMO_COLUMNS}
      columnsState={columnsState}
      onColumnsStateChange={setColumnsState}
      sort={sort}
      onSortChange={setSort}
      view={view}
      onViewChange={setView}
      attributes={DEMO_ATTRIBUTES}
      activeAttributes={activeAttrs}
      onActiveAttributesChange={setActiveAttrs}
      scheduled={jobs ? { value: scheduledKey, onChange: setScheduledKey } : undefined}
      timeline={jobs ? { value: timeline, onChange: setTimeline } : undefined}
    />
  );

  // Mobile: the drawer over the device frame's stage.
  if (mobile) return <div className={styles.mobileStage}>{menu}</div>;

  // Desktop: the bare card, nothing around it — the docs preview brings its
  // own 80px padding (Daniel, 2026-09-04), and the dropdown lists overlay in
  // fixed body portals, so the stage needs no reserved room.
  return menu;
}
