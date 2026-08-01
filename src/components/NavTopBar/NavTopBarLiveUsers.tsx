import { useState } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";
import useIsDesktop from "../../hooks/useIsDesktop";
import AvatarGroup from "../Avatar/AvatarGroup";
import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";
import DrawerHeader from "../Popover/DrawerHeader";
import Popover from "../Popover/Popover";
import HoverTooltip from "../Tooltip/HoverTooltip";

import styles from "./NavTopBarLiveUsers.module.scss";

interface NavTopBarLiveUsersProps {
  /** The users on the same page. Nothing renders when empty. */
  users: AvatarGroupItem[];
  breakpoint?: Breakpoint;
}

// The top bar's live-users stack (doc "Live users"): an inline lg AvatarGroup
// showing up to 3 avatars on desktop (2 + "+N" beyond that) and up to 2 on
// mobile. Desktop: hovering shows a tooltip with ALL live users (not just the
// hidden ones — names matter when the image doesn't ring a bell). Mobile: a
// tap opens a drawer with the same list.
export default function NavTopBarLiveUsers({ users, breakpoint = "auto" }: NavTopBarLiveUsersProps) {
  const isDesktop = useIsDesktop(breakpoint);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (users.length === 0) return null;

  const max = isDesktop ? 3 : 2;
  const group = (
    <AvatarGroup variation="inline" size="lg" items={users} max={users.length > max ? max : undefined} />
  );

  if (isDesktop) {
    // The stack sits at the right screen edge — the tongue goes at the END so
    // the tooltip body extends leftwards instead of off-screen.
    return (
      <HoverTooltip variant="avatarGroup" items={users} align="end">
        {group}
      </HoverTooltip>
    );
  }

  return (
    <>
      <button type="button" className={styles.trigger} aria-label="Live users" onClick={() => setDrawerOpen(true)}>
        {group}
      </button>
      <Popover
        drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        header={<DrawerHeader variant="dragHandle" />}
      >
        <div className={styles.drawerBody}>
          <AvatarGroup variation="stack" size="lg" items={users} />
        </div>
      </Popover>
    </>
  );
}
