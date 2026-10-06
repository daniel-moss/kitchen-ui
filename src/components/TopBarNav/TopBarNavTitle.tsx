import { useContext } from "react";

import clsx from "clsx";

import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";
import { TopBarNavLoadingContext } from "./TopBarNavLoadingContext";

import styles from "./TopBarNavTitle.module.scss";
import { TopBarNavTitleProps } from "./TopBarNavTitle.types";

// TopBarNavTitle — the top bar's title assembly: an optional avatar slot
// (md / 28px) and the page name in one line. The title is a label, not a
// control: sibling pages are reached from the sidebar on desktop and the menu
// page on mobile. While the bar is loading it draws a placeholder instead,
// and the avatar is not drawn at all. See Figma TopBarNav "#️⃣ TopBarNavTitle".
export default function TopBarNavTitle({ title, slotLeft, className }: TopBarNavTitleProps) {
  const isLoading = useContext(TopBarNavLoadingContext);

  if (isLoading) {
    return (
      <div className={clsx(styles.root, className)}>
        <SkeletonTypography variant="h3" width={128} />
      </div>
    );
  }

  return (
    <div className={clsx(styles.root, className)}>
      {slotLeft != null && <span className={styles.slotLeft}>{slotLeft}</span>}
      <span className={styles.title}>{title}</span>
    </div>
  );
}
