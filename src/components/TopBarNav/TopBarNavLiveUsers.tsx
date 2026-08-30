import { useState } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";
import useIsDesktop from "../../hooks/useIsDesktop";
import AvatarGroup from "../Avatar/AvatarGroup";
import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";
import AvatarLive from "../Avatar/AvatarLive";
import DrawerHeader from "../Popover/DrawerHeader";
import Popover from "../Popover/Popover";
import HoverTooltip from "../Tooltip/HoverTooltip";

import styles from "./TopBarNavLiveUsers.module.scss";

interface TopBarNavLiveUsersProps {
  /** The users on the same page. Nothing renders when empty. */
  users: AvatarGroupItem[];
  breakpoint?: Breakpoint;
}

// The top bar's live-users stack (doc "Live users"): xl (36px) avatars — a
// single AvatarLive for 1 user, an inline xl AvatarGroup for 2+, showing up
// to 3 slots on desktop (2 + "+N" beyond that) and up to 2 on mobile.
// Desktop: hovering shows a tooltip with ALL live users. Mobile: a tap opens
// a drawer (Popover) with the vertical stack.
export default function TopBarNavLiveUsers({ users, breakpoint = "auto" }: TopBarNavLiveUsersProps) {
  const isDesktop = useIsDesktop(breakpoint);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (users.length === 0) return null;

  const max = isDesktop ? 3 : 2;
  const single = users[0];
  const group =
    users.length === 1 ? (
      // The doc: "1 user — AvatarLive. 2+ — AvatarGroup."
      <AvatarLive
        size="xl"
        content={single.content}
        imageSrc={single.imageSrc}
        characters={single.characters}
        color={"ringColor" in single ? single.ringColor : undefined}
      />
    ) : (
      <AvatarGroup variation="inline" size="xl" items={users} max={users.length > max ? max : undefined} />
    );

  if (isDesktop) {
    // The stack sits at the right screen edge — the tongue goes at the END so
    // the tooltip body extends leftwards instead of off-screen. The stack in
    // the tooltip is lg (the doc).
    return (
      <HoverTooltip variant="avatarGroup" items={users} avatarGroupSize="lg" align="end">
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
