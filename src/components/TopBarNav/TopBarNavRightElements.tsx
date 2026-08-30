import clsx from "clsx";

import useIsDesktop from "../../hooks/useIsDesktop";
import Button from "../Button/Button";
import IconButton from "../IconButton/IconButton";
import HoverTooltip from "../Tooltip/HoverTooltip";

import styles from "./TopBarNavRightElements.module.scss";
import { TopBarNavRightElementsProps } from "./TopBarNavRightElements.types";

// TopBarNavRightElements — the list bar's right side: [search (desktop
// only)] [create]. The create button is a solid lg "New" Button on desktop
// and a solid lg plus IconButton on mobile; both IconButtons carry hover
// tooltips. No live users on list pages (they belong to the details bar).
// See Figma TopBarNav "#️⃣ Right Elements List Desktop / Mobile".
export default function TopBarNavRightElements({
  onSearch,
  onCreate,
  createLabel = "New",
  breakpoint = "auto",
  className,
}: TopBarNavRightElementsProps) {
  const isDesktop = useIsDesktop(breakpoint);

  return (
    <div className={clsx(styles.root, className)}>
      {isDesktop && onSearch != null && (
        <HoverTooltip text="Object search">
          <IconButton icon="search" variant="ghost" size="lg" aria-label="Object search" onClick={onSearch} />
        </HoverTooltip>
      )}
      {onCreate != null &&
        (isDesktop ? (
          <Button variant="solid" size="lg" leftIcon="plus" onClick={onCreate}>
            {createLabel}
          </Button>
        ) : (
          <HoverTooltip text={createLabel}>
            <IconButton icon="plus" variant="solid" size="lg" aria-label={createLabel} onClick={onCreate} />
          </HoverTooltip>
        ))}
    </div>
  );
}
