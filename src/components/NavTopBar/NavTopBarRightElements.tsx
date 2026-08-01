import clsx from "clsx";

import useIsDesktop from "../../hooks/useIsDesktop";
import Button from "../Button/Button";
import IconButton from "../IconButton/IconButton";
import HoverTooltip from "../Tooltip/HoverTooltip";
import NavTopBarLiveUsers from "./NavTopBarLiveUsers";

import styles from "./NavTopBarRightElements.module.scss";
import { NavTopBarRightElementsProps } from "./NavTopBarRightElements.types";

// NavTopBarRightElements — the top bar's right side, format-dependent:
// [live avatars] [search (desktop only)] [create]. The create button is a
// solid "New" Button on desktop and a solid plus IconButton on mobile. See
// Figma "#️⃣ NavTopBar_RightElements_Desktop" / "..._Mobile".
export default function NavTopBarRightElements({
  avatars,
  onSearch,
  onCreate,
  createLabel = "New",
  breakpoint = "auto",
  className,
}: NavTopBarRightElementsProps) {
  const isDesktop = useIsDesktop(breakpoint);

  return (
    <div className={clsx(styles.root, className)}>
      {avatars != null && <NavTopBarLiveUsers users={avatars} breakpoint={breakpoint} />}
      {isDesktop && onSearch != null && (
        <HoverTooltip text="Object search">
          <IconButton icon="magnifying-glass" variant="ghost" size="md" aria-label="Object search" onClick={onSearch} />
        </HoverTooltip>
      )}
      {onCreate != null &&
        (isDesktop ? (
          <Button variant="solid" size="md" leftIcon="plus" onClick={onCreate}>
            {createLabel}
          </Button>
        ) : (
          <HoverTooltip text={createLabel}>
            <IconButton icon="plus" variant="solid" size="md" aria-label={createLabel} onClick={onCreate} />
          </HoverTooltip>
        ))}
    </div>
  );
}
